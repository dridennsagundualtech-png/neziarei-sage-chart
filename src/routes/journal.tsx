import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Calculator, FlaskConical, ImageIcon, NotebookPen, ScrollText } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { TermTooltip } from "@/components/TermTooltip";
import { PageGate } from "@/components/PageGate";
import { HistorySection } from "@/components/pages/HistorySection";
import { BacktestStatsPanel } from "@/components/BacktestStatsPanel";
import { NotesSection } from "@/components/pages/NotesSection";
import { ScreenshotsSection } from "@/components/pages/ScreenshotsSection";
import { SplitSection } from "@/components/pages/SplitSection";
import { StatisticsSection } from "@/components/pages/StatisticsSection";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal: history, stats, notes & split | ChartPilot" },
      {
        name: "description",
        content:
          "Your trading journal in one place: past analyses and outcomes, deterministic performance statistics, free-form notes and the profit split calculator.",
      },
      { property: "og:title", content: "Journal: ChartPilot" },
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
  { key: "practice" as const, label: "Backtest stats", icon: FlaskConical },
  { key: "notes" as const, label: "Notes", icon: NotebookPen },
  { key: "screenshots" as const, label: "Screenshots", icon: ImageIcon },
  { key: "split" as const, label: "Split", icon: Calculator },
];

type TabKey = (typeof TABS)[number]["key"];

function JournalPage() {
  const [tab, setTab] = useState<TabKey>("history");

  return (
    <AppShell>
      <div className="mb-3 rounded-2xl border border-border bg-elevated p-3 text-sm text-muted-foreground">
        <TermTooltip term="Journal" label="Journal" />{" "}
        — simple meaning: your trading diary. History stores past reads, Stats scores live finished trades, Backtest stats scores saved practice runs,
        notes are free writing, and split is for comparing groups of trades.
      </div>
      <PageGate page="/journal">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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
          {tab === "practice" && <BacktestStatsPanel />}
          {tab === "notes" && <NotesSection />}
          {tab === "screenshots" && <ScreenshotsSection />}
          {tab === "split" && <SplitSection />}
        </div>
      </PageGate>
    </AppShell>
  );
}
