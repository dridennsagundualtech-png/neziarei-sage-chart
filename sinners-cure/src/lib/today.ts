/**
 * getToday(date): everything shown on the Today screen, as plain data.
 * Pure and offline — reusable by a future home-screen widget.
 */
import { READINGS, type MassDay } from "@/data/readings";
import { VERSES, type DailyVerse } from "@/data/verses";
import { MYSTERY_SETS, mysteriesForDate, type MysterySet } from "@/data/rosary";
import { COLOR_NAMES, dateKey, dayOfYear, seasonFor, type LitColor } from "./liturgy";

export interface TodayContent {
  key: string;
  dateLabel: string;
  season: string;
  color: LitColor;
  colorName: string;
  mass: MassDay & { available: boolean };
  verse: DailyVerse;
  verseFromMass: boolean;
  mysteries: MysterySet;
}

export function getToday(date: Date = new Date()): TodayContent {
  const key = dateKey(date);
  const season = seasonFor(date);
  const entry = READINGS[key];
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const mass = entry
    ? { ...entry, available: true }
    : {
        celebration: `${weekday} in ${season.name}`,
        summary: "The readings for this day are not in the app yet. Join the Church's prayer by reading today's Gospel or praying the Rosary.",
        readings: [],
        available: false,
      };
  const color = entry?.color ?? season.color;
  return {
    key,
    dateLabel: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    season: season.name,
    color,
    colorName: COLOR_NAMES[color],
    mass,
    verse: entry?.verse ?? VERSES[dayOfYear(date) % VERSES.length] ?? VERSES[0]!,
    verseFromMass: !!entry?.verse,
    mysteries: MYSTERY_SETS[mysteriesForDate(date)],
  };
}
