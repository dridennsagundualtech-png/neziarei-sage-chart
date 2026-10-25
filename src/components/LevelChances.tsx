import { VERDICT_LEVELS } from "@/components/EdgeVerdictCard";
import { DataTable } from "@/components/journal/parts";
import type { EdgeVerdict, VerdictLevel } from "@/lib/edge-verdict";
import { levelText } from "@/lib/instruments";
import { FILL_DAYS, levelChances, outOf100, planOutcomes, type HitRecord } from "@/lib/level-odds";
import { cn } from "@/lib/utils";

/** "35%", "under 5%", "over 95%": odds rounded to 5%, short enough for a table. */
function pct(p: number | null): string {
  if (p === null) return "–";
  if (p < 0.05) return "under 5%";
  if (p > 0.95) return "over 95%";
  return `${Math.round(p * 20) * 5}%`;
}

/** Past results are counts, not modelled odds, so they keep whole percents. */
const whole = (p: number) => `${Math.round(p * 100)}%`;

function RecordLine({
  who,
  record,
  level,
}: {
  who: string;
  record: HitRecord;
  level: VerdictLevel | null;
}) {
  const verdict = level ? VERDICT_LEVELS[level] : null;
  return (
    <li className="py-2.5">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-semibold">{who}</span>
        {verdict && <span className={cn("caps text-sm", verdict.text)}>{verdict.label}</span>}
      </p>
      <p className="mt-0.5 text-muted-foreground">
        {record.trades && record.hitRate !== null && record.oddsRate !== null
          ? `TP1 came first ${whole(record.hitRate)} of the time over ${record.trades.toLocaleString("en-US")} finished trades; the odds for their levels said ${whole(record.oddsRate)}.`
          : "No finished wins or losses with valid levels yet."}
      </p>
    </li>
  );
}

/**
 * The chance of each price in the plan with no edge (src/lib/level-odds.ts),
 * what happens to 100 plans like it, and how past reads did against the same
 * odds. The verdicts come from the app's strict checks, never from here.
 */
export function LevelChances({
  symbol,
  now,
  sigma,
  levels,
  denRecord,
  denVerdict,
  journalRecord,
  journalLevel,
}: {
  symbol: string;
  /** The latest closed price and where it came from; null when unknown. */
  now: { price: number; label: string } | null;
  /** Daily volatility from the price map; null when the symbol has no stored daily bars. */
  sigma: number | null;
  levels: { entry: number; stop: number; tp1: number; tp2: number | null };
  /** Den results only: its replayed signals, and the track record's verdict (with costs). */
  denRecord?: HitRecord | null;
  denVerdict?: EdgeVerdict | null;
  journalRecord: HitRecord;
  journalLevel: VerdictLevel;
}) {
  const chances = now && sigma ? levelChances(now.price, sigma, levels) : [];
  const outcomes = planOutcomes(now?.price ?? null, sigma, levels.entry, levels.stop, levels.tp1);
  const parts = outcomes
    ? [
        { key: "tp1", label: "Reach TP1 first", share: outcomes.tp1, bar: "bg-bull" },
        { key: "stop", label: "Hit the stop first", share: outcomes.stop, bar: "bg-bear" },
        ...(outcomes.fill !== null && outcomes.unfilled >= 0.005
          ? [
              {
                key: "unfilled",
                label: `Never reach the entry in ${FILL_DAYS} days`,
                share: outcomes.unfilled,
                bar: "bg-muted-foreground/40",
              },
            ]
          : []),
      ]
    : [];
  const counts = outOf100(parts.map((p) => p.share));
  const proven = denVerdict?.level === "edge" || journalLevel === "edge";

  return (
    <div className="text-sm">
      {chances.length > 0 && now && (
        <>
          <p className="font-semibold">Price trades at each level</p>
          <p className="mb-1 text-xs text-muted-foreground">
            From {now.label}. Any touch counts, up or down; which comes first after the entry is
            below.
          </p>
          <DataTable
            label={`Chance price reaches each ${symbol} plan level`}
            columns={[
              { label: "Level" },
              { label: "Price", align: "right" },
              { label: "In 1 day", align: "right" },
              { label: `In ${FILL_DAYS} days`, align: "right" },
            ]}
            rows={chances.map((c) => ({
              key: c.key,
              cells: [c.label, levelText(symbol, c.price), pct(c.day1), pct(c.day5)],
            }))}
          />
        </>
      )}

      {outcomes && (
        <div className={cn(chances.length > 0 && "mt-5")}>
          <p className="font-semibold">
            {outcomes.fill !== null ? "Out of 100 plans like this" : "Out of 100 trades that fill"}
          </p>
          <div className="mt-2 flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {parts
              .filter((part) => part.share > 0)
              .map((part) => (
                <span
                  key={part.key}
                  className={cn("h-full", part.bar)}
                  style={{ flex: `${part.share} 1 0%` }}
                />
              ))}
          </div>
          <ul className="mt-2 divide-y divide-border">
            {parts.map((part, i) => (
              <li key={part.key} className="flex items-center justify-between gap-3 py-2">
                <span className="flex items-center gap-2">
                  <span aria-hidden className={cn("inline-block size-2.5 rounded-sm", part.bar)} />
                  {part.label}
                </span>
                <span className="font-semibold tabular-nums">
                  {counts[i] === 0 && part.share > 0 ? "under 5" : `about ${counts[i]}`}
                </span>
              </li>
            ))}
          </ul>
          {outcomes.fill === null && (
            <p className="mt-1 text-xs text-muted-foreground">
              No daily data is stored for {symbol}, so the chance the entry fills isn&rsquo;t known.
            </p>
          )}
        </div>
      )}

      <p className="mt-5 font-semibold">How accurate the read has been</p>
      <ul className="divide-y divide-border">
        {denRecord && (
          <RecordLine
            who="Den, these rules on past data"
            record={denRecord}
            level={denVerdict?.level ?? null}
          />
        )}
        <RecordLine who="Your logged trades" record={journalRecord} level={journalLevel} />
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        {proven
          ? "A record above beats the odds on its history. That's a reason to trust the read more, not a promise for this trade."
          : "No record above proves an edge yet, so the chances above are the honest ones for this plan. A read can only shift them once its record shows it beats the odds."}
      </p>
    </div>
  );
}
