import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Btn, Page } from "@/components/app-ui";
import { bookById } from "@/data/books";
import { planById, type PlanReading } from "@/data/plans";
import { usePlanProgress } from "@/lib/plans-store";

export const Route = createFileRoute("/more/plans/$id")({
  loader: ({ params }) => {
    const plan = planById(params.id);
    if (!plan) throw notFound();
    return { id: plan.id, name: plan.name, description: plan.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Reading plan"} — Sinner's Cure` },
      { name: "description", content: loaderData?.description ?? "A Bible reading plan." },
      { property: "og:title", content: `${loaderData?.name ?? "Reading plan"} — Sinner's Cure` },
      { property: "og:description", content: loaderData?.description ?? "A Bible reading plan." },
    ],
  }),
  component: PlanPage,
});

function label(rs: PlanReading[]) {
  const parts: string[] = [];
  let i = 0;
  while (i < rs.length) {
    let j = i;
    const a = rs[i]!;
    while (j + 1 < rs.length && rs[j + 1]!.book === a.book && rs[j + 1]!.chapter === rs[j]!.chapter + 1) j++;
    const name = bookById(a.book)?.name ?? a.book;
    parts.push(j > i ? `${name} ${a.chapter}–${rs[j]!.chapter}` : `${name} ${a.chapter}`);
    i = j + 1;
  }
  return parts.join(", ");
}

function PlanPage() {
  const { id } = Route.useLoaderData();
  const plan = planById(id)!;
  const [progress, setProgress] = usePlanProgress();
  const done = new Set(progress[id] ?? []);
  const nextDay = plan.days.findIndex((_, i) => !done.has(i));
  const nextRs = nextDay >= 0 ? plan.days[nextDay]! : [];
  const first = nextRs[0];
  const toggle = (i: number) =>
    setProgress((p) => {
      const cur = new Set(p[id] ?? []);
      if (cur.has(i)) cur.delete(i);
      else cur.add(i);
      return { ...p, [id]: [...cur].sort((a, b) => a - b) };
    });

  return (
    <Page eyebrow={`${done.size} of ${plan.days.length} days`} title={plan.name}>
      <Link to="/more" className="-mt-2 mb-4 inline-flex min-h-11 items-center gap-1 text-primary">
        <ChevronLeft className="size-5" /> More
      </Link>
      {nextDay >= 0 && first && (
        <div className="card-surface mb-4 p-5">
          <p className="eyebrow">Next · Day {nextDay + 1}</p>
          <p className="mt-1 font-serif text-xl font-semibold">{label(nextRs)}</p>
          <div className="mt-4 flex gap-3">
            <Link
              to="/bible"
              search={{ book: first.book, ch: first.chapter }}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground"
            >
              Read
            </Link>
            <Btn variant="outline" onClick={() => toggle(nextDay)}>
              Mark done
            </Btn>
          </div>
        </div>
      )}
      <ul className="card-surface divide-y overflow-hidden">
        {plan.days.map((rs, i) => (
          <li key={i}>
            <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2">
              <input type="checkbox" className="size-6 shrink-0 accent-primary" checked={done.has(i)} onChange={() => toggle(i)} />
              <span className="w-16 shrink-0 text-muted-foreground">Day {i + 1}</span>
              <span className={done.has(i) ? "text-muted-foreground line-through" : ""}>{label(rs)}</span>
            </label>
          </li>
        ))}
      </ul>
    </Page>
  );
}
