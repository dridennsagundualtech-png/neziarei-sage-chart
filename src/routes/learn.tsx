import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Compass, Dumbbell, GraduationCap, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AppGuide } from "@/components/app-guide/AppGuide";
import { TermTooltip } from "@/components/TermTooltip";
import { PageGate } from "@/components/PageGate";
import { BooksSection } from "@/components/pages/BooksSection";
import { StaticQuizRunner } from "@/components/StaticQuizRunner";
import { AcademyLessons } from "@/components/pages/AcademyLessons";
import { PracticeSection } from "@/components/pages/PracticeSection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  validateSearch: (search: Record<string, unknown>): { tab?: AcademyTab } => ({
    tab: TAB_KEYS.includes(search.tab as AcademyTab) ? (search.tab as AcademyTab) : undefined,
  }),
  component: AcademyPage,
});

type AcademyTab = "guide" | "lessons" | "books" | "quizzes" | "practice";
const TAB_KEYS: AcademyTab[] = ["guide", "lessons", "books", "quizzes", "practice"];

const TABS = [
  { key: "guide" as const, label: "App guide", icon: Compass },
  { key: "lessons" as const, label: "Lessons", icon: GraduationCap },
  { key: "books" as const, label: "Books", icon: BookOpen },
  { key: "quizzes" as const, label: "Quizzes", icon: ListChecks },
  { key: "practice" as const, label: "Practice (AI)", icon: Dumbbell },
];

function AcademyPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<AcademyTab>(search.tab ?? "lessons");

  // A link with ?tab= (for example from the App guide) switches the tab.
  useEffect(() => {
    if (search.tab) setTab(search.tab);
  }, [search.tab]);

  return (
    <AppShell>
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-4xl font-bold">Academy</h1>
          <TermTooltip term="Academy" iconOnly />
        </div>
        <p className="mt-1 text-[15px] leading-snug text-muted-foreground">
          Lessons teach ideas, books hold your reading, quizzes check you, practice lets you try
          without real money, and the App guide shows how every screen works.
        </p>
      </div>
      <PageGate page="/learn">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  aria-pressed={tab === item.key}
                  variant={tab === item.key ? "selected" : "secondary"}
                  className={cn(
                    "h-11 rounded-xl px-2 text-xs sm:text-sm",
                    item.key === "guide" && "col-span-2 sm:col-span-1",
                  )}
                  onClick={() => setTab(item.key)}
                >
                  <Icon className="size-4 shrink-0" /> {item.label}
                </Button>
              );
            })}
          </div>
          {tab === "guide" && <AppGuide />}
          {tab === "lessons" && <AcademyLessons />}
          {tab === "books" && <BooksSection />}
          {tab === "quizzes" && <StaticQuizRunner />}
          {tab === "practice" && <PracticeSection />}
        </div>
      </PageGate>
    </AppShell>
  );
}
