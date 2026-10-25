import { Check, CircleHelp, FileUp, X } from "lucide-react";
import { useState } from "react";

import { Section } from "@/components/settings/parts";
import { checkEa, parseMt5Report, type EaCheck } from "@/lib/ea-check";
import { cn } from "@/lib/utils";

/** MT5 saves HTML reports as UTF-16 with a byte-order mark; anything else is read as UTF-8. */
function decode(buffer: ArrayBuffer): string {
  const b = new Uint8Array(buffer);
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(buffer);
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(buffer);
  return new TextDecoder("utf-8").decode(buffer);
}

const amount = (v: number | null) =>
  v === null
    ? "–"
    : `${v < 0 ? "−" : ""}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const share = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);

const TONE: Record<EaCheck["level"], string> = {
  empty: "border-border bg-elevated",
  none: "border-bear/50 bg-bear/5",
  danger: "border-bear/50 bg-bear/5",
  thin: "border-warn/50 bg-warn/5",
  unproven: "border-warn/50 bg-warn/5",
  passes: "border-bull/50 bg-bull/5",
};

/** Owner-only: judge an EA (or any account) from an MT5 report, on this device. */
export function EaCheckSection() {
  const [file, setFile] = useState<string | null>(null);
  const [result, setResult] = useState<EaCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = async (input: HTMLInputElement) => {
    const picked = input.files?.[0];
    input.value = "";
    if (!picked) return;
    setFile(picked.name);
    setError(null);
    setResult(null);
    try {
      setResult(checkEa(parseMt5Report(decode(await picked.arrayBuffer()))));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  };

  const figures: [string, string][] = result
    ? [
        ["Closed trades", result.trades.toLocaleString("en-US")],
        ["Net result, after costs", amount(result.net)],
        ["Win rate", share(result.winRate)],
        ["Average win / loss", `${amount(result.avgWin)} / ${amount(result.avgLoss)}`],
        ["Largest loss", amount(result.largestLoss)],
        ["Profit factor", result.profitFactor === null ? "–" : result.profitFactor.toFixed(2)],
        ["Deepest drawdown, closed trades", share(result.maxDrawdown)],
        ["Period", `${Math.round(result.days)} days`],
      ]
    : [];

  return (
    <Section
      title="EA check"
      hint="Only you can see this. Judge an EA, or any account, from an MT5 report. The file stays on this device."
    >
      <div className="space-y-3 py-4 text-[15px] leading-snug">
        <p className="font-semibold">Save the report as HTML in MT5:</p>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            An EA's test: Strategy Tester › Backtest tab › right-click › Report › HTML. Test it with
            "Every tick based on real ticks" so the spread is real.
          </li>
          <li>
            An EA running on an account: Toolbox › History › right-click › Report › HTML. This one
            also shows stop losses.
          </li>
        </ul>
        <label
          htmlFor="ea-report"
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-elevated px-4 font-semibold focus-within:ring-2 focus-within:ring-ring"
        >
          <FileUp className="size-4" aria-hidden />
          {file ? "Open another report" : "Open a report"}
          <input
            id="ea-report"
            type="file"
            accept=".htm,.html"
            className="sr-only"
            onChange={(event) => void open(event.currentTarget)}
          />
        </label>
        {file && <p className="text-[13px] text-muted-foreground">{file}</p>}
        {error && <p className="text-bear">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4 py-4" aria-live="polite">
          <p
            className={cn(
              "rounded-xl border p-3 text-[15px] font-semibold leading-snug",
              TONE[result.level],
            )}
          >
            {result.headline}
          </p>

          {result.trades > 0 && (
            <>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {figures.map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[13px] text-muted-foreground">{label}</dt>
                    <dd className="text-base font-semibold tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="space-y-2.5">
                {result.flags.map((flag) => (
                  <li key={flag.key} className="flex gap-2.5 text-[15px] leading-snug">
                    {flag.hit === true ? (
                      <X className="mt-0.5 size-4 shrink-0 text-bear" aria-label="Warning" />
                    ) : flag.hit === false ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-bull" aria-label="Clear" />
                    ) : (
                      <CircleHelp
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-label="Can't tell"
                      />
                    )}
                    <span>
                      <span className="font-semibold">{flag.label}</span>
                      <span className="block text-muted-foreground">{flag.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <p className="text-[13px] leading-[18px] text-muted-foreground">
                The drawdown counts closed trades only; with trades still open it was deeper. Even a
                pass is only history: run the EA on demo for 1–3 months at your real risk before any
                real money.
              </p>
            </>
          )}
        </div>
      )}
    </Section>
  );
}
