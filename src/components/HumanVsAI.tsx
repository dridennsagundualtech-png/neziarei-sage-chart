import { useServerFn } from "@tanstack/react-start";
import { Loader2, Swords } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import type { AnalysisResult } from "@/lib/analysis-types";
import { useSaveComparison, type Verdict } from "@/lib/learning";
import { compareWithChartPilot } from "@/lib/teach.functions";
import { cn } from "@/lib/utils";

export interface HumanSubmission {
  direction: string;
  structure: string;
  liquidity: string;
  sweep: string;
  mss: string;
  entry: string;
  stop: string;
  target: string;
  rr: string;
  confidence: string;
}

export const EMPTY_SUBMISSION: HumanSubmission = {
  direction: "",
  structure: "",
  liquidity: "",
  sweep: "",
  mss: "",
  entry: "",
  stop: "",
  target: "",
  rr: "",
  confidence: "",
};

const FIELDS: { key: keyof HumanSubmission; label: string; placeholder: string; long?: boolean }[] = [
  { key: "direction", label: "Direction", placeholder: "Long / Short / Wait / No trade" },
  { key: "structure", label: "Market structure", placeholder: "Bullish, bearish or ranging — and why", long: true },
  { key: "liquidity", label: "Liquidity", placeholder: "Where do you think orders are resting?", long: true },
  { key: "sweep", label: "Sweep", placeholder: "Was liquidity swept and reclaimed?" },
  { key: "mss", label: "MSS / BOS", placeholder: "Did structure shift or continue?" },
  { key: "entry", label: "Entry", placeholder: "Your conditional entry zone" },
  { key: "stop", label: "Stop / invalidation", placeholder: "Where is your idea wrong?" },
  { key: "target", label: "Target", placeholder: "Next logical liquidity area" },
  { key: "rr", label: "R:R", placeholder: "e.g. 2.5" },
  { key: "confidence", label: "Your confidence", placeholder: "Low / Medium / High" },
];

/**
 * Human vs AI. The learner commits to their own read BEFORE ChartPilot's is
 * revealed, then gets a field-by-field learning score. The purpose is
 * independence from the AI, not agreement with it.
 */
export function HumanVsAIForm({
  onSubmit,
  submitted,
}: {
  onSubmit: (value: HumanSubmission) => void;
  submitted: boolean;
}) {
  const [value, setValue] = useState<HumanSubmission>(EMPTY_SUBMISSION);

  return (
    <section className="card-soft p-4">
      <p className="flex items-center gap-2 font-display text-base font-semibold">
        <Swords className="size-4 text-primary" /> Your analysis first
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Write your own read before ChartPilot's is revealed. Blank fields are allowed — say “unclear”
        when you honestly cannot tell. That is a real answer.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className={cn("space-y-1.5", field.long && "sm:col-span-2")}>
            <Label htmlFor={`hv-${field.key}`}>{field.label}</Label>
            {field.long ? (
              <Textarea
                id={`hv-${field.key}`}
                rows={2}
                className="rounded-xl"
                disabled={submitted}
                placeholder={field.placeholder}
                value={value[field.key]}
                onChange={(event) => setValue((c) => ({ ...c, [field.key]: event.target.value }))}
              />
            ) : (
              <Input
                id={`hv-${field.key}`}
                className="h-11 rounded-xl"
                disabled={submitted}
                placeholder={field.placeholder}
                value={value[field.key]}
                onChange={(event) => setValue((c) => ({ ...c, [field.key]: event.target.value }))}
              />
            )}
          </div>
        ))}
      </div>

      <Button
        className="mt-3 h-11 w-full rounded-xl"
        disabled={submitted}
        onClick={() => {
          if (!Object.values(value).some((v) => v.trim())) {
            toast.error("Fill in at least one field — even a guess.");
            return;
          }
          onSubmit(value);
          toast.success("Locked in. ChartPilot's read is next.");
        }}
      >
        {submitted ? "Answer locked in" : "Lock in my analysis"}
      </Button>
    </section>
  );
}

export function HumanVsAIComparison({
  human,
  result,
  analysisId,
  beginner,
}: {
  human: HumanSubmission;
  result: AnalysisResult;
  analysisId: string | null;
  beginner: boolean;
}) {
  const run = useServerFn(compareWithChartPilot);
  const save = useSaveComparison();

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    fields: { label: string; verdict: string; explanation: string }[];
    score: number;
    max: number;
    missed: string;
    encouragement: string;
  } | null>(null);

  const compare = async () => {
    setLoading(true);
    try {
      const analysisText = JSON.stringify({
        direction: result.direction,
        structure: result.checklist.find((c) => c.key === "htf_structure")?.evidence,
        htf_bias: result.htf_bias,
        liquidity: result.checklist.find((c) => c.key === "liquidity")?.evidence,
        sweep: result.checklist.find((c) => c.key === "liquidity_sweep")?.evidence,
        mss: result.checklist.find((c) => c.key === "mss_bos")?.evidence,
        entry: result.entry_zone,
        stop: result.stop_loss,
        targets: [result.tp1, result.tp2],
        rr: result.risk_reward,
        setup_stage: result.setup_stage,
        summary: result.summary,
        reasoning: result.reasoning,
      });

      const data = (await run({
        data: { human: human as unknown as Record<string, string>, analysis: analysisText, beginner },
      })) as NonNullable<typeof report>;

      setReport(data);
      save.mutate({
        analysisId,
        asset: result.asset,
        score: data.score,
        max: data.max,
        fields: data.fields.map((f) => ({
          label: f.label,
          verdict: (f.verdict as Verdict) ?? "PARTIALLY CORRECT",
          explanation: f.explanation,
        })),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The comparison could not be produced.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card-soft p-4">
      <p className="flex items-center gap-2 font-display text-base font-semibold">
        <Swords className="size-4 text-primary" /> Your analysis vs ChartPilot
      </p>

      {!report ? (
        <>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Compare your read with ChartPilot's, field by field. Disagreement is not automatically an
            error — defensible reasoning counts.
          </p>
          <Button className="mt-3 h-11 w-full rounded-xl" onClick={compare} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {loading ? "Comparing your reasoning…" : "Compare and score my reasoning"}
          </Button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Learning score</p>
            <p className="font-display text-2xl font-semibold text-primary">
              {report.score}
              <span className="text-base text-muted-foreground">/{report.max}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              A reasoning score, not a trading result. It says nothing about whether the trade would win.
            </p>
          </div>

          <ul className="space-y-2">
            {report.fields.map((field, i) => (
              <li key={i} className="panel p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{field.label}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      field.verdict === "CORRECT" && "bg-bull/15 text-bull",
                      field.verdict === "PARTIALLY CORRECT" && "bg-warn/15 text-warn",
                      field.verdict === "INCORRECT" && "bg-bear/15 text-bear",
                    )}
                  >
                    {field.verdict}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{field.explanation}</p>
              </li>
            ))}
          </ul>

          <div className="panel p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              The concept you missed
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{report.missed}</p>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{report.encouragement}</p>
        </div>
      )}

      <UncertaintyNote compact className="mt-3" />
    </section>
  );
}
