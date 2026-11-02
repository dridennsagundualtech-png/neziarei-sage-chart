import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { List, Page, Section, Switch } from "@/components/app-ui";
import { PRACTICES, type PracticeId } from "@/data/practices";
import { useSettings } from "@/lib/settings";
import { t } from "@/lib/lang";

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
      back={{ label: t("Back", "Bumalik") }}
      title={t("Your plan of life", "Iyong plano ng buhay")}
      subtitle={t(
        "Pick the practices you want on your Today screen. Start with a few you can keep every day.",
        "Piliin ang mga gawaing gusto mo sa iyong Ngayon na screen. Magsimula sa ilang kaya mong gawin araw-araw.",
      )}
    >
      <Link
        to="/learn/$id"
        params={{ id: "plan-of-life" }}
        className="-mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-primary"
      >
        {t("What is a plan of life?", "Ano ang plano ng buhay?")}{" "}
        <ChevronRight className="size-5" aria-hidden />
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
      <Section title={t("A day of prayer is", "Ang araw ng pananalangin ay")}>
        <div role="radiogroup" className="grid gap-2">
          {(
            [
              [
                "any",
                t("Any one practice", "Kahit isang gawain"),
                t(
                  "Gentle: one practice counts toward the week's marks.",
                  "Magaan: bilang na ang isang gawain sa marka ng linggo.",
                ),
              ],
              [
                "full",
                t("Every practice in my plan", "Lahat ng gawain sa aking plano"),
                t(
                  "For when your plan is settled and you want to keep all of it.",
                  "Para kapag buo na ang iyong plano at gusto mong gawin ang lahat.",
                ),
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
        {t(
          "Some practices tick themselves when you finish them in the app: the readings, the Angelus, the Rosary, the Chaplet and the night examination.",
          "Kusang natsetsekan ang ilang gawain kapag natapos mo sa app: ang mga pagbasa, ang Orasyon, ang Rosaryo, ang Koronilya at ang pagsusuri sa gabi.",
        )}
      </p>
    </Page>
  );
}
