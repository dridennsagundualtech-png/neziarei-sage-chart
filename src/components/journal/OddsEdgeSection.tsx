import { VERDICT_LEVELS } from "@/components/EdgeVerdictCard";
import { DataTable, JSection, Notice, StatRows, fmtR, signTone } from "@/components/journal/parts";
import { TermTooltip } from "@/components/TermTooltip";
import { sessionFromTimestamp } from "@/lib/edge-board";
import { oddsEdge, oddsGroups, type OddsGroup, type OddsRowLike } from "@/lib/odds-edge";
import { cn } from "@/lib/utils";

const pct = (v: number | null) => (v === null ? "–" : `${Math.round(v * 100)}%`);
const points = (v: number) => {
  const n = Math.abs(Math.round(v * 100));
  return `${v >= 0 ? "+" : "−"}${n} ${n === 1 ? "pt" : "pts"}`;
};

/**
 * Journal › Stats: every finished trade against the price map's no-edge odds
 * for its own levels (src/lib/odds-edge.ts). The verdict uses the same strict
 * rules as the rest of the app; groups are description only.
 */
export function OddsEdgeSection({ rows }: { rows: OddsRowLike[] }) {
  const edge = oddsEdge(rows);
  const level = VERDICT_LEVELS[edge.level];
  const groups: { title: string; list: OddsGroup[] }[] = [
    { title: "By symbol", list: oddsGroups(rows, (t) => t.asset) },
    { title: "By session", list: oddsGroups(rows, (t) => sessionFromTimestamp(t.created_at)) },
  ].filter((g) => g.list.length > 0);

  return (
    <JSection
      title={<TermTooltip term="Your edge vs the odds" label="Your edge vs the odds" />}
      hint="Each finished trade against the price map's odds for its own entry, stop and TP1. Beating those odds over many trades is what an edge looks like."
    >
      <div className={cn("mb-4 rounded-2xl border bg-elevated p-4", level.border)}>
        <p className={cn("caps text-xl", level.text)}>{level.label}</p>
        <p className="mt-1 text-[15px] leading-relaxed">{edge.headline}</p>
      </div>

      <StatRows
        rows={[
          {
            label: "Trades counted",
            value: String(edge.trades),
            hint: `Wins and losses with a long or short plan and valid levels. About ${edge.needed.toLocaleString("en-US")} needed to judge.`,
          },
          { label: "TP1 came first", value: pct(edge.hitRate) },
          { label: "The odds said", value: pct(edge.oddsRate) },
          {
            label: "Ahead of the odds",
            value: edge.marginR === null ? "–" : `${fmtR(edge.marginR)} a trade`,
            tone: edge.marginR === null ? undefined : signTone(edge.marginR),
          },
          {
            label: "Left out",
            value: String(edge.leftOut),
            hint: "Breakevens, missed or invalidated trades, and trades without valid levels: they don't settle whether TP1 or the stop came first.",
          },
        ]}
      />

      {groups.length > 0 ? (
        <div className="mt-6 space-y-5">
          <p className="text-[15px] leading-snug text-muted-foreground">
            Groups with 20 or more counted trades, as a description only. Picking your best group
            after the fact is how luck looks like skill, so groups never get a verdict.
          </p>
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-1 text-base font-semibold">{group.title}</h3>
              <DataTable
                label={`Your results against the odds, ${group.title.toLowerCase()}`}
                columns={[
                  { label: "Group" },
                  { label: "Trades", align: "right" },
                  { label: "TP1 first", align: "right" },
                  { label: "Odds", align: "right" },
                  { label: "Difference", align: "right" },
                ]}
                rows={group.list.map((row) => ({
                  key: row.label,
                  cells: [
                    row.label,
                    row.trades,
                    pct(row.hitRate),
                    pct(row.oddsRate),
                    <span
                      key="d"
                      className={cn("font-semibold", signTone(row.hitRate - row.oddsRate))}
                    >
                      {points(row.hitRate - row.oddsRate)}
                    </span>,
                  ],
                }))}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-[15px] text-muted-foreground">
          Breakdowns by symbol and session appear once a group has 20 counted trades.
        </p>
      )}

      <div className="mt-5">
        <Notice>
          Only logged trades count. Log every trade you take, losers too, or this will flatter you.
        </Notice>
      </div>
    </JSection>
  );
}
