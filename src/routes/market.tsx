import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { MarketSection } from "@/components/pages/MarketSection";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Live market analysis (admin) — ChartPilot" },
      {
        name: "description",
        content:
          "Admin-only multi-timeframe market analysis built from stored OHLC candles: bias, support and resistance levels, momentum and a conditional plan.",
      },
      { property: "og:title", content: "Live market analysis — ChartPilot" },
      {
        property: "og:description",
        content: "Multi-timeframe read from real stored candle data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketPage,
});

function MarketPage() {
  return (
    <AppShell>
      <MarketSection />
    </AppShell>
  );
}
