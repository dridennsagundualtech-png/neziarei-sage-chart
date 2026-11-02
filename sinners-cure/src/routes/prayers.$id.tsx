import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, ChevronLeft, Copy } from "lucide-react";
import { Btn, ListenButton, Page, PrayerText } from "@/components/app-ui";
import { markPath, useStreak } from "@/lib/streak";
import { prayerById } from "@/data/prayers";
import { copyText } from "@/lib/share";

export const Route = createFileRoute("/prayers/$id")({
  loader: ({ params }) => {
    const prayer = prayerById(params.id);
    if (!prayer) throw notFound();
    return prayer;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Prayer"} — Sinner's Cure` },
      { name: "description", content: `The full text of the ${loaderData?.title ?? "prayer"}.` },
      { property: "og:title", content: `${loaderData?.title ?? "Prayer"} — Sinner's Cure` },
      { property: "og:description", content: `The full text of the ${loaderData?.title ?? "prayer"}.` },
    ],
  }),
  component: PrayerPage,
});

function PrayerPage() {
  const p = Route.useLoaderData();
  const { todayItems } = useStreak();
  const prayed = todayItems.includes("prayer");
  return (
    <Page title={p.title}>
      <Link to="/prayers" className="-mt-2 mb-4 inline-flex min-h-11 items-center gap-1 text-primary">
        <ChevronLeft className="size-5" /> All prayers
      </Link>
      <article className="card-surface p-5">
        <PrayerText text={p.text} />
      </article>
      <div className="mt-4 flex flex-wrap gap-3">
        <Btn onClick={() => markPath("prayer")} disabled={prayed}>
          <Check className="size-5" /> {prayed ? "Prayed today" : "Amen"}
        </Btn>
        <ListenButton id={`prayer-${p.id}`} text={`${p.title}. ${p.text}`} />
        <Btn variant="outline" onClick={() => copyText(`${p.title}\n\n${p.text}`)} aria-label="Copy">
          <Copy className="size-5" />
        </Btn>
      </div>
    </Page>
  );
}
