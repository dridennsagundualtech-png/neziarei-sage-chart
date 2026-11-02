import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { BellRing, Check, ChevronRight, Copy, Share2 } from "lucide-react";
import { Btn, IconBtn, ListenButton, Page, Section, btnClass } from "@/components/app-ui";
import { getToday } from "@/lib/today";
import { copyText, shareText } from "@/lib/share";
import { encouragement, lastWeek, togglePath, useStreak } from "@/lib/streak";
import { useSettings } from "@/lib/settings";
import { usePassage } from "@/data/bible";
import { practiceById } from "@/data/practices";
import { useLocal } from "@/lib/storage";
import { isNative, scheduleReminders } from "@/lib/native";
import type { PassageSpan } from "@/data/bible";

export const Route = createFileRoute("/")({
  component: TodayPage,
});

const DOT: Record<string, string> = {
  green: "bg-lit-green",
  violet: "bg-lit-violet",
  white: "bg-lit-white",
  red: "bg-lit-red",
  rose: "bg-lit-rose",
};

function verseSpan(key: string): PassageSpan {
  const [book = "", ch = "1", vs = "1"] = key.split(".");
  const [a = "1", b] = vs.split("-");
  return [book, Number(ch), Number(a), Number(ch), Number(b ?? a)];
}

function TodayPage() {
  const hydrated = useHydrated();
  const { settings } = useSettings();
  if (!hydrated) return <Page title="">{null}</Page>;
  const t = getToday(new Date(), settings.calendar);
  return (
    <Page
      ribbon
      title={t.mass.title}
      subtitle={
        <>
          <p>
            {t.dateLabel}
            {t.mass.subtitle ? ` · ${t.mass.subtitle}` : ""}
          </p>
          <p className="mt-1 flex items-center gap-2">
            <span className={`inline-block size-3 rounded-full ${DOT[t.color]}`} aria-hidden />
            {t.mass.rankLabel === "Weekday" || t.mass.rankLabel === "Sunday"
              ? t.season
              : `${t.mass.rankLabel} · ${t.season}`}{" "}
            · {t.colorName}
          </p>
        </>
      }
    >
      {t.notes.length > 0 && (
        <ul className="-mt-2 mb-2 space-y-1">
          {t.notes.map((n) => (
            <li key={n} className="font-serif text-[1.1rem] italic text-rubric">
              {n}
            </li>
          ))}
        </ul>
      )}

      <VerseOfTheDay t={t} />
      <TodayMass t={t} />
      <TodayRosary t={t} />
      <PlanOfLife />
      <ReminderPrompt />
    </Page>
  );
}

type T = ReturnType<typeof getToday>;

function VerseOfTheDay({ t }: { t: T }) {
  const verses = usePassage([verseSpan(t.verse.key)]);
  const text = verses?.length ? verses.map((v) => v.text).join(" ") : t.verse.text;
  const quote = `“${text}” ${t.verse.ref}`;
  return (
    <section className="card-surface mt-6 p-5">
      <h2 className="rubric">Verse of the day</h2>
      <blockquote className="mt-2 font-serif text-[1.55rem] leading-snug">“{text}”</blockquote>
      <p className="mt-2 font-semibold text-primary">{t.verse.ref}</p>
      <p className="mt-4 border-t pt-3 text-[1rem]">
        <span className="font-semibold">Living it today: </span>
        {t.verse.apply}
      </p>
      <div className="-mb-2 mt-2 flex items-center gap-1">
        <ListenButton id="verse" text={`${text} ${t.verse.ref}`} />
        <span className="flex-1" />
        <IconBtn label="Copy verse" onClick={() => copyText(quote)}>
          <Copy className="size-5" aria-hidden />
        </IconBtn>
        <IconBtn label="Share verse" onClick={() => shareText(`${quote}\n\n${t.verse.apply}`)}>
          <Share2 className="size-5" aria-hidden />
        </IconBtn>
      </div>
    </section>
  );
}

function GospelOpening({ spans }: { spans: PassageSpan[] }) {
  const verses = usePassage(spans.slice(0, 1));
  const first = verses?.[0]?.text;
  if (!first) return null;
  return <p className="scripture mt-3 line-clamp-3 italic text-muted-foreground">“{first}”</p>;
}

function TodayMass({ t }: { t: T }) {
  const gospel = t.mass.readings.find((r) => r.kind === "gospel");
  return (
    <Section title="Today's Mass">
      <p>{t.mass.about}</p>
      {t.mass.memorials.length > 0 && (
        <ul className="mt-3 space-y-1 text-[0.98rem] text-muted-foreground">
          {t.mass.memorials
            .filter((m) => m.name !== t.mass.title)
            .map((m) => (
              <li key={m.name}>
                {m.label}: {m.name}
              </li>
            ))}
        </ul>
      )}
      {gospel?.options[0] && <GospelOpening spans={gospel.options[0].spans} />}
      {t.mass.readings.length > 0 && (
        <dl className="mt-4 divide-y border-y">
          {t.mass.readings
            .filter((r) => r.kind !== "sequence")
            .map((r, i) => (
              <div key={i} className="flex justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-muted-foreground">
                  {r.label.replace("Responsorial ", "")}
                </dt>
                <dd className="text-right font-medium">{r.options[0]?.citation}</dd>
              </div>
            ))}
        </dl>
      )}
      <Link to="/mass" className={btnClass("primary", "mt-4 w-full")}>
        Read today's readings
      </Link>
    </Section>
  );
}

