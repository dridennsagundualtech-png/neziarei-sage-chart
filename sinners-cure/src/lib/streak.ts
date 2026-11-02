/**
 * The daily plan of life and the record of days of prayer.
 * Practices are ticked per day in "sc.path"; a day counts as a day of prayer
 * when the goal in Settings is met (any one practice, or every practice in the plan).
 */
import { t } from "./lang";
import { dateKey } from "./liturgy";
import { readLocal, writeLocal, useLocal } from "./storage";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from "./settings";
import type { PracticeId } from "@/data/practices";

export const STREAK_KEY = "sc.prayedDays";
export const PATH_KEY = "sc.path";

export type PathItem = PracticeId;

const currentSettings = () => ({
  ...DEFAULT_SETTINGS,
  ...readLocal<Partial<Settings>>(SETTINGS_KEY, {}),
});

export function goalMet(
  items: PathItem[],
  goal: Settings["goal"],
  plan: PathItem[] = DEFAULT_SETTINGS.plan,
): boolean {
  if (goal === "full") return plan.length > 0 && plan.every((p) => items.includes(p));
  return items.length > 0;
}

function record(date: Date, items: PathItem[]) {
  const all = readLocal<Record<string, PathItem[]>>(PATH_KEY, {});
  const k = dateKey(date);
  writeLocal(PATH_KEY, { ...all, [k]: items });
  const { goal, plan } = currentSettings();
  const days = readLocal<string[]>(STREAK_KEY, []);
  const met = goalMet(items, goal, plan);
  if (met && !days.includes(k)) writeLocal(STREAK_KEY, [...days, k]);
  if (!met && days.includes(k))
    writeLocal(
      STREAK_KEY,
      days.filter((d) => d !== k),
    );
}

const itemsOn = (date: Date) =>
  readLocal<Record<string, PathItem[]>>(PATH_KEY, {})[dateKey(date)] ?? [];

/** Ticks a practice for today (the app calls this when you finish a prayer). */
export function markPath(item: PathItem, date = new Date()) {
  const items = itemsOn(date);
  if (!items.includes(item)) record(date, [...items, item]);
}

/** Ticks or unticks a practice by hand. */
export function togglePath(item: PathItem, date = new Date()) {
  const items = itemsOn(date);
  record(date, items.includes(item) ? items.filter((i) => i !== item) : [...items, item]);
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
  let best = 0,
    run = 0,
    prev: Date | null = null;
  for (const k of sorted) {
    const [y, m, d] = k.split("-").map(Number);
    const cur = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
    run = prev && Math.round((cur.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

/** The last seven days, oldest first, with whether each was a day of prayer. */
export function lastWeek(days: string[], today = new Date()) {
  const set = new Set(days);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + i);
    return { date: d, prayed: set.has(dateKey(d)), today: i === 6 };
  });
}

export function encouragement(streak: number, prayedToday: boolean): string {
  if (prayedToday && streak >= 7)
    return t(
      `${streak} days in a row. Pray without ceasing (1 Thessalonians 5:17).`,
      `${streak} araw na sunod-sunod. Manalangin nang walang patid (1 Tesalonica 5:17).`,
    );
  if (prayedToday)
    return t(
      "You have prayed today. Go in peace.",
      "Nakapagdasal ka na ngayon. Humayo nang mapayapa.",
    );
  if (streak > 0)
    return t("Even one Hail Mary is a beginning.", "Kahit isang Aba Ginoong Maria ay simula na.");
  return t(
    "Begin again today. God never tires of forgiving.",
    "Magsimulang muli ngayon. Hindi napapagod ang Diyos sa pagpapatawad.",
  );
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
