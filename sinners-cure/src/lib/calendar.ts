/**
 * General Roman Calendar, computed offline for any year.
 * Ported from RomanCalendar 3.0 by Br. Jayarathina Madharasan SDR (public domain),
 * https://github.com/jayarathina/Tamil-Catholic-Lectionary.
 *
 * Each day gets a code. Seasonal days use `<SEASON><WEEK>-<N><DAY>`:
 * AW Advent, CW Christmas, LW Lent, EW Easter, OW Ordinary Time; e.g. OW31-1Mon,
 * LW00-3Wed (Ash Wednesday), AW05-Dec17. Fixed celebrations use their name.
 * Lower rank = higher precedence (Table of Liturgical Days).
 */
import GENERAL from "@/data/general-calendar.json";
import type { LitColor } from "./liturgy";

export interface CalendarOptions {
  epiphanySunday: boolean;
  ascensionSunday: boolean;
  corpusChristiSunday: boolean;
}
export const DEFAULT_CALENDAR: CalendarOptions = {
  epiphanySunday: true,
  ascensionSunday: true,
  corpusChristiSunday: true,
};

export interface Celebration {
  code: string;
  rank: number;
  type?: string;
  color?: LitColor;
}

interface YearData {
  days: Map<string, Celebration[]>;
  season: Map<string, string>;
  easter: Date;
  adventStart: Date;
}

const RANKS: [RegExp, number][] = [
  [/^EW01-0Sun/, 1],
  [/^LW06-6Sat/, 1.1],
  [/^LW06-5Fri/, 1.1],
  [/^LW06-4Thu/, 1.1],
  [/^Nativity of the Lord/, 2],
  [/^CW03-Epiphany/, 2],
  [/^EW07-Ascension/, 2],
  [/^EW08-Pentecost/, 2],
  [/^AW\d{2}-0Sun/, 2.1],
  [/^LW\d{2}-0Sun/, 2.1],
  [/^EW\d{2}-0Sun/, 2.1],
  [/^LW00-3Wed/, 2.2],
  [/^LW06/, 2.3],
  [/^EW01/, 2.4],
  [/^Solemnity/, 3.1],
  [/^OW00-Trinity/, 3.1],
  [/^OW00-CorpusChristi/, 3.1],
  [/^OW00-SacredHeart/, 3.1],
  [/^OW34-0Sun/, 3.1],
  [/^All Souls/, 3.2],
  [/^Feast-Lord/, 5],
  [/^CW04-Baptism/, 5],
  [/^CW01-HolyFamily/, 5],
  [/^OW\d{2}-0Sun/, 6],
  [/^CW\d{2}-0Sun/, 6],
  [/^Feast/, 7],
  [/^AW05/, 9.1],
  [/^CW01/, 9.2],
  [/^LW/, 9.3],
  [/^Mem-Mary/, 10.1],
  [/^Mem/, 10.2],
  [/^OpMem/, 12],
  [/^AW/, 13.1],
  [/^CW/, 13.2],
  [/^EW/, 13.3],
  [/^OW/, 13.4],
  [/^Commemoration/, 14],
];

