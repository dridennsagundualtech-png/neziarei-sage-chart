/**
 * The Mass of a given day: name, rank, color, season, readings and what it is about.
 * Built from the offline calendar (calendar.ts) and lectionary (data/lectionary.json).
 */
import LECT from "@/data/lectionary.json";
import { DAY_TEXT, SAINT_TEXT, seasonText } from "@/data/celebrations";
import { NAME_TL } from "@/data/celebrations.tl";
import { TL, t } from "./lang";
import { calendarDay, type CalendarDay, type CalendarOptions, type Celebration } from "./calendar";
import type { LitColor } from "./liturgy";

type Row = [type: string, citation: string, spans: [string, number, number, number, number][]];
const LECTIONARY = LECT as unknown as Record<string, Row[]>;

export type Span = [book: string, fromCh: number, fromV: number, toCh: number, toV: number];
export interface ReadingOption {
  citation: string;
  spans: Span[];
  note?: "shorter" | "or";
}
export interface Reading {
  label: string;
  kind: "first" | "psalm" | "second" | "gospel" | "procession" | "sequence";
  options: ReadingOption[];
}
export interface MassDay {
  /** The celebration people will hear named at Mass (an obligatory memorial wins over a weekday). */
  title: string;
  /** Day code of the main celebration (calendar.ts), for language-independent checks. */
  code: string;
  /** The day of the season, when the title is a saint. */
  subtitle?: string;
  name: string;
  rankLabel: string;
  color: LitColor;
  season: string;
  /** What the day is about, in a sentence or three. */
  about: string;
  memorials: { name: string; label: string; about: string | undefined }[];
  readings: Reading[];
  /** Extra line such as the four Masses of Christmas. */
  note?: string;
  holyDay: boolean;
  sundayCycle: "A" | "B" | "C";
  weekdayCycle: 1 | 2;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const ORDINAL = [
  "",
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
  "Eleventh",
  "Twelfth",
  "Thirteenth",
  "Fourteenth",
  "Fifteenth",
  "Sixteenth",
  "Seventeenth",
  "Eighteenth",
  "Nineteenth",
  "Twentieth",
  "Twenty-first",
  "Twenty-second",
  "Twenty-third",
  "Twenty-fourth",
  "Twenty-fifth",
  "Twenty-sixth",
  "Twenty-seventh",
  "Twenty-eighth",
  "Twenty-ninth",
  "Thirtieth",
  "Thirty-first",
  "Thirty-second",
  "Thirty-third",
  "Thirty-fourth",
];

const NAMED: Record<string, string> = {
  "CW01-HolyFamily": "The Holy Family of Jesus, Mary and Joseph",
  "CW02-0Sun": "Second Sunday after the Nativity",
  "CW03-Epiphany": "The Epiphany of the Lord",
  "CW04-Baptism": "The Baptism of the Lord",
  "EW07-Ascension": "The Ascension of the Lord",
  "EW08-Pentecost": "Pentecost Sunday",
  "OW00-Trinity": "The Most Holy Trinity",
  "OW00-CorpusChristi": "The Most Holy Body and Blood of Christ",
  "OW00-SacredHeart": "The Most Sacred Heart of Jesus",
  "OW00-ImmaculateHeart": "The Immaculate Heart of the Blessed Virgin Mary",
  "OW00-MaryMotherofChurch": "The Blessed Virgin Mary, Mother of the Church",
  "OW34-0Sun": "Our Lord Jesus Christ, King of the Universe",
  "LW00-3Wed": "Ash Wednesday",
  "LW06-0Sun": "Palm Sunday of the Passion of the Lord",
  "LW06-4Thu": "Holy Thursday",
  "LW06-5Fri": "Good Friday of the Passion of the Lord",
  "LW06-6Sat": "Holy Saturday and the Easter Vigil",
  "EW01-0Sun": "Easter Sunday of the Resurrection of the Lord",
  "EW02-0Sun": "Second Sunday of Easter (Divine Mercy Sunday)",
  "AW03-0Sun": "Third Sunday of Advent (Gaudete Sunday)",
  "LW04-0Sun": "Fourth Sunday of Lent (Laetare Sunday)",
  "Nativity of the Lord": "The Nativity of the Lord (Christmas)",
  "Blessed Virgin Mary, the Mother of God": "Mary, the Holy Mother of God",
  "All Souls": "All Souls' Day",
  "Saint Joseph Husband of the Blessed Virgin Mary":
    "Saint Joseph, Spouse of the Blessed Virgin Mary",
  "Annunciation of the Lord": "The Annunciation of the Lord",
  "Birth of Saint John the Baptist": "The Nativity of Saint John the Baptist",
  "Assumption of the Blessed Virgin Mary": "The Assumption of the Blessed Virgin Mary",
  "Immaculate Conception of the Blessed Virgin Mary":
    "The Immaculate Conception of the Blessed Virgin Mary",
  "Presentation of the Lord": "The Presentation of the Lord",
  "Transfiguration of the Lord": "The Transfiguration of the Lord",
  "Exaltation of the Holy Cross": "The Exaltation of the Holy Cross",
  "Dedication of the Lateran basilica": "The Dedication of the Lateran Basilica",
  "Birth of the Blessed Virgin Mary": "The Nativity of the Blessed Virgin Mary",
  "Visitation of the Blessed Virgin Mary": "The Visitation of the Blessed Virgin Mary",
  "Presentation of the Blessed Virgin Mary": "The Presentation of the Blessed Virgin Mary",
  "Queenship of Blessed Virgin Mary": "The Queenship of the Blessed Virgin Mary",
  "Saint Matthew the Evangelist, Apostle, Evangelist": "Saint Matthew, Apostle and Evangelist",
  "Holy Innocents, martyrs": "The Holy Innocents, Martyrs",
};

/** Name for any day code, in the app language. */
export function nameOf(code: string, date: Date): string {
  if (TL) return nameOfTl(code, date);
  if (NAMED[code]) return NAMED[code];
  const m = /^(AW|CW|LW|EW|OW)(\d\d)-(.+)$/.exec(code);
  if (!m) return code;
  const [, season, wk, rest] = m;
  const week = Number(wk);
  const weekday = WEEKDAYS[date.getDay()]!;
  const sunday = rest!.startsWith("0Sun");
  switch (season) {
    case "AW":
      if (week === 5) return `Advent Weekday, ${MONTHS[11]} ${date.getDate()}`;
      return sunday
        ? `${ORDINAL[week]} Sunday of Advent`
        : `${weekday} of the ${ORDINAL[week]} Week of Advent`;
    case "CW":
      if (week === 1)
        return `${ORDINAL[date.getDate() - 24]} Day within the Octave of the Nativity`;
      if (week === 3) return `${weekday} after the Epiphany`;
      return `Christmas Weekday, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
    case "LW":
      if (week === 0) return `${weekday} after Ash Wednesday`;
      if (week === 6) return `${weekday} of Holy Week`;
      return sunday
        ? `${ORDINAL[week]} Sunday of Lent`
        : `${weekday} of the ${ORDINAL[week]} Week of Lent`;
    case "EW":
      if (week === 1) return `${weekday} within the Octave of Easter`;
      return sunday
        ? `${ORDINAL[week]} Sunday of Easter`
        : `${weekday} of the ${ORDINAL[week]} Week of Easter`;
    default:
      return sunday
        ? `${ORDINAL[week]} Sunday in Ordinary Time`
        : `${weekday} of the ${ORDINAL[week]} Week in Ordinary Time`;
  }
}

const WEEKDAYS_TL = ["Linggo", "Lunes", "Martes", "Miyerkules", "Huwebes", "Biyernes", "Sabado"];
const MONTHS_TL = [
  "Enero",
  "Pebrero",
  "Marso",
  "Abril",
  "Mayo",
  "Hunyo",
  "Hulyo",
  "Agosto",
  "Setyembre",
  "Oktubre",
  "Nobyembre",
  "Disyembre",
];
const ORD_TL = [
  "",
  "Unang",
  "Ikalawang",
  "Ikatlong",
  "Ikaapat na",
  "Ikalimang",
  "Ikaanim na",
  "Ikapitong",
  "Ikawalong",
  "Ikasiyam na",
  "Ikasampung",
];
/** "Ikatlong", or "Ika-31 na" past ten. */
export const ordinalTl = (n: number) => ORD_TL[n] ?? `Ika-${n} na`;

/** Tagalog name for any day code; saints without a Tagalog name keep the English one. */
function nameOfTl(code: string, date: Date): string {
  if (NAME_TL[code]) return NAME_TL[code];
  const m = /^(AW|CW|LW|EW|OW)(\d\d)-(.+)$/.exec(code);
  if (!m) return code;
  const [, season, wk, rest] = m;
  const week = Number(wk);
  const weekday = WEEKDAYS_TL[date.getDay()]!;
  const sunday = rest!.startsWith("0Sun");
  const ord = ordinalTl(week);
  switch (season) {
    case "AW":
      if (week === 5) return `Karaniwang Araw ng Adbiyento, ${MONTHS_TL[11]} ${date.getDate()}`;
      return sunday ? `${ord} Linggo ng Adbiyento` : `${weekday} sa ${ord} Linggo ng Adbiyento`;
    case "CW":
      if (week === 1) return `${ordinalTl(date.getDate() - 24)} Araw sa Oktaba ng Pasko`;
      if (week === 3) return `${weekday} pagkatapos ng Epipanya`;
      return `Karaniwang Araw ng Pasko, ${MONTHS_TL[date.getMonth()]} ${date.getDate()}`;
    case "LW":
      if (week === 0) return `${weekday} pagkatapos ng Miyerkules ng Abo`;
      if (week === 6) return `${weekday} Santo`;
      return sunday ? `${ord} Linggo ng Kuwaresma` : `${weekday} sa ${ord} Linggo ng Kuwaresma`;
    case "EW":
      if (week === 1) return `${weekday} sa Oktaba ng Pasko ng Pagkabuhay`;
      return sunday
        ? `${ord} Linggo ng Pasko ng Pagkabuhay`
        : `${weekday} sa ${ord} Linggo ng Pasko ng Pagkabuhay`;
    default:
      return sunday
        ? `${ord} Linggo sa Karaniwang Panahon`
        : `${weekday} sa ${ord} Linggo ng Karaniwang Panahon`;
  }
}

const RANK_TL: Record<string, string> = {
  "Easter Octave": "Oktaba ng Pasko ng Pagkabuhay",
  "Easter Triduum": "Triduo Paskwal",
  Commemoration: "Paggunita",
  Sunday: "Linggo",
  Solemnity: "Dakilang Kapistahan",
  Feast: "Kapistahan",
  Memorial: "Paggunita",
  "Optional memorial": "Malayang Paggunita",
  Weekday: "Karaniwang araw",
};
const SEASON_TL: Record<string, string> = {
  Advent: "Adbiyento",
  "Christmas Time": "Panahon ng Pasko",
  "Easter Triduum": "Triduo Paskwal",
  "Holy Week": "Mahal na Araw",
  Lent: "Kuwaresma",
  "Easter Time": "Panahon ng Pasko ng Pagkabuhay",
  "Ordinary Time": "Karaniwang Panahon",
};
/** Display text for a rank label (rankLabel stays English so code can compare it). */
export const rankText = (label: string) => (TL ? (RANK_TL[label] ?? label) : label);
/** Display text for a season (season stays English so code can compare it). */
export const seasonName = (season: string) => (TL ? (SEASON_TL[season] ?? season) : season);

function rankLabel(c: Celebration, date: Date): string {
  const t = c.type ?? "";
  if (/^EW01-[1-6]/.test(c.code)) return "Easter Octave";
  if (/^LW06-[456]/.test(c.code)) return "Easter Triduum";
  if (t === "All Souls") return "Commemoration";
  if (c.rank === 2.1 || c.rank === 6) return "Sunday";
  if (t.startsWith("Solemnity")) return "Solemnity";
  if (t.startsWith("Feast")) return "Feast";
  if (t === "Mem" || t === "Mem-Mary") return "Memorial";
  if (t === "OpMem") return "Optional memorial";
  if (t === "Commemoration") return "Commemoration";
  return date.getDay() === 0 ? "Sunday" : "Weekday";
}

function seasonOf(code: string, date: Date): string {
  const p = code.slice(0, 2);
  const wk = Number(code.slice(2, 4));
  if (p === "AW") return "Advent";
  if (p === "CW") return "Christmas Time";
  if (p === "LW") {
    if (
      code.startsWith("LW06-4Thu") ||
      code.startsWith("LW06-5Fri") ||
      code.startsWith("LW06-6Sat")
    )
      return "Easter Triduum";
    return wk === 6 ? "Holy Week" : "Lent";
  }
  if (p === "EW") return code === "EW01-0Sun" ? "Easter Triduum" : "Easter Time";
  return "Ordinary Time";
}

const LABELS: Record<string, { label: string; kind: Reading["kind"] }> = {
  "0": { label: t("Gospel at the Procession", "Mabuting Balita sa Prusisyon"), kind: "procession" },
  "1": { label: t("First Reading", "Unang Pagbasa"), kind: "first" },
  "2": { label: t("Responsorial Psalm", "Salmong Tugunan"), kind: "psalm" },
  "3": { label: t("Second Reading", "Ikalawang Pagbasa"), kind: "second" },
  "4": { label: t("Sequence", "Sekwensya"), kind: "sequence" },
  "6": { label: t("Gospel", "Mabuting Balita"), kind: "gospel" },
};
const VIGIL = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh"];
const vigilLabel = (i: number) =>
  i === 8 ? t("Epistle", "Sulat") : t(`${VIGIL[i]} Reading`, `${ordinalTl(i)} Pagbasa`);

function rowsFor(code: string, day: CalendarDay): Row[] {
  const ids = [code];
  if (/^OW\d{2}-[1-6]/.test(code)) ids.push(`${code} ${day.weekdayCycle}`);
  ids.push(`${code} ${day.sundayCycle}`);
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push(...(LECTIONARY[id] ?? []));
  }
  return rows;
}

function options(rows: Row[], psalm = false): ReadingOption[] {
  const types = new Set(rows.map((r) => r[0]));
  return rows.map((r, i) => {
    const o: ReadingOption = { citation: r[1], spans: r[2] };
    if (i > 0)
      o.note = !psalm && types.has(r[0].slice(0, -1)) && r[0].endsWith("1") ? "shorter" : "or";
    return o;
  });
}

function group(rows: Row[]): Reading[] {
  const by = new Map<string, Row[]>();
  for (const r of [...rows].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const k = r[0].split(".")[0]!;
    if (!by.has(k)) by.set(k, []);
    by.get(k)!.push(r);
  }
  const out: Reading[] = [];
  for (const k of ["0", "1", "2", "3", "4", "6"]) {
    const list = by.get(k);
    if (!list?.length || !LABELS[k]) continue;
    out.push({ ...LABELS[k], options: options(list, k === "2") });
  }
  return out;
}

function easterVigil(day: CalendarDay): Reading[] {
  const rows = rowsFor("LW06-6Sat", day);
  const pick = (prefix: string) =>
    rows.filter(
      (r) => r[0] === prefix || (r[0].startsWith(prefix) && r[0].length === prefix.length + 1),
    );
  const out: Reading[] = [];
  for (let i = 1; i <= 8; i++) {
    const reading = pick(`1.${i}`);
    const psalm = pick(`2.${i}`);
    if (reading.length)
      out.push({
        label: vigilLabel(i),
        kind: i === 8 ? "second" : "first",
        options: options(reading),
      });
    if (psalm.length)
      out.push({ label: LABELS["2"]!.label, kind: "psalm", options: options(psalm, true) });
  }
  const gospel = rows.filter((r) => r[0].startsWith("6"));
  if (gospel.length)
    out.push({ label: LABELS["6"]!.label, kind: "gospel", options: options(gospel) });
  return out;
}

/** Readings of the day: the day's own, with proper readings of a memorial put in their place. */
function readingsFor(day: CalendarDay): Reading[] {
  const primary = day.celebrations[0];
  if (!primary) return [];
  if (primary.code === "LW06-6Sat") return easterVigil(day);
  let rows =
    primary.code === "Nativity of the Lord"
      ? [...(LECTIONARY["Nativity of the Lord 4"] ?? [])]
      : rowsFor(primary.code, day);
  for (const c of day.celebrations.slice(1)) {
    const proper = rowsFor(c.code, day).filter((r) => /^\d\.\d\d[19]/.test(r[0]));
    if (!proper.length) continue;
    let major = new Set(proper.map((r) => r[0].split(".")[0]));
    if (major.has("6")) major = new Set([...major, "5"]);
    rows = [...rows.filter((r) => !major.has(r[0].split(".")[0])), ...proper];
  }
  const readings = group(rows);
  // A feast of the Lord on a weekday has one reading before the psalm: either of the two.
  if (primary.type === "Feast-Lord" && day.date.getDay() !== 0) {
    const first = readings.find((r) => r.kind === "first");
    const second = readings.find((r) => r.kind === "second");
    if (first && second) {
      first.options.push(...second.options.map((o) => ({ ...o, note: "or" as const })));
      return readings.filter((r) => r !== second);
    }
  }
  return readings;
}

const HOLY_DAYS = new Set(["1-1", "8-15", "11-1", "12-8", "12-25"]);

export function massDay(date: Date, opt?: CalendarOptions): MassDay {
  const day = calendarDay(date, opt);
  const [primary, ...rest] = day.celebrations;
  const code = primary?.code ?? day.seasonCode;
  const memorials = rest.map((c) => ({
    name: nameOf(c.code, date),
    label: rankLabel(c, date),
    about: SAINT_TEXT[c.code],
  }));
  const obligatory = rest.find((c) => c.type === "Mem" || c.type === "Mem-Mary");
  const name = nameOf(code, date);
  const own =
    DAY_TEXT[code] ?? SAINT_TEXT[code] ?? (obligatory ? SAINT_TEXT[obligatory.code] : undefined);
  const about = own ?? seasonText(day.seasonCode, date);
  const md: MassDay = {
    code,
    title: obligatory ? nameOf(obligatory.code, date) : name,
    name,
    rankLabel: obligatory ? "Memorial" : primary ? rankLabel(primary, date) : "Weekday",
    color: obligatory?.color ?? primary?.color ?? "green",
    season: seasonOf(day.seasonCode || code, date),
    about,
    memorials,
    readings: readingsFor(day),
    holyDay:
      HOLY_DAYS.has(`${date.getMonth() + 1}-${date.getDate()}`) &&
      primary?.type?.startsWith("Solemnity") === true,
    sundayCycle: day.sundayCycle,
    weekdayCycle: day.weekdayCycle,
  };
  if (obligatory) md.subtitle = name;
  if (code === "Nativity of the Lord")
    md.note = t(
      "Christmas has four Masses: the Vigil, at Night, at Dawn and during the Day. These are the readings of the Mass during the Day.",
      "Apat ang Misa ng Pasko: sa Bisperas, sa Hatinggabi, sa Madaling-araw at sa Araw. Ito ang mga pagbasa sa Misa sa Araw.",
    );
  if (code === "LW06-5Fri")
    md.note = t(
      "No Mass is celebrated today. The Church gathers for the Celebration of the Lord's Passion.",
      "Walang Misa ngayon. Nagtitipon ang Simbahan para sa Pagdiriwang ng Pagpapakasakit ng Panginoon.",
    );
  if (code === "LW06-6Sat")
    md.note = t(
      "No Mass is celebrated during the day. After nightfall the Church keeps the Easter Vigil, the greatest night of the year.",
      "Walang Misa sa araw. Pagdilim, ipinagdiriwang ng Simbahan ang Bihilya ng Pasko ng Pagkabuhay, ang pinakadakilang gabi ng taon.",
    );
  return md;
}
