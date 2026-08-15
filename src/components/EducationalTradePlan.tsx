import { AlertTriangle, BadgeCheck, ShieldX, Target } from "lucide-react";

import { TermTooltip } from "@/components/TermTooltip";
import type { AnalysisResult } from "@/lib/analysis-types";
import type { SettingsRow } from "@/lib/data";

/**
 * Trade plan in teaching form: WHAT / WHY / ENTRY / INVALIDATION / TARGET /
 * R:R / CONFIRMATION, closed by an explicit "do not follow blindly" note.
 */
export function EducationalTradePlan({
  result,
  settings,
}: {
  result: AnalysisResult;
  settings: SettingsRow;
}) {
  const rrBelowMin =
    typeof result.risk_reward === "number" && result.risk_reward < Number(settings.min_rr);

  const rows: { key: string; label: string; value: string; term?: string }[] = [
    {
      key: "what",
      label: "WHAT",
      value:
        result.direction === "POTENTIAL LONG" || result.direction === "POTENTIAL SHORT"
          ? result.direction
          : `${result.direction} — no position is justified by the current evidence.`,
    },
    {
      key: "why",
      label: "WHY",
      value: result.summary || "The screenshots do not support a clear reason yet.",
    },
    {
      key: "entry",
      label: "ENTRY",
      value: result.entry_zone
        ? `Only if price reaches ${result.entry_zone} AND the confirmation below happens first.`
        : "No entry zone is readable from these screenshots.",
      term: "Entry zone",
    },
    {
      key: "invalidation",
      label: "INVALIDATION",
      value:
        result.invalidation[0] ??
        (result.stop_loss ? `A decisive move beyond ${result.stop_loss}.` : "Not determinable from these screenshots."),
      term: "Invalidation",
    },
    {
      key: "target",
      label: "TARGET",
      value: [result.tp1, result.tp2].filter(Boolean).join(" → ") || "No logical target area is readable.",
      term: "TP1",
    },
    {
      key: "rr",
      label: "R:R",
      value: result.risk_reward
        ? `${result.risk_reward.toFixed(1)}R potential reward per 1R risked — a payoff ratio, not a probability.`
        : "Not measurable from these screenshots.",
      term: "R:R",
    },
    {
      key: "confirmation",
      label: "CONFIRMATION",
      value:
        result.required_confirmation.join(" · ") ||
        "Wait for a structural break with a close, not a wick, before considering anything.",
      term: "Required confirmation",
    },
  ];

  return (
    <section className="animate-float-in card-soft p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Target className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold">
            <TermTooltip term="Conditional trade plan" label="Educational trade plan" />
          </h2>
          <p className="text-xs text-muted-foreground">
            Read it as a set of conditions to check, not as instructions to execute.
          </p>
        </div>
      </div>

      <dl className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="panel p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {row.term ? <TermTooltip term={row.term} label={row.label} /> : row.label}
            </dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-foreground/90">{row.value}</dd>
          </div>
        ))}
      </dl>

      {rrBelowMin && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-warn/10 p-3 text-xs text-warn">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Reward-to-risk is below your own minimum of {settings.min_rr}:1 — by your own rules, this is a
          skip.
        </p>
      )}

      <p className="mt-3 flex items-start gap-2 rounded-xl bg-bear/10 p-3 text-xs leading-relaxed text-bear">
        <ShieldX className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">DO NOT FOLLOW BLINDLY: </span>
          this plan is a conditional interpretation of the chart, not an instruction or a guarantee. If
          the confirmation never happens, there is no trade.
        </span>
      </p>

      <p className="mt-2 flex items-start gap-2 text-[11px] text-muted-foreground">
        <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
        Before considering anything: could you explain each line above in your own words? If not, use
        “Teach me this chart” first.
      </p>
    </section>
  );
}
