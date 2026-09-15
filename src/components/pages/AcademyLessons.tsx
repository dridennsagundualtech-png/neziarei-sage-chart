/**
 * Academy — Duolingo-style learning path.
 * Levels unlock as you complete lessons. Progress is stored via existing learning APIs.
 */
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  GraduationCap,
  Lock,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SignInPrompt } from "@/components/SignInPrompt";
import { ConceptCard } from "@/components/ConceptCard";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import { Button } from "@/components/ui/button";
import {
  ACADEMY,
  CONCEPTS,
  TOPIC_LABEL,
  type Lesson,
} from "@/lib/education-content";
import { DEFAULT_SETTINGS, LOCAL_USER, useSettings } from "@/lib/data";
import {
  knowledgeScore,
  recommendedLessons,
  spacedPrompt,
  topicScores,
  useCompleteLesson,
  useLearning,
} from "@/lib/learning";
import { cn } from "@/lib/utils";

function xpForLessons(n: number) {
  return n * 10;
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
  const [step, setStep] = useState(0);
  const totalSteps = lesson.body.length + 1;
  const isMistakeStep = step >= lesson.body.length;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-6 pt-4">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            onClick={onClose}
          >
            Close
          </button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
          {TOPIC_LABEL[lesson.topic] ?? lesson.topic}
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold leading-tight">{lesson.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{lesson.summary}</p>

        <div className="mt-6 flex-1">
          {!isMistakeStep ? (
            <div className="card-soft p-5">
              <p className="text-[11px] font-medium uppercase text-muted-foreground">
                Step {step + 1} of {lesson.body.length}
              </p>
              <p className="mt-3 text-base leading-relaxed">{lesson.body[step]}</p>
            </div>
          ) : (
            <div className="card-soft border-warn/40 p-5">
              <p className="text-[11px] font-medium uppercase text-warn">Common beginner mistake</p>
              <p className="mt-3 text-base leading-relaxed">{lesson.mistake}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                Remember this one — it shows up in real accounts more often than fancy indicators.
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {step > 0 && (
            <Button variant="secondary" className="h-12 flex-1 rounded-2xl" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {!isMistakeStep ? (
            <Button className="h-12 flex-1 rounded-2xl" onClick={() => setStep((s) => s + 1)}>
              Continue <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              className="h-12 flex-1 rounded-2xl"
              onClick={() => {
                onComplete();
                onClose();
              }}
            >
              {done ? "Done" : "Mark complete · +10 XP"}
            </Button>
          )}
        </div>
      </div>
    </div>
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

  const doneSet = useMemo(() => new Set(Object.keys(state?.lessons ?? {})), [state?.lessons]);
  const doneCount = doneSet.size;
  const totalLessons = ACADEMY.reduce((n, l) => n + l.lessons.length, 0);
  const xp = xpForLessons(doneCount);
  const score = state ? knowledgeScore(state) : null;
  const spaced = state ? spacedPrompt(state) : null;
  const topics = state ? topicScores(state) : [];
  const nextUp = state ? recommendedLessons(state).slice(0, 3) : ACADEMY[0]?.lessons.slice(0, 2) ?? [];

  const levelProgress = ACADEMY.map((level) => {
    const total = level.lessons.length;
    const done = level.lessons.filter((l) => doneSet.has(l.id)).length;
    return { ...level, done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  });

  const isLevelUnlocked = (levelIndex: number) => {
    if (levelIndex <= 0) return true;
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

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft overflow-hidden p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-display text-xl font-semibold">
              <GraduationCap className="size-5 text-primary" />
              Academy
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Short lessons. Real platform terms. Finish units to unlock the next.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
              <Star className="size-3.5" /> {xp} XP
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Flame className="size-3.5 text-warn" /> {doneCount}/{totalLessons} lessons
            </span>
          </div>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">
              {score === null ? "—" : `${score}%`}
            </p>
            <p className="text-[11px] text-muted-foreground">Practice score</p>
          </div>
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">{state?.attempts.length ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Answers</p>
          </div>
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">{doneCount}</p>
            <p className="text-[11px] text-muted-foreground">Completed</p>
          </div>
        </div>

        {continueLesson && (
          <Button
            className="mt-4 h-12 w-full rounded-2xl text-base"
            onClick={() => setActiveLesson(continueLesson)}
          >
            <Sparkles className="size-4" />
            Continue · {continueLesson.title}
          </Button>
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
          <p className="font-display text-sm font-semibold">Topic strength</p>
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
            variant={tab === item.key ? "default" : "secondary"}
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
                      !complete && unlocked && "border-primary bg-primary/15 text-primary",
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
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                        {level.done}/{level.total}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", complete ? "bg-bull" : "bg-primary")}
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
                                  "grid size-7 shrink-0 place-items-center rounded-full text-[11px]",
                                  done ? "bg-bull/20 text-bull" : "bg-primary/15 text-primary",
                                )}
                              >
                                {done ? "✓" : "▶"}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium leading-tight">
                                  {lesson.title}
                                </span>
                                <span className="block text-[11px] text-muted-foreground">
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
                        Complete at least 60% of the previous unit to unlock.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tab === "concepts" && (
        <section className="space-y-2">
          <p className="px-1 text-xs text-muted-foreground">
            Quick reference cards — same ideas as the path, in library form.
          </p>
          {CONCEPTS.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} beginner={settings.beginner_mode} />
          ))}
        </section>
      )}

      {nextUp.length > 0 && tab === "path" && (
        <section className="card-soft p-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <BookOpen className="size-4 text-primary" /> Suggested next
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
