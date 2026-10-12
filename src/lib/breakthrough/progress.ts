import { ACADEMY } from "@/lib/education-content";
import { BREAKTHROUGH } from "./index";

/** Same rule as the normal units: the previous unit must be at least 60% complete. */
export const UNLOCK_PCT = 60;

/** Stored in the lessons map when the placement check is passed: every unit and Breakthrough open. */
export const PLACEMENT_ID = "placement-passed";

/** Chapters worth reading before the rest, whatever order the list is in. */
export const READ_FIRST = new Set(["bt-13-risk-math", "bt-14-psychology"]);

export interface BreakthroughAccess {
  /** The whole Breakthrough lesson is open. */
  open: boolean;
  /** Progress through the last normal unit, 0–100. */
  lastUnitPct: number;
  lastUnitTitle: string;
  /** Chapter ids that can be opened: all of them once Breakthrough is open. */
  unlocked: Set<string>;
}

export function breakthroughAccess(doneSet: Set<string>): BreakthroughAccess {
  const last = ACADEMY[ACADEMY.length - 1];
  const total = last?.lessons.length ?? 0;
  const done = last ? last.lessons.filter((l) => doneSet.has(l.id)).length : 0;
  const lastUnitPct = total ? Math.round((done / total) * 100) : 100;
  const open = lastUnitPct >= UNLOCK_PCT || doneSet.has(PLACEMENT_ID);
  return {
    open,
    lastUnitPct,
    lastUnitTitle: last ? `Unit ${last.level} · ${last.title}` : "the last unit",
    unlocked: new Set(open ? BREAKTHROUGH.chapters.map((c) => c.id) : []),
  };
}
