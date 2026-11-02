import { useLocal } from "./storage";
import { DEFAULT_PLAN, type PracticeId } from "@/data/practices";
import { DEFAULT_CALENDAR, type CalendarOptions } from "./calendar";

export interface Settings {
  theme: "light" | "dark";
  textScale: number;
  /** Daily reminder "HH:MM", or "" for off. */
  reminder: string;
  reminderFor: "readings" | "rosary" | "prayer";
  /** "any": one practice counts as a day of prayer. "full": every practice in the plan. */
  goal: "any" | "full";
  voiceRate: number;
  plan: PracticeId[];
  calendar: CalendarOptions;
}

export const TEXT_SCALES = [1, 1.15, 1.3, 1.5, 1.75];
export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  textScale: 1,
  reminder: "",
  reminderFor: "readings",
  goal: "any",
  voiceRate: 0.9,
  plan: DEFAULT_PLAN,
  calendar: DEFAULT_CALENDAR,
};
export const SETTINGS_KEY = "sc.settings";

export function useSettings() {
  const [s, set] = useLocal<Partial<Settings>>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    ...s,
    calendar: { ...DEFAULT_CALENDAR, ...s.calendar },
  };
  const update = (patch: Partial<Settings>) =>
    set((p) => ({ ...DEFAULT_SETTINGS, ...p, ...patch }));
  const bumpText = (dir: 1 | -1) => {
    const i = TEXT_SCALES.indexOf(settings.textScale);
    const n = Math.max(0, Math.min(TEXT_SCALES.length - 1, (i < 0 ? 0 : i) + dir));
    update({ textScale: TEXT_SCALES[n] ?? 1 });
  };
  return { settings, update, bumpText };
}
