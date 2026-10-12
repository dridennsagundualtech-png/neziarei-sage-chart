/**
 * Academy: Duolingo-style learning path.
 * Units unlock as you complete lessons (or pass the placement check). Each lesson
 * ends with two check questions that feed topic strength.
 */
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Lock,
  Play,
  ScanSearch,
  Target,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { QuizFlow, type QuizAnswer } from "@/components/QuizFlow";
import { TermTooltip } from "@/components/TermTooltip";

import { BreakthroughReader } from "@/components/breakthrough/BreakthroughReader";
import { BreakthroughSection } from "@/components/breakthrough/BreakthroughSection";
import { TermVisual } from "@/components/breakthrough/TermVisual";
import { SignInPrompt } from "@/components/SignInPrompt";
import { ConceptCard } from "@/components/ConceptCard";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import { Button } from "@/components/ui/button";
import { BREAKTHROUGH, BREAKTHROUGH_IDS, type BreakthroughChapter } from "@/lib/breakthrough";
import { LESSON_VISUALS } from "@/lib/breakthrough/lesson-visuals";
import { breakthroughAccess, PLACEMENT_ID, READ_FIRST } from "@/lib/breakthrough/progress";
import { ACADEMY, ALL_LESSONS, CONCEPTS, TOPIC_LABEL, type Lesson } from "@/lib/education-content";
import { PLACEMENT_PASS_PCT } from "@/lib/lesson-checks";
import { DEFAULT_SETTINGS, LOCAL_USER, useSettings } from "@/lib/data";
import {
  knowledgeScore,
  quizAttempts,
  recommendedLessons,
  spacedPrompt,
  topicScores,
  useCompleteLesson,
  useLearning,
  useRecordAttempts,
} from "@/lib/learning";
import { lessonCheck, placementQuestions } from "@/lib/static-quizzes";
import { cn } from "@/lib/utils";

function xpForLessons(n: number) {
  return n * 10;
}

function score(answers: QuizAnswer[]) {
  const right = answers.filter((a) => a.correct).length;
  return { right, total: answers.length, pct: answers.length ? (right / answers.length) * 100 : 0 };
}

/** Full-screen sheet shared by the lesson player and the placement check. */
function Sheet({
  progress,
  onClose,
  children,
  footer,
}: {
  progress: number;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4 pb-6 pt-4">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            className="flex h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-medium"
            onClick={onClose}
          >
            <X className="size-5" /> Close
          </button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/70 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
        {footer && <div className="mt-4 flex gap-2">{footer}</div>}
      </div>
    </div>
  );
}

