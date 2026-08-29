import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, GraduationCap } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PageGate } from "@/components/PageGate";
import { AcademyLessons } from "@/components/pages/AcademyLessons";
import { PracticeSection } from "@/components/pages/PracticeSection";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/learn")({
  head: () => ({
    meta: [
      { title: "Academy — lessons & practice drills | ChartPilot" },
      {
        name: "description",
        content:
          "Structured chart-reading lessons plus quiz, identify-it and guided practice on your own screenshots. Educational only — not financial advice.",
      },
      { property: "og:title", content: "Academy — lessons & practice | ChartPilot" },
      {
        property: "og:description",
        content:
          "Seven levels of lessons, a concept library and hands-on practice drills in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AcademyPage,
});

const TABS = [
  { key: "lessons" as const, label: "Lessons", icon: GraduationCap },
  { key: "practice" as const, label: "Practice", icon: Dumbbell },
];

function AcademyPage() {
  const [tab, setTab] = useState<"lessons" | "practice">("lessons");

  return (
    <AppShell>
      <PageGate page="/learn">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant={tab === item.key ? "default" : "secondary"}
                  className="h-11 rounded-xl"
                  onClick={() => setTab(item.key)}
                >
                  <Icon className="size-4" /> {item.label}
                </Button>
              );
            })}
          </div>
          {tab === "lessons" ? <AcademyLessons /> : <PracticeSection />}
        </div>
      </PageGate>
    </AppShell>
  );
}
