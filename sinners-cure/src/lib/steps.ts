/**
 * Step lists for bead prayers. Bead indexes map to the BeadRing:
 * 0 = crucifix, 1 = large pendant bead, 2-4 = three small pendant beads,
 * decade d (0-4): large bead 5 + d*11, small beads 6 + d*11 … 15 + d*11.
 * bead: null means "between beads" (keeps the previous bead lit).
 */
import { P } from "@/data/prayers";
import { MYSTERY_SETS, type MysterySetId } from "@/data/rosary";
import type { PassageSpan } from "@/data/bible";
import { t } from "@/lib/lang";

export interface Step {
  title: string;
  text: string;
  bead: number | null;
  subtitle?: string;
  scripture?: string;
  fruit?: string;
  /** Key verse of a mystery, shown from the Bible. */
  quote?: PassageSpan;
  /** 1-5 on the step that announces a mystery. */
  mystery?: number;
  /** One of the ten Hail Marys of a Rosary decade (language-independent marker). */
  decade?: boolean;
}

export const decadeLarge = (d: number) => 5 + d * 11;
const ORD = t(
  ["First", "Second", "Third", "Fourth", "Fifth"],
  ["Unang", "Ikalawang", "Ikatlong", "Ikaapat na", "Ikalimang"],
);
const VIRTUES = t(["faith", "hope", "charity"], ["pananampalataya", "pag-asa", "pag-ibig"]);
const of = (n: number, total: number) => t(`${n} of ${total}`, `${n} sa ${total}`);
const T = {
  before: t("Prayer Before the Rosary", "Dasal Bago ang Rosaryo"),
  cross: t("Sign of the Cross", "Tanda ng Krus"),
  creed: t("Apostles' Creed", "Sumasampalataya"),
  ourFather: t("Our Father", "Ama Namin"),
  hailMary: t("Hail Mary", "Aba Ginoong Maria"),
  gloryBe: t("Glory Be", "Luwalhati"),
  fatima: t("Fatima Prayer", "Dasal ng Fatima"),
  queen: t("Hail, Holy Queen", "Aba Po, Santa Mariang Hari"),
  litany: t("Litany of Loreto", "Litanya ng Mahal na Birhen"),
  closing: t("Closing Prayer", "Pangwakas na Dasal"),
  memorare: t("Memorare", "Alalahanin Mo"),
  michael: t("Prayer to St Michael", "Dasal kay San Miguel"),
};

export interface RosaryOptions {
  litany: boolean;
  stMichael: boolean;
}

export function rosarySteps(setId: MysterySetId, opts: RosaryOptions): Step[] {
  const set = MYSTERY_SETS[setId];
  const steps: Step[] = [
    { title: T.before, text: P.beforeRosary, bead: null },
    { title: T.cross, text: P.signOfCross, bead: 0 },
    { title: T.creed, text: P.creed, bead: 0 },
    { title: T.ourFather, text: P.ourFather, bead: 1 },
    ...VIRTUES.map((v, i) => ({
      title: T.hailMary,
      subtitle: t(
        `${of(i + 1, 3)} · for an increase of ${v}`,
        `${of(i + 1, 3)} · para sa paglago ng ${v}`,
      ),
      text: P.hailMary,
      bead: 2 + i,
    })),
    { title: T.gloryBe, text: P.gloryBe, bead: null },
  ];
  set.mysteries.forEach((m, d) => {
    const label = t(
      `${ORD[d]} ${set.name.replace(" Mysteries", "")} Mystery`,
      `${ORD[d]} ${set.name.replace("Mga Misteryo ng ", "Misteryo ng ")}`,
    );
    steps.push({
      title: m.title,
      subtitle: label,
      text: m.meditation,
      scripture: m.scripture,
      fruit: m.fruit,
      quote: m.quote,
      mystery: d + 1,
      bead: decadeLarge(d),
    });
    steps.push({ title: T.ourFather, subtitle: label, text: P.ourFather, bead: decadeLarge(d) });
    for (let i = 0; i < 10; i++) {
      steps.push({
        title: T.hailMary,
        subtitle: `${label} · ${of(i + 1, 10)}`,
        text: P.hailMary,
        bead: decadeLarge(d) + 1 + i,
        decade: true,
      });
    }
    steps.push({ title: T.gloryBe, subtitle: label, text: P.gloryBe, bead: null });
    steps.push({ title: T.fatima, subtitle: label, text: P.fatima, bead: null });
  });
  steps.push({ title: T.queen, text: P.hailHolyQueen, bead: null });
  if (opts.litany) steps.push({ title: T.litany, text: P.litany, bead: null });
  steps.push({ title: T.closing, text: P.rosaryClosing, bead: null });
  steps.push({ title: T.memorare, text: P.memorare, bead: null });
  if (opts.stMichael) steps.push({ title: T.michael, text: P.stMichael, bead: null });
  steps.push({ title: T.cross, text: P.signOfCross, bead: 0 });
  return steps;
}

export function chapletSteps(): Step[] {
  const steps: Step[] = [
    { title: T.cross, text: P.signOfCross, bead: 0 },
    {
      title: t("Opening Prayer (optional)", "Pambungad na Dasal (opsyonal)"),
      text: P.chapletOpening,
      bead: 0,
    },
    { title: T.ourFather, text: P.ourFather, bead: 1 },
    { title: T.hailMary, text: P.hailMary, bead: 2 },
    { title: T.creed, text: P.creed, bead: 3 },
  ];
  for (let d = 0; d < 5; d++) {
    const label = t(`${ORD[d]} Decade`, `${ORD[d]} Dekada`);
    steps.push({
      title: t("Eternal Father", "Amang Walang Hanggan"),
      subtitle: label,
      text: P.eternalFather,
      bead: decadeLarge(d),
    });
    for (let i = 0; i < 10; i++) {
      steps.push({
        title: t(
          "For the sake of His sorrowful Passion",
          "Alang-alang sa Kanyang mapait na pagpapakasakit",
        ),
        subtitle: `${label} · ${of(i + 1, 10)}`,
        text: P.forTheSake,
        bead: decadeLarge(d) + 1 + i,
      });
    }
  }
  steps.push({ title: t("Holy God", "Banal na Diyos"), text: P.holyGod, bead: null });
  steps.push({
    title: t("Closing Prayer (optional)", "Pangwakas na Dasal (opsyonal)"),
    text: P.chapletClosing,
    bead: null,
  });
  steps.push({ title: T.cross, text: P.signOfCross, bead: 0 });
  return steps;
}

/**
 * Decade Hail Mary shortcut. If step i is one of a decade's ten Hail Marys,
 * returns { to: index of the step right after that run (its Glory Be),
 * count: 10 } so one tap can stand for the whole decade. Null otherwise.
 */
export function decadeHailMaryRun(steps: Step[], i: number): { to: number; count: number } | null {
  const isDecade = (s: Step | undefined) => !!s?.decade;
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
