"""
Export long MT5 history to CSV files for ChartPilot's research scripts.

It only writes files on this computer: no database upload and no keys, so it
can't touch the app's data. Run it where MetaTrader 5 is installed and logged in:

    python mt5_export_history.py

Before the first run, in MT5: Tools > Options > Charts > "Max bars in chart" =
Unlimited, then restart MT5. Otherwise MT5 hands over only the bars it keeps
in memory. Files land in a "history" folder next to this script, one per
symbol and timeframe (e.g. history/EURUSD.r_H1.csv), in the same format
mt5_data_auto.py writes: time,open,high,low,close,tick_volume. Zip the folder
and upload it.
"""
import sys
from datetime import datetime, timezone
from pathlib import Path

import MetaTrader5 as mt5
import pandas as pd

SYMBOLS = ["EURUSD.r", "AUDUSD.r", "USDJPY.r", "XAUUSD.r", "XAGUSD.r"]

# How far back each timeframe goes. Brokers often hold less; you get what exists.
TIMEFRAMES = {
    "D1": (mt5.TIMEFRAME_D1, datetime(2006, 1, 1, tzinfo=timezone.utc)),
    "H4": (mt5.TIMEFRAME_H4, datetime(2006, 1, 1, tzinfo=timezone.utc)),
    "H1": (mt5.TIMEFRAME_H1, datetime(2010, 1, 1, tzinfo=timezone.utc)),
    "M15": (mt5.TIMEFRAME_M15, datetime(2017, 1, 1, tzinfo=timezone.utc)),
}

OUT = Path(__file__).resolve().parent / "history"

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
        rates = mt5.copy_rates_range(symbol, timeframe, start, now)
        if rates is None or len(rates) == 0:
            print(f"{symbol} {name}: no data ({mt5.last_error()})")
            continue
        df = pd.DataFrame(rates)
        df["time"] = pd.to_datetime(df["time"], unit="s")
        path = OUT / f"{symbol}_{name}.csv"
        df[["time", "open", "high", "low", "close", "tick_volume"]].to_csv(path, index=False)
        print(f"{symbol} {name}: {len(df):,} bars, {df['time'].iloc[0]} to {df['time'].iloc[-1]}")

mt5.shutdown()
print(f"Done. Zip the folder {OUT} and upload it.")
