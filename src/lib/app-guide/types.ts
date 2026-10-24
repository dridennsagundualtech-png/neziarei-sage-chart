import type { Visual } from "@/lib/breakthrough/types";

/**
 * App guide: a course about using ChartPilot itself, separate from the trading
 * lessons and never locked. Every label in here must match the real screen, so
 * check the component before changing a button name in either place.
 */

/** Who can see the screen a lesson teaches. */
export type GuideAccess = "everyone" | "signed-in" | "premium" | "market-data" | "admin";

/** One block of a screen sketch. `hl` marks the part the step is about. */
export type MockPart = { hl?: boolean } & (
  | { kind: "title"; text: string; sub?: string }
  | { kind: "tabs"; items: string[]; active: number }
  | { kind: "chips"; label?: string; items: string[]; on?: number[] }
  | { kind: "button"; label: string; tone?: "primary" | "secondary" | "ghost" }
  | { kind: "buttons"; items: { label: string; tone?: "primary" | "secondary" | "ghost" }[] }
  | { kind: "field"; label: string; value: string; hint?: string }
  | { kind: "toggle"; label: string; on: boolean; hint?: string }
  | { kind: "slider"; label: string; value: string; pct: number }
  | { kind: "card"; title: string; lines: string[] }
  | { kind: "stats"; items: [string, string][] }
  | { kind: "rows"; rows: { left: string; right?: string; tone?: "bull" | "bear" | "muted" }[] }
  | { kind: "note"; text: string; tone?: "warn" | "info" }
);

/** A simplified drawing of a screen, with the important control highlighted. */
export interface ScreenMock {
  /** Breadcrumb shown on top, e.g. "Journal › History". */
  where: string;
  parts: MockPart[];
}

export interface GuideStep {
  title: string;
  /** An illustration or something to try (calculator, chart that builds step by step). */
  visual?: Visual;
  /** Plain text; **double asterisks** mark the exact on-screen label. */
  body: string;
  bullets?: string[];
  mock?: ScreenMock;
  /** A short practical tip or warning under the step. */
  tip?: string;
}

export interface GuideCheck {
  id: string;
  /** A chart or diagram shown with the question; it must not give the answer away. */
  visual?: Visual;
  prompt: string;
  options: [string, string, string, string] | [string, string];
  correctIndex: number;
  explanation: string;
}

/** Where "Open this screen" goes. Journal and Academy accept a `tab`. */
export interface GuideLink {
  to:
    | "/"
    | "/analyze"
    | "/learn"
    | "/journal"
    | "/settings"
    | "/backtest"
    | "/admin"
    | "/charts"
    | "/auth";
  tab?: string;
  /** Analyze only: open straight in Market data mode. */
  mode?: "data";
  label: string;
}

export interface GuideLesson {
  id: string;
  title: string;
  summary: string;
  /** Path through the app, e.g. "Journal › History". */
  where: string;
  access: GuideAccess;
  open?: GuideLink;
  steps: GuideStep[];
  checks: [GuideCheck, GuideCheck];
  /** Something to go and do before the next lesson, shown after the check. */
  task?: string;
}

export interface GuideModule {
  id: string;
  title: string;
  blurb: string;
  lessons: GuideLesson[];
}

/** A course rendered by the guide player: the App guide or the Full course. */
export interface Course {
  /** Short name, used in the lesson header and the search box. */
  name: string;
  intro: string;
  modules: GuideModule[];
  startLabel: string;
  /** Show who can open each screen (the App guide); the Full course is for everyone. */
  showAccess: boolean;
  /** Device copy of progress when signed out. */
  storageKey: string;
  footnote: string;
}
