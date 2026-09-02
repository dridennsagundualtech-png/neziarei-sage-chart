import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Calculator, ImageIcon, NotebookPen, ScrollText } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PageGate } from "@/components/PageGate";
import { HistorySection } from "@/components/pages/HistorySection";
import { NotesSection } from "@/components/pages/NotesSection";
import { ScreenshotsSection } from "@/components/pages/ScreenshotsSection";
import { SplitSection } from "@/components/pages/SplitSection";
import { StatisticsSection } from "@/components/pages/StatisticsSection";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — history, stats, notes & split | ChartPilot" },
      {
        name: "description",
        content:
          "Your trading journal in one place: past analyses and outcomes, deterministic performance statistics, free-form notes and the profit split calculator.",
      },
      { property: "og:title", content: "Journal — ChartPilot" },
      {
        property: "og:description",
        content:
          "History, win rate and expectancy, styled notes and the split calculator, all in one journal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JournalPage,
});

const TABS = [
  { key: "history" as const, label: "History", icon: ScrollText },
  { key: "stats" as const, label: "Stats", icon: BarChart3 },
  { key: "notes" as const, label: "Notes", icon: NotebookPen },
  { key: "split" as const, label: "Split", icon: Calculator },
];

type TabKey = (typeof TABS)[number]["key"];

function JournalPage() {
  const [tab, setTab] = useState<TabKey>("history");

  return (
    <AppShell>
      <PageGate page="/journal">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {TABS.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.key}
                  variant={tab === item.key ? "default" : "secondary"}
                  className="h-11 flex-col gap-0.5 rounded-xl px-1 text-[10px]"
                  onClick={() => setTab(item.key)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
          {tab === "history" && <HistorySection />}
          {tab === "stats" && <StatisticsSection />}
          {tab === "notes" && <NotesSection />}
          {tab === "split" && <SplitSection />}
        </div>
      </PageGate>
    </AppShell>
  );
}
