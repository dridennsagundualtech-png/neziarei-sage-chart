/**
 * Static quiz runner: no AI, no chart upload required. Every finished set is
 * saved to the learning record, so topic strength reflects quiz answers.
 */
import { ListChecks, Lock, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { QuizFlow, type QuizAnswer } from "@/components/QuizFlow";
import { Button } from "@/components/ui/button";
import { breakthroughAccess } from "@/lib/breakthrough/progress";
import { quizAttempts, useLearning, useRecordAttempts } from "@/lib/learning";
import {
  STATIC_BATCHES,
  ALL_BATCHES,
  UNIT_BATCHES,
  questionsForBatch,
  type StaticQuizBatch,
} from "@/lib/static-quizzes";
import { cn } from "@/lib/utils";

type Phase = "pick" | "quiz" | "results";

function BatchButton({ batch, onStart }: { batch: StaticQuizBatch; onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="card-soft flex w-full flex-col gap-1 p-4 text-left transition-colors hover:bg-muted/30"
    >
      <span className="font-display text-base font-semibold">{batch.title}</span>
      <span className="text-[13px] text-muted-foreground">{batch.description}</span>
      <span className="mt-1 text-[13px] text-muted-foreground">
        {batch.questionIds.length} questions · ~{batch.minutes} min
      </span>
    </button>
  );
}

export function StaticQuizRunner() {
  const learning = useLearning();
  const record = useRecordAttempts();
  const doneSet = useMemo(
    () => new Set(Object.keys(learning.data?.lessons ?? {})),
    [learning.data?.lessons],
  );
  const access = breakthroughAccess(doneSet);
  const btBatches = ALL_BATCHES.filter((b) => b.chapterId);
  const [phase, setPhase] = useState<Phase>("pick");
  const [batch, setBatch] = useState<StaticQuizBatch | null>(null);
  const [run, setRun] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);

  const questions = useMemo(() => (batch ? questionsForBatch(batch.id) : []), [batch]);

  const start = (b: StaticQuizBatch) => {
    setBatch(b);
    setAnswers([]);
    setRun((n) => n + 1);
    record.reset();
    setPhase("quiz");
  };

  const finish = (list: QuizAnswer[]) => {
    setAnswers(list);
    setPhase("results");
    record.mutate(quizAttempts(list));
  };

  const reset = () => {
    setPhase("pick");
    setBatch(null);
    setAnswers([]);
  };

  if (phase === "pick") {
    return (
      <div className="space-y-4">
        <header className="card-soft p-5">
          <p className="flex items-center gap-2 font-display text-xl font-semibold">
            <ListChecks className="size-5 text-muted-foreground" />
            Knowledge quizzes
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fixed questions with instant answers: no AI, no uploads, no limits. Every finished set
            counts towards your topic strength in Lessons.
          </p>
        </header>

        <div className="space-y-2">
          {STATIC_BATCHES.map((b) => (
            <BatchButton key={b.id} batch={b} onStart={() => start(b)} />
          ))}
        </div>

        <section className="space-y-2" aria-labelledby="unit-quiz-title">
          <div className="px-1 pt-2">
            <h3 id="unit-quiz-title" className="font-display text-base font-semibold">
              Unit quizzes
            </h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Every lesson check from one unit in a single run. Good for revision before a session.
            </p>
          </div>
          {UNIT_BATCHES.map((b) => (
            <BatchButton key={b.id} batch={b} onStart={() => start(b)} />
          ))}
        </section>

        <section className="space-y-2" aria-labelledby="bt-quiz-title">
          <div className="px-1 pt-2">
            <h3
              id="bt-quiz-title"
              className="flex items-center gap-2 font-display text-base font-semibold"
            >
              <Sparkles className="size-4 text-muted-foreground" /> Breakthrough quizzes
            </h3>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {access.open
                ? "One set per Breakthrough chapter."
                : `Open once ${access.lastUnitTitle} is at least 60% complete, or the placement check is passed.`}
            </p>
          </div>
          {btBatches.map((b) => {
            const open = !!b.chapterId && access.unlocked.has(b.chapterId);
            return (
              <button
                key={b.id}
                type="button"
                disabled={!open}
                onClick={() => start(b)}
                className={cn(
                  "card-soft flex min-h-12 w-full items-start gap-3 p-4 text-left transition-colors",
                  open ? "hover:bg-muted/30" : "cursor-not-allowed opacity-60",
                )}
              >
                {!open && (
                  <Lock
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-label="Locked"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-semibold">{b.title}</span>
                  <span className="mt-1 block text-[13px] text-muted-foreground">
                    {open
                      ? `${b.questionIds.length} questions · ~${b.minutes} min`
                      : "Opens with Breakthrough"}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      </div>
    );
  }

  if (phase === "results" && batch) {
    const correctCount = answers.filter((a) => a.correct).length;
    const total = answers.length;
    const pct = total ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="space-y-4">
        <header className="card-soft p-5 text-center">
          <p className="font-display text-2xl font-semibold">{pct}%</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {correctCount} / {total} correct · {batch.title}
          </p>
          <p className="mt-3 text-[13px] text-muted-foreground">
            {record.isError
              ? "Couldn't save these answers to your progress. "
              : record.isSuccess
                ? "Saved to your topic strength. "
                : ""}
            {pct >= 80
              ? "Solid. Review any misses, then move on."
              : pct >= 50
                ? "OK start: revisit the related Academy lessons."
                : "Go back through the lessons behind these questions before trading live size."}
          </p>
        </header>

        <div className="space-y-2">
          {answers.map(({ question: q, correct }) => (
            <div key={q.id} className="panel p-3 text-sm">
              <p className="font-medium">{q.prompt}</p>
              <p className={cn("mt-1 text-[13px]", correct ? "text-bull" : "text-bear")}>
                {correct ? "Correct" : "Incorrect"} · Answer: {q.options[q.correctIndex]}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">{q.explanation}</p>
            </div>
          ))}
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
  if (!batch) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{batch.title}</p>
        <button
          type="button"
          className="h-11 px-2 text-sm text-muted-foreground underline"
          onClick={reset}
        >
          Exit
        </button>
      </div>
      <QuizFlow key={run} questions={questions} onFinish={finish} />
    </div>
  );
}
