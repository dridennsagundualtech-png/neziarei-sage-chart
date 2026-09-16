/**
 * Static quiz runner: no AI, no chart upload required.
 */
import { CheckCircle2, CircleSlash, HelpCircle, ListChecks, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  STATIC_BATCHES,
  questionsForBatch,
  type StaticQuestion,
  type StaticQuizBatch,
} from "@/lib/static-quizzes";
import { cn } from "@/lib/utils";

type Phase = "pick" | "quiz" | "results";

export function StaticQuizRunner() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [batch, setBatch] = useState<StaticQuizBatch | null>(null);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<{ id: string; correct: boolean }[]>([]);

  const questions = useMemo(
    () => (batch ? questionsForBatch(batch.id) : []),
    [batch],
  );
  const current: StaticQuestion | null = questions[index] ?? null;

  const start = (b: StaticQuizBatch) => {
    setBatch(b);
    setIndex(0);
    setChoice(null);
    setRevealed(false);
    setAnswers([]);
    setPhase("quiz");
  };

  const submit = () => {
    if (choice === null || !current) return;
    const correct = choice === current.correctIndex;
    setAnswers((a) => [...a, { id: current.id, correct }]);
    setRevealed(true);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setPhase("results");
      return;
    }
    setIndex((i) => i + 1);
    setChoice(null);
    setRevealed(false);
  };

  const reset = () => {
    setPhase("pick");
    setBatch(null);
    setIndex(0);
    setChoice(null);
    setRevealed(false);
    setAnswers([]);
  };

  if (phase === "pick") {
    return (
      <div className="space-y-4">
        <header className="card-soft p-5">
          <p className="flex items-center gap-2 font-display text-xl font-semibold">
            <ListChecks className="size-5 text-primary" />
            Knowledge quizzes
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fixed questions with instant answers. <strong className="text-foreground">No AI</strong>, 
            works without models, uploads, or limits. Great for studying with others.
          </p>
        </header>

        <div className="space-y-2">
          {STATIC_BATCHES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => start(b)}
              className="card-soft flex w-full flex-col gap-1 p-4 text-left transition-colors hover:bg-muted/30"
            >
              <span className="font-display text-base font-semibold">{b.title}</span>
              <span className="text-xs text-muted-foreground">{b.description}</span>
              <span className="mt-1 text-[11px] text-muted-foreground">
                {b.questionIds.length} questions · ~{b.minutes} min
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "results" && batch) {
    const correctCount = answers.filter((a) => a.correct).length;
    const total = answers.length || questions.length;
    const pct = total ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="space-y-4">
        <header className="card-soft p-5 text-center">
          <p className="font-display text-2xl font-semibold">{pct}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {correctCount} / {total} correct · {batch.title}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {pct >= 80
              ? "Solid. Review any misses, then move on."
              : pct >= 50
                ? "OK start: revisit the related Academy lessons."
                : "Worth revisiting Unit 0 / risk lessons before live size."}
          </p>
        </header>

        <div className="space-y-2">
          {questions.map((q) => {
            const ans = answers.find((a) => a.id === q.id);
            return (
              <div key={q.id} className="panel p-3 text-sm">
                <p className="font-medium">{q.prompt}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    ans?.correct ? "text-bull" : "text-bear",
                  )}
                >
                  {ans?.correct ? "Correct" : "Incorrect"} · Answer: {q.options[q.correctIndex]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button className="h-11 flex-1 rounded-xl" onClick={() => batch && start(batch)}>
            <RotateCcw className="size-4" /> Retry batch
          </Button>
          <Button variant="secondary" className="h-11 flex-1 rounded-xl" onClick={reset}>
            All batches
          </Button>
        </div>
      </div>
    );
  }

  // quiz phase
  if (!current || !batch) return null;

  const progress = ((index + (revealed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {batch.title} · {index + 1}/{questions.length}
        </p>
        <button type="button" className="text-xs text-muted-foreground underline" onClick={reset}>
          Exit
        </button>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <section className="card-soft p-4">
        <p className="flex items-start gap-2 font-display text-base font-semibold leading-snug">
          <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          {current.prompt}
        </p>

        <div className="mt-4 space-y-2">
          {current.options.map((opt, i) => {
            const selected = choice === i;
            const showCorrect = revealed && i === current.correctIndex;
            const showWrong = revealed && selected && i !== current.correctIndex;
            return (
              <button
                key={i}
                type="button"
                disabled={revealed}
                onClick={() => setChoice(i)}
                className={cn(
                  "w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                  !revealed && selected && "border-primary bg-primary/10",
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
            className={cn(
              "mt-4 flex gap-2 rounded-xl p-3 text-sm",
              choice === current.correctIndex ? "bg-bull/10 text-bull" : "bg-bear/10 text-bear",
            )}
          >
            {choice === current.correctIndex ? (
              <CheckCircle2 className="size-5 shrink-0" />
            ) : (
              <CircleSlash className="size-5 shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {choice === current.correctIndex ? "Correct" : "Not quite"}
              </p>
              <p className="mt-1 text-xs text-foreground/80">{current.explanation}</p>
            </div>
          </div>
        )}
      </section>

      {!revealed ? (
        <Button className="h-12 w-full rounded-xl" disabled={choice === null} onClick={submit}>
          Check answer
        </Button>
      ) : (
        <Button className="h-12 w-full rounded-xl" onClick={next}>
          {index + 1 >= questions.length ? "See results" : "Next question"}
        </Button>
      )}
    </div>
  );
}
