import { useLocal } from "./storage";

export interface Settings {
  theme: "light" | "dark";
  textScale: number;
  reminder: string; // "HH:MM" or ""
  reminderFor: "readings" | "rosary" | "prayer";
  goal: "any" | "full";
  voiceRate: number;
}

export const TEXT_SCALES = [1, 1.15, 1.3, 1.5, 1.75];
export const DEFAULT_SETTINGS: Settings = { theme: "light", textScale: 1, reminder: "", reminderFor: "rosary", goal: "any", voiceRate: 0.9 };
export const SETTINGS_KEY = "sc.settings";

export function useSettings() {
  const [s, set] = useLocal<Partial<Settings>>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...s };
  const update = (patch: Partial<Settings>) => set((p) => ({ ...DEFAULT_SETTINGS, ...p, ...patch }));
  const bumpText = (dir: 1 | -1) => {
    const i = TEXT_SCALES.indexOf(settings.textScale);
    const n = Math.max(0, Math.min(TEXT_SCALES.length - 1, (i < 0 ? 0 : i) + dir));
    update({ textScale: TEXT_SCALES[n] ?? 1 });
  };
  return { settings, update, bumpText };
}
