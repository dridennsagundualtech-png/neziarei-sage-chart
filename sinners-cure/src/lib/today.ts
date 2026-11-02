/**
 * getToday(date): everything the Today screen, the widget and the daily reminder show.
 * Pure and offline. Scripture text here is the Douay-Rheims kept in data/verses.ts.
 */
import { VERSES, type DailyVerse } from "@/data/verses";
import { MYSTERY_SETS, mysteriesForDate, type MysterySet } from "@/data/rosary";
import { COLOR_NAMES, dateKey, dayOfYear, type LitColor } from "./liturgy";
import { massDay, type MassDay } from "./mass-day";
import { DEFAULT_CALENDAR, type CalendarOptions } from "./calendar";

export interface TodayContent {
  key: string;
  dateLabel: string;
  season: string;
  color: LitColor;
  colorName: string;
  mass: MassDay;
  verse: DailyVerse;
  mysteries: MysterySet;
  /** Holy day, fasting and abstinence notes. */
  notes: string[];
}

function observances(date: Date, mass: MassDay): string[] {
  const notes: string[] = [];
  const solemnity = mass.rankLabel === "Solemnity";
  if (mass.holyDay) notes.push("A Holy Day of Obligation in many countries.");
  if (mass.name === "Ash Wednesday" || mass.name.startsWith("Good Friday"))
    notes.push("A day of fasting and abstinence.");
  else if (date.getDay() === 5 && !solemnity) {
    notes.push(
      mass.season === "Lent"
        ? "A Friday of Lent: abstain from meat."
        : "Friday: a day of penance. Abstain from meat or offer another penance.",
    );
  }
  return notes;
}

export function getToday(
  date: Date = new Date(),
  calendar: CalendarOptions = DEFAULT_CALENDAR,
): TodayContent {
  const mass = massDay(date, calendar);
  return {
    key: dateKey(date),
    dateLabel: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    season: mass.season,
    color: mass.color,
    colorName: COLOR_NAMES[mass.color],
    mass,
    verse: VERSES[dayOfYear(date) % VERSES.length] ?? VERSES[0]!,
    mysteries: MYSTERY_SETS[mysteriesForDate(date)],
    notes: observances(date, mass),
  };
}
