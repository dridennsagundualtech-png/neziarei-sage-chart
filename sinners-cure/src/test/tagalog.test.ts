/**
 * The app in Tagalog. The language is read once when modules load, so this file sets it in
 * localStorage first and imports everything fresh.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";

type Mods = {
  lang: typeof import("@/lib/lang");
  prayers: typeof import("@/data/prayers");
  steps: typeof import("@/lib/steps");
  rosary: typeof import("@/data/rosary");
  practices: typeof import("@/data/practices");
  confession: typeof import("@/data/confession");
  verses: typeof import("@/data/verses");
  massDay: typeof import("@/lib/mass-day");
  today: typeof import("@/lib/today");
  speech: typeof import("@/lib/speech");
};
let m: Mods;
let en: { prayers: typeof import("@/data/prayers"); practices: typeof import("@/data/practices") };

beforeAll(async () => {
  vi.resetModules();
  localStorage.removeItem("sc.settings");
  en = { prayers: await import("@/data/prayers"), practices: await import("@/data/practices") };
  vi.resetModules();
  localStorage.setItem("sc.settings", JSON.stringify({ lang: "tl" }));
  m = {
    lang: await import("@/lib/lang"),
    prayers: await import("@/data/prayers"),
    steps: await import("@/lib/steps"),
    rosary: await import("@/data/rosary"),
    practices: await import("@/data/practices"),
    confession: await import("@/data/confession"),
    verses: await import("@/data/verses"),
    massDay: await import("@/lib/mass-day"),
    today: await import("@/lib/today"),
    speech: await import("@/lib/speech"),
  };
});

describe("Tagalog content", () => {
  it("reads the language from settings", () => expect(m.lang.TL).toBe(true));

  it("every prayer has a Tagalog title and text", () => {
    for (const p of m.prayers.PRAYERS) {
      const e = en.prayers.prayerById(p.id)!;
      expect(p.title, p.id).not.toBe(e.title);
      expect(p.text, p.id).not.toBe(e.text);
      expect(p.group, p.id).toBe(e.group);
    }
  });

  it("uses the traditional Ama Namin and Aba Ginoong Maria", () => {
    expect(m.prayers.P.ourFather.startsWith("Ama namin, sumasalangit Ka.")).toBe(true);
    expect(m.prayers.P.hailMary.startsWith("Aba Ginoong Maria, napupuno ka ng grasya")).toBe(true);
  });

  it("the Rosary keeps its shape in Tagalog", () => {
    const s = m.steps.rosarySteps("joyful", { litany: true, stMichael: true });
    expect(s.filter((x) => x.title === "Aba Ginoong Maria").length).toBe(53);
    const first = s.findIndex((x) => x.decade);
    const run = m.steps.decadeHailMaryRun(s, first)!;
    expect(run.count).toBe(10);
    expect(s[run.to]!.title).toBe("Luwalhati");
    expect(s.find((x) => x.mystery === 1)!.subtitle).toBe("Unang Misteryo ng Tuwa");
  });

  it("every mystery, practice and guide is translated", () => {
    for (const set of Object.values(m.rosary.MYSTERY_SETS)) {
      expect(set.name.startsWith("Mga Misteryo ng")).toBe(true);
      expect(set.mysteries).toHaveLength(5);
    }
    m.practices.PRACTICES.forEach((p, i) =>
      expect(p.title).not.toBe(en.practices.PRACTICES[i]!.title),
    );
    m.practices.GUIDES.forEach((g, i) => expect(g.title).not.toBe(en.practices.GUIDES[i]!.title));
    expect(m.confession.EXAMINATION[0]!.questions[0]!.text).toMatch(/ ba /);
    expect(m.verses.VERSES.every((v) => !/^[A-Z][a-z]+ (your|the|God|him)/.test(v.apply))).toBe(
      true,
    );
  });

  it("every day of 2026-2028 has a Tagalog name, season and description", () => {
    for (let y = 2026; y <= 2028; y++) {
      for (let d = new Date(y, 0, 1); d.getFullYear() === y; d.setDate(d.getDate() + 1)) {
        const md = m.massDay.massDay(new Date(d));
        const k = d.toDateString();
        expect(md.name, k).not.toMatch(/ Week | Sunday of | Ordinary Time|Weekday,|Octave/);
        expect(m.massDay.seasonName(md.season), k).not.toMatch(/Time|Lent|Advent|Week/);
        expect(md.about, k).not.toMatch(/^(The|A|An|On|In|At|We|Jesus|Christ) /);
      }
    }
  });

  it("names weekdays the Filipino way", () => {
    // 2026-11-02 Monday is All Souls; 2026-11-03 is a weekday in Ordinary Time.
    expect(m.massDay.nameOf("OW31-2Tue", new Date(2026, 10, 3))).toBe(
      "Martes sa Ika-31 na Linggo ng Karaniwang Panahon",
    );
    expect(m.massDay.massDay(new Date(2026, 10, 2)).title).toBe("Araw ng mga Kaluluwa");
    expect(m.today.getToday(new Date(2027, 1, 10)).notes[0]).toMatch(/pag-aayuno/);
  });
});

describe("read-aloud chunks", () => {
  it("splits into sentences and keeps litany lines as phrases", () => {
    const c = m.speech.naturalChunks("Holy Mary, pray for us.\nMother of Christ\nMother of God.");
    expect(c).toEqual(["Holy Mary, pray for us.", "Mother of Christ, Mother of God."]);
  });
  it("splits very long sentences at commas", () => {
    const long = Array.from({ length: 30 }, (_, i) => `part ${i}`).join(", ") + ".";
    for (const c of m.speech.naturalChunks(long)) expect(c.length).toBeLessThanOrEqual(180);
  });
});
