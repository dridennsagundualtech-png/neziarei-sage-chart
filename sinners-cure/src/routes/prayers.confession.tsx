import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Btn, Card, Page, PrayerText } from "@/components/app-ui";
import { CONFESSION_STEPS, EXAMINATION } from "@/data/confession";
import { P } from "@/data/prayers";
import { useLocal } from "@/lib/storage";

export const Route = createFileRoute("/prayers/confession")({
  head: () => ({
    meta: [
      { title: "Confession Guide — Sinner's Cure" },
      { name: "description", content: "How to go to Confession, with an examination of conscience you can check off privately." },
      { property: "og:title", content: "Confession Guide — Sinner's Cure" },
      { property: "og:description", content: "How to go to Confession, with an examination of conscience you can check off privately." },
    ],
  }),
  component: ConfessionPage,
});

function ConfessionPage() {
  const [checks, setChecks] = useLocal<Record<string, boolean>>("sc.confession", {});
  const count = Object.values(checks).filter(Boolean).length;

  return (
    <Page title="Confession Guide">
      <Link to="/prayers" className="-mt-2 mb-4 inline-flex min-h-11 items-center gap-1 text-primary">
        <ChevronLeft className="size-5" /> All prayers
      </Link>

      <Card className="mb-4">
        <h2 className="font-serif text-xl font-semibold">How to confess</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6">
          {CONFESSION_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Card>

      <div className="sticky top-0 z-10 -mx-4 mb-3 flex items-center justify-between gap-3 bg-background px-4 py-3">
        <p className="font-medium">
          {count} checked · <span className="text-muted-foreground">saved only on this phone</span>
        </p>
        <Btn variant="outline" onClick={() => setChecks({})} disabled={count === 0}>
          <Trash2 className="size-5" /> Clear
        </Btn>
      </div>

      <div className="space-y-4">
        {EXAMINATION.map((sec) => (
          <Card key={sec.title}>
            <h2 className="font-serif text-xl font-semibold leading-snug">{sec.title}</h2>
            <ul className="mt-3 space-y-1">
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
          </Card>
        ))}
        <Card>
          <h2 className="mb-3 font-serif text-xl font-semibold">Act of Contrition</h2>
          <PrayerText text={P.actOfContrition} />
        </Card>
      </div>
    </Page>
  );
}
