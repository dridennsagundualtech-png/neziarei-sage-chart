import { dateKey } from "./liturgy";
import { readLocal, writeLocal, useLocal } from "./storage";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from "./settings";

export const STREAK_KEY = "sc.prayedDays";
export const PATH_KEY = "sc.path";

/** The three steps of the daily path. */
export type PathItem = "readings" | "rosary" | "prayer";

export function markPrayedToday(date = new Date()) {
  const days = readLocal<string[]>(STREAK_KEY, []);
  const k = dateKey(date);
  if (!days.includes(k)) writeLocal(STREAK_KEY, [...days, k]);
}

/** Goal "any": any one step counts. Goal "full": Mass readings + Rosary. */
export function goalMet(items: PathItem[], goal: Settings["goal"]): boolean {
  if (goal === "full") return items.includes("readings") && items.includes("rosary");
  return items.length > 0;
}

export function markPath(item: PathItem, date = new Date()) {
  const all = readLocal<Record<string, PathItem[]>>(PATH_KEY, {});
  const k = dateKey(date);
  const items = all[k] ?? [];
  const next = items.includes(item) ? items : [...items, item];
  if (next !== items) writeLocal(PATH_KEY, { ...all, [k]: next });
  const goal = { ...DEFAULT_SETTINGS, ...readLocal<Partial<Settings>>(SETTINGS_KEY, {}) }.goal;
  if (goalMet(next, goal)) markPrayedToday(date);
}

/** Consecutive days ending today (or yesterday, if today isn't marked yet). */
export function computeStreak(days: string[], today = new Date()): number {
  const set = new Set(days);
  const cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!set.has(dateKey(cur))) cur.setDate(cur.getDate() - 1);
  let n = 0;
  while (set.has(dateKey(cur))) {
    n++;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

export function bestStreak(days: string[]): number {
  const sorted = [...new Set(days)].sort();
  let best = 0, run = 0, prev: Date | null = null;
  for (const k of sorted) {
    const [y, m, d] = k.split("-").map(Number);
    const cur = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
    run = prev && Math.round((cur.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

export function encouragement(streak: number, prayedToday: boolean): string {
  if (prayedToday && streak >= 7) return `${streak} days in a row. "Pray without ceasing." (1 Thess 5:17)`;
  if (prayedToday) return "You have prayed today. Go in peace.";
  if (streak > 0) return "Your streak is waiting. Even one Hail Mary is a beginning.";
  return "Begin again today. God is never tired of forgiving.";
}

export function useStreak() {
  const [days] = useLocal<string[]>(STREAK_KEY, []);
  const [path] = useLocal<Record<string, PathItem[]>>(PATH_KEY, {});
  const today = dateKey(new Date());
  return {
    days,
    streak: computeStreak(days),
    best: bestStreak(days),
    prayedToday: days.includes(today),
    todayItems: path[today] ?? [],
  };
}