export function rankOf(codeOrType: string): number {
  for (const [re, r] of RANKS) if (re.test(codeOrType)) return r;
  throw new Error(`Unknown day code: ${codeOrType}`);
}

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const mk = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const add = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const key = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}`;
const before = (a: Date, b: Date) => a.getTime() < b.getTime();
const nextDow = (d: Date, dow: number) => add(d, (dow - d.getDay() + 7) % 7 || 7);
const prevDow = (d: Date, dow: number) => add(d, -((d.getDay() - dow + 7) % 7 || 7));
const pad = (n: number) => String(n).padStart(2, "0");

export function easterSunday(y: number): Date {
  const a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4;
  const f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return mk(y, month, day);
}

function typeForRank(rank: number): string | undefined {
  if (rank <= 2.4 && [1, 2, 2.4].includes(rank)) return "Solemnity";
  if (rank === 3.1 || (rank >= 4 && rank < 5)) return "Solemnity";
  if (rank === 5) return "Feast-Lord";
  if (rank === 7) return "Feast";
  return undefined;
}

function buildYear(year: number, opt: CalendarOptions): YearData {
  const days = new Map<string, Celebration[]>();
  const season = new Map<string, string>();
  for (let d = mk(year, 1, 1); d.getFullYear() === year; d = add(d, 1)) days.set(key(d), []);

  // Season limits
  const adventStart = nextDow(prevDow(mk(year, 12, 1), 4), 0); // Sunday after the last Thursday of November
  const christmas = mk(year, 12, 25);
  let epiphany: Date;
  let baptism: Date;
  if (opt.epiphanySunday) {
    epiphany = nextDow(mk(year, 1, 1), 0);
    baptism = epiphany.getDate() > 6 ? add(epiphany, 1) : nextDow(epiphany, 0);
  } else {
    epiphany = mk(year, 1, 6);
    baptism = nextDow(epiphany, 0);
  }
  const ordinary1 = add(baptism, 1);
  const easter = easterSunday(year);
  const lent = add(easter, -46);
  const ordinary2 = add(easter, 50);

  const setMovable = (d: Date, code: string) => {
    const rank = rankOf(code);
    const type = typeForRank(rank);
    days.set(key(d), [type ? { code, rank, type } : { code, rank }]);
    if (!season.has(key(d)) || /^(AW|CW|LW|EW|OW)\d/.test(code)) season.set(key(d), code);
  };
  const fillWeeks = (from: Date, to: Date, prefix: string, week = 0) => {
    for (let d = from; before(d, to); d = add(d, 1)) {
      if (d.getDay() === 0) week++;
      setMovable(d, `${prefix}${pad(week)}-${d.getDay()}${DAY_ABBR[d.getDay()]}`);
    }
  };

  // Advent
  fillWeeks(adventStart, christmas, "AW");
  for (let d = mk(year, 12, 17); before(d, christmas); d = add(d, 1)) {
    if (d.getDay() > 0) setMovable(d, `AW05-${MONTH_ABBR[11]}${d.getDate()}`);
  }
  // Christmas, Jan 1 to the Baptism of the Lord
  for (let d = mk(year, 1, 1); before(d, epiphany); d = add(d, 1)) {
    setMovable(d, d.getDay() === 0 ? "CW02-0Sun" : `CW02-${MONTH_ABBR[0]}${d.getDate()}`);
  }
  setMovable(epiphany, "CW03-Epiphany");
  let n = 1;
  for (let d = add(epiphany, 1); before(d, baptism); d = add(d, 1)) setMovable(d, `CW03-Day${n++}`);
  setMovable(baptism, "CW04-Baptism");
  // Christmas, Dec 25-31
  for (let d = christmas; d.getFullYear() === year; d = add(d, 1))
    setMovable(d, `CW01-${MONTH_ABBR[11]}${d.getDate()}`);
  setMovable(
    christmas.getDay() === 0 ? mk(year, 12, 30) : nextDow(christmas, 0),
    "CW01-HolyFamily",
  );
  // Lent and Easter
  fillWeeks(lent, easter, "LW");
  fillWeeks(easter, ordinary2, "EW");
  setMovable(add(easter, opt.ascensionSunday ? 42 : 39), "EW07-Ascension");
  setMovable(add(easter, 49), "EW08-Pentecost");
  // Ordinary Time
  fillWeeks(ordinary1, lent, "OW", 1);
  const firstSunday = nextDow(ordinary2, 0);
  const lastSunday = prevDow(adventStart, 0);
  const weeks = Math.round((lastSunday.getTime() - firstSunday.getTime()) / (7 * 86400000));
  fillWeeks(ordinary2, adventStart, "OW", 33 - weeks);
  setMovable(firstSunday, "OW00-Trinity");
  const corpus = opt.corpusChristiSunday ? nextDow(firstSunday, 0) : add(firstSunday, 4);
  setMovable(corpus, "OW00-CorpusChristi");
  setMovable(nextDow(nextDow(corpus, 1), 5), "OW00-SacredHeart");

  const get = (m: number, d: number) => days.get(`${m}-${d}`)!;
  const setFixed = (m: number, d: number, code: string, type: string) => {
    const rank = rankOf(type);
    days.set(`${m}-${d}`, [{ code, rank, type: m === 11 && d === 2 ? "All Souls" : type }]);
  };

  const addFixed = (list: [number, number, string, string][]) => {
    // Solemnities
    for (const [m, d, code, type] of list) {
      if (!type.startsWith("Solemnity")) continue;
      const feastRank = rankOf(type);
      const current = get(m, d)[0]!;
      if (feastRank < current.rank) {
        setFixed(m, d, code, type);
        continue;
      }
      let to = mk(year, m, d);
      if (d === 19 && m === 3 && current.code.startsWith("LW06")) to = prevDow(to, 6);
      else if (d === 25 && m === 3 && current.code.startsWith("LW06-0Sun")) to = prevDow(to, 6);
      else if (d === 25 && m === 3 && /^(LW06|EW01)/.test(current.code)) to = add(easter, 8);
      else {
        do to = add(to, 1);
        while (feastRank > get(to.getMonth() + 1, to.getDate())[0]!.rank);
      }
      setFixed(to.getMonth() + 1, to.getDate(), code, type);
    }
    // Feasts
    for (const [m, d, code, type] of list) {
      if (!type.startsWith("Feast")) continue;
      if (rankOf(type) < get(m, d)[0]!.rank) setFixed(m, d, code, type);
    }
    // Memorials
    for (const [m, d, code, t] of list) {
      if (!/^(Op)?Mem/.test(t)) continue;
      const today = get(m, d);
      const first = today[0]!;
      if (first.rank <= 9) continue;
      let type = t;
      const second = today[1];
      if (second?.type && rankOf(second.type) === 10.2 && rankOf(type) === 10.1) today.splice(1, 1);
      if (/^(LW|AW05|CW01)/.test(first.code)) type = "Commemoration";
      today.push({ code, rank: rankOf(type), type });
    }
  };
  addFixed(GENERAL as [number, number, string, string][]);

  // Immaculate Heart (Saturday after the Sacred Heart) and Mary, Mother of the Church (Monday after Pentecost)
  const fixes: [number, number, string, string][] = [];
  const heart = add(easter, 69);
  if (get(heart.getMonth() + 1, heart.getDate())[0]!.rank > 5)
    fixes.push([heart.getMonth() + 1, heart.getDate(), "OW00-ImmaculateHeart", "Mem"]);
  if (get(ordinary2.getMonth() + 1, ordinary2.getDate())[0]!.rank > 5)
    fixes.push([
      ordinary2.getMonth() + 1,
      ordinary2.getDate(),
      "OW00-MaryMotherofChurch",
      "Mem-Mary",
    ]);
  addFixed(fixes);

  // Two obligatory memorials on one day: both become optional.
  for (const list of days.values()) {
    if (list.filter((c) => c.type === "Mem").length > 1)
      for (const c of list) if (c.type === "Mem") c.type = "OpMem";
  }

  // Colors: an optional memorial keeps the color of the day.
  for (const list of days.values()) {
    let last: LitColor = "green";
    for (const c of list) {
      if (c.type !== "OpMem") last = colorOf(c.code, c.type);
      c.color = last;
    }
  }
  return { days, season, easter, adventStart };
}

const COLORS: Record<string, LitColor> = {
  Solemnity: "white",
  "Saints Peter and Paul, Apostles": "red",
  "EW08-Pentecost": "red",
  "AW03-0Sun": "rose",
  "LW04-0Sun": "rose",
  "Feast-Lord": "white",
  "Exaltation of the Holy Cross": "red",
  Feast: "white",
  Mem: "white",
  martyr: "red",
  "Chair of Saint Peter, apostle": "white",
  "The Conversion of Saint Paul, apostle": "white",
  "Saint John the Apostle and evangelist": "white",
  "LW06-0Sun": "red",
  "LW06-4Thu": "white",
  "LW06-5Fri": "red",
  "LW06-6Sat": "white",
  Commemoration: "violet",
  "All Souls": "violet",
};

function colorOf(code: string, type?: string): LitColor {
  const t = (type ?? "").split("-")[0] ?? "";
  let c: LitColor = "green";
  if (COLORS[code]) c = COLORS[code];
  else if (type === "All Souls") c = "violet";
  else if (COLORS[t]) c = COLORS[t];
  else {
    const p = code.slice(0, 2);
    c = p === "AW" || p === "LW" ? "violet" : p === "CW" || p === "EW" ? "white" : "green";
  }
  if (!COLORS[code] && /martyr|apostle|evangelist/i.test(code)) c = "red";
  return c;
}

const cache = new Map<string, YearData>();
function yearData(year: number, opt: CalendarOptions): YearData {
  const k = `${year}:${opt.epiphanySunday ? 1 : 0}${opt.ascensionSunday ? 1 : 0}${opt.corpusChristiSunday ? 1 : 0}`;
  let y = cache.get(k);
  if (!y) {
    y = buildYear(year, opt);
    cache.set(k, y);
  }
  return y;
}

export interface CalendarDay {
  date: Date;
  /** Celebrations of the day; [0] is the day itself, the rest are memorials. */
  celebrations: Celebration[];
  /** Seasonal code of the day, e.g. OW31-1Mon. */
  seasonCode: string;
  /** Sunday cycle (A, B, C) and weekday cycle (1, 2) in force on this date. */
  sundayCycle: "A" | "B" | "C";
  weekdayCycle: 1 | 2;
  easter: Date;
}

export function calendarDay(date: Date, opt: CalendarOptions = DEFAULT_CALENDAR): CalendarDay {
  const y = date.getFullYear();
  const data = yearData(y, opt);
  const k = key(date);
  const afterAdvent = !before(date, data.adventStart);
  const letters = ["A", "B", "C"] as const;
  return {
    date,
    celebrations: data.days.get(k) ?? [],
    seasonCode: data.season.get(k) ?? "",
    sundayCycle: letters[afterAdvent ? y % 3 : (y - 1) % 3]!,
    weekdayCycle: y % 2 === 0 ? 2 : 1,
    easter: data.easter,
  };
}
