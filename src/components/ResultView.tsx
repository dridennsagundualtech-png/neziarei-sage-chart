import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Calculator,
  CircleHelp,
  Copy,
  Eye,
  Info,
  ListChecks,
  Radar,
  ShieldX,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TermTooltip } from "@/components/TermTooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CHECKLIST_BY_KEY,
  GRADE_LABEL,
  MAX_SCORE,
  OUTCOMES,
  SAMPLE_TIER_LABEL,
  type AnalysisResult,
  type Outcome,
} from "@/lib/analysis-types";
import { useUpdateAnalysis, type AnalysisRow, type SettingsRow } from "@/lib/data";
import { historicalEdge, midpointOf, positionSize, type JournalRow } from "@/lib/stats";
import {
  copyToClipboard,
  eaSignalOf,
  formatTradePlanCompact,
  formatTradePlanText,
  generateSimplePineAlert,
} from "@/lib/trade-plan-export";
import { cn } from "@/lib/utils";

export function rowToResult(row: AnalysisRow): AnalysisResult {
  return {
    asset: row.asset,
    market_type: row.market_type,
    timeframes: row.timeframes,
    primary_timeframe: row.primary_timeframe,
    sufficient_information: row.sufficient_information,
    requested_additional_images: row.requested_additional_images,
    missing_information: [],
    htf_bias: row.htf_bias,
    direction: row.direction as AnalysisResult["direction"],
    setup_stage: row.setup_stage as AnalysisResult["setup_stage"],
    checklist: row.checklist,
    score: row.score,
    max_score: row.max_score,
    grade: row.grade as AnalysisResult["grade"],
    visual_evidence: row.visual_evidence as AnalysisResult["visual_evidence"],
    summary: row.summary ?? "",
    entry_zone: row.entry_zone,
    stop_loss: row.stop_loss,
    tp1: row.tp1,
    tp2: row.tp2,
    risk_reward: row.risk_reward,
    required_confirmation: row.required_confirmation,
    invalidation: row.invalidation,
    reasoning: row.reasoning,
  };
}

function titleCase(text: string) {
  return text.charAt(0) + text.slice(1).toLowerCase();
}

function directionTone(direction: string, invalidated: boolean) {
  if (invalidated) return "bear";
  if (direction === "POTENTIAL LONG") return "bull";
  if (direction === "POTENTIAL SHORT") return "bear";
  return "neutral";
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ElementType;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-float-in card-soft">
      <h2 className="card-band">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <TermTooltip term={title} label={title} />
      </h2>
      <div className="p-4">
        {hint && <p className="mb-3 text-sm text-muted-foreground">{hint}</p>}
        {children}
      </div>
    </section>
  );
}

const STRIP = [
  { key: "READY", label: "Ready", tone: "bg-bull text-bull-foreground" },
  { key: "WAIT", label: "Wait", tone: "bg-primary text-primary-foreground" },
  { key: "NO_TRADE", label: "No trade", tone: "bg-bear text-bear-foreground" },
] as const;

/**
 * The preflight strip: one segment lit for the checklist verdict. It states
 * where the checklist landed, never an instruction to trade.
 */
function StateStrip({ level }: { level: "READY" | "DEVELOPING" | "WAIT" | "NO_TRADE" }) {
  const active = level === "DEVELOPING" ? "WAIT" : level;
  return (
    <div
      role="img"
      aria-label={`Checklist verdict: ${STRIP.find((seg) => seg.key === active)?.label}`}
      className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-elevated"
    >
      {STRIP.map((seg, i) => (
        <span
          key={seg.key}
          className={cn(
            "caps py-2.5 text-center text-lg transition-colors",
            i > 0 && "border-l border-border",
            seg.key === active ? cn(seg.tone, "animate-pop") : "text-muted-foreground/60",
          )}
        >
          {seg.label}
        </span>
      ))}
    </div>
  );
}

/** One ruled row: label left, value right in the figures column. */
function PlanRow({ label, value, tone }: { label: string; value: string | null; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">
        <TermTooltip term={label} label={label} />
      </dt>
      <dd
        className={cn("text-right text-sm font-semibold", value ? tone : "text-muted-foreground")}
      >
        {value ?? "Not visible"}
      </dd>
    </div>
  );
}

