"""
Export long MT5 daily history, and each symbol's costs, to CSV files for
ChartPilot's research scripts.

It only writes files on this computer: no database upload and no keys, so it
can't touch the app's data. Run it where MetaTrader 5 is installed and logged in:

    python mt5_export_history.py

Before the first run, in MT5: Tools > Options > Charts > "Max bars in chart" =
Unlimited, then restart MT5.

It asks your terminal which symbols your account has and picks one name per
market below, preferring the raw-account ".r" names. Markets your broker
doesn't offer are listed and skipped. Files land in a "history" folder next
to this script:
  - SYMBOL_D1.csv per symbol: time,open,high,low,close,tick_volume
  - symbols.csv: each symbol's contract size, tick value, spread and swap rates
A file is only written when bars came back, so a failed re-run never replaces
a good file. Zip the "history" folder itself and upload it.
"""
from __future__ import annotations

import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import MetaTrader5 as mt5
import pandas as pd

# One line per market; the first name your broker has is used.
MARKETS = {
    # FX: the 28 pairs of the eight major currencies
    **{pair: [pair] for pair in [
        "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD",
        "EURGBP", "EURJPY", "EURCHF", "EURAUD", "EURCAD", "EURNZD",
        "GBPJPY", "GBPCHF", "GBPAUD", "GBPCAD", "GBPNZD",
        "AUDJPY", "AUDCAD", "AUDCHF", "AUDNZD",
        "NZDJPY", "NZDCAD", "NZDCHF", "CADJPY", "CADCHF", "CHFJPY",
    ]},
    # Metals
    "Gold": ["XAUUSD"],
    "Silver": ["XAGUSD"],
    "Platinum": ["XPTUSD"],
    "Palladium": ["XPDUSD"],
    # Energies
    "WTI oil": ["XTIUSD", "WTI", "USOIL", "CL-OIL", "OIL"],
    "Brent oil": ["XBRUSD", "BRENT", "UKOIL"],
    "Natural gas": ["XNGUSD", "NATGAS", "NGAS", "NG"],
    # Stock indices
    "Dow Jones": ["US30", "DJ30", "WS30", "DJI30"],
    "S&P 500": ["US500", "SP500", "SPX500"],
    "Nasdaq 100": ["US100", "NAS100", "USTEC", "NDX100"],
    "DAX": ["GER40", "DE40", "GER30", "DAX40", "DE30"],
    "FTSE 100": ["UK100", "FTSE100"],
    "Nikkei 225": ["JP225", "JPN225", "NIKKEI225"],
    "ASX 200": ["AUS200", "ASX200"],
    "CAC 40": ["FRA40", "FRANCE40", "CAC40", "F40"],
    "Euro Stoxx 50": ["EU50", "EUSTX50", "STOXX50"],
    "Hang Seng": ["HK50", "HSI50", "HK33"],
    "IBEX 35": ["ESP35", "SPAIN35"],
    "China A50": ["CHINA50", "CN50"],
    # Softs and grains
    "Coffee": ["COFFEE"],
    "Cocoa": ["COCOA"],
    "Sugar": ["SUGAR"],
    "Cotton": ["COTTON"],
    "Corn": ["CORN"],
    "Wheat": ["WHEAT"],
    "Soybeans": ["SOYBEAN", "SOYBEANS"],
}

START = datetime(2006, 1, 1, tzinfo=timezone.utc)
OUT = Path(__file__).resolve().parent / "history"

SPEC_FIELDS = [
    "name", "description", "path", "currency_base", "currency_profit", "currency_margin",
    "digits", "point", "trade_contract_size", "trade_tick_size", "trade_tick_value",
    "volume_min", "spread", "spread_float", "swap_mode", "swap_long", "swap_short",
    "swap_rollover3days", "trade_mode", "trade_calc_mode", "bid", "ask",
]


def base_name(name: str) -> str:
    """'EURUSD.r' -> 'EURUSD', 'US500' -> 'US500'."""
    return re.split(r"[._+\-#!]", name.upper())[0]


def pick(candidates: list[str], by_base: dict[str, list[str]]) -> str | None:
    for candidate in candidates:
        names = by_base.get(candidate.upper(), [])
        if names:
            raw = [n for n in names if n.lower().endswith(".r")]
            return (raw or sorted(names, key=len))[0]
    return None


def next_month(day: datetime) -> datetime:
    return datetime(day.year + (day.month == 12), day.month % 12 + 1, 1, tzinfo=timezone.utc)


def fetch(symbol: str, timeframe: int, start: datetime, end: datetime):
    """
    Asks MT5 for one month at a time. One big request fails with "Invalid params"
    when it holds more bars than MT5 keeps in memory, and a call can fail with
    "Call failed" while MT5 is still downloading history, so each month gets two
    retries. Returns the joined bars and how many months came back empty.
    """
    frames, empty = [], 0
    month = datetime(start.year, start.month, 1, tzinfo=timezone.utc)
    while month < end:
        rates = None
        for attempt in range(3):
            rates = mt5.copy_rates_range(symbol, timeframe, max(month, start), min(next_month(month), end))
            if rates is not None:
                break
            time.sleep(0.5 * (attempt + 1))
        if rates is None or len(rates) == 0:
            empty += 1
        else:
            frames.append(pd.DataFrame(rates))
        month = next_month(month)
    if not frames:
        return None, empty
    # Month edges are inclusive on both sides, so a bar can arrive twice.
    return pd.concat(frames).drop_duplicates("time").sort_values("time"), empty


if not mt5.initialize():
    print(f"Could not connect to MT5: {mt5.last_error()}")
    sys.exit(1)

by_base: dict[str, list[str]] = {}
for info in mt5.symbols_get() or []:
    by_base.setdefault(base_name(info.name), []).append(info.name)

chosen, missing = {}, []
for market, candidates in MARKETS.items():
    name = pick(candidates, by_base)
    if name:
        chosen[market] = name
    else:
        missing.append(market)
print(f"Your account has {len(chosen)} of {len(MARKETS)} markets.")
if missing:
    print("Not offered, skipped: " + ", ".join(missing))

OUT.mkdir(exist_ok=True)
now = datetime.now(timezone.utc)
specs = []
for market, symbol in chosen.items():
    if not mt5.symbol_select(symbol, True):
        print(f"Skipped {symbol}: couldn't add it to Market Watch ({mt5.last_error()})")
        continue
    info = mt5.symbol_info(symbol)
    if info is not None:
        row = info._asdict()
        specs.append({"market": market, **{field: row.get(field) for field in SPEC_FIELDS}})
    print(f"{symbol} ({market}) D1: downloading month by month since {START:%Y-%m}...", flush=True)
    df, empty = fetch(symbol, mt5.TIMEFRAME_D1, START, now)
    if df is None:
        print(f"{symbol} D1: no data ({mt5.last_error()})")
        continue
    df["time"] = pd.to_datetime(df["time"], unit="s")
    df[["time", "open", "high", "low", "close", "tick_volume"]].to_csv(OUT / f"{symbol}_D1.csv", index=False)
    note = f"; {empty} months had no data" if empty else ""
    print(f"{symbol} D1: {len(df):,} bars, {df['time'].iloc[0]:%Y-%m-%d} to {df['time'].iloc[-1]:%Y-%m-%d}{note}")

if specs:
    pd.DataFrame(specs).to_csv(OUT / "symbols.csv", index=False)
    print(f"Saved costs and swap rates for {len(specs)} symbols to symbols.csv")

mt5.shutdown()
print(f"Done. Zip the folder {OUT} and upload it.")
