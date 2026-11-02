/**
 * getToday(date): everything the Today screen, the widget and the daily reminder show.
 * Pure and offline. Scripture text here is the Douay-Rheims kept in data/verses.ts.
 */
import { VERSES, type DailyVerse } from "@/data/verses";
import { MYSTERY_SETS, mysteriesForDate, type MysterySet } from "@/data/rosary";
import { COLOR_NAMES, dateKey, dayOfYear, type LitColor } from "./liturgy";
import { massDay, type MassDay } from "./mass-day";
import { DEFAULT_CALENDAR, type CalendarOptions } from "./calendar";
import { LOCALE, t } from "./lang";

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
  const code = mass.code;
  if (mass.holyDay)
    notes.push(
      t("A Holy Day of Obligation in many countries.", "Pistang pangilin sa maraming bansa."),
    );
  if (code === "LW00-3Wed" || code === "LW06-5Fri")
    notes.push(
      t("A day of fasting and abstinence.", "Araw ng pag-aayuno at pangingilin sa karne."),
    );
  else if (date.getDay() === 5 && !solemnity) {
    notes.push(
      mass.season === "Lent"
        ? t("A Friday of Lent: abstain from meat.", "Biyernes ng Kuwaresma: huwag kumain ng karne.")
        : t(
            "Friday: a day of penance. Abstain from meat or offer another penance.",
            "Biyernes: araw ng penitensya. Huwag kumain ng karne o mag-alay ng ibang penitensya.",
          ),
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
    dateLabel: date.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" }),
    season: mass.season,
    color: mass.color,
    colorName: COLOR_NAMES[mass.color],
    mass,
    verse: VERSES[dayOfYear(date) % VERSES.length] ?? VERSES[0]!,
    mysteries: MYSTERY_SETS[mysteriesForDate(date)],
    notes: observances(date, mass),
  };
}
