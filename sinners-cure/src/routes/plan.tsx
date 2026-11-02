import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { List, Page, Section, Switch } from "@/components/app-ui";
import { PRACTICES, type PracticeId } from "@/data/practices";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/plan")({
  component: PlanPage,
});

function PlanPage() {
  const { settings, update } = useSettings();
  const plan = new Set(settings.plan);
  const toggle = (id: PracticeId, on: boolean) => {
    const next = PRACTICES.map((p) => p.id).filter((x) => (x === id ? on : plan.has(x)));
    update({ plan: next });
  };
  return (
    <Page
      back={{ label: "Back" }}
      title="Your plan of life"
      subtitle="Pick the practices you want on your Today screen. Start with a few you can keep every day."
    >
      <Link
        to="/learn/$id"
        params={{ id: "plan-of-life" }}
        className="-mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-primary"
      >
        What is a plan of life? <ChevronRight className="size-5" aria-hidden />
      </Link>
      <List className="mt-4">
        {PRACTICES.map((p) => (
          <Switch
            key={p.id}
            label={p.title}
            detail={`${p.when}. ${p.detail}`}
            checked={plan.has(p.id)}
            onChange={(v) => toggle(p.id, v)}
          />
        ))}
      </List>
      <Section title="A day of prayer is">
        <div role="radiogroup" className="grid gap-2">
          {(
            [
              ["any", "Any one practice", "Gentle: one practice counts toward the week's marks."],
              [
                "full",
                "Every practice in my plan",
                "For when your plan is settled and you want to keep all of it.",
              ],
            ] as const
          ).map(([value, label, detail]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={settings.goal === value}
              onClick={() => update({ goal: value })}
              className={`rounded-xl border px-4 py-3 text-left ${settings.goal === value ? "border-foreground bg-card" : "bg-transparent"}`}
            >
              <span className="block font-semibold">{label}</span>
              <span className="block text-[0.95rem] text-muted-foreground">{detail}</span>
            </button>
          ))}
        </div>
      </Section>
      <p className="mt-6 text-[0.95rem] text-muted-foreground">
        Some practices tick themselves when you finish them in the app: the readings, the Angelus,
        the Rosary, the Chaplet and the night examination.
      </p>
    </Page>
  );
}
