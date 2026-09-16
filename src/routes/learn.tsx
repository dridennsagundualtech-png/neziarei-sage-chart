import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Dumbbell, GraduationCap, ListChecks } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PageGate } from "@/components/PageGate";
import { BooksSection } from "@/components/pages/BooksSection";
import { StaticQuizRunner } from "@/components/StaticQuizRunner";
import { AcademyLessons } from "@/components/pages/AcademyLessons";
import { PracticeSection } from "@/components/pages/PracticeSection";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Academy: lessons, books, quizzes & practice | ChartPilot" },
      {
        name: "description",
        content:
          "Lessons, reading list, offline quizzes (no AI), and optional AI practice. Educational only: not financial advice.",
      },
      { property: "og:title", content: "Academy: lessons, books, quizzes & practice | ChartPilot" },
      {
        property: "og:description",
        content: "Lessons, books, static quizzes, and practice in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademyPage,
});

const TABS = [
  { key: "lessons" as const, label: "Lessons", icon: GraduationCap },
  { key: "books" as const, label: "Books", icon: BookOpen },
  { key: "quizzes" as const, label: "Quizzes", icon: ListChecks },
  { key: "practice" as const, label: "Practice (AI)", icon: Dumbbell },
];

function AcademyPage() {
  const [tab, setTab] = useState<"lessons" | "books" | "quizzes" | "practice">("lessons");

  return (
    <AppShell>
      <PageGate page="/learn">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant={tab === item.key ? "default" : "secondary"}
                  className="h-11 rounded-xl px-2 text-xs sm:text-sm"
                  onClick={() => setTab(item.key)}
                >
                  <Icon className="size-4 shrink-0" /> {item.label}
                </Button>
              );
            })}
          </div>
          {tab === "lessons" && <AcademyLessons />}
          {tab === "books" && <BooksSection />}
          {tab === "quizzes" && <StaticQuizRunner />}
          {tab === "practice" && <PracticeSection />}
        </div>
      </PageGate>
    </AppShell>
  );
}
