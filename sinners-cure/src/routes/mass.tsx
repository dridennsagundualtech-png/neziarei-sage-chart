import { createFileRoute, Link, useHydrated, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { useState } from "react";
import { Btn, IconBtn, ListenButton, Page } from "@/components/app-ui";
import { VerseActions, VerseSpan } from "@/components/verse-actions";
import {
  TRANSLATIONS,
  refLabel,
  usePassage,
  useTranslation,
  type PassageVerse,
} from "@/data/bible";
import { getToday } from "@/lib/today";
import { dateKey } from "@/lib/liturgy";
import { markPath, useStreak } from "@/lib/streak";
import { shareText } from "@/lib/share";
import { useSettings } from "@/lib/settings";
import type { Reading } from "@/lib/mass-day";

export const Route = createFileRoute("/mass")({
  validateSearch: (s: Record<string, unknown>): { d?: string } =>
    typeof s["d"] === "string" && /^\d{4}-\d\d-\d\d$/.test(s["d"]) ? { d: s["d"] } : {},
  component: MassPage,
});

const parse = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y ?? 2000, (m ?? 1) - 1, d ?? 1);
};
const shift = (k: string, n: number) => {
  const d = parse(k);
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};

// Books whose verse numbers differ between the Latin Vulgate (Douay-Rheims) and modern lectionaries.
const RENUMBERED = new Set(["SIR", "TOB", "JDT", "EST"]);

function MassPage() {
  const hydrated = useHydrated();
  const { d } = Route.useSearch();
  const navigate = useNavigate();
  const { todayItems } = useStreak();
  const { settings } = useSettings();
  const [tr] = useTranslation();
  const [sel, setSel] = useState<{ key: string; text: string } | null>(null);
  if (!hydrated) return <Page title="Today's Mass">{null}</Page>;

  const todayKey = dateKey(new Date());
  const key = d ?? todayKey;
  const isToday = key === todayKey;
  const date = parse(key);
  const t = getToday(date, settings.calendar);
  const read = isToday && todayItems.includes("readings");
  const go = (k: string) =>
    void navigate({ to: "/mass", search: k === todayKey ? {} : { d: k }, replace: true });

  return (
    <Page
      back={{ to: "/", label: "Today" }}
      title={t.mass.title}
      subtitle={
        <>
          <p>
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {t.mass.subtitle ? ` · ${t.mass.subtitle}` : ""}
          </p>
          <p className="mt-1">
            {t.mass.rankLabel === "Weekday" || t.mass.rankLabel === "Sunday"
              ? t.season
              : `${t.mass.rankLabel} · ${t.season}`}{" "}
            · {t.colorName} · Year {t.mass.sundayCycle}
            {t.mass.season === "Ordinary Time" && date.getDay() !== 0
              ? `, ${t.mass.weekdayCycle === 1 ? "I" : "II"}`
              : ""}
          </p>
        </>
      }
    >
      <div className="-mt-2 mb-5 flex items-center gap-1">
        <IconBtn label="Previous day" onClick={() => go(shift(key, -1))} className="bg-secondary">
          <ChevronLeft className="size-5" aria-hidden />
        </IconBtn>
        <IconBtn label="Next day" onClick={() => go(shift(key, 1))} className="bg-secondary">
          <ChevronRight className="size-5" aria-hidden />
        </IconBtn>
        {!isToday && (
          <Btn variant="ghost" onClick={() => go(todayKey)} className="px-3">
            Back to today
          </Btn>
        )}
        <span className="flex-1" />
        <IconBtn
          label="Share"
          onClick={() =>
            shareText(
              `${t.mass.title}\n${t.dateLabel}\n\n${t.mass.about}\n\n${t.mass.readings.map((r) => `${r.label}: ${r.options[0]?.citation ?? ""}`).join("\n")}`,
            )
          }
        >
          <Share2 className="size-5" aria-hidden />
        </IconBtn>
      </div>

      <p className="text-[1.05rem]">{t.mass.about}</p>
      {t.mass.note && (
        <p className="mt-3 font-serif text-[1.1rem] italic text-rubric">{t.mass.note}</p>
      )}
      {t.mass.memorials
        .filter((m) => m.name !== t.mass.title)
        .map((m) => (
          <p key={m.name} className="mt-3 text-[0.98rem] text-muted-foreground">
            {m.label}: {m.name}
            {m.about ? `. ${m.about}` : ""}
          </p>
        ))}

      <p className="mt-6 text-[0.92rem] text-muted-foreground">
        Text: {TRANSLATIONS[tr].name}.{" "}
        <Link to="/more/settings" className="underline underline-offset-2">
          Change
        </Link>
      </p>

      <div className="mt-2 space-y-10">
        {t.mass.readings.map((r, i) => (
          <ReadingBlock
            key={`${key}-${i}`}
            reading={r}
            index={i}
            selected={sel?.key}
            onSelect={(v) => setSel(sel?.key === v.key ? null : v)}
          />
        ))}
      </div>

      {t.mass.readings.some((r) => r.kind === "gospel") && (
        <section className="mt-10 rounded-xl bg-secondary p-5">
          <h2 className="font-serif text-[1.35rem] font-semibold">Pray with the Gospel</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Read the Gospel again, slowly.</li>
            <li>
              Put yourself in the scene, as one more person there. Watch Jesus and listen to him.
            </li>
            <li>Ask him: Lord, what do you want me to do today?</li>
            <li>Choose one small thing to do before tonight.</li>
          </ol>
          <Link
            to="/learn/$id"
            params={{ id: "work" }}
            className="mt-3 inline-flex min-h-11 items-center gap-1 font-semibold text-primary"
          >
            Holiness in ordinary work <ChevronRight className="size-5" aria-hidden />
          </Link>
        </section>
      )}

      {isToday && t.mass.readings.length > 0 && (
        <Btn
          className="mt-8 w-full"
          variant={read ? "outline" : "primary"}
          onClick={() => markPath("readings")}
          disabled={read}
        >
          <Check className="size-5" aria-hidden />{" "}
          {read ? "Read today" : "I have read today's readings"}
        </Btn>
      )}

      {sel && (
        <VerseActions
          vkey={sel.key}
          label={refLabel(sel.key)}
          text={sel.text}
          onClose={() => setSel(null)}
        />
      )}
      {sel && <div className="h-64" aria-hidden />}
    </Page>
  );
}