function LessonPlayer({
  lesson,
  done,
  onClose,
  onComplete,
}: {
  lesson: Lesson;
  done: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const record = useRecordAttempts();
  const checks = useMemo(() => lessonCheck(lesson.id), [lesson.id]);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<QuizAnswer[] | null>(null);
  const visual = LESSON_VISUALS[lesson.id];
  const readSteps = lesson.body.length + 1;
  const checking = step >= readSteps;
  const isMistakeStep = step === lesson.body.length;
  const progress = results ? 100 : (Math.min(step + 1, readSteps) / (readSteps + 1)) * 100;
  const result = results ? score(results) : null;

  const footer = checking ? (
    results ? (
      <Button
        className="h-12 flex-1 rounded-2xl"
        disabled={record.isPending}
        onClick={() => {
          onComplete();
          onClose();
        }}
      >
        {done ? "Done" : "Mark complete · +10 XP"}
      </Button>
    ) : null
  ) : (
    <>
      {step > 0 && (
        <Button
          variant="secondary"
          className="h-12 flex-1 rounded-2xl"
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </Button>
      )}
      <Button className="h-12 flex-1 rounded-2xl" onClick={() => setStep((s) => s + 1)}>
        {isMistakeStep && checks.length > 0 ? "Check yourself" : "Continue"}
        <ChevronRight className="size-4" />
      </Button>
    </>
  );

  return (
    <Sheet progress={progress} onClose={onClose} footer={footer}>
      <h2 className="font-display text-xl font-semibold leading-tight">{lesson.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>

      {checking ? (
        <div className="mt-5">
          {result ? (
            <div className="card-soft p-5" aria-live="polite">
              <p className="font-display text-lg font-semibold">
                {result.right} of {result.total} right
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {result.right === result.total
                  ? "Both right."
                  : "Reread the step behind the miss before the next unit; misses also show up under “Review suggested”."}
                {record.isSuccess && " Saved to your topic strength."}
              </p>
              {record.isError && (
                <p className="mt-2 text-[13px] text-bear">
                  Couldn&apos;t save the answers. Your lesson can still be marked complete.
                </p>
              )}
            </div>
          ) : (
            <QuizFlow
              questions={checks}
              finishLabel="Finish check"
              onFinish={(answers) => {
                setResults(answers);
                record.mutate(quizAttempts(answers));
              }}
            />
          )}
        </div>
      ) : (
        <>
          {visual && (
            <div className="mt-4 rounded-2xl border border-border bg-elevated p-3">
              <TermVisual visual={visual} step={Math.min(step, lesson.body.length - 1)} />
            </div>
          )}

          <div className={visual ? "mt-4" : "mt-6"}>
            {!isMistakeStep ? (
              <div className="card-soft p-5">
                <p className="text-[13px] font-medium text-muted-foreground">
                  Step {step + 1} of {lesson.body.length}
                </p>
                <p className="mt-3 text-base leading-relaxed">{lesson.body[step]}</p>
              </div>
            ) : (
              <div className="card-soft border-warn/40 p-5">
                <p className="text-[13px] font-semibold text-warn">Common beginner mistake</p>
                <p className="mt-3 text-base leading-relaxed">{lesson.mistake}</p>
              </div>
            )}
          </div>
        </>
      )}
    </Sheet>
  );
}

/** Twelve questions across the path. Passing opens every unit and Breakthrough at once. */
function PlacementCheck({ onClose, onPassed }: { onClose: () => void; onPassed: () => void }) {
  const record = useRecordAttempts();
  const questions = useMemo(() => placementQuestions(), []);
  const [results, setResults] = useState<QuizAnswer[] | null>(null);
  const result = results ? score(results) : null;
  const passed = result ? result.pct >= PLACEMENT_PASS_PCT : false;
  const need = Math.ceil((questions.length * PLACEMENT_PASS_PCT) / 100);

  return (
    <Sheet
      progress={results ? 100 : 0}
      onClose={onClose}
      footer={
        results ? (
          <Button className="h-12 flex-1 rounded-2xl" disabled={record.isPending} onClick={onClose}>
            {passed ? "Open the path" : "Back to lessons"}
          </Button>
        ) : null
      }
    >
      <h2 className="font-display text-xl font-semibold leading-tight">Placement check</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {questions.length} questions from every unit. Get {need} right and every unit plus
        Breakthrough opens, so you can skip what you already know.
      </p>
      <div className="mt-5">
        {result ? (
          <div className="card-soft p-5" aria-live="polite">
            <p className="font-display text-lg font-semibold">
              {result.right} of {result.total} right
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {passed
                ? "Passed. Every unit and Breakthrough is open. Start with the units you missed questions from."
                : `Not this time: ${need} were needed. The path stays in order; each unit's quiz is in the Quizzes tab when you want another go.`}
            </p>
            {record.isError && (
              <p className="mt-2 text-[13px] text-bear">
                Couldn&apos;t save the result. Try again.
              </p>
            )}
          </div>
        ) : (
          <QuizFlow
            questions={questions}
            finishLabel="See result"
            onFinish={async (answers) => {
              setResults(answers);
              const ok = score(answers).pct >= PLACEMENT_PASS_PCT;
              // One write after the other: both read and rewrite the same record.
              await record.mutateAsync(quizAttempts(answers)).catch(() => undefined);
              if (ok) onPassed();
            }}
          />
        )}
      </div>
    </Sheet>
  );
}

function Learn() {
  const learningQuery = useLearning();
  const settingsQuery = useSettings();
  const complete = useCompleteLesson();
  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };
  const state = learningQuery.data;
  const [tab, setTab] = useState<"path" | "concepts">("path");
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState<{
    chapter: BreakthroughChapter;
    term?: string;
  } | null>(null);

  const doneSet = useMemo(() => new Set(Object.keys(state?.lessons ?? {})), [state?.lessons]);
  const knownIds = useMemo(() => [...ALL_LESSONS.map((l) => l.id), ...BREAKTHROUGH_IDS], []);
  const doneCount = knownIds.filter((id) => doneSet.has(id)).length;
  const totalLessons = knownIds.length;
  const xp = xpForLessons(doneCount);
  const score = state ? knowledgeScore(state) : null;
  const spaced = state ? spacedPrompt(state) : null;
  const topics = state ? topicScores(state) : [];
  const nextUp = state
    ? recommendedLessons(state).slice(0, 3)
    : (ACADEMY[0]?.lessons.slice(0, 2) ?? []);

  const levelProgress = ACADEMY.map((level) => {
    const total = level.lessons.length;
    const done = level.lessons.filter((l) => doneSet.has(l.id)).length;
    return { ...level, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  });

  const placed = doneSet.has(PLACEMENT_ID);
  const access = breakthroughAccess(doneSet);
  const isLevelUnlocked = (levelIndex: number) => {
    if (levelIndex <= 0 || placed) return true;
    const prev = levelProgress[levelIndex - 1];
    return prev ? prev.pct >= 60 : false;
  };

  const continueLesson = useMemo(() => {
    for (const level of ACADEMY) {
      for (const lesson of level.lessons) {
        if (!doneSet.has(lesson.id)) return lesson;
      }
    }
    return null;
  }, [doneSet]);
  const continueChapter = useMemo(() => {
    if (continueLesson) return null;
    const open = BREAKTHROUGH.chapters.filter(
      (c) => breakthroughAccess(doneSet).unlocked.has(c.id) && !doneSet.has(c.id),
    );
    return open.find((c) => READ_FIRST.has(c.id)) ?? open[0] ?? null;
  }, [continueLesson, doneSet]);

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft overflow-hidden p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-semibold">
            {doneCount} of {totalLessons} lessons
          </p>
          <span className="text-[13px] font-medium tabular-nums text-muted-foreground">
            {xp} XP
          </span>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/70 transition-all"
            style={{ width: `${totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">
              {score === null ? "–" : `${score}%`}
            </p>
            <p className="text-xs text-muted-foreground">Quiz score</p>
          </div>
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">{state?.attempts.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Answers</p>
          </div>
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">{doneCount}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
        </div>

        {continueLesson && (
          <Button
            className="mt-4 h-12 w-full rounded-2xl text-base"
            onClick={() => setActiveLesson(continueLesson)}
          >
            <ScanSearch className="size-4" />
            Continue · {continueLesson.title}
          </Button>
        )}
        {continueChapter && (
          <Button
            className="mt-4 h-12 w-full rounded-2xl text-base"
            onClick={() => setActiveChapter({ chapter: continueChapter })}
          >
            <ScanSearch className="size-4" />
            Continue · {continueChapter.title}
          </Button>
        )}
        {!placed && !access.open && (
          <button
            type="button"
            onClick={() => setPlacementOpen(true)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-1 text-[14px] font-medium text-muted-foreground underline underline-offset-4"
          >
            Already trading? Take the placement check
          </button>
        )}
      </header>

      {spaced && (
        <section className="card-soft border-warn/30 p-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <Target className="size-4 text-warn" /> Review suggested
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You have missed <span className="text-foreground">{TOPIC_LABEL[spaced.topic]}</span>{" "}
            {spaced.wrong} times. Revisit that unit before the next live trade.
          </p>
        </section>
      )}

      {topics.length > 0 && (
        <section className="card-soft p-4">
          <p className="font-display text-sm font-semibold">
            <TermTooltip term="Topic strength" label="Topic strength" />
          </p>
          <div className="mt-2 space-y-1.5">
            {topics.slice(0, 6).map((t) => (
              <div key={t.topic} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{TOPIC_LABEL[t.topic] ?? t.topic}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium",
                    t.percent === null && "bg-muted text-muted-foreground",
                    t.percent !== null && t.percent >= 70 && "bg-bull/12 text-bull",
                    t.percent !== null && t.percent < 70 && "bg-warn/12 text-warn",
                  )}
                >
                  {t.percent === null ? `${t.attempts}/3` : `${t.percent}%`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { key: "path" as const, label: "Learning path" },
            { key: "concepts" as const, label: "Concept library" },
          ] as const
        ).map((item) => (
          <Button
            key={item.key}
            aria-pressed={tab === item.key}
            variant={tab === item.key ? "selected" : "secondary"}
            className="h-11 rounded-xl"
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === "path" && (
        <div className="relative space-y-4 pl-2">
          <div className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-border" />

          {levelProgress.map((level, index) => {
            const unlocked = isLevelUnlocked(index);
            const complete = level.pct === 100;

            return (
              <section key={level.level} className="relative">
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl border-2 font-display text-sm font-bold shadow-sm",
                      complete && "border-bull bg-bull/15 text-bull",
                      !complete && unlocked && "border-foreground/40 bg-card text-foreground",
                      !unlocked && "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {complete ? (
                      <CheckCircle2 className="size-6" />
                    ) : !unlocked ? (
                      <Lock className="size-5" />
                    ) : (
                      level.level
                    )}
                  </div>

                  <div className={cn("min-w-0 flex-1 card-soft p-4", !unlocked && "opacity-60")}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-base font-semibold">
                          {level.level === 0 ? "Start here" : `Unit ${level.level}`} · {level.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{level.blurb}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {level.done}/{level.total}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          complete ? "bg-bull" : "bg-foreground/70",
                        )}
                        style={{ width: `${level.pct}%` }}
                      />
                    </div>

                    {unlocked ? (
                      <div className="mt-3 space-y-1.5">
                        {level.lessons.map((lesson) => {
                          const done = doneSet.has(lesson.id);
                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => setActiveLesson(lesson)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors",
                                done
                                  ? "border-bull/30 bg-bull/5"
                                  : "border-border bg-card hover:bg-muted/40",
                              )}
                            >
                              <span
                                className={cn(
                                  "grid size-7 shrink-0 place-items-center rounded-full",
                                  done ? "bg-bull/20 text-bull" : "bg-muted text-foreground",
                                )}
                              >
                                {done ? (
                                  <Check className="size-4" aria-label="Done" />
                                ) : (
                                  <Play className="size-3.5" aria-hidden />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium leading-tight">
                                  {lesson.title}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {lesson.summary}
                                </span>
                              </span>
                              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Complete at least 60% of the previous unit, or pass the placement check, to
                        unlock.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}

          <BreakthroughSection
            doneSet={doneSet}
            onOpen={(chapter, term) => setActiveChapter(term ? { chapter, term } : { chapter })}
          />
        </div>
      )}

      {tab === "concepts" && (
        <section className="space-y-2">
          <p className="px-1 text-xs text-muted-foreground">
            Quick reference cards: same ideas as the path, in library form.
          </p>
          {CONCEPTS.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} beginner={settings.beginner_mode} />
          ))}
        </section>
      )}

      {nextUp.length > 0 && tab === "path" && (
        <section className="card-soft p-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <BookOpen className="size-4 text-muted-foreground" /> Suggested next
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {nextUp.map((lesson) => (
              <Button
                key={lesson.id}
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={() => setActiveLesson(lesson)}
              >
                {lesson.title}
              </Button>
            ))}
          </div>
        </section>
      )}

      <UncertaintyNote />

      {activeLesson && (
        <LessonPlayer
          lesson={activeLesson}
          done={doneSet.has(activeLesson.id)}
          onClose={() => setActiveLesson(null)}
          onComplete={() => {
            if (!doneSet.has(activeLesson.id)) {
              complete.mutate(activeLesson.id);
            }
          }}
        />
      )}

      {placementOpen && (
        <PlacementCheck
          onClose={() => setPlacementOpen(false)}
          onPassed={() => complete.mutate(PLACEMENT_ID)}
        />
      )}

      {activeChapter && (
        <BreakthroughReader
          chapter={activeChapter.chapter}
          number={BREAKTHROUGH.chapters.indexOf(activeChapter.chapter) + 1}
          total={BREAKTHROUGH.chapters.length}
          done={doneSet.has(activeChapter.chapter.id)}
          initialTerm={activeChapter.term}
          onClose={() => setActiveChapter(null)}
          onComplete={() => {
            if (!doneSet.has(activeChapter.chapter.id)) complete.mutate(activeChapter.chapter.id);
          }}
        />
      )}
    </div>
  );
}

export function AcademyLessons() {
  return (
    <SignInPrompt feature="the Academy">
      <Learn />
    </SignInPrompt>
  );
}
