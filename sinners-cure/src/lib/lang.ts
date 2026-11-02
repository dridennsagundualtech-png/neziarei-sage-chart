/**
 * App language (English or Tagalog). Read once when the app starts; changing it in
 * Settings saves the choice and reloads the app, so every screen and data file can
 * simply call `t(english, tagalog)` or check `TL` without hooks or re-renders.
 * Scripture (Bible text, Mass readings, Rosary verses) always stays in English.
 */
import { readLocal } from "./storage";

export type Lang = "en" | "tl";

/** Same key as SETTINGS_KEY in settings.ts (not imported to avoid an import cycle). */
const KEY = "sc.settings";

function readLang(): Lang {
  try {
    return readLocal<{ lang?: Lang }>(KEY, {}).lang === "tl" ? "tl" : "en";
  } catch {
    return "en";
  }
}

export const LANG: Lang = readLang();
export const TL = LANG === "tl";

/** Pick the English or Tagalog version of a string (or any value). */
export function t<T>(en: T, tl: T): T {
  return TL ? tl : en;
}

/** Locale for dates and numbers. */
export const LOCALE = TL ? "fil-PH" : "en-US";

/** Merge Tagalog fields over an English record by id; missing translations fall back to English. */
export function localize<T extends object>(en: T, tl: Partial<T> | undefined): T {
  return TL && tl ? { ...en, ...tl } : en;
}
