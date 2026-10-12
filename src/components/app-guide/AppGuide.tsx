/**
 * App guide: a course on using ChartPilot itself. Separate from the trading
 * lessons, never locked, and readable signed out (progress then stays on this
 * device; signed in it is saved to the account too).
 */
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  ExternalLink,
  Lightbulb,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { QuizFlow, type QuizAnswer } from "@/components/QuizFlow";
import { Rich, ScreenMock } from "@/components/app-guide/ScreenMock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/account";
import {
  ACCESS_LABEL,
  GUIDE_LESSONS,
  GUIDE_MODULES,
  guideQuestions,
  moduleOf,
  nextLesson,
  searchGuide,
  type GuideAccess,
  type GuideLesson,
} from "@/lib/app-guide";
import type { GuideLink } from "@/lib/app-guide/types";
import { useCompleteGuideLesson, useLearning } from "@/lib/learning";
import { cn } from "@/lib/utils";

const LOCAL_KEY = "chartpilot.guide.done";

function readLocal(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeLocal(value: Record<string, string>) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(value));
  } catch {
    // Storage can be blocked (private mode); the account copy still works.
  }
}

/** Finished guide lessons: the account copy merged with this device's copy. */
function useGuideProgress() {
  const session = useSession();
  const learning = useLearning();
  const save = useCompleteGuideLesson();
  const [local, setLocal] = useState<Record<string, string>>({});

  useEffect(() => setLocal(readLocal()), []);

  const done = useMemo(
    () => new Set([...Object.keys(learning.data?.guide ?? {}), ...Object.keys(local)]),
    [learning.data?.guide, local],
  );

  const complete = (id: string) => {
    const next = { ...readLocal(), [id]: new Date().toISOString() };
    writeLocal(next);
    setLocal(next);
    if (session.userId) {
      save.mutate(id, {
        onError: () =>
          toast.error("Saved on this device, but not to your account. Try again later."),
      });
    }
  };

  return { done, complete };
}

const ACCESS_TONE: Record<GuideAccess, string> = {
  everyone: "border-border text-muted-foreground",
  "signed-in": "border-border text-muted-foreground",
  premium: "border-primary/40 text-primary",
  "market-data": "border-chart-5/50 text-chart-5",
  admin: "border-bear/50 text-bear",
};

function AccessBadge({ access }: { access: GuideAccess }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        ACCESS_TONE[access],
      )}
    >
      {ACCESS_LABEL[access]}
    </span>
  );
}

function OpenScreen({ link, onGo }: { link: GuideLink; onGo: () => void }) {
  const className =
    "inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 text-sm font-semibold hover:bg-accent";
  const content = (
    <>
      <ExternalLink className="size-4" /> {link.label}
    </>
  );
  if (link.tab) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link to={link.to} search={{ tab: link.tab } as any} className={className} onClick={onGo}>
        {content}
      </Link>
    );
  }
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link to={link.to} search={{} as any} className={className} onClick={onGo}>
      {content}
    </Link>
  );
}