function TodayRosary({ t }: { t: T }) {
  return (
    <Section
      title="Today's Rosary"
      aside={
        <Link to="/rosary" className="inline-flex min-h-11 items-center font-semibold text-primary">
          Pray <ChevronRight className="size-5" aria-hidden />
        </Link>
      }
    >
      <p className="text-muted-foreground">
        The {t.mysteries.name}, prayed on {t.mysteries.days.replace(" & ", " and ")}
      </p>
      <ol className="mt-3 space-y-1.5">
        {t.mysteries.mysteries.map((m, i) => (
          <li key={m.title} className="flex gap-3">
            <span className="w-5 shrink-0 text-right font-serif text-[1.1rem] text-rubric">
              {i + 1}
            </span>
            <span className="font-serif text-[1.18rem] leading-snug">{m.title}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function PlanOfLife() {
  const { settings } = useSettings();
  const { streak, days, prayedToday, todayItems } = useStreak();
  const week = lastWeek(days);
  const [resolution] = useLocal<{ date: string; text: string } | null>("sc.resolution", null);
  return (
    <Section
      title="Plan of life"
      aside={
        <Link to="/plan" className="inline-flex min-h-11 items-center text-muted-foreground">
          Edit <ChevronRight className="size-5" aria-hidden />
        </Link>
      }
    >
      {resolution?.text && (
        <p className="mb-3 rounded-xl bg-secondary px-4 py-3">
          <span className="font-semibold">Your resolution: </span>
          {resolution.text}
        </p>
      )}
      <ul className="card-surface divide-y overflow-hidden">
        {settings.plan.map((id) => {
          const p = practiceById(id);
          if (!p) return null;
          const done = todayItems.includes(id);
          return (
            <li key={id} className="flex items-stretch">
              <button
                type="button"
                onClick={() => togglePath(id)}
                aria-pressed={done}
                aria-label={`${p.title}: ${done ? "done" : "not done"}`}
                className="flex w-16 shrink-0 items-center justify-center"
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-full border-2 transition-colors ${done ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
                >
                  {done && <Check className="size-5" aria-hidden />}
                </span>
              </button>
              {p.to ? (
                <a
                  href={`#${p.to}`}
                  className="flex min-h-16 min-w-0 flex-1 items-center gap-2 py-2.5 pr-4"
                >
                  <PlanText title={p.title} when={p.when} done={done} />
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </a>
              ) : (
                <div className="flex min-h-16 min-w-0 flex-1 items-center py-2.5 pr-4">
                  <PlanText title={p.title} when={p.when} done={done} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-[0.98rem]">{encouragement(streak, prayedToday)}</p>
        <ol
          className="flex shrink-0 gap-1.5"
          aria-label={`Days of prayer this week: ${week.filter((d) => d.prayed).length} of 7`}
        >
          {week.map((d) => (
            <li
              key={d.date.toISOString()}
              title={d.date.toLocaleDateString("en-US", { weekday: "long" })}
              className={`size-3 rounded-full ${d.prayed ? "bg-primary" : "bg-input"} ${d.today ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
            />
          ))}
        </ol>
      </div>
    </Section>
  );
}

function PlanText({ title, when, done }: { title: string; when: string; done: boolean }) {
  return (
    <span className="min-w-0 flex-1">
      <span
        className={`block font-semibold ${done ? "text-muted-foreground line-through decoration-1" : ""}`}
      >
        {title}
      </span>
      <span className="block text-[0.92rem] text-muted-foreground">{when}</span>
    </span>
  );
}

function ReminderPrompt() {
  const { settings, update } = useSettings();
  const [dismissed, setDismissed] = useLocal<boolean>("sc.reminderPrompt", false);
  if (!isNative() || settings.reminder || dismissed) return null;
  return (
    <section className="mt-9 flex gap-4 rounded-xl bg-secondary p-4">
      <BellRing className="mt-1 size-6 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-semibold">A morning reminder?</p>
        <p className="mt-1 text-[0.98rem] text-muted-foreground">
          Each morning at 7:00: what today's Mass is about and the verse of the day. Change the time
          in Settings.
        </p>
        <div className="mt-3 flex gap-2">
          <Btn
            onClick={() => {
              update({ reminder: "07:00" });
              setTimeout(() => void scheduleReminders(true), 0);
            }}
          >
            Turn on
          </Btn>
          <Btn variant="ghost" onClick={() => setDismissed(true)}>
            No thanks
          </Btn>
        </div>
      </div>
    </section>
  );
}
