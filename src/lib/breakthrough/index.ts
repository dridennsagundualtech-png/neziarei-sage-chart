import { CH_CANDLES, CH_INDICATORS, CH_PATTERNS, CH_WYCKOFF } from "./ch-classic";
import { CH_MACRO, CH_MICRO, CH_PSYCH, CH_RISK, CH_TV } from "./ch-market";
import { CH_FIB, CH_LIQUIDITY, CH_MODELS, CH_STRUCTURE, CH_TIME, CH_ZONES } from "./ch-smc";
import type { BreakthroughChapter, DeepTerm } from "./types";

export type { BreakthroughChapter, DeepTerm } from "./types";

export const BREAKTHROUGH = {
  title: "Breakthrough lesson",
  blurb:
    "The deeper vocabulary: smart-money concepts, Wyckoff, patterns, indicators, order flow, macro, risk maths, psychology and TradingView tools. Every term has a picture or something to try.",
  chapters: [
    CH_ZONES,
    CH_LIQUIDITY,
    CH_STRUCTURE,
    CH_FIB,
    CH_TIME,
    CH_MODELS,
    CH_WYCKOFF,
    CH_CANDLES,
    CH_PATTERNS,
    CH_INDICATORS,
    CH_MICRO,
    CH_MACRO,
    CH_RISK,
    CH_PSYCH,
    CH_TV,
  ] as BreakthroughChapter[],
};

export const BREAKTHROUGH_IDS = BREAKTHROUGH.chapters.map((c) => c.id);

export const BREAKTHROUGH_TERM_COUNT = BREAKTHROUGH.chapters.reduce(
  (n, c) => n + c.terms.length,
  0,
);

export interface TermHit {
  chapter: BreakthroughChapter;
  term: DeepTerm;
}

/** Simple search across term names, other names and meanings. Name matches come first. */
export function searchTerms(query: string, limit = 12): TermHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const byName: TermHit[] = [];
  const byText: TermHit[] = [];
  for (const chapter of BREAKTHROUGH.chapters) {
    for (const term of chapter.terms) {
      const name = `${term.term} ${term.aka ?? ""}`.toLowerCase();
      if (name.includes(q)) byName.push({ chapter, term });
      else if (term.meaning.toLowerCase().includes(q)) byText.push({ chapter, term });
    }
  }
  return [...byName, ...byText].slice(0, limit);
}