function Sheet({
  progress,
  onClose,
  children,
  footer,
}: {
  progress: number;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App guide lesson"
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            className="flex h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-medium"
            onClick={onClose}
          >
            <X className="size-5" /> Close
          </button>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Lesson progress"
          >
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

function GuidePlayer({
  lesson,
  done,
  onClose,
  onComplete,
  onOpenLesson,
}: {
  lesson: GuideLesson;
  done: boolean;
  onClose: () => void;
  onComplete: () => void;
  onOpenLesson: (id: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<QuizAnswer[] | null>(null);
  const questions = useMemo(() => guideQuestions(lesson), [lesson]);
  const total = lesson.steps.length;
  const checking = step >= total;
  const current = lesson.steps[Math.min(step, total - 1)]!;
  const progress = results ? 100 : (Math.min(step, total) / (total + 1)) * 100;
  const next = nextLesson(lesson.id);
  const module = moduleOf(lesson.id);
  const right = results ? results.filter((r) => r.correct).length : 0;

  const finish = (goNext: boolean) => {
    if (!done) onComplete();
    if (goNext && next) onOpenLesson(next.id);
    else onClose();
  };

  const footer = checking ? (
    results ? (
      <>
        <Button
          variant="secondary"
          className="h-12 flex-1 rounded-2xl"
          onClick={() => finish(false)}
        >
          {done ? "Close" : "Mark complete"}
        </Button>
        {next && (
          <Button className="h-12 flex-1 rounded-2xl" onClick={() => finish(true)}>
            Next lesson <ChevronRight className="size-4" />
          </Button>
        )}
      </>
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
        {step === total - 1 ? "Check yourself" : "Continue"}
        <ChevronRight className="size-4" />
      </Button>
    </>
  );

  return (
    <Sheet progress={progress} onClose={onClose} footer={footer}>
      <p className="text-xs font-medium text-muted-foreground">
        App guide{module ? ` · ${module.title}` : ""}
      </p>
      <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{lesson.title}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" aria-hidden /> {lesson.where}
        </span>
        <AccessBadge access={lesson.access} />
      </div>

      {checking ? (
        <div className="mt-5">
          {results ? (
            <div className="space-y-3">
              <div className="panel p-4">
                <p className="font-display text-lg font-semibold">
                  {right} of {questions.length} right
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {right === questions.length
                    ? "You know where this lives. Try it on the real screen."
                    : "Reread the step behind the miss, then try it on the real screen."}
                </p>
              </div>
              {lesson.open && <OpenScreen link={lesson.open} onGo={() => finish(false)} />}
            </div>
          ) : (
            <QuizFlow questions={questions} onFinish={setResults} finishLabel="Finish check" />
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-4 pb-2">
          <div>
            <p className="caps text-xs text-muted-foreground">
              Step {step + 1} of {total}
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-snug">{current.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              <Rich text={current.body} />
            </p>
            {current.bullets && (
              <ul className="mt-3 space-y-2">
                {current.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-2 text-[15px] leading-relaxed text-muted-foreground"
                  >
                    <span
                      aria-hidden
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                    />
                    <span>
                      <Rich text={bullet} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {current.mock && <ScreenMock mock={current.mock} />}
          {current.tip && (
            <p className="flex gap-2 rounded-xl bg-muted/60 p-3 text-sm leading-relaxed">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <Rich text={current.tip} />
              </span>
            </p>
          )}
          {step === 0 && lesson.open && <OpenScreen link={lesson.open} onGo={onClose} />}
        </div>
      )}
    </Sheet>
  );
}

function LessonRow({
  lesson,
  index,
  done,
  onOpen,
}: {
  lesson: GuideLesson;
  index: string;
  done: boolean;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/40"
      >
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
            done ? "bg-bull/15 text-bull" : "bg-muted text-muted-foreground",
          )}
        >
          {done ? <CheckCircle2 className="size-4" aria-label="Done" /> : index}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug">{lesson.title}</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
            {lesson.summary}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-2">
            <AccessBadge access={lesson.access} />
            <span className="text-[11px] text-muted-foreground">{lesson.steps.length} steps</span>
          </span>
        </span>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
    </li>
  );
}

export function AppGuide() {
  const { done, complete } = useGuideProgress();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const firstOpen = GUIDE_LESSONS.find((l) => !done.has(l.id)) ?? null;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const results = useMemo(() => searchGuide(query), [query]);

  // Open the module you are working through, once progress has loaded.
  const currentModule = firstOpen ? moduleOf(firstOpen.id)?.id : undefined;
  useEffect(() => {
    if (currentModule) setExpanded((cur) => (cur.size ? cur : new Set([currentModule])));
  }, [currentModule]);

  const openLesson = GUIDE_LESSONS.find((l) => l.id === openId) ?? null;
  const total = GUIDE_LESSONS.length;
  const finished = GUIDE_LESSONS.filter((l) => done.has(l.id)).length;
  const pct = Math.round((finished / total) * 100);

  const toggle = (id: string) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <section className="card-soft p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Compass className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-bold leading-tight">App guide</h2>
            <p className="mt-1 text-[15px] leading-snug text-muted-foreground">
              How to use every screen of ChartPilot, with the real button names.{" "}
              {GUIDE_MODULES.length} modules, {total} lessons, nothing locked.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>
              {finished} of {total} lessons done
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-bull transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {firstOpen ? (
          <Button
            className="mt-4 h-auto min-h-12 w-full whitespace-normal rounded-xl py-2.5 text-base leading-snug"
            onClick={() => setOpenId(firstOpen.id)}
          >
            {finished === 0 ? "Start the guide" : `Continue: ${firstOpen.title}`}
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <p className="mt-4 rounded-xl bg-bull/10 p-3 text-sm text-bull">
            Every lesson is done. Open any of them again when you need a refresher.
          </p>
        )}
      </section>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search the App guide"
          placeholder="Search the guide"
          className="h-11 rounded-xl pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {query.trim() ? (
        <section className="card-soft p-3" aria-live="polite">
          <p className="px-2 pb-1 text-xs text-muted-foreground">
            {results.length
              ? `${results.length} ${results.length === 1 ? "lesson mentions" : "lessons mention"} that`
              : "No lesson mentions that. Try another word."}
          </p>
          <ul>
            {results.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index="•"
                done={done.has(lesson.id)}
                onOpen={() => setOpenId(lesson.id)}
              />
            ))}
          </ul>
        </section>
      ) : (
        <div className="space-y-3">
          {GUIDE_MODULES.map((module, mi) => {
            const isOpen = expanded.has(module.id);
            const doneHere = module.lessons.filter((l) => done.has(l.id)).length;
            return (
              <section key={module.id} className="card-soft">
                <button
                  type="button"
                  onClick={() => toggle(module.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  <span className="caps mt-0.5 w-7 shrink-0 text-lg leading-none text-muted-foreground">
                    {String(mi + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-lg font-semibold leading-tight">
                      {module.title}
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">
                      {module.blurb}
                    </span>
                    <span className="mt-1.5 block text-xs text-muted-foreground">
                      {doneHere} of {module.lessons.length} done
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden
                    className={cn(
                      "mt-1 size-5 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen && (
                  <ul className="border-t border-border px-2 py-1">
                    {module.lessons.map((lesson, li) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        index={`${mi + 1}.${li + 1}`}
                        done={done.has(lesson.id)}
                        onOpen={() => setOpenId(lesson.id)}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Badges show who can open each screen: Everyone, Signed in, Premium, Market data access
        (switched on by an admin) or Admin only. Signed out, your guide progress stays on this
        device.
      </p>

      {openLesson && (
        <GuidePlayer
          key={openLesson.id}
          lesson={openLesson}
          done={done.has(openLesson.id)}
          onClose={() => setOpenId(null)}
          onComplete={() => complete(openLesson.id)}
          onOpenLesson={(id) => setOpenId(id)}
        />
      )}
    </div>
  );
}
