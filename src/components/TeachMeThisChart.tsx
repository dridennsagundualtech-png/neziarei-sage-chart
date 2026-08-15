import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, ArrowRight, Eye, GraduationCap, Loader2, ShieldX, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import { TEACH_STEPS } from "@/lib/education-content";
import { useRecordAttempts } from "@/lib/learning";
import { teachThisChart } from "@/lib/teach.functions";
import { cn } from "@/lib/utils";

export interface TeachImageInput {
  dataUrl: string;
  timeframe: string | null;
}

interface Step {
  key: string;
  title: string;
  question: string;
  answer: string;
  evidence: string;
  missing: string;
  invalidation: string;
  mistake: string;
  verdictHint: string;
}

/**
 * "Teach Me This Chart" — ten guided steps. The learner is asked FIRST and only
 * then sees the explanation, so the chart does the teaching, not the answer.
 */
export function TeachMeThisChart({
  images,
  context,
  beginner,
}: {
  images: TeachImageInput[];
  context?: string | null;
  beginner: boolean;
}) {
  const run = useServerFn(teachThisChart);
  const record = useRecordAttempts();

  const [steps, setSteps] = useState<Step[] | null>(null);
  const [closing, setClosing] = useState("");
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [own, setOwn] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const start = async () => {
    setLoading(true);
    try {
      const result = (await run({
        data: { images, context: context ?? null, beginner },
      })) as { steps: Step[]; closing: string };
      setSteps(result.steps);
      setClosing(result.closing);
      setIndex(0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The walkthrough could not be built.");
    } finally {
      setLoading(false);
    }
  };

  if (!steps) {
    return (
      <section className="card-soft p-4">
        <p className="flex items-center gap-2 font-display text-base font-semibold">
          <GraduationCap className="size-4 text-primary" /> Teach me this chart
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Ten steps through your own screenshot. Each step asks you first, then explains the evidence,
          what is missing, what would invalidate the read, and the mistake beginners usually make.
        </p>
        <Button className="mt-3 h-11 w-full rounded-xl" onClick={start} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Building your walkthrough…" : "Start the walkthrough"}
        </Button>
      </section>
    );
  }

  const step = steps[index]!;
  const spec = TEACH_STEPS[index];
  const isRevealed = revealed[step.key] === true;

  const reveal = (verdict: "CORRECT" | "PARTIALLY CORRECT" | "INCORRECT" | null) => {
    setRevealed((current) => ({ ...current, [step.key]: true }));
    if (verdict && spec) {
      record.mutate([{ topic: spec.topic, verdict, source: "teach" }]);
    }
  };

  return (
    <section className="card-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-base font-semibold">
          <GraduationCap className="size-4 text-primary" /> Teach me this chart
        </p>
        <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground">
          Step {index + 1} / {steps.length}
        </span>
      </div>

      <div className="mt-3 flex gap-1">
        {steps.map((s, i) => (
          <span
            key={s.key}
            className={cn(
              "h-1 flex-1 rounded-full",
              i < index ? "bg-primary" : i === index ? "bg-primary/60" : "bg-border",
            )}
          />
        ))}
      </div>

      <div className="panel mt-3 p-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Step {index + 1} — {step.title}
        </p>
        <p className="mt-1 font-display text-sm font-semibold">{step.question}</p>

        {!isRevealed ? (
          <div className="mt-3 space-y-2">
            <Textarea
              rows={3}
              className="rounded-xl"
              placeholder="Write what YOU see first. Guessing is fine — this is practice."
              value={own[step.key] ?? ""}
              onChange={(event) => setOwn((c) => ({ ...c, [step.key]: event.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground">{step.verdictHint}</p>
            <Button variant="secondary" className="h-10 w-full rounded-xl" onClick={() => reveal(null)}>
              Show the explanation
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-xs leading-relaxed">
            <p className="text-sm text-foreground/90">{step.answer}</p>
            <p className="flex gap-2 text-muted-foreground">
              <Eye className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span>
                <span className="font-medium text-foreground/90">Evidence: </span>
                {step.evidence}
              </span>
            </p>
            <p className="flex gap-2 text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />
              <span>
                <span className="font-medium text-foreground/90">Missing: </span>
                {step.missing}
              </span>
            </p>
            <p className="flex gap-2 text-muted-foreground">
              <ShieldX className="mt-0.5 size-3.5 shrink-0 text-bear" />
              <span>
                <span className="font-medium text-foreground/90">Would invalidate this: </span>
                {step.invalidation}
              </span>
            </p>
            <p className="flex gap-2 text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />
              <span>
                <span className="font-medium text-foreground/90">Beginner mistake: </span>
                {step.mistake}
              </span>
            </p>

            {own[step.key]?.trim() ? (
              <div className="rounded-xl bg-elevated p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Your answer</p>
                <p className="mt-0.5 text-xs text-foreground/90">{own[step.key]}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  How close were you? Recording it honestly is what builds your knowledge score.
                </p>
                <div className="mt-2 flex gap-1.5">
                  {(["CORRECT", "PARTIALLY CORRECT", "INCORRECT"] as const).map((verdict) => (
                    <Button
                      key={verdict}
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 rounded-lg text-[11px]"
                      onClick={() => spec && record.mutate([{ topic: spec.topic, verdict, source: "teach" }])}
                    >
                      {verdict === "PARTIALLY CORRECT" ? "PARTLY" : verdict}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          className="h-11 rounded-xl"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </Button>
        <Button
          className="h-11 flex-1 rounded-xl"
          disabled={index >= steps.length - 1}
          onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
        >
          Next step <ArrowRight className="size-4" />
        </Button>
      </div>

      {index === steps.length - 1 && closing && (
        <p className="mt-3 rounded-xl bg-elevated p-3 text-xs leading-relaxed text-muted-foreground">
          {closing}
        </p>
      )}

      <UncertaintyNote compact className="mt-3" />
    </section>
  );
}
