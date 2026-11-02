import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { useMemo } from "react";
import { BeadPrayer } from "@/components/bead-prayer";
import { Page } from "@/components/app-ui";
import { MYSTERY_SETS, mysteriesForDate, type MysterySetId } from "@/data/rosary";
import { rosarySteps } from "@/lib/steps";
import { useLocal } from "@/lib/storage";
import { dateKey } from "@/lib/liturgy";
import { IntentionsBox } from "@/components/intentions-box";

export const Route = createFileRoute("/rosary")({
  head: () => ({
    meta: [
      { title: "Holy Rosary — Sinner's Cure" },
      { name: "description", content: "Pray the Holy Rosary one bead at a time, with the mysteries of the day." },
      { property: "og:title", content: "Holy Rosary — Sinner's Cure" },
      { property: "og:description", content: "Pray the Holy Rosary one bead at a time, with the mysteries of the day." },
    ],
  }),
  component: RosaryPage,
});

interface Progress {
  set: MysterySetId | null;
  index: number;
  day: string;
  litany: boolean;
  stMichael: boolean;
}

const INIT: Progress = { set: null, index: 0, day: "", litany: true, stMichael: true };

function RosaryPage() {
  const hydrated = useHydrated();
  const [p, setP] = useLocal<Progress>("sc.rosary", INIT);
  const todaySet = hydrated ? mysteriesForDate(new Date()) : "glorious";
  // A saved rosary from a previous day falls back to today's mysteries.
  const stale = hydrated && p.day !== "" && p.day !== dateKey(new Date()) && p.index === 0;
  const setId: MysterySetId = p.set && !stale ? p.set : todaySet;
  const steps = useMemo(() => rosarySteps(setId, { litany: p.litany, stMichael: p.stMichael }), [setId, p.litany, p.stMichael]);
  const index = Math.min(p.index, steps.length);

  const update = (patch: Partial<Progress>) => setP((prev) => ({ ...INIT, ...prev, set: setId, day: dateKey(new Date()), ...patch }));

  if (!hydrated) return <Page title="Holy Rosary">{null}</Page>;

  return (
    <Page eyebrow={MYSTERY_SETS[setId].days} title={MYSTERY_SETS[setId].name}>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Mysteries">
        {(Object.keys(MYSTERY_SETS) as MysterySetId[]).map((id) => (
          <button
            key={id}
            role="radio"
            aria-checked={id === setId}
            onClick={() => id !== setId && update({ set: id, index: 0 })}
            className={`min-h-11 shrink-0 rounded-full border px-4 font-medium ${id === setId ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {MYSTERY_SETS[id].name.replace(" Mysteries", "")}
            {id === todaySet ? " · today" : ""}
          </button>
        ))}
      </div>

      {index === 0 && (
        <div className="card-surface mb-4 space-y-1 p-4">
          <Toggle label="Include the Litany of Loreto" checked={p.litany} onChange={(v) => update({ litany: v })} />
          <Toggle label="Include the Prayer to St Michael" checked={p.stMichael} onChange={(v) => update({ stMichael: v })} />
        </div>
      )}

      {index === 0 && <IntentionsBox />}

      <BeadPrayer
        steps={steps}
        index={index}
        onIndex={(i) => update({ index: i })}
        doneLabel="Rosary complete"
        pathItem="rosary"
        shareMessage={`I prayed the ${MYSTERY_SETS[setId].name} of the Holy Rosary today. Queen of the Holy Rosary, pray for us. — Sinner's Cure`}
      />
    </Page>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3">
      <span>{label}</span>
      <input type="checkbox" className="size-6 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
