import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronLeft, Share2 } from "lucide-react";
import { useState } from "react";
import { Btn, Card, ListenButton, Page, PrayerText } from "@/components/app-ui";
import { VerseActions, VerseSpan } from "@/components/verse-actions";
import { getMassReadings } from "@/data/mass";
import { refLabel } from "@/data/bible";
import { getToday } from "@/lib/today";
import { markPath, useStreak } from "@/lib/streak";
import { shareText } from "@/lib/share";

export const Route = createFileRoute("/mass")({
  head: () => ({
    meta: [
      { title: "Today's Mass Readings — Sinner's Cure" },
      { name: "description", content: "Read and listen to the full text of today's Mass readings, with highlights and private notes." },
      { property: "og:title", content: "Today's Mass Readings — Sinner's Cure" },
      { property: "og:description", content: "Read and listen to the full text of today's Mass readings, with highlights and private notes." },
    ],
  }),
  component: MassPage,
});

function MassPage() {
  const hydrated = useHydrated();
  const { todayItems } = useStreak();
  const [sel, setSel] = useState<{ key: string; text: string } | null>(null);
  const [deeper, setDeeper] = useState(false);
  if (!hydrated) return <Page title="Today's Mass">{null}</Page>;

  const t = getToday(new Date());
  const readings = getMassReadings(t.key);
  const read = todayItems.includes("readings");
  const allText = readings
    .filter((r) => r.verses.length)
    .map((r) => `${r.label}. ${r.citation}. ${r.verses.map((v) => v.text).join(" ")}${r.label === "Gospel" ? " The Gospel of the Lord." : " The word of the Lord."}`)
    .join(" ");

  return (
    <Page eyebrow={t.dateLabel} title="Today's Mass">
      <Link to="/" className="-mt-2 mb-4 inline-flex min-h-11 items-center gap-1 text-primary">
        <ChevronLeft className="size-5" /> Today
      </Link>

      <Card className="mb-4">
        <p className="eyebrow">{t.season}</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold leading-snug">{t.mass.celebration}</h2>
        <p className="mt-3">{t.mass.summary}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {allText && <ListenButton id="mass-all" text={allText} label="Listen to all" />}
          <Btn variant="outline" onClick={() => shareText(`${t.mass.celebration}\n\n${t.mass.summary}\n\n${t.mass.readings.map((r) => `${r.label}: ${r.citation}`).join("\n")}\n\n— Sinner's Cure`)}>
            <Share2 className="size-5" /> Share
          </Btn>
        </div>
      </Card>

      {readings.length === 0 && (
        <Card>
          <p>The readings for today are not in the app yet.</p>
        </Card>
      )}

      <div className="space-y-4">
        {readings.map((r, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{r.label}</p>
                <h3 className="font-serif text-xl font-semibold text-primary">{r.citation}</h3>
              </div>
              {r.verses.length > 0 && <ListenButton id={`mass-${i}`} text={`${r.label}. ${r.citation}. ${r.verses.map((v) => v.text).join(" ")}`} />}
            </div>
            {r.verses.length ? (
              <div className="scripture mt-3">
                {r.verses.map((v) => (
                  <VerseSpan key={v.key} vkey={v.key} n={v.v} text={v.text} selected={sel?.key === v.key} onSelect={() => setSel(sel?.key === v.key ? null : v)} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-muted-foreground">The text of this reading is not in the sample yet.</p>
            )}
            {r.verses.length > 0 && (
              <p className="mt-3 italic text-muted-foreground">
                {r.label === "Gospel" ? "The Gospel of the Lord. — Praise to you, Lord Jesus Christ." : r.label === "Psalm" ? "" : "The word of the Lord. — Thanks be to God."}
              </p>
            )}
          </Card>
        ))}

        {t.mass.deeper && (
          <Card>
            <button className="flex min-h-11 w-full items-center justify-between text-left" onClick={() => setDeeper(!deeper)} aria-expanded={deeper}>
              <span className="font-serif text-xl font-semibold">A deeper look</span>
              <ChevronDown className={`size-5 transition-transform ${deeper ? "rotate-180" : ""}`} />
            </button>
            {deeper && (
              <div className="mt-3">
                <PrayerText text={t.mass.deeper} />
              </div>
            )}
          </Card>
        )}

        {readings.length > 0 && (
          <Btn className="w-full" variant={read ? "outline" : "primary"} onClick={() => markPath("readings")} disabled={read}>
            <Check className="size-5" /> {read ? "Readings prayed today" : "I have read today's readings"}
          </Btn>
        )}
      </div>

      {sel && <VerseActions vkey={sel.key} label={refLabel(sel.key)} text={sel.text} onClose={() => setSel(null)} />}
      {sel && <div className="h-56" aria-hidden />}
    </Page>
  );
}
