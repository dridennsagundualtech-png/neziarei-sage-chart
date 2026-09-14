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
import { Progress } from "@/components/ui/progress";
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
  DISCLAIMER,
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
    <section className="animate-float-in card-soft p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold">
            <TermTooltip term={title} label={title} />
          </h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </section>
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
  const invalidated = savedRow?.outcome === "INVALIDATED" || result.setup_stage === "SETUP INVALIDATED";
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
      toast.error("Nothing to copy — levels are not readable from this analysis.");
      return;
    }
    const ok = await copyToClipboard(text);
    toast[ok ? "success" : "error"](
      ok
        ? mode === "pine"
          ? "Pine alert idea copied."
          : "Trade plan copied."
        : "Could not copy — try selecting the text manually.",
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Overall result */}
      <section
        className={cn(
          "animate-float-in card-soft relative overflow-hidden p-5",
          tone === "bull" && "border-bull/40",
          tone === "bear" && "border-bear/40",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-sm font-semibold",
              tone === "bull" && "bg-bull/15 text-bull",
              tone === "bear" && "bg-bear/15 text-bear",
              tone === "neutral" && "bg-neutralstate/15 text-neutralstate",
            )}
          >
            {tone === "bull" ? (
              <TrendingUp className="size-4" />
            ) : tone === "bear" ? (
              <TrendingDown className="size-4" />
            ) : (
              <CircleHelp className="size-4" />
            )}
            {invalidated ? "SETUP INVALIDATED" : result.direction}
          </span>
          <Badge variant="secondary" className="rounded-full">
            {result.asset} {result.primary_timeframe ? `· ${result.primary_timeframe}` : ""}
          </Badge>
          <Badge variant="outline" className="rounded-full">
            {result.setup_stage}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "rounded-full gap-1",
              eaSignal.level === "READY" && "border-bull/50 bg-bull/10 text-bull",
              eaSignal.level === "DEVELOPING" && "border-warn/50 bg-warn/10 text-warn",
              eaSignal.level === "WAIT" && "border-muted-foreground/30",
              eaSignal.level === "NO_TRADE" && "border-bear/40 bg-bear/10 text-bear",
            )}
            title={eaSignal.shortReason}
          >
            <Radar className="size-3" />
            {eaSignal.label}
          </Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{eaSignal.shortReason}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <TermTooltip term="Setup quality" label="Setup quality" />
            </p>
            <p className="font-display text-2xl font-semibold">
              {result.score}
              <span className="text-base text-muted-foreground">/{result.max_score ?? MAX_SCORE}</span>
            </p>
            <p className="text-xs text-muted-foreground">{GRADE_LABEL[result.grade]}</p>
          </div>
          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <TermTooltip
                term="Visual evidence"
                label="Visual evidence"
                explanation="How clear the evidence in your screenshots is. It is NOT a probability that the trade wins."
              />
            </p>
            <p className="font-display text-2xl font-semibold">{result.visual_evidence}</p>
            <p className="text-xs text-muted-foreground">
              <TermTooltip term="HTF" label="HTF bias" />: {result.htf_bias}
            </p>
          </div>
        </div>

        <div className="panel mt-3 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <TermTooltip term="Historical edge" label="Historical edge" />
          </p>
          {edge.displayable ? (
            <p className="font-display text-xl font-semibold text-primary">
              {edge.winRate?.toFixed(1)}% across {edge.comparableCount} comparable completed setups
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Insufficient historical data to calculate a statistically meaningful win probability.
              <span className="mt-1 block text-xs">
                Comparable setups: {edge.comparableCount} · {SAMPLE_TIER_LABEL[edge.tier]} · your
                threshold is {edge.minSampleSize}.
              </span>
            </p>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
          Setup quality, visual evidence and historical performance are three separate things. None of
          them is a prediction.
        </p>

        {result.provider_used && (
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            This analysis ran on: {result.provider_used}
          </p>
        )}

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
          <ul className="space-y-2 text-sm">
            {[...result.missing_information, ...result.requested_additional_images].map((item, i) => (
              <li key={i} className="panel flex gap-2 p-3 text-muted-foreground">
                <span className="font-display text-primary">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 3. Trade plan */}
      {result.sufficient_information && (
        <Section
          icon={Target}
          title="Conditional trade plan"
          hint="This is a conditional setup, not a guaranteed prediction or an instruction to trade."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: "Entry zone", value: result.entry_zone },
              { label: "Stop / invalidation", value: result.stop_loss },
              { label: "TP1", value: result.tp1 },
              { label: "TP2", value: result.tp2 },
              {
                label: "R:R",
                value: result.risk_reward ? `${result.risk_reward.toFixed(1)}R` : null,
              },
              { label: "Stage", value: result.setup_stage },
            ].map((item) => (
              <div key={item.label} className="panel p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  <TermTooltip term={item.label} label={item.label} />
                </p>
                <p className="mt-0.5 font-mono text-sm">{item.value ?? "Not visible"}</p>
              </div>
            ))}
          </div>
          {rrBelowMin && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-warn/10 p-3 text-xs text-warn">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Reward-to-risk is below your minimum of {settings.min_rr}:1 — flagged as unfavourable.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            <TermTooltip term="R:R" label="What R:R means" /> — it measures potential reward relative
            to defined risk. It does not predict win probability.
          </p>
        </Section>
      )}

      {/* 3b. Practical export — copy plan / Discord / Pine idea */}
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
                  : "Entry/stop prices not readable — cannot build alert idea"
              }
            >
              <Radar className="size-4" />
              Pine alert idea
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The Pine snippet only plots the levels that could be read from the analysis. It is not an
            automated EA and does not place orders.
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
          <ul className="space-y-2 text-sm text-muted-foreground">
            {result.required_confirmation.map((item, i) => (
              <li key={i} className="panel flex gap-2 p-3">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 5. Invalidation */}
      {result.invalidation.length > 0 && (
        <Section icon={ShieldX} title="Invalidation watch" hint="If any of these happen, the setup is dead.">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {result.invalidation.map((item, i) => (
              <li key={i} className="panel flex gap-2 p-3">
                <ShieldX className="mt-0.5 size-4 shrink-0 text-bear" />
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
        hint={`Every component is capped at its maximum — total ${result.score}/${result.max_score ?? MAX_SCORE}.`}
      >
        <ul className="space-y-2">
          {result.checklist.map((item) => {
            const spec = CHECKLIST_BY_KEY[item.key];
            const ratio = spec ? (item.score / spec.max) * 100 : 0;
            return (
              <li key={item.key} className="panel p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    <TermTooltip
                      term={spec?.label ?? item.key}
                      label={spec?.label ?? item.key}
                      explanation={spec?.help}
                    />
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-xs",
                      ratio >= 100 && "bg-bull/15 text-bull",
                      ratio > 0 && ratio < 100 && "bg-warn/15 text-warn",
                      ratio === 0 && "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.score}/{item.max}
                  </span>
                </div>
                <Progress value={ratio} className="mt-2 h-1.5" />
                <p className="mt-2 text-xs text-foreground/90">{item.status}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.evidence}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  Evidence confidence: {item.confidence}
                  {item.missing ? ` · Missing: ${item.missing}` : ""}
                </p>
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
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              {result.reasoning.map((item, i) => (
                <li key={i} className="panel flex gap-2 p-3">
                  <span className="font-display text-primary">{i + 1}.</span>
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
            <p className="text-[11px] uppercase text-muted-foreground">
              <TermTooltip term="Comparable setups" label="Comparable setups" />
            </p>
            <p className="font-display text-xl">{edge.comparableCount}</p>
          </div>
          <div className="panel p-3">
            <p className="text-[11px] uppercase text-muted-foreground">
              <TermTooltip term="Sample quality" label="Sample quality" />
            </p>
            <p className="text-sm">{SAMPLE_TIER_LABEL[edge.tier]}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Comparable = same asset, same direction, same primary timeframe and a setup score within ±2.
          {edge.displayable
            ? " Even a large sample never guarantees future performance."
            : ` A win rate appears only once ${edge.minSampleSize} comparable completed setups exist.`}
        </p>
      </Section>

      {/* 9. Risk management */}
      <Section icon={Calculator} title="Risk management" hint="Never scale risk up because a score looks good.">
        <div className="grid grid-cols-2 gap-2">
          <div className="panel p-3">
            <p className="text-[11px] uppercase text-muted-foreground">
              <TermTooltip term="Risk per trade" label="Risk per trade" />
            </p>
            <p className="font-display text-xl">{Number(settings.risk_pct)}%</p>
          </div>
          <div className="panel p-3">
            <p className="text-[11px] uppercase text-muted-foreground">
              <TermTooltip term="Max loss" label="Max loss" />
            </p>
            <p className="font-display text-xl">
              {Number(settings.account_balance) > 0
                ? `${settings.currency} ${sizing.riskAmount.toFixed(2)}`
                : "Set balance"}
            </p>
          </div>
          <div className="panel col-span-2 p-3">
            <p className="text-[11px] uppercase text-muted-foreground">
              <TermTooltip term="Position size" label="Position size" />
            </p>
            <p className="font-mono text-sm">
              {sizing.units
                ? `${sizing.units.toFixed(4)} units · risk per unit ${sizing.riskPerUnit?.toFixed(4)}`
                : "Not calculable — exact entry/stop prices are not readable from the screenshots."}
            </p>
            {sizing.units && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Convert to lots/contracts using your broker’s contract size. Example: if 1 lot = 100,000
                units, size ≈ {(sizing.units / 100000).toFixed(2)} lots.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* 10. Journal */}
      {savedRow && <JournalControls row={savedRow} />}

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground/70">{DISCLAIMER}</p>
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
          closed_at: closed ? new Date().toISOString() : null,
          ...(outcome === "INVALIDATED" ? { setup_stage: "SETUP INVALIDATED" } : {}),
        },
      },
      {
        onSuccess: () => toast.success("Journal updated — statistics recalculated."),
        onError: () => toast.error("Could not update the journal."),
      },
    );
  };

  return (
    <Section icon={BookOpen} title="Journal this setup" hint="Statistics update the moment you record a result.">
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