interface ResultViewProps {
  result: AnalysisResult;
  journal: JournalRow[];
  settings: SettingsRow;
  savedRow?: AnalysisRow | null;
}

export function ResultView({ result, journal, settings, savedRow }: ResultViewProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const invalidated =
    savedRow?.outcome === "INVALIDATED" || result.setup_stage === "SETUP INVALIDATED";
  const tone = directionTone(result.direction, invalidated);
  const edge = historicalEdge(
    journal,
    {
      asset: result.asset,
      direction: result.direction,
      timeframe: result.primary_timeframe,
      score: result.score,
    },
    settings.min_sample_size,
  );

  const entryMid = midpointOf(result.entry_zone);
  const stopMid = midpointOf(result.stop_loss);
  const sizing = positionSize({
    balance: Number(settings.account_balance),
    riskPct: Number(settings.risk_pct),
    entry: entryMid,
    stop: stopMid,
  });

  const rrBelowMin =
    typeof result.risk_reward === "number" && result.risk_reward < Number(settings.min_rr);

  const eaSignal = eaSignalOf(result);
  const pineSnippet = generateSimplePineAlert(result);

  const handleCopyPlan = async (mode: "full" | "compact" | "pine") => {
    let text = "";
    if (mode === "full") {
      text = formatTradePlanText(result, {
        riskAmount: sizing.riskAmount,
        units: sizing.units,
        currency: settings.currency,
        riskPct: Number(settings.risk_pct),
      });
    } else if (mode === "compact") {
      text = formatTradePlanCompact(result);
    } else {
      text = pineSnippet ?? "";
    }
    if (!text) {
      toast.error("Nothing to copy: levels are not readable from this analysis.");
      return;
    }
    const ok = await copyToClipboard(text);
    toast[ok ? "success" : "error"](
      ok
        ? mode === "pine"
          ? "Pine alert idea copied."
          : "Trade plan copied."
        : "Could not copy: try selecting the text manually.",
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Overall result */}
      <section className="animate-float-in space-y-4">
        <StateStrip level={invalidated ? "NO_TRADE" : eaSignal.level} />

        <div>
          <h2
            className={cn(
              "flex items-center gap-2 text-4xl font-bold leading-none",
              tone === "bull" && "text-bull",
              tone === "bear" && "text-bear",
              tone === "neutral" && "text-foreground",
            )}
          >
            {tone === "bull" ? (
              <TrendingUp className="size-7" aria-hidden />
            ) : tone === "bear" ? (
              <TrendingDown className="size-7" aria-hidden />
            ) : (
              <CircleHelp className="size-7 text-neutralstate" aria-hidden />
            )}
            {invalidated ? "Setup invalidated" : titleCase(result.direction)}
          </h2>
          <p className="mt-2 text-sm font-semibold">
            {result.asset}
            {result.timeframes.length > 0 ? ` · ${result.timeframes.join(" + ")}` : ""}
            <span className="font-normal text-muted-foreground">
              {` · ${titleCase(result.setup_stage)}`}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{eaSignal.shortReason}</p>
        </div>

        <dl className="card-soft grid grid-cols-2 overflow-hidden">
          <div className="border-r border-border p-4">
            <dt className="text-xs text-muted-foreground">
              <TermTooltip term="Setup quality" label="Setup quality" />
            </dt>
            <dd className="mt-1 font-display text-4xl font-bold leading-none">
              {result.score}
              <span className="text-xl text-muted-foreground">
                /{result.max_score ?? MAX_SCORE}
              </span>
            </dd>
            <dd className="mt-1 text-sm">{GRADE_LABEL[result.grade]}</dd>
          </div>
          <div className="p-4">
            <dt className="text-xs text-muted-foreground">
              <TermTooltip
                term="Visual evidence"
                label="Visual evidence"
                explanation="How clear the evidence in your screenshots is. It is NOT a probability that the trade wins."
              />
            </dt>
            <dd className="mt-1 font-display text-4xl font-bold leading-none capitalize">
              {result.visual_evidence.toLowerCase()}
            </dd>
            <dd className="mt-1 text-sm">
              <TermTooltip term="HTF" label="HTF bias" />: {result.htf_bias}
            </dd>
          </div>
          <div className="col-span-2 border-t border-border p-4">
            <dt className="text-xs text-muted-foreground">
              <TermTooltip term="Historical edge" label="Historical edge" />
            </dt>
            {edge.displayable ? (
              <dd className="mt-1 text-base font-semibold">
                {edge.winRate?.toFixed(1)}% across {edge.comparableCount} comparable completed
                setups
              </dd>
            ) : (
              <dd className="mt-1 text-sm text-muted-foreground">
                Not enough history yet: {edge.comparableCount} comparable setups,{" "}
                {SAMPLE_TIER_LABEL[edge.tier].toLowerCase()}. A win rate appears at{" "}
                {edge.minSampleSize}.
              </dd>
            )}
          </div>
        </dl>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Setup quality, visual evidence and historical performance are three separate things. None
          of them is a prediction.
          {result.provider_used ? ` Analysed with ${result.provider_used}.` : ""}
        </p>
      </section>

      {/* 2. Simple explanation */}
      {result.summary && (
        <Section icon={Info} title="In plain English">
          <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
        </Section>
      )}

      {/* Insufficient evidence */}
      {!result.sufficient_information && (
        <Section
          icon={AlertTriangle}
          title="More chart context required"
          hint="Nothing was invented to fill these gaps."
        >
          <ol className="divide-y divide-border text-sm">
            {[...result.missing_information, ...result.requested_additional_images].map(
              (item, i) => (
                <li key={i} className="flex gap-3 py-2.5">
                  <span className="caps w-5 shrink-0 text-base text-warn">{i + 1}</span>
                  {item}
                </li>
              ),
            )}
          </ol>
        </Section>
      )}

      {/* 3. Trade plan */}
      {result.sufficient_information && (
        <Section
          icon={Target}
          title="Conditional trade plan"
          hint="This is a conditional setup, not a guaranteed prediction or an instruction to trade."
        >
          <dl className="divide-y divide-border">
            <PlanRow label="Entry zone" value={result.entry_zone} />
            <PlanRow label="Stop / invalidation" value={result.stop_loss} tone="text-bear" />
            <PlanRow label="TP1" value={result.tp1} tone="text-bull" />
            <PlanRow label="TP2" value={result.tp2} tone="text-bull" />
            <PlanRow
              label="R:R"
              value={result.risk_reward ? `${result.risk_reward.toFixed(1)}R` : null}
            />
          </dl>
          {rrBelowMin && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-warn/10 p-3 text-xs text-warn">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Reward-to-risk is below your minimum of {settings.min_rr}:1, flagged as unfavourable.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            <TermTooltip term="R:R" label="What R:R means" />: it measures potential reward relative
            to defined risk. It does not predict win probability.
          </p>

          {/* Group D: account protection reminders (from Settings) */}
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <p className="text-sm font-semibold">Risk rules for this plan</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
              {Number(settings.risk_pct) > 0 && (
                <li>
                  Risk about{" "}
                  <span className="font-medium text-foreground">{settings.risk_pct}%</span> of
                  account per trade
                  {sizing.units != null && Number.isFinite(sizing.units)
                    ? ` (≈ ${sizing.units.toLocaleString(undefined, { maximumFractionDigits: 4 })} units / ${Number(sizing.riskAmount).toFixed(2)} ${settings.currency})`
                    : ""}
                  .
                </li>
              )}
              {Number(settings.move_to_be_at_r) > 0 && (
                <li>
                  If price moves{" "}
                  <span className="font-medium text-foreground">+{settings.move_to_be_at_r}R</span>{" "}
                  in your favour, consider moving stop to{" "}
                  <span className="font-medium text-foreground">break-even (entry)</span> so a
                  winner cannot become a full loser.
                </li>
              )}
              {Number(settings.daily_loss_limit_r) > 0 && (
                <li>
                  Daily soft stop: if you are down about{" "}
                  <span className="font-medium text-foreground">
                    {settings.daily_loss_limit_r}R
                  </span>{" "}
                  today, skip new trades until tomorrow — protects the account more than one more
                  “revenge” setup.
                </li>
              )}
              {Number(settings.move_to_be_at_r) <= 0 &&
                Number(settings.daily_loss_limit_r) <= 0 && (
                  <li>
                    Set “Move stop to break-even” and “Daily loss limit” under Settings → Risk to
                    see those reminders here.
                  </li>
                )}
            </ul>
          </div>
        </Section>
      )}

      {/* 3b. Practical export: copy plan / Discord / Pine idea */}
      {result.sufficient_information && (
        <Section
          icon={Copy}
          title="Copy plan & alerts"
          hint="Practical helpers for journaling, Discord/Telegram, or a simple TradingView alert idea. Always confirm live."
        >
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={() => handleCopyPlan("full")}
            >
              <Copy className="size-4" />
              Full plan
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={() => handleCopyPlan("compact")}
            >
              <Copy className="size-4" />
              Discord / Telegram
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!pineSnippet}
              onClick={() => handleCopyPlan("pine")}
              title={
                pineSnippet
                  ? "Copy a simple Pine Script alert idea based on readable levels"
                  : "Entry/stop prices not readable: cannot build alert idea"
              }
            >
              <Radar className="size-4" />
              Pine alert idea
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The Pine snippet only plots the levels that could be read from the analysis. It is not
            an automated EA and does not place orders.
          </p>
        </Section>
      )}

      {/* 4. Required confirmation */}
      {result.required_confirmation.length > 0 && (
        <Section
          icon={BadgeCheck}
          title="Required confirmation before considering entry"
          hint="Do not chase price. Wait for these conditions."
        >
          <ul className="divide-y divide-border text-sm">
            {result.required_confirmation.map((item, i) => (
              <li key={i} className="flex gap-2.5 py-2.5">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-bull" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 5. Invalidation */}
      {result.invalidation.length > 0 && (
        <Section
          icon={ShieldX}
          title="Invalidation watch"
          hint="If any of these happen, the setup is dead."
        >
          <ul className="divide-y divide-border text-sm">
            {result.invalidation.map((item, i) => (
              <li key={i} className="flex gap-2.5 py-2.5">
                <ShieldX className="mt-0.5 size-4 shrink-0 text-bear" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 6. Checklist */}
      <Section
        icon={ListChecks}
        title="Setup checklist"
        hint={`Every component is capped at its maximum: total ${result.score}/${result.max_score ?? MAX_SCORE}.`}
      >
        <ul className="divide-y divide-border">
          {result.checklist.map((item, index) => {
            const spec = CHECKLIST_BY_KEY[item.key];
            const max = spec?.max ?? item.max;
            const ratio = max ? item.score / max : 0;
            return (
              <li
                key={item.key}
                className="animate-tick-in grid grid-cols-[1fr_auto] gap-x-4 py-3"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <p className="text-sm font-semibold">
                  <TermTooltip
                    term={spec?.label ?? item.key}
                    label={spec?.label ?? item.key}
                    explanation={spec?.help}
                  />
                </p>
                <p
                  className={cn(
                    "row-span-2 self-center text-right font-display text-2xl font-bold leading-none",
                    ratio >= 1 && "text-bull",
                    ratio > 0 && ratio < 1 && "text-warn",
                    ratio === 0 && "text-muted-foreground",
                  )}
                  aria-label={`${item.score} of ${max} points`}
                >
                  {item.score}
                  <span className="text-base text-muted-foreground">/{max}</span>
                </p>
                <p className="mt-0.5 text-sm text-foreground/90">{item.status}</p>
                <div className="col-span-2 mt-1 space-y-1 text-xs text-muted-foreground">
                  <p>{item.evidence}</p>
                  <p>
                    Evidence confidence: {item.confidence}
                    {item.missing ? ` · Missing: ${item.missing}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 7. Why this read */}
      {result.reasoning.length > 0 && (
        <Section icon={BookOpen} title="Why this read" hint="Learn the logic, step by step.">
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-xl"
            onClick={() => setShowReasoning((v) => !v)}
          >
            {showReasoning ? "Hide reasoning" : "Show reasoning"}
          </Button>
          {showReasoning && (
            <ol className="mt-3 divide-y divide-border text-sm">
              {result.reasoning.map((item, i) => (
                <li key={i} className="flex gap-3 py-2.5">
                  <span className="caps w-5 shrink-0 text-base text-muted-foreground">{i + 1}</span>
                  {item}
                </li>
              ))}
            </ol>
          )}
        </Section>
      )}

      {/* 8. Historical evidence */}
      <Section
        icon={Eye}
        title="Historical evidence"
        hint="Calculated only from your own completed journal entries."
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="panel p-3">
            <p className="text-xs uppercase text-muted-foreground">
              <TermTooltip term="Comparable setups" label="Comparable setups" />
            </p>
            <p className="font-display text-xl">{edge.comparableCount}</p>
          </div>
          <div className="panel p-3">
            <p className="text-xs uppercase text-muted-foreground">
              <TermTooltip term="Sample quality" label="Sample quality" />
            </p>
            <p className="text-sm">{SAMPLE_TIER_LABEL[edge.tier]}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Comparable = same asset, same direction, same primary timeframe and a setup score within
          ±2.
          {edge.displayable
            ? " Even a large sample never guarantees future performance."
            : ` A win rate appears only once ${edge.minSampleSize} comparable completed setups exist.`}
        </p>
      </Section>

      {/* 9. Risk management */}
      <Section
        icon={Calculator}
        title="Risk management"
        hint="Never scale risk up because a score looks good."
      >
        <div className="grid grid-cols-2 gap-2">
          <div className="panel p-3">
            <p className="text-xs uppercase text-muted-foreground">
              <TermTooltip term="Risk per trade" label="Risk per trade" />
            </p>
            <p className="font-display text-xl">{Number(settings.risk_pct)}%</p>
          </div>
          <div className="panel p-3">
            <p className="text-xs uppercase text-muted-foreground">
              <TermTooltip term="Max loss" label="Max loss" />
            </p>
            <p className="font-display text-xl">
              {Number(settings.account_balance) > 0
                ? `${settings.currency} ${sizing.riskAmount.toFixed(2)}`
                : "Set balance"}
            </p>
          </div>
          <div className="panel col-span-2 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              <TermTooltip term="Position size" label="Position size" />
            </p>
            <p className="font-mono text-sm">
              {sizing.units
                ? `${sizing.units.toFixed(4)} units · risk per unit ${sizing.riskPerUnit?.toFixed(4)}`
                : "Not calculable: exact entry/stop prices are not readable from the screenshots."}
            </p>
            {sizing.units != null && sizing.units > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Convert to lots/contracts using your broker’s contract size. Example: if 1 lot =
                100,000 units, size ≈ {(sizing.units / 100000).toFixed(2)} lots.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* 10. Journal */}
      {savedRow && <JournalControls row={savedRow} />}
    </div>
  );
}

function JournalControls({ row }: { row: AnalysisRow }) {
  const update = useUpdateAnalysis();
  const [outcome, setOutcome] = useState<Outcome>(row.outcome);
  const [rResult, setRResult] = useState(row.r_result?.toString() ?? "");
  const [notes, setNotes] = useState(row.notes ?? "");
  const [reason, setReason] = useState(row.invalidation_reason ?? "");

  const save = () => {
    const parsed = rResult.trim() === "" ? null : Number(rResult);
    if (parsed !== null && !Number.isFinite(parsed)) {
      toast.error("Result in R must be a number, e.g. 2.8 or -1");
      return;
    }
    const closed = ["WIN", "LOSS", "BREAKEVEN", "INVALIDATED", "MISSED"].includes(outcome);
    update.mutate(
      {
        id: row.id,
        patch: {
          outcome,
          r_result: parsed,
          notes: notes || null,
          invalidation_reason: reason || null,
          // Keep the original close date when editing notes on an already-closed trade.
          closed_at: closed ? (row.closed_at ?? new Date().toISOString()) : null,
          ...(outcome === "INVALIDATED" ? { setup_stage: "SETUP INVALIDATED" } : {}),
        },
      },
      {
        onSuccess: () => toast.success("Journal updated: statistics recalculated."),
        onError: () => toast.error("Could not update the journal."),
      },
    );
  };

  return (
    <Section
      icon={BookOpen}
      title="Journal this setup"
      hint="Statistics update the moment you record a result."
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={(value) => setOutcome(value as Outcome)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-result">
              Result in <TermTooltip term="R" label="R" />
            </Label>
            <Input
              id="r-result"
              inputMode="decimal"
              placeholder="+2.8 / -1 / 0"
              className="h-11 rounded-xl"
              value={rResult}
              onChange={(event) => setRResult(event.target.value)}
            />
          </div>
        </div>
        {outcome === "INVALIDATED" && (
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason for invalidation</Label>
            <Input
              id="reason"
              className="h-11 rounded-xl"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            className="rounded-xl"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        <Button className="h-11 w-full rounded-xl" onClick={save} disabled={update.isPending}>
          Save result
        </Button>
      </div>
    </Section>
  );
}
