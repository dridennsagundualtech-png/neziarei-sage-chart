"""
Export long MT5 daily history, and each symbol's costs, to CSV files for
ChartPilot's research scripts.

It only writes files on this computer: no database upload and no keys, so it
can't touch the app's data. Run it where MetaTrader 5 is installed and logged in:

    python mt5_export_history.py          bars and costs
    python mt5_export_history.py costs    costs only (symbols.csv), in seconds

Run it while the market is open: spreads are read from live prices, and with
the market closed MT5 has no price for most symbols.

Before the first run, in MT5: Tools > Options > Charts > "Max bars in chart" =
Unlimited, then restart MT5.

It asks your terminal which symbols your account has and picks one name per
market below, preferring the raw-account ".r" names. Markets your broker
doesn't offer are listed and skipped. Files land in a "history" folder next
to this script:
  - SYMBOL_D1.csv per symbol: time,open,high,low,close,tick_volume
  - symbols.csv: each symbol's contract size, tick value, spread and swap rates
A file is only written when bars came back, so a failed re-run never replaces
a good file. If the run stops early, run it again: markets downloaded in the
last 12 hours are kept and it carries on with the rest. symbols.csv is saved
as it goes. Wait for the "Finished" line, then zip the "history" folder itself
and upload it.
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
# A re-run keeps files written this recently, so a stopped export picks up where it left off.
RESUME_HOURS = 12
COSTS_ONLY = "costs" in sys.argv[1:]

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


def live_info(symbol: str):
    """symbol_info once a price has arrived: a symbol just added to Market Watch has none for a moment."""
    info = mt5.symbol_info(symbol)
    for _ in range(30):
        if info is None or info.bid > 0:
            break
        time.sleep(0.1)
        info = mt5.symbol_info(symbol)
    return info


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
done, failed = 0, []
for number, (market, symbol) in enumerate(chosen.items(), start=1):
    tag = f"[{number}/{len(chosen)}] {symbol} ({market})"
    try:
        if not mt5.symbol_select(symbol, True):
            print(f"{tag}: skipped, couldn't add it to Market Watch ({mt5.last_error()})")
            failed.append(symbol)
            continue
        info = live_info(symbol)
        if info is not None and info.bid <= 0:
            print(f"{tag}: no live price yet, so its spread can't be read (is the market open?)")
        if info is not None:
            row = info._asdict()
            specs.append({"market": market, **{field: row.get(field) for field in SPEC_FIELDS}})
            # Saved after every symbol, so a run that stops early still keeps the costs.
            pd.DataFrame(specs).to_csv(OUT / "symbols.csv", index=False)
        if COSTS_ONLY:
            done += 1
            continue
        path = OUT / f"{symbol}_D1.csv"
        if path.exists() and time.time() - path.stat().st_mtime < RESUME_HOURS * 3600:
            print(f"{tag}: already downloaded in the last {RESUME_HOURS} hours, kept")
            done += 1
            continue
        print(f"{tag}: downloading month by month since {START:%Y-%m}...", flush=True)
        df, empty = fetch(symbol, mt5.TIMEFRAME_D1, START, now)
        if df is None:
            print(f"{tag}: no data ({mt5.last_error()})")
            failed.append(symbol)
            continue
        df["time"] = pd.to_datetime(df["time"], unit="s")
        df[["time", "open", "high", "low", "close", "tick_volume"]].to_csv(path, index=False)
        note = f"; {empty} months had no data" if empty else ""
        print(f"{tag}: {len(df):,} bars, {df['time'].iloc[0]:%Y-%m-%d} to {df['time'].iloc[-1]:%Y-%m-%d}{note}")
        done += 1
    except Exception as error:  # one bad market shouldn't stop the rest
        print(f"{tag}: failed ({error})")
        failed.append(symbol)

mt5.shutdown()
print(f"Saved costs and swap rates for {len(specs)} symbols to symbols.csv")
priced = sum(1 for spec in specs if (spec.get("bid") or 0) > 0)
print(f"{priced} of {len(specs)} had a live price.")
if COSTS_ONLY:
    print(f"Finished. Upload {OUT / 'symbols.csv'}.")
    sys.exit(0)
print(f"Finished: {done} of {len(chosen)} markets exported.")
if failed:
    print("Didn't export: " + ", ".join(failed) + ". Run the script again to retry them.")
print(f"Zip the folder {OUT} and upload it.")
