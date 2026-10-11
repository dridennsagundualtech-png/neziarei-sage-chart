import { useId, useMemo, useState } from "react";

import type { CalcKind } from "@/lib/breakthrough/types";
import { cn } from "@/lib/utils";

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] text-muted-foreground">
          {label}
        </label>
        <span className="font-mono text-[15px] font-semibold tabular-nums">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 w-full cursor-pointer accent-[var(--color-primary)]"
      />
    </div>
  );
}

function Result({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "bull" | "bear" | "warn";
}) {
  return (
    <p
      aria-live="polite"
      className={cn(
        "border-l-2 pl-3 text-[15px] leading-relaxed",
        tone === "bull" && "border-bull",
        tone === "bear" && "border-bear",
        tone === "warn" && "border-warn",
        !tone && "border-border",
      )}
    >
      {children}
    </p>
  );
}

function Bar({ parts }: { parts: { pct: number; tone: string; label: string }[] }) {
  return (
    <div className="space-y-2">
      {parts.map((p) => (
        <div key={p.label}>
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>{p.label}</span>
            <span className="font-mono tabular-nums">{p.pct.toFixed(1)}%</span>
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, p.pct))}%`, background: p.tone }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const pct = (v: number) => `${v}%`;
const r = (v: number) => `${v.toFixed(1)}R`;
const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const signed = (v: number, digits = 2) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}`;

function RMultiple() {
  const [risk, setRisk] = useState(50);
  const [exit, setExit] = useState(2);
  return (
    <div className="space-y-3">
      <Slider
        label="Money at risk (1R)"
        value={risk}
        min={10}
        max={200}
        step={10}
        format={money}
        onChange={setRisk}
      />
      <Slider
        label="Where you exit"
        value={exit}
        min={-1}
        max={4}
        step={0.5}
        format={(v) => `${signed(v, 1)}R`}
        onChange={setExit}
      />
      <Result tone={exit >= 0 ? "bull" : "bear"}>
        {exit >= 0 ? "Profit" : "Loss"} of {money(Math.abs(exit * risk))}. Written as R, that is{" "}
        <b>{signed(exit, 1)}R</b>, and it reads the same on a $500 or a $50,000 account.
      </Result>
    </div>
  );
}

function Breakeven() {
  const [rr, setRr] = useState(2);
  const be = (1 / (1 + rr)) * 100;
  return (
    <div className="space-y-3">
      <Slider
        label="Reward : risk"
        value={rr}
        min={0.5}
        max={5}
        step={0.25}
        format={(v) => `${v.toFixed(2)} : 1`}
        onChange={setRr}
      />
      <Bar
        parts={[{ pct: be, tone: "var(--color-warn)", label: "Win rate needed to break even" }]}
      />
      <Result>
        At {rr.toFixed(2)}:1 you must win more than <b>{be.toFixed(1)}%</b> of trades just to break
        even, before spread and commission. It says nothing about the win rate you actually have.
      </Result>
    </div>
  );
}

function Expectancy() {
  const [win, setWin] = useState(40);
  const [avgWin, setAvgWin] = useState(2);
  const [avgLoss, setAvgLoss] = useState(1);
  const e = (win / 100) * avgWin - (1 - win / 100) * avgLoss;
  return (
    <div className="space-y-3">
      <Slider
        label="Win rate"
        value={win}
        min={20}
        max={80}
        step={1}
        format={pct}
        onChange={setWin}
      />
      <Slider
        label="Average winner"
        value={avgWin}
        min={0.5}
        max={5}
        step={0.1}
        format={r}
        onChange={setAvgWin}
      />
      <Slider
        label="Average loser"
        value={avgLoss}
        min={0.5}
        max={2}
        step={0.1}
        format={r}
        onChange={setAvgLoss}
      />
      <Result tone={e > 0 ? "bull" : "bear"}>
        {win}% × {avgWin.toFixed(1)}R − {100 - win}% × {avgLoss.toFixed(1)}R ={" "}
        <b>{signed(e)}R per trade</b>. Over 100 trades that is about {signed(e * 100, 0)}R,{" "}
        {e > 0 ? "a positive" : "a negative"} edge, if these numbers hold.
      </Result>
    </div>
  );
}

function ProfitFactor() {
  const [gp, setGp] = useState(3000);
  const [gl, setGl] = useState(2000);
  const pf = gp / gl;
  return (
    <div className="space-y-3">
      <Slider
        label="Total of all winning trades"
        value={gp}
        min={0}
        max={6000}
        step={100}
        format={money}
        onChange={setGp}
      />
      <Slider
        label="Total of all losing trades"
        value={gl}
        min={100}
        max={6000}
        step={100}
        format={money}
        onChange={setGl}
      />
      <Result tone={pf > 1 ? "bull" : "bear"}>
        Profit factor = {money(gp)} ÷ {money(gl)} = <b>{pf.toFixed(2)}</b>.{" "}
        {pf > 1
          ? "Winners outweigh losers."
          : pf === 1
            ? "Exactly break-even."
            : "Losers outweigh winners."}
      </Result>
    </div>
  );
}

function Drawdown() {
  const [loss, setLoss] = useState(20);
  const need = (loss / (100 - loss)) * 100;
  return (
    <div className="space-y-3">
      <Slider
        label="Account falls by"
        value={loss}
        min={5}
        max={80}
        step={5}
        format={pct}
        onChange={setLoss}
      />
      <Bar
        parts={[
          { pct: loss, tone: "var(--color-bear)", label: "Lost" },
          {
            pct: Math.min(need, 100),
            tone: "var(--color-bull)",
            label: `Gain needed to recover${need > 100 ? " (bar capped)" : ""}`,
          },
        ]}
      />
      <Result tone={need > 50 ? "bear" : "warn"}>
        Lose {loss}% and you need <b>+{need.toFixed(1)}%</b> just to get back to where you started.
      </Result>
    </div>
  );
}

/** Chance of at least one run of `k` losses in `n` trades. */
function streakChance(lossP: number, k: number, n: number) {
  // dp[j] = probability of being on a current losing run of length j with no k-run yet
  let dp = new Array<number>(k).fill(0);
  dp[0] = 1;
  let hit = 0;
  for (let t = 0; t < n; t++) {
    const next = new Array<number>(k).fill(0);
    for (let j = 0; j < k; j++) {
      const p = dp[j] ?? 0;
      if (!p) continue;
      next[0] = (next[0] ?? 0) + p * (1 - lossP);
      if (j + 1 === k) hit += p * lossP;
      else next[j + 1] = (next[j + 1] ?? 0) + p * lossP;
    }
    dp = next;
  }
  return hit;
}

function Streak() {
  const [win, setWin] = useState(40);
  const [len, setLen] = useState(5);
  const [risk, setRisk] = useState(1);
  const lossP = 1 - win / 100;
  const in100 = useMemo(() => streakChance(lossP, len, 100), [lossP, len]);
  const drop = (1 - (1 - risk / 100) ** len) * 100;
  return (
    <div className="space-y-3">
      <Slider
        label="Win rate"
        value={win}
        min={30}
        max={70}
        step={1}
        format={pct}
        onChange={setWin}
      />
      <Slider
        label="Losers in a row"
        value={len}
        min={3}
        max={12}
        step={1}
        format={(v) => `${v}`}
        onChange={setLen}
      />
      <Slider
        label="Risk per trade"
        value={risk}
        min={0.5}
        max={10}
        step={0.5}
        format={(v) => `${v}%`}
        onChange={setRisk}
      />
      <Result tone={in100 > 0.5 ? "warn" : undefined}>
        Chance of meeting at least one run of {len} losers somewhere in 100 trades:{" "}
        <b>{(in100 * 100).toFixed(0)}%</b>. That run would cost about <b>{drop.toFixed(1)}%</b> of
        the account at {risk}% risk per trade.
      </Result>
    </div>
  );
}

const PAIRS = [
  { key: "EURUSD long", usd: -1 },
  { key: "GBPUSD long", usd: -1 },
  { key: "AUDUSD long", usd: -1 },
  { key: "USDJPY long", usd: 1 },
  { key: "USDCHF short", usd: -1 },
];

function Correlation() {
  const [on, setOn] = useState<string[]>(["EURUSD long", "GBPUSD long", "AUDUSD long"]);
  const picked = PAIRS.filter((p) => on.includes(p.key));
  const shortUsd = picked.filter((p) => p.usd < 0).length;
  const longUsd = picked.filter((p) => p.usd > 0).length;
  const same = Math.max(shortUsd, longUsd);
  return (
    <div className="space-y-3">
      <p className="text-[14px] text-muted-foreground">
        Each trade risks 1%. Tap to open or close trades.
      </p>
      <div className="flex flex-wrap gap-2">
        {PAIRS.map((p) => {
          const active = on.includes(p.key);
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setOn((list) => (active ? list.filter((x) => x !== p.key) : [...list, p.key]))
              }
              className={cn(
                "h-11 rounded-xl border px-3 text-[14px] font-medium",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground",
              )}
            >
              {p.key}
            </button>
          );
        })}
      </div>
      <Result tone={same >= 3 ? "warn" : undefined}>
        Open risk {picked.length}% across {picked.length} trade{picked.length === 1 ? "" : "s"}.{" "}
        {same >= 2
          ? `${same} of them are the same bet ${shortUsd >= longUsd ? "against" : "on"} the US dollar, so a single dollar move can hit about ${same}% at once.`
          : "No two of them share the same dollar direction."}
      </Result>
    </div>
  );
}

