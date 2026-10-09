import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { AppShell } from "@/components/AppShell";
import { BacktestStatsPanel } from "@/components/BacktestStatsPanel";
import { PageGate } from "@/components/PageGate";
import { TermTooltip } from "@/components/TermTooltip";
import { HistorySection } from "@/components/pages/HistorySection";
import { NotesSection } from "@/components/pages/NotesSection";
import { ScreenshotsSection } from "@/components/pages/ScreenshotsSection";
import { SplitSection } from "@/components/pages/SplitSection";
import { StatisticsSection } from "@/components/pages/StatisticsSection";
import { cn } from "@/lib/utils";

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
  { key: "history", label: "History" },
  { key: "stats", label: "Stats" },
  { key: "practice", label: "Backtest stats" },
  { key: "notes", label: "Notes" },
  { key: "screenshots", label: "Screenshots" },
  { key: "split", label: "Split" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function JournalPage() {
  const [tab, setTab] = useState<TabKey>("history");
  const buttons = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});
  const userPicked = useRef(false);

  // Keep the picked tab visible in the swipeable row (not on first load).
  useEffect(() => {
    if (!userPicked.current) return;
    buttons.current[tab]?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [tab]);

  const pick = (key: TabKey) => {
    userPicked.current = true;
    setTab(key);
  };

  // Arrow keys / Home / End move between tabs, as people expect from a tab bar.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = TABS.findIndex((item) => item.key === tab);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    const key = TABS[next]!.key;
    pick(key);
    buttons.current[key]?.focus();
  };

  return (
    <AppShell>
      <PageGate page="/journal">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Journal</h1>
            <TermTooltip term="Journal" iconOnly />
          </div>
          <p className="mt-1 text-[15px] leading-snug text-muted-foreground">
            Your chart reads, how they ended, and your notes.
          </p>

          <div
            role="tablist"
            aria-label="Journal sections"
            onKeyDown={onKeyDown}
            className="-mx-4 mt-5 flex overflow-x-auto border-b border-border/60 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TABS.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  ref={(node) => {
                    buttons.current[item.key] = node;
                  }}
                  id={`journal-tab-${item.key}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls="journal-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => pick(item.key)}
                  className={cn(
                    "relative inline-flex h-12 shrink-0 items-center whitespace-nowrap px-3 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div
            id="journal-panel"
            role="tabpanel"
            aria-labelledby={`journal-tab-${tab}`}
            tabIndex={-1}
            className="focus:outline-none"
          >
            {tab === "history" && <HistorySection />}
            {tab === "stats" && <StatisticsSection />}
            {tab === "practice" && <BacktestStatsPanel />}
            {tab === "notes" && <NotesSection />}
            {tab === "screenshots" && <ScreenshotsSection />}
            {tab === "split" && <SplitSection />}
          </div>
        </div>
      </PageGate>
    </AppShell>
  );
}
