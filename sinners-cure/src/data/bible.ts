/**
 * Bible text access. The text lives in bible-text.json:
 *   { "<BOOK_ID>": { "<chapter number>": ["verse 1 text", "verse 2 text", ...] } }
 * Verse N is at index N-1. Book IDs come from books.ts.
 * Sample = Douay-Rheims (public domain). Replace the JSON with the full Bible later.
 */
import text from "./bible-text.json";
import { bookById } from "./books";
import { massVerse } from "./mass";

const BIBLE = text as Record<string, Record<string, string[]>>;

export function getChapter(bookId: string, chapter: number): string[] | null {
  return BIBLE[bookId]?.[String(chapter)] ?? null;
}

export const verseKey = (book: string, ch: number, v: number) => `${book}.${ch}.${v}`;

export function parseKey(key: string) {
  const [book, ch, v] = key.split(".");
  return { book: book ?? "", ch: Number(ch), v: Number(v) };
}

export function refLabel(key: string) {
  const { book = "", ch, v } = parseKey(key);
  return `${bookById(book)?.name ?? book} ${ch}:${v}`;
}

export function getVerse(key: string): string | null {
  const { book = "", ch, v } = parseKey(key);
  return getChapter(book, ch)?.[v - 1] ?? massVerse(key);
}

export interface SearchHit {
  key: string;
  text: string;
}

export function searchBible(query: string, limit = 100): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const [book, chapters] of Object.entries(BIBLE)) {
    for (const [ch, verses] of Object.entries(chapters)) {
      verses.forEach((t, i) => {
        if (hits.length < limit && t.toLowerCase().includes(q)) {
          hits.push({ key: verseKey(book, Number(ch), i + 1), text: t });
        }
      });
    }
  }
  return hits;
}
