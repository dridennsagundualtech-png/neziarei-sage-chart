/**
 * Read-along: which word the voice is saying, so screens can light it up, and tap-to-jump.
 *
 * A "reading" is the exact text handed to speak(), built from the pieces a screen shows
 * (makeReading). Every chunk the voice says keeps its character range in that text, so the
 * playing position maps back to a word on screen. Neural voices report their position inside
 * each chunk (word level, timed by word length and punctuation); the phone voice only knows
 * which chunk it is on (sentence level).
 */
import { useSyncExternalStore } from "react";

export interface Chunk {
  /** Range in the reading text: [start, end). */
  start: number;
  end: number;
  /** What the voice is given for this range (line breaks turned into pauses). */
  say: string;
}

/** Joins the pieces a screen shows into one reading, remembering where each piece starts. */
export function makeReading(pieces: string[], sep = " ") {
  const starts: number[] = [];
  let text = "";
  pieces.forEach((p, i) => {
    if (i > 0) text += sep;
    starts.push(text.length);
    text += p;
  });
  return { text, starts };
}

/**
 * A prayer as it is read aloud: optional heading pieces (title, fruit…), then the prayer text
 * without ℣/℟ marks or (rubrics in parentheses). `at[key]` is where each spoken part starts,
 * keyed "para.line.part" in PrayerText's drawing order.
 */
export function prayerReading(head: string[], prayer: string) {
  let text = head.filter(Boolean).join(" ");
  const at: Record<string, number> = {};
  prayer.split("\n\n").forEach((para, p) => {
    para.split("\n").forEach((line, l) => {
      const body = line.replace(/^[VR]\.\s*/, "");
      let first = true;
      body.split(/(\([^)]*\))/).forEach((part, k) => {
        if (part.startsWith("(") || !part.trim()) return;
        // A new line starts on a new line of the reading; parts of one line run on.
        if (text) text += first ? "\n" : text.endsWith(" ") || part.startsWith(" ") ? "" : " ";
        first = false;
        at[`${p}.${l}.${k}`] = text.length;
        text += part;
      });
    });
  });
  return { text, at };
}

