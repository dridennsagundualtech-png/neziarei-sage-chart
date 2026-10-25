"""
Export long MT5 history to CSV files for ChartPilot's research scripts.

It only writes files on this computer: no database upload and no keys, so it
can't touch the app's data. Run it where MetaTrader 5 is installed and logged in:

    python mt5_export_history.py

Before the first run, in MT5: Tools > Options > Charts > "Max bars in chart" =
Unlimited, then restart MT5. Files land in a "history" folder next to this
script, one per symbol and timeframe (e.g. history/EURUSD.r_H1.csv), in the
same format mt5_data_auto.py writes: time,open,high,low,close,tick_volume.
A file is only written when bars came back, so a failed re-run never replaces
a good file. Zip the folder and upload it.
"""
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import MetaTrader5 as mt5
import pandas as pd

# All exported in one run. Add or remove names to change which symbols you get.
SYMBOLS = ["EURUSD.r", "AUDUSD.r", "XAUUSD.r"]

# How far back each timeframe goes. Brokers often hold less; you get what exists.
TIMEFRAMES = {
    "D1": (mt5.TIMEFRAME_D1, datetime(2006, 1, 1, tzinfo=timezone.utc)),
    "H4": (mt5.TIMEFRAME_H4, datetime(2006, 1, 1, tzinfo=timezone.utc)),
    "H1": (mt5.TIMEFRAME_H1, datetime(2010, 1, 1, tzinfo=timezone.utc)),
    "M15": (mt5.TIMEFRAME_M15, datetime(2017, 1, 1, tzinfo=timezone.utc)),
}

OUT = Path(__file__).resolve().parent / "history"


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

OUT.mkdir(exist_ok=True)
now = datetime.now(timezone.utc)
for symbol in SYMBOLS:
    if not mt5.symbol_select(symbol, True):
        print(f"Skipped {symbol}: not in Market Watch ({mt5.last_error()})")
        continue
    for name, (timeframe, start) in TIMEFRAMES.items():
        print(f"{symbol} {name}: downloading month by month since {start:%Y-%m}...", flush=True)
        df, empty = fetch(symbol, timeframe, start, now)
        if df is None:
            print(f"{symbol} {name}: no data ({mt5.last_error()})")
            continue
        df["time"] = pd.to_datetime(df["time"], unit="s")
        path = OUT / f"{symbol}_{name}.csv"
        df[["time", "open", "high", "low", "close", "tick_volume"]].to_csv(path, index=False)
        note = f"; {empty} months had no data" if empty else ""
        print(f"{symbol} {name}: {len(df):,} bars, {df['time'].iloc[0]} to {df['time'].iloc[-1]}{note}")

mt5.shutdown()
print(f"Done. Zip the folder {OUT} and upload it.")
