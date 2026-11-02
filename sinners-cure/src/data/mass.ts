/**
 * Full text of Mass readings. mass-texts.json:
 *   { "YYYY-MM-DD": [ [ { book, ch, v, text }, ... ]  // one array per reading, same order as readings.ts
 *   ] }
 * `book` is the book name as in books.ts ("Psalm" also accepted). Empty array = text not available.
 */
import texts from "./mass-texts.json";
import { BOOKS } from "./books";
import { READINGS } from "./readings";

interface RawVerse {
  book: string;
  ch: number;
  v: number;
  text: string;
}
const MASS = texts as Record<string, RawVerse[][]>;

export interface ReadingVerse {
  key: string; // BOOK.ch.v — shared with the Bible for highlights/notes
  ch: number;
  v: number;
  text: string;
}
export interface FullReading {
  label: string;
  citation: string;
  verses: ReadingVerse[];
}

export function bookIdByName(name: string): string {
  if (name === "Psalm" || name === "Psalms") return "PSA";
  return BOOKS.find((b) => b.name === name)?.id ?? name.toUpperCase().replace(/\s/g, "");
}

export function getMassReadings(dateKey: string): FullReading[] {
  const day = READINGS[dateKey];
  if (!day) return [];
  const raw = MASS[dateKey] ?? [];
  return day.readings.map((r, i) => ({
    ...r,
    verses: (raw[i] ?? []).map((v) => ({ key: `${bookIdByName(v.book)}.${v.ch}.${v.v}`, ch: v.ch, v: v.v, text: v.text })),
  }));
}

let index: Map<string, string> | null = null;
/** Verse text from any Mass reading, by key. */
export function massVerse(key: string): string | null {
  if (!index) {
    index = new Map();
    for (const day of Object.values(MASS)) for (const r of day) for (const v of r) index.set(`${bookIdByName(v.book)}.${v.ch}.${v.v}`, v.text);
  }
  return index.get(key) ?? null;
}

export function searchMass(q: string, limit = 50) {
  const s = q.trim().toLowerCase();
  const hits: { date: string; label: string; key: string; text: string }[] = [];
  if (s.length < 2) return hits;
  for (const date of Object.keys(MASS)) {
    for (const r of getMassReadings(date)) {
      for (const v of r.verses) {
        if (hits.length < limit && v.text.toLowerCase().includes(s)) hits.push({ date, label: r.citation, key: v.key, text: v.text });
      }
    }
  }
  return hits;
}
