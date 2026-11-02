import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { BookOpen, Check, ChevronRight, CircleDot, Copy, Flame, HandHeart, Share2 } from "lucide-react";
import { Btn, Card, ListenButton, Page, btnClass } from "@/components/app-ui";
import { getToday } from "@/lib/today";
import { copyText, shareText } from "@/lib/share";
import { encouragement, goalMet, markPath, useStreak, type PathItem } from "@/lib/streak";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Sinner's Cure" },
      { name: "description", content: "Today's Mass, the Church season, a daily verse, and a simple daily path of Scripture and prayer." },
      { property: "og:title", content: "Today — Sinner's Cure" },
      { property: "og:description", content: "Today's Mass, the Church season, a daily verse, and a simple daily path of Scripture and prayer." },
    ],
  }),
  component: TodayPage,
});

const DOT: Record<string, string> = {
  green: "bg-lit-green",
  violet: "bg-lit-violet",
  white: "bg-lit-white",
  red: "bg-lit-red",
  rose: "bg-lit-rose",
};

function TodayPage() {
  const hydrated = useHydrated();
  const { streak, prayedToday, todayItems } = useStreak();
  const { settings } = useSettings();
  if (!hydrated) return <Page title="Today">{null}</Page>;
  const t = getToday(new Date());
  const verseText = `"${t.verse.text}" — ${t.verse.ref}`;
  const met = goalMet(todayItems, settings.goal);

  const steps: { item: PathItem; title: string; detail: string; to: "/mass" | "/rosary" | "/prayers"; icon: typeof BookOpen }[] = [
    { item: "readings", title: "Hear the Word", detail: t.mass.readings.length ? `Today's readings · ${t.mass.readings.find((r) => r.label === "Gospel")?.citation ?? ""}` : "Read today's Gospel", to: "/mass", icon: BookOpen },
    { item: "rosary", title: "Pray the Rosary", detail: t.mysteries.name, to: "/rosary", icon: CircleDot },
    { item: "prayer", title: "A moment of prayer", detail: "Angelus, Chaplet or a prayer of your choice", to: "/prayers", icon: HandHeart },
  ];

  return (
    <Page eyebrow={t.dateLabel} title="Today">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 font-medium">
          <span className={`size-3.5 rounded-full border border-foreground/20 ${DOT[t.color]}`} aria-hidden />
          {t.season} · {t.colorName}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 font-medium">
          <Flame className="size-4 text-primary" aria-hidden /> {streak} day{streak === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-4">
        <section className="card-surface border-primary/40 p-6">
          <p className="eyebrow">{t.verseFromMass ? "Verse of the day · from today's Mass" : "Verse of the day"}</p>
          <blockquote className="mt-3 font-serif text-[1.6rem] leading-snug">“{t.verse.text}”</blockquote>
          <p className="mt-3 font-semibold text-primary">{t.verse.ref}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ListenButton id="verse" text={`${t.verse.text} ${t.verse.ref}`} />
            <Btn variant="outline" onClick={() => copyText(verseText)} aria-label="Copy verse">
              <Copy className="size-5" />
            </Btn>
            <Btn variant="outline" onClick={() => shareText(verseText)} aria-label="Share verse">
              <Share2 className="size-5" />
            </Btn>
          </div>
        </section>

        <Card>
          <div className="flex items-baseline justify-between gap-2">
            <p className="eyebrow">Today's path</p>
            <p className="text-sm text-muted-foreground">{settings.goal === "full" ? "Goal: readings + Rosary" : "Goal: any one step"}</p>
          </div>
          <ol className="mt-3 space-y-2">
            {steps.map((s) => {
              const done = todayItems.includes(s.item);
              const Icon = s.icon;
              return (
                <li key={s.item}>
                  <Link to={s.to} className="flex min-h-16 items-center gap-3 rounded-xl border bg-background px-3 py-2">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {done ? <Check className="size-5" aria-label="Done" /> : <Icon className="size-5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{s.title}</span>
                      <span className="block truncate text-muted-foreground">{s.detail}</span>
                    </span>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className="mt-4">{met || prayedToday ? encouragement(streak, true) : encouragement(streak, false)}</p>
          {!todayItems.includes("prayer") && (
            <Btn variant="outline" className="mt-3 w-full" onClick={() => markPath("prayer")}>
              I prayed today
            </Btn>
          )}
        </Card>

        <Card>
          <p className="eyebrow">Today's Mass</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold leading-snug">{t.mass.celebration}</h2>
          <p className="mt-3">{t.mass.summary}</p>
          {t.mass.readings.length > 0 && (
            <dl className="mt-4 divide-y border-t">
              {t.mass.readings.map((r) => (
                <div key={r.label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted-foreground">{r.label}</dt>
                  <dd className="text-right font-medium">{r.citation}</dd>
                </div>
              ))}
            </dl>
          )}
          {t.mass.available && (
            <Link to="/mass" className={btnClass("primary", "mt-4 w-full")}>
              Read & listen
            </Link>
          )}
        </Card>
      </div>
    </Page>
  );
}
