import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { BacktestSection } from "@/components/pages/BacktestSection";

export const Route = createFileRoute("/backtest")({
  head: () => ({
    meta: [
      { title: "Den Analyzer backtest (admin) — ChartPilot" },
      {
        name: "description",
        content:
          "Admin-only walk-forward backtest for the rule-based Den Analyzer. Replay history bar by bar with zero lookahead bias.",
      },
      { property: "og:title", content: "Den Analyzer backtest — ChartPilot" },
      {
        property: "og:description",
        content: "Walk-forward backtest of the rule-based Den Analyzer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BacktestPage,
});

function BacktestPage() {
  return (
    <AppShell>
      <BacktestSection />
    </AppShell>
  );
}
