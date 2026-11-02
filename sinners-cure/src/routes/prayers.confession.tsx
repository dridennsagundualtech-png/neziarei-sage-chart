import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Trash2 } from "lucide-react";
import { Btn, Page, PrayerText, Section } from "@/components/app-ui";
import { CONFESSION_STEPS, EXAMINATION } from "@/data/confession";
import { P } from "@/data/prayers";
import { useLocal } from "@/lib/storage";

export const Route = createFileRoute("/prayers/confession")({
  component: ConfessionPage,
});

function ConfessionPage() {
  const [checks, setChecks] = useLocal<Record<string, boolean>>("sc.confession", {});
  const count = Object.values(checks).filter(Boolean).length;

  return (
    <Page
      back={{ to: "/prayers", label: "Prayers" }}
      title="Going to Confession"
      subtitle="Whatever you have done, God is waiting to forgive you."
    >
      <p>
        In Confession, Christ himself forgives you through the priest. The priest can never reveal
        anything you tell him: this is the seal of confession (CCC 1467). Nervous or out of
        practice? Say so. The priest will help you.
      </p>

      <Section title="Mortal or venial?">
        <p>
          A sin is mortal when it is serious, you know it is serious, and you freely choose it (CCC
          1857). Mortal sins must be confessed before receiving Holy Communion. Venial sins are less
          serious; confessing them still helps you grow.
        </p>
        <Link
          to="/learn/$id"
          params={{ id: "sin" }}
          className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-primary"
        >
          Mortal and venial sin explained <ChevronRight className="size-5" aria-hidden />
        </Link>
      </Section>

      <Section title="How to confess">
        <ol className="space-y-3">
          {CONFESSION_STEPS.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="w-5 shrink-0 text-right font-serif text-[1.2rem] text-rubric">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Examination of conscience">
        <p className="text-muted-foreground">
          Go through the questions slowly. Tick what you want to remember to confess. Ticks stay on
          this phone only.
        </p>
        <div className="sticky top-0 z-10 -mx-4 mt-3 flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
          <p className="font-medium">{count === 0 ? "Nothing ticked" : `${count} ticked`}</p>
          <Btn
            variant="ghost"
            onClick={() => setChecks({})}
            disabled={count === 0}
            className="px-3"
          >
            <Trash2 className="size-5" aria-hidden /> Clear all
          </Btn>
        </div>
        <div className="mt-4 space-y-7">
          {EXAMINATION.map((sec) => (
            <div key={sec.title}>
              <h3 className="font-serif text-[1.25rem] font-semibold leading-snug">{sec.title}</h3>
              <ul className="mt-2">
                {sec.questions.map((q) => (
                  <li key={q.id}>
                    <label className="flex min-h-12 cursor-pointer items-start gap-3 py-1.5">
                      <input
                        type="checkbox"
                        className="mt-1 size-6 shrink-0 accent-primary"
                        checked={!!checks[q.id]}
                        onChange={(e) => setChecks((c) => ({ ...c, [q.id]: e.target.checked }))}
                      />
                      <span>{q.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Act of Contrition">
        <PrayerText text={P.actOfContrition} />
      </Section>

      <Section title="Afterwards">
        <p>
          Do your penance soon, thank God for his mercy, and clear your ticks. If you remember a
          mortal sin you forgot, it was forgiven with the others; mention it at your next confession
          (CCC 1456).
        </p>
      </Section>
    </Page>
  );
}
