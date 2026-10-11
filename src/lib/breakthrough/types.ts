import type { TopicKey } from "@/lib/education-content";
import type { SceneSpec, Tone } from "./scene";

export interface FlowSpec {
  nodes: { label: string; note?: string; tone?: Tone }[];
  /** Draw a return arrow from the last node back to the first. */
  loop?: boolean;
  /** "grid" shows the boxes as a two-column set with no arrows (for options, not steps). */
  layout?: "chain" | "grid";
  /** One line shown under the flow. */
  caption?: string;
}

export type CalcKind =
  | "rmultiple"
  | "breakeven"
  | "expectancy"
  | "profitfactor"
  | "drawdown"
  | "streak"
  | "correlation"
  | "kelly"
  | "sample"
  | "trailing"
  | "equity"
  | "margin"
  | "leverage"
  | "pipvalue"
  | "spread"
  | "sizing";

export interface ClockBand {
  label: string;
  /** Hours, end exclusive. Bands may wrap past midnight (e.g. 20 to 0). */
  start: number;
  end: number;
  /** "utc" bands are fixed; "ny" bands move with US daylight saving. */
  tz: "utc" | "ny";
  tone: Tone;
}

export interface ClockSpec {
  bands: ClockBand[];
  caption?: string;
}

export type Visual =
  | { kind: "scene"; scene: SceneSpec }
  | { kind: "flow"; flow: FlowSpec }
  | { kind: "calc"; calc: CalcKind }
  | { kind: "clock"; clock: ClockSpec }
  | { kind: "dom" }
  | { kind: "footprint" };

/** One term inside a Breakthrough chapter. */
export interface DeepTerm {
  term: string;
  /** Other names or abbreviations traders use for the same thing. */
  aka?: string;
  /** What it is, in plain words. */
  meaning: string;
  /** How to recognise it on a chart, or how to use it. */
  spot: string;
  /** Where to find it or how to do it in TradingView. */
  tv?: string;
  /** The honest limit: where it fails or what people get wrong. */
  caution?: string;
  /** Every term has an illustration or an interactive piece. */
  visual: Visual;
}

export interface BreakthroughChapter {
  /** Stored in the same learning-progress map as the normal lessons, so keep it unique. */
  id: string;
  title: string;
  /** Existing topic key, used only for the small label above the title. */
  topic: TopicKey;
  summary: string;
  terms: DeepTerm[];
  mistake: string;
}

/** Shorthand used by the content files. */
export const scene = (s: SceneSpec): Visual => ({ kind: "scene", scene: s });
export const flow = (f: FlowSpec): Visual => ({ kind: "flow", flow: f });
export const calc = (c: CalcKind): Visual => ({ kind: "calc", calc: c });
export const clock = (c: ClockSpec): Visual => ({ kind: "clock", clock: c });