const ENDINGS: Partial<Record<Reading["kind"], string>> = {
  first: "The word of the Lord. ℟. Thanks be to God.",
  second: "The word of the Lord. ℟. Thanks be to God.",
  gospel: "The Gospel of the Lord. ℟. Praise to you, Lord Jesus Christ.",
};

function ReadingBlock({
  reading,
  index,
  selected,
  onSelect,
}: {
  reading: Reading;
  index: number;
  selected: string | undefined;
  onSelect: (v: PassageVerse) => void;
}) {
  const [choice, setChoice] = useState(0);
  const option = reading.options[choice] ?? reading.options[0]!;
  const verses = usePassage(option.spans.length ? option.spans : undefined);
  const renumbered = option.spans.some((s) => RENUMBERED.has(s[0]));

  if (reading.kind === "sequence") {
    return (
      <section>
        <h2 className="rubric">Sequence</h2>
        <p className="mt-1 font-serif text-[1.3rem]">{option.citation}</p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="rubric">{reading.label}</h2>
          <h3 className="font-serif text-[1.45rem] font-semibold leading-tight">
            {option.citation}
          </h3>
        </div>
        {verses && verses.length > 0 && (
          <ListenButton
            id={`mass-${index}-${choice}`}
            text={`${reading.label}. ${option.citation}. ${verses.map((v) => v.text).join(" ")}`}
            className="shrink-0"
          />
        )}
      </div>
      {reading.options.length > 1 && (
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="radiogroup"
          aria-label={`${reading.label} options`}
        >
          {reading.options.map((o, i) => (
            <button
              key={o.citation}
              type="button"
              role="radio"
              aria-checked={i === choice}
              onClick={() => setChoice(i)}
              className={`min-h-10 rounded-full px-3 text-[0.95rem] font-medium ${i === choice ? "bg-foreground text-background" : "bg-secondary"}`}
            >
              {o.note === "shorter"
                ? "Shorter form"
                : i === 0 && reading.options[1]?.note === "shorter"
                  ? "Full reading"
                  : o.citation}
            </button>
          ))}
        </div>
      )}
      {renumbered && (
        <p className="mt-2 text-[0.92rem] text-muted-foreground">
          This book is numbered differently in Bibles translated from the Latin, so the passage may
          start or end a verse or two away.
        </p>
      )}
      <div className="scripture mt-3">
        {verses === undefined && <p className="text-muted-foreground">Opening the Bible…</p>}
        {verses?.length === 0 && (
          <p className="text-muted-foreground">This passage isn't in the bundled Bible.</p>
        )}
        {verses?.map((v) => (
          <VerseSpan
            key={v.key}
            vkey={v.key}
            n={v.v}
            text={v.text}
            selected={selected === v.key}
            onSelect={() => onSelect(v)}
          />
        ))}
      </div>
      {ENDINGS[reading.kind] && verses && verses.length > 0 && (
        <p className="mt-3 font-serif text-[1.1rem] italic text-rubric">{ENDINGS[reading.kind]}</p>
      )}
    </section>
  );
}
