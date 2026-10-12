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
  /** Plain text; **double asterisks** mark the exact on-screen label. */
  body: string;
  bullets?: string[];
  mock?: ScreenMock;
  /** A short practical tip or warning under the step. */
  tip?: string;
}

export interface GuideCheck {
  id: string;
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
    | "/market"
    | "/backtest"
    | "/admin"
    | "/charts"
    | "/auth";
  tab?: string;
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
}

export interface GuideModule {
  id: string;
  title: string;
  blurb: string;
  lessons: GuideLesson[];
}
