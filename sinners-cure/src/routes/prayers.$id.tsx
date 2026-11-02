import { createFileRoute, notFound } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { Btn, IconBtn, ListenButton, Page, PrayerText } from "@/components/app-ui";
import { markPath, useStreak, type PathItem } from "@/lib/streak";
import { prayerById } from "@/data/prayers";
import { copyText } from "@/lib/share";

export const Route = createFileRoute("/prayers/$id")({
  loader: ({ params }) => {
    const prayer = prayerById(params.id);
    if (!prayer) throw notFound();
    return prayer;
  },
  component: PrayerPage,
});

/** Which plan-of-life practice a prayer counts for. */
const COUNTS_FOR: Record<string, PathItem> = {
  angelus: "angelus",
  "regina-caeli": "angelus",
  morning: "offering",
  "before-prayer": "prayer",
};

function PrayerPage() {
  const p = Route.useLoaderData();
  const { todayItems } = useStreak();
  const item = COUNTS_FOR[p.id] ?? "aspirations";
  const prayed = todayItems.includes(item);
  return (
    <Page back={{ label: "Back" }} title={p.title}>
      <PrayerText text={p.text} />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Btn onClick={() => markPath(item)} disabled={prayed}>
          <Check className="size-5" aria-hidden /> {prayed ? "Prayed today" : "Amen"}
        </Btn>
        <ListenButton
          id={`prayer-${p.id}`}
          text={`${p.title}. ${p.text.replace(/\([^)]*\)/g, "")}`}
        />
        <IconBtn label="Copy prayer" onClick={() => copyText(`${p.title}\n\n${p.text}`)}>
          <Copy className="size-5" aria-hidden />
        </IconBtn>
      </div>
    </Page>
  );
}
