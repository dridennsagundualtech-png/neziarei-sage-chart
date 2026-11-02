/**
 * Reading plans. Each plan is a list of days; each day is a list of
 * { book, chapter }. Plans here are generated from books.ts by spreading the
 * chapters evenly across the days. You may replace `days` with a hand-written list.
 */
import { BOOKS } from "./books";

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
  return list.flatMap((b) => Array.from({ length: b.chapters }, (_, i) => ({ book: b.id, chapter: i + 1 })));
}

function spread(chapters: PlanReading[], dayCount: number): PlanReading[][] {
  return Array.from({ length: dayCount }, (_, d) =>
    chapters.slice(Math.floor((d * chapters.length) / dayCount), Math.floor(((d + 1) * chapters.length) / dayCount)),
  );
}

export const PLANS: ReadingPlan[] = [
  { id: "bible-year", name: "Bible in a Year", description: "All 73 books in 365 days.", days: spread(chaptersOf(null), 365) },
  { id: "gospels-30", name: "Gospels in 30 Days", description: "Matthew, Mark, Luke and John.", days: spread(chaptersOf(["MAT", "MRK", "LUK", "JHN"]), 30) },
  { id: "gospels-40", name: "Gospels in 40 Days", description: "A gentler pace through the four Gospels.", days: spread(chaptersOf(["MAT", "MRK", "LUK", "JHN"]), 40) },
  { id: "advent-isaiah", name: "Advent with Isaiah", description: "The prophet of Advent, in 24 days before Christmas.", days: spread(chaptersOf(["ISA"]), 24) },
  { id: "lent-passion", name: "Lent: Repentance & the Passion", description: "Penitential Psalms, Jonah and the Passion narratives in four weeks.", days: spread([...[6, 32, 38, 51, 102, 130, 143].map((c) => ({ book: "PSA", chapter: c })), ...chaptersOf(["JON"]), ...[26, 27, 28].map((c) => ({ book: "MAT", chapter: c })), ...[14, 15, 16].map((c) => ({ book: "MRK", chapter: c })), ...[22, 23, 24].map((c) => ({ book: "LUK", chapter: c })), ...[13, 14, 15, 16, 17, 18, 19, 20, 21].map((c) => ({ book: "JHN", chapter: c }))], 28) },
  { id: "psalms-30", name: "Psalms in 30 Days", description: "Five psalms a day.", days: spread(chaptersOf(["PSA"]), 30) },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id);
