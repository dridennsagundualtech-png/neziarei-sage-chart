import { createFileRoute, Link } from "@tanstack/react-router";
import { CandlestickChart, LineChart, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { PageGate } from "@/components/PageGate";
import { ProChartsPanel } from "@/components/ProChartsPanel";
import { TradingSessionCard } from "@/components/TradingSessionCard";
import { MarketSection } from "@/components/pages/MarketSection";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/account";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChartPilot — Evidence-based chart analysis & journal" },
      {
        name: "description",
        content:
          "Trading sessions, live charts and strict, evidence-based chart analysis with a journal. Educational tool, not financial advice.",
      },
      { property: "og:title", content: "ChartPilot — Evidence-based chart analysis" },
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
        <div className="mb-4">
          <TradingSessionCard />
        </div>

        <Link to="/analyze" className="mb-4 block">
          <Button className="h-12 w-full rounded-xl text-base">
            <LineChart className="size-4" /> Analyze a chart
          </Button>
        </Link>

        {access?.isAdmin && (
          <div className="mb-4 space-y-2">
            <Button
              variant={proCharts ? "default" : "secondary"}
              className="h-11 w-full rounded-xl"
              onClick={() => setProCharts((current) => !current)}
            >
              <CandlestickChart className="size-4" />
              {proCharts ? "Hide Pro Charts" : "Pro Charts — TradingView workspace"}
            </Button>
            {proCharts && <ProChartsPanel heading={false} />}
          </div>
        )}
        {access?.isAdmin && (
          <div className="mb-4 space-y-2">
            <Button
              variant={adminMarket ? "default" : "secondary"}
              className="h-11 w-full rounded-xl"
              onClick={() => setAdminMarket((current) => !current)}
            >
              <ShieldCheck className="size-4" />
              {adminMarket ? "Hide admin market analysis" : "Admin feature — market analysis"}
            </Button>
            {adminMarket && <MarketSection />}
          </div>
        )}
      </PageGate>
    </AppShell>
  );
}
