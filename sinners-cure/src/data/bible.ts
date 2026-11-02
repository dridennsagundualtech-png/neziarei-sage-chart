/**
 * Bible text, loaded book by book from public/bible/<translation>/<BOOK>.json
 * (built by scripts/build-bible.mjs). Each file is [[verse 1, verse 2, ...], ...],
 * chapter N at index N-1. Numbering follows the Mass lectionary (Hebrew psalm numbers).
 * Both translations are public domain. Files ship inside the app: no internet needed.
 */
import { useEffect, useSyncExternalStore } from "react";
import { BOOKS, bookById } from "./books";
import { readLocal, useLocal } from "@/lib/storage";
import { t } from "@/lib/lang";

export type TranslationId = "drc" | "cpdv";
export const TRANSLATIONS: Record<TranslationId, { name: string; short: string; about: string }> = {
  drc: {
    name: "Douay-Rheims",
    short: "DRB",
    about: t(
      "The classic Catholic English Bible, Challoner revision (1752). Traditional wording, close to many prayers.",
      "Ang klasikong Bibliyang Katoliko sa Ingles, rebisyon ni Challoner (1752). Tradisyonal na pananalita, malapit sa maraming dasal.",
    ),
  },
  cpdv: {
    name: "Catholic Public Domain Version",
    short: "CPDV",
    about: t(
      "A modern-English Catholic translation of the Latin Vulgate (2009). Easier to read.",
      "Isang makabagong saling Katoliko sa Ingles ng Latin Vulgata (2009). Mas madaling basahin.",
    ),
  },
};
export const TRANSLATION_KEY = "sc.translation";
export const useTranslation = () => useLocal<TranslationId>(TRANSLATION_KEY, "drc");
const currentTranslation = (): TranslationId => readLocal<TranslationId>(TRANSLATION_KEY, "drc");

type BookText = string[][];
const cache = new Map<string, BookText>();
const loading = new Map<string, Promise<BookText>>();
const failed = new Set<string>();
let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const fileUrl = (tr: TranslationId, book: string) =>
  `${import.meta.env.BASE_URL}bible/${tr}/${book}.json`;

export function loadBook(
  book: string,
  tr: TranslationId = currentTranslation(),
): Promise<BookText> {
  const k = `${tr}/${book}`;
  const hit = cache.get(k);
  if (hit) return Promise.resolve(hit);
  let p = loading.get(k);
  if (!p) {
    p = fetch(fileUrl(tr, book))
      .then((r) => {
        if (!r.ok) throw new Error(`Missing ${k}`);
        return r.json() as Promise<BookText>;
      })
      .then((b) => {
        cache.set(k, b);
        loading.delete(k);
        failed.delete(k);
        emit();
        return b;
      })
      .catch((e: unknown) => {
        loading.delete(k);
        failed.add(k);
        emit();
        throw e;
      });
    loading.set(k, p);
  }
  return p;
}

/** Book text in the chosen translation: undefined while loading, null if it could not load. */
export function useBookText(book: string | undefined): BookText | null | undefined {
  const [tr] = useTranslation();
  useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
  useEffect(() => {
    if (book) loadBook(book, tr).catch(() => undefined);
  }, [book, tr]);
  if (!book) return undefined;
  const k = `${tr}/${book}`;
  return cache.get(k) ?? (failed.has(k) ? null : undefined);
}

export function useChapter(book: string, chapter: number): string[] | null | undefined {
  const b = useBookText(book);
  if (b === undefined || b === null) return b;
  return b[chapter - 1] ?? null;
}

export const verseKey = (book: string, ch: number, v: number) => `${book}.${ch}.${v}`;

export function parseKey(key: string) {
  const [book, ch, v] = key.split(".");
  return { book: book ?? "", ch: Number(ch), v: Number(v) };
}

export function refLabel(key: string) {
  const { book = "", ch, v } = parseKey(key);
  const name = bookById(book)?.name ?? book;
  return `${name === "Psalms" ? "Psalm" : name} ${ch}:${v}`;
}

export function useVerseText(key: string): string | undefined {
  const { book, ch, v } = parseKey(key);
  const b = useBookText(book);
  return b?.[ch - 1]?.[v - 1];
}

/** Verses of a passage, e.g. [["MAT", 23, 1, 23, 12]]. Skips verses the book doesn't have. */
export type PassageSpan = [book: string, fromCh: number, fromV: number, toCh: number, toV: number];
export interface PassageVerse {
  key: string;
  ch: number;
  v: number;
  text: string;
}
export function passageVerses(spans: PassageSpan[], books: Map<string, BookText>): PassageVerse[] {
  const out: PassageVerse[] = [];
  const seen = new Set<string>();
  for (const [book, c1, v1, c2, v2] of spans) {
    const text = books.get(book);
    if (!text) continue;
    for (let c = c1; c <= c2; c++) {
      const chapter = text[c - 1] ?? [];
      const from = c === c1 ? v1 : 1;
      const to = c === c2 ? v2 : chapter.length;
      for (let v = from; v <= to; v++) {
        const t = chapter[v - 1];
        const key = verseKey(book, c, v);
        if (t && !seen.has(key)) {
          seen.add(key);
          out.push({ key, ch: c, v, text: t });
        }
      }
    }
  }
  return out;
}

/** Loads every book a passage needs, then returns its verses. Re-renders when ready. */
export function usePassage(spans: PassageSpan[] | undefined): PassageVerse[] | undefined {
  const [tr] = useTranslation();
  useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
  const books = [...new Set((spans ?? []).map((s) => s[0]))];
  useEffect(() => {
    for (const b of books) loadBook(b, tr).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books.join(","), tr]);
  if (!spans) return undefined;
  const map = new Map<string, BookText>();
  for (const b of books) {
    const t = cache.get(`${tr}/${b}`);
    if (!t) return failed.has(`${tr}/${b}`) ? [] : undefined;
    map.set(b, t);
  }
  return passageVerses(spans, map);
}

export async function passageText(
  spans: PassageSpan[],
  tr: TranslationId = currentTranslation(),
): Promise<PassageVerse[]> {
  const books = [...new Set(spans.map((s) => s[0]))];
  const map = new Map<string, BookText>();
  for (const b of books) map.set(b, await loadBook(b, tr));
  return passageVerses(spans, map);
}

export interface SearchHit {
  key: string;
  text: string;
}

/**
 * Searches the whole Bible, book by book, so the screen stays responsive.
 * `onHits` receives the results found so far; returns all hits.
 */
export async function searchBible(
  query: string,
  {
    limit = 200,
    signal,
    onHits,
  }: {
    limit?: number;
    signal?: AbortSignal;
    onHits?: (hits: SearchHit[], done: boolean) => void;
  } = {},
): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase();
  const hits: SearchHit[] = [];
  if (q.length < 2) return hits;
  const tr = currentTranslation();
  for (const book of BOOKS) {
    if (signal?.aborted) return hits;
    let text: BookText;
    try {
      text = await loadBook(book.id, tr);
    } catch {
      continue;
    }
    text.forEach((verses, ci) =>
      verses.forEach((t, vi) => {
        if (hits.length < limit && t.toLowerCase().includes(q))
          hits.push({ key: verseKey(book.id, ci + 1, vi + 1), text: t });
      }),
    );
    onHits?.([...hits], false);
    if (hits.length >= limit) break;
    await new Promise((r) => setTimeout(r, 0));
  }
  onHits?.([...hits], true);
  return hits;
}
