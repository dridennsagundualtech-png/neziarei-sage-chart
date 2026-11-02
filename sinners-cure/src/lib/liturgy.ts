export type LitColor = "green" | "violet" | "white" | "red" | "rose";

export interface Season {
  name: string;
  color: LitColor;
}

const DAY = 86400000;
const d0 = (y: number, m: number, d: number) => new Date(y, m, d);
const strip = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const same = (a: Date, b: Date) => strip(a).getTime() === strip(b).getTime();

export function easterSunday(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return d0(y, month - 1, day);
}

export function firstSundayOfAdvent(y: number): Date {
  const dec24 = d0(y, 11, 24);
  return addDays(dec24, -dec24.getDay() - 21);
}

function baptismOfTheLord(y: number): Date {
  const jan6 = d0(y, 0, 6);
  return addDays(jan6, 7 - jan6.getDay());
}

export function seasonFor(date: Date): Season {
  const t = strip(date).getTime();
  const y = date.getFullYear();
  const easter = easterSunday(y);
  const ash = addDays(easter, -46);
  const advent = firstSundayOfAdvent(y);
  const between = (a: Date, b: Date) => t >= a.getTime() && t <= b.getTime();

  if (t >= advent.getTime() && t < d0(y, 11, 25).getTime()) {
    if (same(date, addDays(advent, 14))) return { name: "Advent (Gaudete Sunday)", color: "rose" };
    return { name: "Advent", color: "violet" };
  }
  if (t >= d0(y, 11, 25).getTime() || t <= baptismOfTheLord(y).getTime()) return { name: "Christmas", color: "white" };
  if (same(date, addDays(easter, -7))) return { name: "Palm Sunday", color: "red" };
  if (same(date, addDays(easter, -2))) return { name: "Good Friday", color: "red" };
  if (between(addDays(easter, -3), addDays(easter, -1))) return { name: "Paschal Triduum", color: "white" };
  if (t >= ash.getTime() && t < easter.getTime()) {
    if (same(date, addDays(easter, -21))) return { name: "Lent (Laetare Sunday)", color: "rose" };
    return { name: "Lent", color: "violet" };
  }
  if (same(date, addDays(easter, 49))) return { name: "Pentecost", color: "red" };
  if (between(easter, addDays(easter, 48))) return { name: "Easter", color: "white" };
  return { name: "Ordinary Time", color: "green" };
}

export const COLOR_NAMES: Record<LitColor, string> = {
  green: "Green",
  violet: "Violet",
  white: "White",
  red: "Red",
  rose: "Rose",
};

export function dateKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dayOfYear(d: Date) {
  return Math.round((strip(d).getTime() - d0(d.getFullYear(), 0, 1).getTime()) / DAY);
}