const CLOSERS = /["”’')\]]/;
const PUNCT_END = /[.!?,;:…"”’')\]]$/;

/** The words of text.slice(start, end) as said aloud: line breaks become a pause. */
function sayOf(text: string, start: number, end: number) {
  return text
    .slice(start, end)
    .split(/\s*\n\s*/)
    .filter(Boolean)
    .map((line, i, all) => (i < all.length - 1 && !PUNCT_END.test(line) ? `${line},` : line))
    .join(" ")
    .replace(/℣\.|℟\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits a reading into chunks for the voice: one sentence each (lines without an ending
 * mark, as in a litany, run on into the next line), long sentences split at ; : or commas
 * to at most `max` characters, and short sentences grouped up to `group` characters.
 */
export function chunkText(text: string, max = 180, group = 0): Chunk[] {
  // 1. Sentence and line ranges.
  const raw: { s: number; e: number; hard: boolean }[] = [];
  let s = -1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (s < 0) {
      if (!/\s/.test(c)) s = i;
      continue;
    }
    if (c === "\n") {
      raw.push({ s, e: i, hard: false });
      s = -1;
    } else if (/[.!?]/.test(c)) {
      let e = i + 1;
      while (e < text.length && (/[.!?]/.test(text[e]!) || CLOSERS.test(text[e]!))) e++;
      if (e >= text.length || /\s/.test(text[e]!)) {
        raw.push({ s, e, hard: true });
        s = -1;
        i = e - 1;
      }
    }
  }
  if (s >= 0) raw.push({ s, e: text.length, hard: true });
  for (const r of raw) while (r.e > r.s && /\s/.test(text[r.e - 1]!)) r.e--;

  // 2. Run unfinished lines on into the next until a sentence ends (or it gets long).
  const merged: { s: number; e: number }[] = [];
  let cur: { s: number; e: number } | null = null;
  for (const r of raw) {
    if (r.e <= r.s) continue;
    if (cur && r.e - cur.s <= max) cur.e = r.e;
    else {
      if (cur) merged.push(cur);
      cur = { s: r.s, e: r.e };
    }
    if (r.hard) {
      merged.push(cur);
      cur = null;
    }
  }
  if (cur) merged.push(cur);

  // 3. Split long sentences at ; : , and 4. group short ones.
  const out: Chunk[] = [];
  const push = (a: number, b: number) => {
    while (a < b && /\s/.test(text[a]!)) a++;
    while (b > a && /\s/.test(text[b - 1]!)) b--;
    if (b <= a) return;
    const last = out[out.length - 1];
    if (group > 0 && last && b - last.start <= group) {
      last.end = b;
      last.say = sayOf(text, last.start, b);
    } else out.push({ start: a, end: b, say: sayOf(text, a, b) });
  };
  for (const m of merged) {
    if (m.e - m.s <= max) {
      push(m.s, m.e);
      continue;
    }
    let a = m.s;
    let lastBreak = -1;
    for (let i = m.s; i < m.e; i++) {
      if (/[;:,]/.test(text[i]!) && /\s/.test(text[i + 1] ?? " ")) lastBreak = i + 1;
      if (i - a >= 160 && lastBreak > a) {
        push(a, lastBreak);
        a = lastBreak;
        lastBreak = -1;
      }
    }
    push(a, m.e);
  }
  return out.filter((c) => c.say);
}

/** Chunks starting at character `from` (moved to the start of that word). */
export function chunksFrom(text: string, chunks: Chunk[], from: number): Chunk[] {
  if (from <= 0) return chunks;
  let f = from;
  while (f > 0 && /\S/.test(text[f - 1]!)) f--;
  const out: Chunk[] = [];
  for (const c of chunks) {
    if (c.end <= f) continue;
    if (c.start < f) out.push({ start: f, end: c.end, say: sayOf(text, f, c.end) });
    else out.push(c);
  }
  return out.filter((c) => c.say);
}

/**
 * Where in a chunk the voice is after `pos` of `dur` seconds, as a character offset:
 * each word takes time for its letters plus a pause for punctuation after it.
 */
export function offsetAt(text: string, chunk: Chunk, pos: number, dur: number): number {
  const part = text.slice(chunk.start, chunk.end);
  const words = [...part.matchAll(/\S+/g)];
  if (!words.length) return chunk.start;
  const weight = (w: string) =>
    w.replace(/[^\p{L}\p{N}]/gu, "").length +
    1.5 +
    (/[.!?]["”’')\]]*$/.test(w) ? 6 : /[;:]$/.test(w) ? 4 : /,$/.test(w) ? 3 : 0);
  const total = words.reduce((n, w) => n + weight(w[0]), 0);
  const lead = Math.min(0.1, dur * 0.05);
  const f = Math.max(0, Math.min(1, (pos - lead) / Math.max(0.1, dur - lead * 2.5)));
  let acc = 0;
  for (const w of words) {
    acc += weight(w[0]);
    if (acc / total > f) return chunk.start + (w.index ?? 0);
  }
  return chunk.start + (words[words.length - 1]!.index ?? 0);
}

// ---- Live position -------------------------------------------------------------------

export interface ReadPos {
  id: string;
  /** Chunk being said. */
  start: number;
  end: number;
  /** Word being said, or -1 when only the chunk is known (phone voice). */
  at: number;
}

let pos: ReadPos | null = null;
const listeners = new Set<() => void>();
export function setReadPos(p: ReadPos | null) {
  if (
    p === pos ||
    (p && pos && p.id === pos.id && p.at === pos.at && p.start === pos.start && p.end === pos.end)
  )
    return;
  pos = p;
  listeners.forEach((l) => l());
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/**
 * For a piece of reading `id` covering [from, to): "at|start|end" relative to the piece when
 * the voice is inside it, "" otherwise. A string so React only re-renders the piece in play.
 */
export function useReadPos(id: string | undefined, from: number, to: number): string {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!id || !pos || pos.id !== id || pos.end <= from || pos.start >= to) return "";
      return `${pos.at >= from && pos.at < to ? pos.at - from : -1}|${pos.start - from}|${pos.end - from}`;
    },
    () => "",
  );
}

// ---- Jumping ----------------------------------------------------------------------

type Seeker = (id: string, offset: number) => boolean;
let seeker: Seeker | null = null;
/** speech.ts registers how to restart the current reading from a character offset. */
export function setSeeker(s: Seeker) {
  seeker = s;
}
/** Restarts reading `id` from `offset` if it is the one playing; false otherwise. */
export function seekReading(id: string, offset: number): boolean {
  return seeker ? seeker(id, offset) : false;
}

// Development only: lets a test browser move the read-along position by hand.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as { __readPos?: typeof setReadPos }).__readPos = setReadPos;
}
