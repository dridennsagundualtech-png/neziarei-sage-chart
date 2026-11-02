import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, HeartHandshake, Info, ListChecks, Settings2 } from "lucide-react";
import { List, Page, Row, Section } from "@/components/app-ui";
import { PLANS } from "@/data/plans";
import { usePlanProgress } from "@/lib/plans-store";
import { lastWeek, useStreak } from "@/lib/streak";
import { LOCALE, t } from "@/lib/lang";

export const Route = createFileRoute("/more/")({
  component: MorePage,
});

function MorePage() {
  const { streak, days, best } = useStreak();
  const [progress] = usePlanProgress();
  const week = lastWeek(days);

  return (
    <Page title={t("More", "Iba pa")}>
      <section className="card-surface p-5">
        {days.length === 0 ? (
          <>
            <h2 className="font-serif text-[1.5rem] font-semibold">
              {t("Days of prayer", "Mga araw ng pananalangin")}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t(
                "Each day you keep your plan of life, a mark fills in here.",
                "Sa bawat araw na tinutupad mo ang iyong plano ng buhay, may markang mapupuno rito.",
              )}
            </p>
          </>
        ) : (
          <>
            <p className="font-serif text-[2.4rem] font-semibold leading-none">{streak}</p>
            <p className="mt-1 text-muted-foreground">
              {t(
                `day${streak === 1 ? "" : "s"} of prayer in a row · best ${best} · ${days.length} in all`,
                `araw ng pananalangin na sunod-sunod · pinakamahaba ${best} · ${days.length} lahat`,
              )}
            </p>
          </>
        )}
        <ol
          className="mt-4 grid grid-cols-7 gap-1 text-center"
          aria-label={t("The last seven days", "Ang huling pitong araw")}
        >
          {week.map((d) => (
            <li key={d.date.toISOString()} className="flex flex-col items-center gap-1.5">
              <span
                className={`size-7 rounded-full ${d.prayed ? "bg-primary" : "bg-secondary"} ${d.today ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
              />
              <span className="text-[0.8rem] text-muted-foreground">
                {d.date.toLocaleDateString(LOCALE, { weekday: "narrow" })}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <Section title={t("Reading plans", "Mga plano sa pagbasa")}>
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
                      ? t(
                          `Day ${Math.min(done + 1, p.days.length)} of ${p.days.length}`,
                          `Araw ${Math.min(done + 1, p.days.length)} sa ${p.days.length}`,
                        )
                      : t(`${p.days.length} days`, `${p.days.length} araw`)}
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

      <Section title={t("Yours", "Iyo")}>
        <List>
          <Link to="/plan" className="block">
            <Row
              icon={<ListChecks className="size-5" aria-hidden />}
              title={t("Plan of life", "Plano ng buhay")}
              detail={t(
                "The practices on your Today screen",
                "Ang mga gawain sa iyong Ngayon na screen",
              )}
            />
          </Link>
          <Link to="/more/intentions" className="block">
            <Row
              icon={<HeartHandshake className="size-5" aria-hidden />}
              title={t("Prayer intentions", "Mga intensyon sa dasal")}
            />
          </Link>
          <Link to="/more/saved" className="block">
            <Row
              icon={<Bookmark className="size-5" aria-hidden />}
              title={t("Saved verses", "Mga naka-save na talata")}
              detail={t("Bookmarks, highlights and notes", "Mga bookmark, highlight at tala")}
            />
          </Link>
          <Link to="/more/settings" className="block">
            <Row
              icon={<Settings2 className="size-5" aria-hidden />}
              title={t("Settings", "Mga Setting")}
              detail={t(
                "Language, voice, theme, text size, Bible, reminder, calendar",
                "Wika, boses, tema, laki ng teksto, Bibliya, paalala, kalendaryo",
              )}
            />
          </Link>
        </List>
      </Section>

      <List className="mt-6">
        <Link to="/more/about" className="block">
          <Row
            icon={<Info className="size-5" aria-hidden />}
            title={t("About", "Tungkol")}
            detail={t("Why I made Sinner's Cure", "Bakit ko ginawa ang Sinner's Cure")}
          />
        </Link>
      </List>
      <p className="mt-8 text-center text-[0.9rem] text-muted-foreground">
        {t(
          "Sinner's Cure works without internet. Scripture: Douay-Rheims and Catholic Public Domain Version, both public domain.",
          "Gumagana ang Sinner's Cure kahit walang internet. Kasulatan: Douay-Rheims at Catholic Public Domain Version, kapwa nasa pampublikong domain.",
        )}
      </p>
    </Page>
  );
}
