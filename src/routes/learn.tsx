import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, GraduationCap, Repeat, Target } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
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

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Trading Academy — learn to read charts | ChartPilot" },
      {
        name: "description",
        content:
          "Seven levels of structured chart-reading lessons, concept explanations in simple words, knowledge scores and spaced practice reminders. Educational only — not financial advice.",
      },
      { property: "og:title", content: "Trading Academy — ChartPilot" },
      {
        property: "og:description",
        content: "Structured lessons, concept library and knowledge scores that measure what you actually answered.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  return (
    <AppShell>
      <SignInPrompt feature="the Academy">
        <Learn />
      </SignInPrompt>
    </AppShell>
  );
}

function LessonCard({ lesson, done }: { lesson: Lesson; done: boolean }) {
  const [open, setOpen] = useState(false);
  const complete = useCompleteLesson();

  return (
    <div className="panel p-3">
      <button
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium">{lesson.title}</span>
          <span className="block text-xs text-muted-foreground">{lesson.summary}</span>
        </span>
        {done && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-bull" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
          {lesson.body.map((paragraph) => (
            <p key={paragraph} className="text-xs leading-relaxed text-muted-foreground">
              {paragraph}
            </p>
          ))}
          <p className="rounded-xl bg-warn/8 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/90">Common beginner mistake: </span>
            {lesson.mistake}
          </p>
          <Button
            variant={done ? "secondary" : "default"}
            className="h-10 w-full rounded-xl"
            onClick={() => complete.mutate(lesson.id)}
          >
            {done ? "Marked as read" : "Mark as read"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Learn() {
  const learningQuery = useLearning();
  const settingsQuery = useSettings();
  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };
  const state = learningQuery.data;
  const [tab, setTab] = useState<"academy" | "concepts">("academy");

  const score = state ? knowledgeScore(state) : null;
  const topics = state ? topicScores(state) : [];
  const nextUp = state ? recommendedLessons(state) : [];
  const spaced = state ? spacedPrompt(state) : null;
  const doneCount = state ? Object.keys(state.lessons).length : 0;

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold">
          <GraduationCap className="size-5 text-primary" /> Trading Academy
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn to read charts yourself. Every lesson explains the idea in simple words, where it
          appears, what would invalidate it, and the mistake beginners usually make.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">{score === null ? "—" : `${score}%`}</p>
            <p className="text-[11px] text-muted-foreground">Knowledge score</p>
          </div>
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">{state?.attempts.length ?? 0}</p>
            <p className="text-[11px] text-muted-foreground">Answers given</p>
          </div>
          <div className="panel p-3">
            <p className="font-display text-lg font-semibold">{doneCount}</p>
            <p className="text-[11px] text-muted-foreground">Lessons read</p>
          </div>
        </div>
        {score === null && (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            A topic only gets a score after three answers — small samples mean nothing. Answer some
            questions in Practice to start measuring.
          </p>
        )}
      </header>

      {spaced && (
        <section className="card-soft p-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <Repeat className="size-4 text-warn" /> Spaced practice
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            You have missed <span className="text-foreground/90">{TOPIC_LABEL[spaced.topic]}</span>{" "}
            {spaced.wrong} times. Revisit it before your next analysis.
          </p>
        </section>
      )}

      {topics.some((t) => t.attempts > 0) && (
        <section className="card-soft p-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <Target className="size-4 text-primary" /> Knowledge by topic
          </p>
          <div className="mt-3 space-y-2">
            {topics
              .filter((t) => t.attempts > 0)
              .map((t) => (
                <div key={t.topic} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-muted-foreground">{TOPIC_LABEL[t.topic]}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-medium",
                      t.percent === null && "bg-muted text-muted-foreground",
                      t.percent !== null && t.percent >= 70 && "bg-bull/12 text-bull",
                      t.percent !== null && t.percent < 70 && "bg-warn/12 text-warn",
                    )}
                  >
                    {t.percent === null ? `${t.attempts}/3 answers` : `${t.percent}%`}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {nextUp.length > 0 && (
        <section className="card-soft p-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <BookOpen className="size-4 text-primary" /> Recommended next
          </p>
          <div className="mt-3 space-y-2">
            {nextUp.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} done={false} />
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { key: "academy" as const, label: "Lessons" },
            { key: "concepts" as const, label: "Concept library" },
          ]
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

      {tab === "academy" &&
        ACADEMY.map((level) => (
          <section key={level.level} className="card-soft p-4">
            <p className="font-display text-base font-semibold">
              Level {level.level} — {level.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{level.blurb}</p>
            <div className="mt-3 space-y-2">
              {level.lessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  done={Boolean(state?.lessons[lesson.id])}
                />
              ))}
            </div>
          </section>
        ))}

      {tab === "concepts" && (
        <section className="space-y-2">
          {CONCEPTS.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} beginner={settings.beginner_mode} />
          ))}
        </section>
      )}

      <UncertaintyNote />
    </div>
  );
}
