import { createFileRoute } from "@tanstack/react-router";
import { CandlestickChart, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { SetupAlertsPanel } from "@/components/SetupAlertsPanel";
import { TermTooltip } from "@/components/TermTooltip";
import { PageGate } from "@/components/PageGate";
import { ProChartsPanel } from "@/components/ProChartsPanel";
import { TradingSessionCard } from "@/components/TradingSessionCard";
import { NewsPanel } from "@/components/NewsPanel";
import { MarketSection } from "@/components/pages/MarketSection";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/account";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChartPilot: Evidence-based chart analysis & journal" },
      {
        name: "description",
        content:
          "Trading sessions, live charts and strict, evidence-based chart analysis with a journal. Educational tool, not financial advice.",
      },
      { property: "og:title", content: "ChartPilot: Evidence-based chart analysis" },
      {
        property: "og:description",
        content:
          "Trading sessions, live charts and strict, evidence-based chart analysis with a journal.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { access } = useAccess();
  const [adminMarket, setAdminMarket] = useState(false);
  const [proCharts, setProCharts] = useState(true);

  return (
    <AppShell>
      <PageGate page="/">
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-4xl font-bold">Home</h1>
            <TermTooltip term="Home" iconOnly />
          </div>
          <p className="mt-1 text-[15px] leading-snug text-muted-foreground">
            Which trading session is open, signals shared with you, and the latest market news.
          </p>
        </div>
        <div className="mb-4">
          <TradingSessionCard />
        </div>

        <div className="mb-4">
          <SetupAlertsPanel />
        </div>

        <div className="mb-4">
          <NewsPanel />
        </div>

        {access?.isAdmin && (
          <div className="mb-4 space-y-2">
            <Button
              aria-pressed={proCharts}
              variant={proCharts ? "selected" : "secondary"}
              className="h-11 w-full rounded-xl"
              onClick={() => setProCharts((current) => !current)}
            >
              <CandlestickChart className="size-4" />
              {proCharts ? "Hide Pro Charts" : "Pro Charts: TradingView workspace"}
            </Button>
            {proCharts && <ProChartsPanel heading={false} />}
          </div>
        )}
        {access?.isAdmin && (
          <div className="mb-4 space-y-2">
            <Button
              aria-pressed={adminMarket}
              variant={adminMarket ? "selected" : "secondary"}
              className="h-11 w-full rounded-xl"
              onClick={() => setAdminMarket((current) => !current)}
            >
              <ShieldCheck className="size-4" />
              {adminMarket ? "Hide admin market analysis" : "Admin feature: market analysis"}
            </Button>
            {adminMarket && <MarketSection />}
          </div>
        )}
      </PageGate>
    </AppShell>
  );
}
