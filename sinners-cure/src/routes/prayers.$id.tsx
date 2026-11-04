import { createFileRoute, notFound } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { Btn, IconBtn, ListenButton, Page, PrayerText } from "@/components/app-ui";
import { markPath, useStreak, type PathItem } from "@/lib/streak";
import { prayerById } from "@/data/prayers";
import { copyText } from "@/lib/share";
import { t } from "@/lib/lang";
import { prayerReading } from "@/lib/read-along";

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
  const rid = `prayer-${p.id}`;
  const reading = prayerReading([`${p.title}.`], p.text);
  return (
    <Page back={{ label: t("Back", "Bumalik") }} title={p.title}>
      <PrayerText text={p.text} read={{ rid, at: reading.at }} />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Btn onClick={() => markPath(item)} disabled={prayed}>
          <Check className="size-5" aria-hidden />{" "}
          {prayed ? t("Prayed today", "Nadasal na ngayon") : "Amen"}
        </Btn>
        <ListenButton id={rid} text={reading.text} />
        <IconBtn
          label={t("Copy prayer", "Kopyahin ang dasal")}
          onClick={() => copyText(`${p.title}\n\n${p.text}`)}
        >
          <Copy className="size-5" aria-hidden />
        </IconBtn>
      </div>
    </Page>
  );
}
