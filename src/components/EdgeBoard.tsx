/**
 * Personal edge board UI — Journal → Stats.
 * Coaching from YOUR finished trades only. Never changes Den math.
 */
import { Lightbulb } from "lucide-react";

import { Breakdown, JSection, type BreakdownGroup } from "@/components/journal/parts";
import { TermTooltip } from "@/components/TermTooltip";
import { SAMPLE_TIER_LABEL } from "@/lib/analysis-types";
import { bucketBlurb, buildEdgeBoard, type EdgeBucket } from "@/lib/edge-board";
import type { JournalRow } from "@/lib/stats";

function toRows(buckets: EdgeBucket[]): BreakdownGroup["rows"] {
  return buckets.map((bucket) => ({
    label: bucket.label,
    total: bucket.stats.total,
    winRate: bucket.stats.winRate,
    avgR: bucket.stats.avgR,
    // Only groups with enough trades get a comment; saying "too few" on every row is just noise.
    ...(bucket.reliable
      ? { note: `Enough data. ${bucketBlurb(bucket)}`, noteTone: "ok" as const }
      : {}),
  }));
}

export function EdgeBoard({ rows, minSample = 15 }: { rows: JournalRow[]; minSample?: number }) {
  const board = buildEdgeBoard(rows, minSample);

  const groups: BreakdownGroup[] = [
    { key: "symbol", label: "Symbol", rows: toRows(board.bySymbol) },
    { key: "grade", label: "Grade", rows: toRows(board.byGrade) },
    { key: "direction", label: "Direction", rows: toRows(board.byDirection) },
    { key: "timeframe", label: "Timeframe", rows: toRows(board.byTimeframe) },
    { key: "setup", label: "Setup type", rows: toRows(board.bySetupType) },
    { key: "session", label: "Session (UTC)", rows: toRows(board.bySession) },
  ];

  return (
    <JSection
      title={<TermTooltip term="My edge board" label="My edge board" />}
      hint={
        <>
          What has actually worked <span className="font-semibold text-foreground">for you</span>,
          from finished journal trades only. It never changes the Den Analyzer rules.
        </>
      }
    >
      <p className="mb-5 text-[15px] text-muted-foreground">
        {board.totalCompleted} finished {board.totalCompleted === 1 ? "trade" : "trades"} · sample:{" "}
        {SAMPLE_TIER_LABEL[board.sampleTier]}. A group needs about {board.minSample} trades to count
        as “enough data”.
      </p>

      {board.coaching.length > 0 && (
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Lightbulb className="size-5" aria-hidden /> What your scoreboard says
          </h3>
          <ul className="mt-3 space-y-2.5 text-[15px] leading-snug">
            {board.coaching.map((line, index) => (
              <li key={index} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Breakdown label="Edge board" groups={groups} empty="No finished trades to group yet." />

      <p className="mt-5 text-[13px] leading-[18px] text-muted-foreground">
        Built from finished trades in this view. It shows what happened together, not what causes
        results, and it is not a promise of future results.
      </p>
    </JSection>
  );
}
