import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, GraduationCap, ListChecks } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PageGate } from "@/components/PageGate";
import { StaticQuizRunner } from "@/components/StaticQuizRunner";
import { AcademyLessons } from "@/components/pages/AcademyLessons";
import { PracticeSection } from "@/components/pages/PracticeSection";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Academy — lessons, quizzes & practice | ChartPilot" },
      {
        name: "description",
        content:
          "Structured lessons, offline knowledge quizzes (no AI), and optional AI practice drills. Educational only — not financial advice.",
      },
      { property: "og:title", content: "Academy — lessons, quizzes & practice | ChartPilot" },
      {
        property: "og:description",
        content:
          "Lessons, static quizzes without AI, and hands-on practice in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademyPage,
});

const TABS = [
  { key: "lessons" as const, label: "Lessons", icon: GraduationCap },
  { key: "quizzes" as const, label: "Quizzes", icon: ListChecks },
  { key: "practice" as const, label: "Practice (AI)", icon: Dumbbell },
];

function AcademyPage() {
  const [tab, setTab] = useState<"lessons" | "quizzes" | "practice">("lessons");

  return (
    <AppShell>
      <PageGate page="/learn">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
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
          {tab === "quizzes" && <StaticQuizRunner />}
          {tab === "practice" && <PracticeSection />}
        </div>
      </PageGate>
    </AppShell>
  );
}
