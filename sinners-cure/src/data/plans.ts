/**
 * Reading plans. Each plan is a list of days; each day is a list of
 * { book, chapter }. Plans here are generated from books.ts by spreading the
 * chapters evenly across the days. You may replace `days` with a hand-written list.
 */
import { BOOKS } from "./books";
import { t } from "@/lib/lang";

export interface PlanReading {
  book: string;
  chapter: number;
}
export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  days: PlanReading[][];
}

function chaptersOf(ids: string[] | null): PlanReading[] {
  const list = ids ? BOOKS.filter((b) => ids.includes(b.id)) : BOOKS;
  return list.flatMap((b) =>
    Array.from({ length: b.chapters }, (_, i) => ({ book: b.id, chapter: i + 1 })),
  );
}

function spread(chapters: PlanReading[], dayCount: number): PlanReading[][] {
  return Array.from({ length: dayCount }, (_, d) =>
    chapters.slice(
      Math.floor((d * chapters.length) / dayCount),
      Math.floor(((d + 1) * chapters.length) / dayCount),
    ),
  );
}

export const PLANS: ReadingPlan[] = [
  {
    id: "bible-year",
    name: t("Bible in a Year", "Bibliya sa Isang Taon"),
    description: t("All 73 books in 365 days.", "Lahat ng 73 aklat sa loob ng 365 araw."),
    days: spread(chaptersOf(null), 365),
  },
  {
    id: "gospels-30",
    name: t("Gospels in 30 Days", "Mga Ebanghelyo sa 30 Araw"),
    description: t("Matthew, Mark, Luke and John.", "Mateo, Marcos, Lucas at Juan."),
    days: spread(chaptersOf(["MAT", "MRK", "LUK", "JHN"]), 30),
  },
  {
    id: "gospels-40",
    name: t("Gospels in 40 Days", "Mga Ebanghelyo sa 40 Araw"),
    description: t(
      "A gentler pace through the four Gospels.",
      "Mas mabagal na pagbasa sa apat na Ebanghelyo.",
    ),
    days: spread(chaptersOf(["MAT", "MRK", "LUK", "JHN"]), 40),
  },
  {
    id: "advent-isaiah",
    name: t("Advent with Isaiah", "Adbiyento kasama si Isaias"),
    description: t(
      "The prophet of Advent, in 24 days before Christmas.",
      "Ang propeta ng Adbiyento, sa loob ng 24 na araw bago ang Pasko.",
    ),
    days: spread(chaptersOf(["ISA"]), 24),
  },
  {
    id: "lent-passion",
    name: t("Lent: Repentance & the Passion", "Kuwaresma: Pagsisisi at ang Pasyon"),
    description: t(
      "Penitential Psalms, Jonah and the Passion narratives in four weeks.",
      "Mga Salmo ng Pagsisisi, Jonas at ang mga salaysay ng Pasyon sa loob ng apat na linggo.",
    ),
    days: spread(
      [
        ...[6, 32, 38, 51, 102, 130, 143].map((c) => ({ book: "PSA", chapter: c })),
        ...chaptersOf(["JON"]),
        ...[26, 27, 28].map((c) => ({ book: "MAT", chapter: c })),
        ...[14, 15, 16].map((c) => ({ book: "MRK", chapter: c })),
        ...[22, 23, 24].map((c) => ({ book: "LUK", chapter: c })),
        ...[13, 14, 15, 16, 17, 18, 19, 20, 21].map((c) => ({ book: "JHN", chapter: c })),
      ],
      28,
    ),
  },
  {
    id: "psalms-30",
    name: t("Psalms in 30 Days", "Mga Salmo sa 30 Araw"),
    description: t("Five psalms a day.", "Limang salmo bawat araw."),
    days: spread(chaptersOf(["PSA"]), 30),
  },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id);
