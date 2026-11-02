import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, HeartHandshake, ListChecks, Settings2 } from "lucide-react";
import { List, Page, Row, Section } from "@/components/app-ui";
import { PLANS } from "@/data/plans";
import { usePlanProgress } from "@/lib/plans-store";
import { lastWeek, useStreak } from "@/lib/streak";

export const Route = createFileRoute("/more/")({
  component: MorePage,
});

function MorePage() {
  const { streak, days, best } = useStreak();
  const [progress] = usePlanProgress();
  const week = lastWeek(days);

  return (
    <Page title="More">
      <section className="card-surface p-5">
        {days.length === 0 ? (
          <>
            <h2 className="font-serif text-[1.5rem] font-semibold">Days of prayer</h2>
            <p className="mt-1 text-muted-foreground">
              Each day you keep your plan of life, a mark fills in here.
            </p>
          </>
        ) : (
          <>
            <p className="font-serif text-[2.4rem] font-semibold leading-none">{streak}</p>
            <p className="mt-1 text-muted-foreground">
              day{streak === 1 ? "" : "s"} of prayer in a row · best {best} · {days.length} in all
            </p>
          </>
        )}
        <ol className="mt-4 grid grid-cols-7 gap-1 text-center" aria-label="The last seven days">
          {week.map((d) => (
            <li key={d.date.toISOString()} className="flex flex-col items-center gap-1.5">
              <span
                className={`size-7 rounded-full ${d.prayed ? "bg-primary" : "bg-secondary"} ${d.today ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
              />
              <span className="text-[0.8rem] text-muted-foreground">
                {d.date.toLocaleDateString("en-US", { weekday: "narrow" })}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Section title="Reading plans">
        <List>
          {PLANS.map((p) => {
            const done = progress[p.id]?.length ?? 0;
            const pct = Math.round((done / p.days.length) * 100);
            return (
              <Link
                key={p.id}
                to="/more/plans/$id"
                params={{ id: p.id }}
                className="block px-4 py-3"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-[0.95rem] text-muted-foreground">
                    {done > 0
                      ? `Day ${Math.min(done + 1, p.days.length)} of ${p.days.length}`
                      : `${p.days.length} days`}
                  </span>
                </span>
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-secondary">
                  <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                </span>
              </Link>
            );
          })}
        </List>
      </Section>

      <Section title="Yours">
        <List>
          <Link to="/plan" className="block">
            <Row
              icon={<ListChecks className="size-5" aria-hidden />}
              title="Plan of life"
              detail="The practices on your Today screen"
            />
          </Link>
          <Link to="/more/intentions" className="block">
            <Row
              icon={<HeartHandshake className="size-5" aria-hidden />}
              title="Prayer intentions"
            />
          </Link>
          <Link to="/more/saved" className="block">
            <Row
              icon={<Bookmark className="size-5" aria-hidden />}
              title="Saved verses"
              detail="Bookmarks, highlights and notes"
            />
          </Link>
          <Link to="/more/settings" className="block">
            <Row
              icon={<Settings2 className="size-5" aria-hidden />}
              title="Settings"
              detail="Theme, text size, Bible, reminder, calendar"
            />
          </Link>
        </List>
      </Section>
      <p className="mt-8 text-center text-[0.9rem] text-muted-foreground">
        Sinner's Cure works without internet. Scripture: Douay-Rheims and Catholic Public Domain
        Version, both public domain.
      </p>
    </Page>
  );
}
