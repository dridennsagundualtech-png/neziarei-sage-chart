import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Page } from "@/components/app-ui";
import { PRAYERS } from "@/data/prayers";

export const Route = createFileRoute("/prayers/")({
  head: () => ({
    meta: [
      { title: "Prayers — Sinner's Cure" },
      { name: "description", content: "Divine Mercy Chaplet, Angelus, Memorare, daily prayers and a Confession guide." },
      { property: "og:title", content: "Prayers — Sinner's Cure" },
      { property: "og:description", content: "Divine Mercy Chaplet, Angelus, Memorare, daily prayers and a Confession guide." },
    ],
  }),
  component: PrayersPage,
});

const row = "flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-lg";

function PrayersPage() {
  const groups = [...new Set(PRAYERS.filter((p) => p.listed).map((p) => p.group ?? "Other"))];
  return (
    <Page title="Prayers">
      <div className="card-surface mb-6 divide-y overflow-hidden">
        <Link to="/prayers/chaplet" className={row}>
          <span>
            <span className="block font-semibold">Divine Mercy Chaplet</span>
            <span className="text-base text-muted-foreground">Pray on the beads, step by step</span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        <Link to="/prayers/confession" className={row}>
          <span>
            <span className="block font-semibold">Confession Guide</span>
            <span className="text-base text-muted-foreground">Examination of conscience</span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      </div>
      {groups.map((g) => (
        <section key={g} className="mb-6">
          <h2 className="eyebrow mb-2 px-1">{g}</h2>
          <div className="card-surface divide-y overflow-hidden">
            {PRAYERS.filter((p) => p.listed && (p.group ?? "Other") === g).map((p) => (
              <Link key={p.id} to="/prayers/$id" params={{ id: p.id }} className={row}>
                {p.title}
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}
