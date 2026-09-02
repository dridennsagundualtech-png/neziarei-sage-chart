import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { ProChartsPanel } from "@/components/ProChartsPanel";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/account";

export const Route = createFileRoute("/charts")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Pro Charts (admin) — ChartPilot" },
      {
        name: "description",
        content:
          "Admin-only professional charting workspace: TradingView advanced chart with drawing tools, market overview mini charts and a market heatmap.",
      },
      { property: "og:title", content: "Pro Charts — ChartPilot" },
      {
        property: "og:description",
        content: "Advanced TradingView charting, mini market overview and heatmap for admins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChartsPage,
});

function ChartsPage() {
  return (
    <AppShell>
      <ProCharts />
    </AppShell>
  );
}

function ProCharts() {
  const { access, session, loading } = useAccess();

  if (loading) {
    return <div className="card-soft p-6 text-sm text-muted-foreground">Checking your access…</div>;
  }

  if (!session.userId) {
    return (
      <div className="card-soft space-y-3 p-5">
        <h1 className="font-display text-lg font-semibold">Sign in required</h1>
        <p className="text-sm text-muted-foreground">Sign in with the admin account to continue.</p>
        <Link to="/auth" className="inline-flex">
          <Button className="h-11 rounded-xl">Sign in</Button>
        </Link>
      </div>
    );
  }

  if (!access?.isAdmin) {
    return (
      <div className="card-soft space-y-2 p-5">
        <h1 className="font-display text-lg font-semibold">Admin only</h1>
        <p className="text-sm text-muted-foreground">
          This account ({access?.email ?? "unknown"}) does not have admin access.
        </p>
      </div>
    );
  }

  return <ProChartsPanel />;
}