function Kelly() {
  const [win, setWin] = useState(45);
  const [payoff, setPayoff] = useState(2);
  const f = (p: number) => p - (1 - p) / payoff;
  const full = f(win / 100);
  const lower = f((win - 5) / 100);
  return (
    <div className="space-y-3">
      <Slider
        label="Win rate"
        value={win}
        min={30}
        max={70}
        step={1}
        format={pct}
        onChange={setWin}
      />
      <Slider
        label="Average win ÷ average loss"
        value={payoff}
        min={0.5}
        max={4}
        step={0.1}
        format={(v) => v.toFixed(1)}
        onChange={setPayoff}
      />
      {full <= 0 ? (
        <Result tone="bear">No edge with these numbers. Kelly says: risk nothing.</Result>
      ) : (
        <Result tone="warn">
          Full Kelly: <b>{(full * 100).toFixed(1)}%</b> per trade · half: {(full * 50).toFixed(1)}%
          · quarter: {(full * 25).toFixed(1)}%. If your true win rate is 5 points lower, full Kelly
          drops to {lower > 0 ? `${(lower * 100).toFixed(1)}%` : "zero"}, which is why traders bet a
          small fraction of it.
        </Result>
      )}
    </div>
  );
}

function Sample() {
  const [n, setN] = useState(30);
  const half = 1.96 * Math.sqrt(0.25 / n) * 100;
  const low = Math.max(0, 50 - half);
  const high = Math.min(100, 50 + half);
  return (
    <div className="space-y-3">
      <Slider
        label="Trades in your journal"
        value={n}
        min={10}
        max={500}
        step={10}
        format={(v) => `${v}`}
        onChange={setN}
      />
      <div>
        <div className="relative h-4 rounded-full bg-muted">
          <div
            className="absolute inset-y-0 rounded-full bg-warn/60"
            style={{ left: `${low}%`, width: `${high - low}%` }}
          />
          <div className="absolute inset-y-[-3px] w-0.5 bg-foreground" style={{ left: "50%" }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[13px] text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      <Result>
        You measured a 50% win rate over {n} trades. The true rate could reasonably be anywhere from{" "}
        <b>
          {low.toFixed(0)}% to {high.toFixed(0)}%
        </b>{" "}
        (95% range). More trades shrink the band.
      </Result>
    </div>
  );
}

function Trailing() {
  const start = 10000;
  const limit = 800;
  const [peak, setPeak] = useState(10600);
  const [now, setNow] = useState(10100);
  const staticFloor = start - limit;
  const trailFloor = Math.max(peak, start) - limit;
  const effectiveNow = Math.min(now, peak);
  return (
    <div className="space-y-3">
      <p className="text-[14px] text-muted-foreground">$10,000 account, maximum loss $800.</p>
      <Slider
        label="Highest equity reached"
        value={peak}
        min={10000}
        max={12000}
        step={100}
        format={money}
        onChange={setPeak}
      />
      <Slider
        label="Equity now"
        value={effectiveNow}
        min={9000}
        max={peak}
        step={100}
        format={money}
        onChange={setNow}
      />
      <Result tone={effectiveNow <= trailFloor ? "bear" : undefined}>
        Static rule: fail below <b>{money(staticFloor)}</b>, room left{" "}
        {money(effectiveNow - staticFloor)}. Trailing rule: fail below <b>{money(trailFloor)}</b>,
        room left {money(effectiveNow - trailFloor)}.{" "}
        {effectiveNow <= trailFloor
          ? "This account would already be failed under the trailing rule."
          : ""}
      </Result>
    </div>
  );
}

export function CalcVisual({ kind }: { kind: CalcKind }) {
  switch (kind) {
    case "rmultiple":
      return <RMultiple />;
    case "breakeven":
      return <Breakeven />;
    case "expectancy":
      return <Expectancy />;
    case "profitfactor":
      return <ProfitFactor />;
    case "drawdown":
      return <Drawdown />;
    case "streak":
      return <Streak />;
    case "correlation":
      return <Correlation />;
    case "kelly":
      return <Kelly />;
    case "sample":
      return <Sample />;
    case "trailing":
      return <Trailing />;
  }
}
