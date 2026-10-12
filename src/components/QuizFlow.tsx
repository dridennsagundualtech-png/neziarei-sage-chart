/**
 * One-question-at-a-time quiz: pick, check, read why, next. Used by the quiz
 * sets, the lesson checks, the chapter checks and the placement check.
 */
import { CheckCircle2, CircleSlash } from "lucide-react";
import { useState } from "react";

import { TermVisual } from "@/components/breakthrough/TermVisual";
import { Button } from "@/components/ui/button";
import type { Visual } from "@/lib/breakthrough/types";
import type { StaticQuestion } from "@/lib/static-quizzes";
import { cn } from "@/lib/utils";

export interface QuizAnswer {
  question: StaticQuestion;
  correct: boolean;
}

/** Quiz pictures: lesson charts with no captions are shown complete; others stay interactive. */
function QuizVisual({ visual }: { visual: Visual }) {
  const complete = visual.kind === "scene" && visual.scene.steps.every((s) => !s.text);
  return (
    <div className="rounded-2xl border border-border bg-elevated p-3">
      {complete ? <TermVisual visual={visual} step={9999} /> : <TermVisual visual={visual} />}
    </div>
  );
}

export function QuizFlow({
  questions,
  onFinish,
  finishLabel = "See results",
}: {
  questions: StaticQuestion[];
  onFinish: (answers: QuizAnswer[]) => void;
  finishLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const current = questions[index];
  if (!current) return null;
  const revealed = answers.length > index;
  const right = choice === current.correctIndex;
  const last = index + 1 >= questions.length;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-medium tabular-nums text-muted-foreground">
          Question {index + 1} of {questions.length}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/70 transition-all"
            style={{ width: `${((index + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <section className="card-soft p-4">
        <h3 className="font-display text-base font-semibold leading-snug">{current.prompt}</h3>

        {current.visual && (
          <div className="mt-3">
            <QuizVisual key={`${current.id}-q`} visual={current.visual} />
          </div>
        )}

        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Answers">
          {current.options.map((opt, i) => {
            const selected = choice === i;
            const showCorrect = revealed && i === current.correctIndex;
            const showWrong = revealed && selected && !showCorrect;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={revealed}
                onClick={() => setChoice(i)}
                className={cn(
                  "min-h-12 w-full rounded-xl border px-3 py-3 text-left text-[15px] transition-colors",
                  !revealed && selected && "border-foreground bg-foreground/10",
                  !revealed && !selected && "border-border bg-card hover:bg-muted/40",
                  showCorrect && "border-bull/50 bg-bull/10 text-bull",
                  showWrong && "border-bear/50 bg-bear/10 text-bear",
                  revealed && !showCorrect && !showWrong && "opacity-60",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div
            aria-live="polite"
            className={cn(
              "mt-4 flex gap-2 rounded-xl p-3 text-sm",
              right ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear",
            )}
          >
            {right ? (
              <CheckCircle2 className="size-5 shrink-0" />
            ) : (
              <CircleSlash className="size-5 shrink-0" />
            )}
            <div>
              <p className="font-medium">{right ? "Correct" : "Not quite"}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-foreground/85">
                {current.explanation}
              </p>
            </div>
          </div>
        )}

        {revealed && current.reveal && (
          <div className="mt-3">
            <p className="mb-2 text-[13px] font-semibold text-muted-foreground">See it</p>
            <QuizVisual key={`${current.id}-r`} visual={current.reveal} />
          </div>
        )}
      </section>

      {!revealed ? (
        <Button
          className="h-12 w-full rounded-xl"
          disabled={choice === null}
          onClick={() => setAnswers((a) => [...a, { question: current, correct: right }])}
        >
          Check answer
        </Button>
      ) : (
        <Button
          className="h-12 w-full rounded-xl"
          onClick={() => {
            if (last) return onFinish(answers);
            setIndex((i) => i + 1);
            setChoice(null);
          }}
        >
          {last ? finishLabel : "Next question"}
        </Button>
      )}
    </div>
  );
}
