import { useId, useState } from "react";

import { cn } from "@/lib/utils";

const ASKS = [
  { price: 100.02, size: 3 },
  { price: 100.03, size: 4 },
  { price: 100.04, size: 2 },
  { price: 100.05, size: 6 },
  { price: 100.06, size: 5 },
];
const BIDS = [
  { price: 100.01, size: 4 },
  { price: 100.0, size: 5 },
  { price: 99.99, size: 3 },
];

/** Order book: drag a market buy and watch it eat through the asks. */
export function DomVisual() {
  const id = useId();
  const [size, setSize] = useState(5);
  let left = size;
  const fills = ASKS.map((a) => {
    const take = Math.min(a.size, Math.max(left, 0));
    left -= take;
    return take;
  });
  const filled = fills.reduce((s, v) => s + v, 0);
  const cost = ASKS.reduce((s, a, i) => s + a.price * (fills[i] ?? 0), 0);
  const avg = filled ? cost / filled : 0;
  const best = ASKS[0]?.price ?? 0;
  const ticks = Math.round((avg - best) * 100 * 10) / 10;

  return (
    <div className="space-y-3">
      <table className="w-full text-[14px] tabular-nums">
        <caption className="sr-only">Order book with the asks a market buy would take</caption>
        <thead>
          <tr className="text-left text-[13px] text-muted-foreground">
            <th className="py-1 font-medium">Side</th>
            <th className="py-1 font-medium">Price</th>
            <th className="py-1 text-right font-medium">Waiting</th>
            <th className="py-1 text-right font-medium">You take</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {[...ASKS].reverse().map((a) => {
            const take = fills[ASKS.indexOf(a)] ?? 0;
            return (
              <tr key={a.price} className={cn("border-t border-border", take > 0 && "bg-bear/10")}>
                <td className="py-1.5 font-sans text-bear">Ask</td>
                <td className="py-1.5">{a.price.toFixed(2)}</td>
                <td className="py-1.5 text-right">{a.size}</td>
                <td className="py-1.5 text-right font-semibold">{take || ""}</td>
              </tr>
            );
          })}
          {BIDS.map((b) => (
            <tr key={b.price} className="border-t border-border">
              <td className="py-1.5 font-sans text-bull">Bid</td>
              <td className="py-1.5">{b.price.toFixed(2)}</td>
              <td className="py-1.5 text-right">{b.size}</td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={id} className="text-[14px] text-muted-foreground">
            Market buy size (lots)
          </label>
          <span className="font-mono text-[15px] font-semibold tabular-nums">{size}</span>
        </div>
        <input
          id={id}
          type="range"
          min={1}
          max={24}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="h-11 w-full cursor-pointer accent-[var(--color-primary)]"
        />
      </div>
      <p aria-live="polite" className="border-l-2 border-border pl-3 text-[15px] leading-relaxed">
        Spread: 100.02 − 100.01 = 1 tick. Your {filled} lot{filled === 1 ? "" : "s"} fill at an
        average of <b className="font-mono">{avg.toFixed(3)}</b>, which is {ticks} tick
        {ticks === 1 ? "" : "s"} of slippage above the best ask.
        {left > 0
          ? ` ${left} lot${left === 1 ? " is" : "s are"} still unfilled: the book ran out.`
          : ""}
      </p>
    </div>
  );
}

const ROWS = [
  { price: 100.06, bid: 8, ask: 14 },
  { price: 100.05, bid: 11, ask: 42 },
  { price: 100.04, bid: 9, ask: 38 },
  { price: 100.03, bid: 12, ask: 30 },
  { price: 100.02, bid: 25, ask: 22 },
  { price: 100.01, bid: 31, ask: 9 },
];

/** Footprint cell: sellers hitting the bid × buyers lifting the ask at each price inside one candle. */
export function FootprintVisual() {
  const [picked, setPicked] = useState<number | null>(null);
  const delta = ROWS.reduce((s, r) => s + r.ask - r.bid, 0);
  // diagonal imbalance: ask at a price vs bid one tick lower, 3:1 or more
  const imbalance = (i: number) => {
    const below = ROWS[i + 1];
    const row = ROWS[i];
    return !!row && !!below && row.ask >= below.bid * 3;
  };
  const pickedRow = picked === null ? null : ROWS[picked];

  return (
    <div className="space-y-3">
      <p className="text-[14px] text-muted-foreground">One candle, split by price. Tap a row.</p>
      <div className="overflow-hidden rounded-xl border border-border">
        {ROWS.map((row, i) => (
          <button
            key={row.price}
            type="button"
            aria-pressed={picked === i}
            onClick={() => setPicked(picked === i ? null : i)}
            className={cn(
              "grid min-h-11 w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 font-mono text-[14px] tabular-nums",
              i > 0 && "border-t border-border",
              picked === i && "bg-muted",
            )}
          >
            <span className="text-right text-bear">{row.bid}</span>
            <span className="text-[13px] text-muted-foreground">{row.price.toFixed(2)}</span>
            <span
              className={cn(
                "text-left text-bull",
                imbalance(i) && "font-bold underline underline-offset-4",
              )}
            >
              {row.ask}
              {imbalance(i) ? " ▲" : ""}
            </span>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="border-l-2 border-border pl-3 text-[15px] leading-relaxed">
        {pickedRow
          ? `At ${pickedRow.price.toFixed(2)}: ${pickedRow.bid} sold into the bid, ${pickedRow.ask} bought at the ask. Delta ${pickedRow.ask - pickedRow.bid >= 0 ? "+" : ""}${pickedRow.ask - pickedRow.bid}.`
          : `Left column = sellers hitting the bid, right = buyers lifting the ask. Candle delta: +${delta}. ▲ marks a buying imbalance: at least 3× the selling one tick lower.`}
      </p>
    </div>
  );
}
