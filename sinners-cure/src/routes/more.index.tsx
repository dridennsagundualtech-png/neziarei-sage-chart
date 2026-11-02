import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Flame } from "lucide-react";
import { Card, Page } from "@/components/app-ui";
import { PLANS } from "@/data/plans";
import { usePlanProgress } from "@/lib/plans-store";
import { useStreak } from "@/lib/streak";

export const Route = createFileRoute("/more/")({
  head: () => ({
    meta: [
      { title: "More — Sinner's Cure" },
      { name: "description", content: "Reading plans, your saved verses, prayer streak and settings." },
      { property: "og:title", content: "More — Sinner's Cure" },
      { property: "og:description", content: "Reading plans, your saved verses, prayer streak and settings." },
    ],
  }),
  component: MorePage,
});

const row = "flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-lg";

function MorePage() {
  const { streak, days, best } = useStreak();
  const [progress] = usePlanProgress();

  return (
    <Page title="More">
      <Card className="mb-6 flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Flame className="size-8" aria-hidden />
        </div>
        <div>
          <p className="eyebrow">Prayer streak</p>
          <p className="font-serif text-3xl font-semibold">
            {streak} day{streak === 1 ? "" : "s"}
          </p>
          <p className="text-muted-foreground">Best {best} · {days.length} days of prayer in total</p>
        </div>
      </Card>

      <h2 className="eyebrow mb-2 px-1">Reading plans</h2>
      <div className="card-surface mb-6 divide-y overflow-hidden">
        {PLANS.map((p) => {
          const done = progress[p.id]?.length ?? 0;
          const pct = Math.round((done / p.days.length) * 100);
          return (
            <Link key={p.id} to="/more/plans/$id" params={{ id: p.id }} className="block px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{p.name}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <p className="text-muted-foreground">
                Day {Math.min(done + 1, p.days.length)} of {p.days.length}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="card-surface divide-y overflow-hidden">
        <Link to="/more/intentions" className={row}>
          Prayer intentions <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        <Link to="/more/saved" className={row}>
          Highlights, bookmarks & notes <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        <Link to="/more/settings" className={row}>
          Settings <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      </div>
    </Page>
  );
}
