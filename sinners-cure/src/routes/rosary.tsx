import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { BeadPrayer } from "@/components/bead-prayer";
import { BeadRing } from "@/components/bead-ring";
import { Btn, List, Page, Switch } from "@/components/app-ui";
import { MYSTERY_SETS, mysteriesForDate, type MysterySetId } from "@/data/rosary";
import { rosarySteps } from "@/lib/steps";
import { useLocal } from "@/lib/storage";
import { dateKey } from "@/lib/liturgy";
import { IntentionsBox } from "@/components/intentions-box";

export const Route = createFileRoute("/rosary")({
  component: RosaryPage,
});

interface Progress {
  set: MysterySetId | null;
  index: number;
  day: string;
  started: boolean;
  litany: boolean;
  stMichael: boolean;
}

const INIT: Progress = {
  set: null,
  index: 0,
  day: "",
  started: false,
  litany: false,
  stMichael: true,
};

function RosaryPage() {
  const hydrated = useHydrated();
  const [p, setP] = useLocal<Progress>("sc.rosary", INIT);
  const today = dateKey(new Date());
  const todaySet = hydrated ? mysteriesForDate(new Date()) : "glorious";
  // A rosary left unfinished on another day starts fresh with today's mysteries.
  const stale = hydrated && p.day !== "" && p.day !== today;
  const setId: MysterySetId = p.set && !stale ? p.set : todaySet;
  const started = !stale && (p.started || p.index > 0);
  const steps = useMemo(
    () => rosarySteps(setId, { litany: p.litany, stMichael: p.stMichael }),
    [setId, p.litany, p.stMichael],
  );
  const index = stale ? 0 : Math.min(p.index, steps.length);

  const update = (patch: Partial<Progress>) =>
    setP((prev) => {
      const fresh = prev.day !== "" && prev.day !== today;
      return {
        ...INIT,
        ...prev,
        ...(fresh ? { index: 0, started: false, set: null } : {}),
        set: setId,
        day: today,
        ...patch,
      };
    });

  if (!hydrated) return <Page title="Holy Rosary">{null}</Page>;
  const set = MYSTERY_SETS[setId];

  if (started) {
    return (
      <Page
        title={set.name}
        action={
          <button
            type="button"
            onClick={() => update({ started: false, index: 0 })}
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-muted-foreground"
          >
            <RotateCcw className="size-4" aria-hidden /> Restart
          </button>
        }
      >
        <BeadPrayer
          steps={steps}
          index={index}
          onIndex={(i) => update({ index: i, started: true })}
          doneLabel="Rosary prayed"
          pathItem="rosary"
          shareMessage={`I prayed the ${set.name} of the Holy Rosary today. Queen of the Holy Rosary, pray for us.`}
        />
      </Page>
    );
  }

  return (
    <Page title="Holy Rosary" subtitle={`Today: the ${MYSTERY_SETS[todaySet].name}`}>
      <div
        role="radiogroup"
        aria-label="Mysteries"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {(Object.keys(MYSTERY_SETS) as MysterySetId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={id === setId}
            onClick={() => update({ set: id, index: 0 })}
            className={`min-h-11 shrink-0 rounded-full px-4 font-semibold ${id === setId ? "bg-foreground text-background" : "bg-secondary"}`}
          >
            {MYSTERY_SETS[id].name.replace(" Mysteries", "")}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-5">
        <BeadRing current={-1} className="w-28 shrink-0" />
        <div>
          <h2 className="font-serif text-[1.6rem] font-semibold leading-tight">{set.name}</h2>
          <p className="mt-1 text-muted-foreground">Prayed on {set.days.replace(" & ", " and ")}</p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {set.mysteries.map((m, i) => (
          <li key={m.title} className="flex gap-3">
            <span className="w-5 shrink-0 text-right font-serif text-[1.2rem] text-rubric">
              {i + 1}
            </span>
            <span>
              <span className="block font-serif text-[1.22rem] leading-snug">{m.title}</span>
              <span className="block text-[0.95rem] text-muted-foreground">
                {m.scripture} · Fruit: {m.fruit}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <Btn className="mt-7 w-full" onClick={() => update({ started: true, index: 0 })}>
        Begin the Rosary
      </Btn>

      <h2 className="mt-9 font-serif text-[1.35rem] font-semibold">Before you begin</h2>
      <div className="mt-3">
        <IntentionsBox />
      </div>
      <List>
        <Switch
          label="Litany of Loreto"
          detail="After the Hail, Holy Queen"
          checked={p.litany}
          onChange={(v) => update({ litany: v })}
        />
        <Switch
          label="Prayer to Saint Michael"
          detail="At the end"
          checked={p.stMichael}
          onChange={(v) => update({ stMichael: v })}
        />
      </List>
      <p className="mt-4 text-[0.95rem] text-muted-foreground">
        Tap the beads or Next to move on. Your place is kept if you close the app, until the end of
        the day.
      </p>
    </Page>
  );
}
