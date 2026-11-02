/**
 * Step lists for bead prayers. Bead indexes map to the BeadRing:
 * 0 = crucifix, 1 = large pendant bead, 2-4 = three small pendant beads,
 * decade d (0-4): large bead 5 + d*11, small beads 6 + d*11 … 15 + d*11.
 * bead: null means "between beads" (keeps the previous bead lit).
 */
import { P } from "@/data/prayers";
import { MYSTERY_SETS, type MysterySetId } from "@/data/rosary";

export interface Step {
  title: string;
  text: string;
  bead: number | null;
  subtitle?: string;
  scripture?: string;
  fruit?: string;
}

export const decadeLarge = (d: number) => 5 + d * 11;
const ORD = ["First", "Second", "Third", "Fourth", "Fifth"];
const VIRTUES = ["faith", "hope", "charity"];

export interface RosaryOptions {
  litany: boolean;
  stMichael: boolean;
}

export function rosarySteps(setId: MysterySetId, opts: RosaryOptions): Step[] {
  const set = MYSTERY_SETS[setId];
  const steps: Step[] = [
    { title: "Prayer Before the Rosary", text: P.beforeRosary, bead: null },
    { title: "Sign of the Cross", text: P.signOfCross, bead: 0 },
    { title: "Apostles' Creed", text: P.creed, bead: 0 },
    { title: "Our Father", text: P.ourFather, bead: 1 },
    ...VIRTUES.map((v, i) => ({ title: "Hail Mary", subtitle: `${i + 1} of 3 · for an increase of ${v}`, text: P.hailMary, bead: 2 + i })),
    { title: "Glory Be", text: P.gloryBe, bead: null },
  ];
  set.mysteries.forEach((m, d) => {
    const label = `${ORD[d]} ${set.name.replace(" Mysteries", "")} Mystery`;
    steps.push({ title: m.title, subtitle: label, text: m.meditation, scripture: m.scripture, fruit: m.fruit, bead: decadeLarge(d) });
    steps.push({ title: "Our Father", subtitle: label, text: P.ourFather, bead: decadeLarge(d) });
    for (let i = 0; i < 10; i++) {
      steps.push({ title: "Hail Mary", subtitle: `${label} · ${i + 1} of 10`, text: P.hailMary, bead: decadeLarge(d) + 1 + i });
    }
    steps.push({ title: "Glory Be", subtitle: label, text: P.gloryBe, bead: null });
    steps.push({ title: "Fatima Prayer", subtitle: label, text: P.fatima, bead: null });
  });
  steps.push({ title: "Hail, Holy Queen", text: P.hailHolyQueen, bead: null });
  if (opts.litany) steps.push({ title: "Litany of Loreto", text: P.litany, bead: null });
  steps.push({ title: "Closing Prayer", text: P.rosaryClosing, bead: null });
  steps.push({ title: "Memorare", text: P.memorare, bead: null });
  if (opts.stMichael) steps.push({ title: "Prayer to St Michael", text: P.stMichael, bead: null });
  steps.push({ title: "Sign of the Cross", text: P.signOfCross, bead: 0 });
  return steps;
}

export function chapletSteps(): Step[] {
  const steps: Step[] = [
    { title: "Sign of the Cross", text: P.signOfCross, bead: 0 },
    { title: "Opening Prayer (optional)", text: P.chapletOpening, bead: 0 },
    { title: "Our Father", text: P.ourFather, bead: 1 },
    { title: "Hail Mary", text: P.hailMary, bead: 2 },
    { title: "Apostles' Creed", text: P.creed, bead: 3 },
  ];
  for (let d = 0; d < 5; d++) {
    const label = `${ORD[d]} Decade`;
    steps.push({ title: "Eternal Father", subtitle: label, text: P.eternalFather, bead: decadeLarge(d) });
    for (let i = 0; i < 10; i++) {
      steps.push({ title: "For the sake of His sorrowful Passion", subtitle: `${label} · ${i + 1} of 10`, text: P.forTheSake, bead: decadeLarge(d) + 1 + i });
    }
  }
  steps.push({ title: "Holy God", text: P.holyGod, bead: null });
  steps.push({ title: "Closing Prayer (optional)", text: P.chapletClosing, bead: null });
  steps.push({ title: "Sign of the Cross", text: P.signOfCross, bead: 0 });
  return steps;
}

/**
 * Decade Hail Mary shortcut. If step i is one of a decade's ten Hail Marys,
 * returns { to: index of the step right after that run (its Glory Be),
 * count: 10 } so one tap can stand for the whole decade. Null otherwise.
 */
export function decadeHailMaryRun(steps: Step[], i: number): { to: number; count: number } | null {
  const isDecade = (s: Step | undefined) =>
    !!s && s.title === "Hail Mary" && !!s.subtitle?.includes("of 10");
  if (!isDecade(steps[i])) return null;
  let j = i;
  while (isDecade(steps[j + 1])) j++;
  return { to: j + 1, count: 10 };
}

/** The bead that should be lit at step i (last non-null bead up to i). */
export function beadAt(steps: Step[], i: number): number {
  for (let k = Math.min(i, steps.length - 1); k >= 0; k--) {
    const b = steps[k]?.bead ?? null;
    if (b !== null) return b;
  }
  return -1;
}
