import { ACADEMY } from "@/lib/education-content";
import { BREAKTHROUGH } from "./index";

/** Same rule as the normal units: the previous unit must be at least 60% complete. */
export const UNLOCK_PCT = 60;

export interface BreakthroughAccess {
  /** The whole Breakthrough lesson is open. */
  open: boolean;
  /** Progress through the last normal unit, 0–100. */
  lastUnitPct: number;
  lastUnitTitle: string;
  /** Chapter ids that can be opened. Chapters open one by one. */
  unlocked: Set<string>;
}

export function breakthroughAccess(doneSet: Set<string>): BreakthroughAccess {
  const last = ACADEMY[ACADEMY.length - 1];
  const total = last?.lessons.length ?? 0;
  const done = last ? last.lessons.filter((l) => doneSet.has(l.id)).length : 0;
  const lastUnitPct = total ? Math.round((done / total) * 100) : 100;
  const open = lastUnitPct >= UNLOCK_PCT;
  const unlocked = new Set<string>();
  if (open) {
    for (const chapter of BREAKTHROUGH.chapters) {
      unlocked.add(chapter.id);
      if (!doneSet.has(chapter.id)) break;
    }
  }
  return {
    open,
    lastUnitPct,
    lastUnitTitle: last ? `Unit ${last.level} · ${last.title}` : "the last unit",
    unlocked,
  };
}
