import { describe, expect, it } from "vitest";
import { mysteriesForDate } from "@/data/rosary";
import { rosarySteps, chapletSteps, decadeHailMaryRun } from "@/lib/steps";
import { BOOKS } from "@/data/books";
import { massDay } from "@/lib/mass-day";
import { readFileSync } from "node:fs";
import { VERSES } from "@/data/verses";
import { getToday } from "@/lib/today";
import { computeStreak } from "@/lib/streak";

// 2026-11-01 is a Sunday
const day = (n: number) => new Date(2026, 10, 1 + n);

describe("rosary mysteries by weekday", () => {
  it("Sunday Glorious", () => expect(mysteriesForDate(day(0))).toBe("glorious"));
  it("Monday Joyful", () => expect(mysteriesForDate(day(1))).toBe("joyful"));
  it("Tuesday Sorrowful", () => expect(mysteriesForDate(day(2))).toBe("sorrowful"));
  it("Wednesday Glorious", () => expect(mysteriesForDate(day(3))).toBe("glorious"));
  it("Thursday Luminous", () => expect(mysteriesForDate(day(4))).toBe("luminous"));
  it("Friday Sorrowful", () => expect(mysteriesForDate(day(5))).toBe("sorrowful"));
  it("Saturday Joyful", () => expect(mysteriesForDate(day(6))).toBe("joyful"));
});

describe("rosary order", () => {
  const steps = rosarySteps("joyful", { litany: false, stMichael: true });
  it("has 53 Hail Marys", () =>
    expect(steps.filter((s) => s.title === "Hail Mary").length).toBe(53));
  it("opens with Sign of the Cross, Creed, Our Father", () =>
    expect(steps.slice(1, 4).map((s) => s.title)).toEqual([
      "Sign of the Cross",
      "Apostles' Creed",
      "Our Father",
    ]));
  it("has 5 Fatima prayers", () =>
    expect(steps.filter((s) => s.title === "Fatima Prayer").length).toBe(5));
  it("St Michael is optional", () =>
    expect(
      rosarySteps("joyful", { litany: false, stMichael: false }).some(
        (s) => s.title === "Prayer to St Michael",
      ),
    ).toBe(false));
});

describe("decade Hail Mary shortcut", () => {
  const steps = rosarySteps("joyful", { litany: false, stMichael: false });
  const firstDecade = steps.findIndex((s) => s.subtitle?.includes("of 10"));
  it("offers the shortcut on decade Hail Marys", () =>
    expect(decadeHailMaryRun(steps, firstDecade)).not.toBeNull());
  it("one tap stands for 10 Hail Marys", () =>
    expect(decadeHailMaryRun(steps, firstDecade)!.count).toBe(10));
  it("lands on the decade's Glory Be", () =>
    expect(steps[decadeHailMaryRun(steps, firstDecade)!.to]!.title).toBe("Glory Be"));
  it("works from the middle of a decade", () =>
    expect(steps[decadeHailMaryRun(steps, firstDecade + 5)!.to]!.title).toBe("Glory Be"));
  it("not offered on the opening 3 Hail Marys", () => {
    const pendant = steps.findIndex((s) => s.subtitle?.includes("of 3"));
    expect(decadeHailMaryRun(steps, pendant)).toBeNull();
  });
  it("not offered on chaplet beads", () => {
    const chap = chapletSteps();
    const bead = chap.findIndex((s) => s.subtitle?.includes("of 10"));
    expect(decadeHailMaryRun(chap, bead)).toBeNull();
  });
});

describe("chaplet", () => {
  it("has 50 'For the sake' beads", () =>
    expect(chapletSteps().filter((s) => s.title.startsWith("For the sake")).length).toBe(50));
});

describe("bible & liturgy", () => {
  it("has 73 books, 46 OT", () => {
    expect(BOOKS.length).toBe(73);
    expect(BOOKS.filter((b) => b.testament === "OT").length).toBe(46);
  });
  it("Advent 2026 starts Nov 29 in violet", () => {
    const d = massDay(new Date(2026, 10, 29));
    expect(d.name).toBe("First Sunday of Advent");
    expect(d.color).toBe("violet");
    expect(d.sundayCycle).toBe("B");
  });
  it("All Souls uses its own color", () =>
    expect(getToday(new Date(2026, 10, 2)).color).toBe("violet"));
});

describe("streak", () => {
  it("counts consecutive days to today", () =>
    expect(computeStreak(["2026-11-01", "2026-11-02", "2026-11-03"], new Date(2026, 10, 3))).toBe(
      3,
    ));
  it("breaks on a missed day", () =>
    expect(computeStreak(["2026-11-01", "2026-11-03"], new Date(2026, 10, 3))).toBe(1));
});

import { bestStreak, goalMet } from "@/lib/streak";
describe("daily goal", () => {
  it("'any' goal is met by one step", () => expect(goalMet(["prayer"], "any")).toBe(true));
  it("'full' goal needs every practice in the plan", () => {
    expect(goalMet(["readings"], "full", ["readings", "rosary"])).toBe(false);
    expect(goalMet(["readings", "rosary"], "full", ["readings", "rosary"])).toBe(true);
  });
  it("best streak finds the longest run", () =>
    expect(bestStreak(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-10"])).toBe(3));
});

describe("church calendar", () => {
  const at = (y: number, m: number, d: number) => massDay(new Date(y, m - 1, d));
  it("Easter 2027 is March 28", () =>
    expect(at(2027, 3, 28).name).toBe("Easter Sunday of the Resurrection of the Lord"));
  it("Ash Wednesday 2027 is February 10", () => expect(at(2027, 2, 10).name).toBe("Ash Wednesday"));
  it("Pentecost is red", () => expect(at(2027, 5, 16).color).toBe("red"));
  it("Christ the King ends the year", () =>
    expect(at(2026, 11, 22).name).toBe("Our Lord Jesus Christ, King of the Universe"));
  it("Gaudete Sunday is rose", () => expect(at(2026, 12, 13).color).toBe("rose"));
  it("Epiphany moves to Sunday", () =>
    expect(at(2027, 1, 3).name).toBe("The Epiphany of the Lord"));
  it("an obligatory memorial names the day", () =>
    expect(at(2026, 11, 4).title).toBe("Saint Charles Borromeo, bishop"));
  it("Joseph moves out of Holy Week", () => {
    // 2035: March 19 is Monday of Holy Week, so Saint Joseph moves to the Saturday before Palm Sunday.
    expect(at(2035, 3, 17).name).toBe("Saint Joseph, Spouse of the Blessed Virgin Mary");
  });
  it("31st Sunday, Year A readings", () => {
    const r = at(2026, 11, 1).readings; // All Saints replaces the Sunday in 2026
    expect(r.find((x) => x.kind === "gospel")?.options[0]?.citation).toBe("Matthew 5:1-12a");
    expect(at(2023, 11, 5).readings.find((x) => x.kind === "gospel")?.options[0]?.citation).toBe(
      "Matthew 23:1-12",
    );
  });
  it("every day from 2026 to 2028 has a name and a Gospel", () => {
    for (
      let d = new Date(2026, 0, 1);
      d.getFullYear() < 2029;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    ) {
      const m = massDay(d);
      expect(m.name.length, d.toDateString()).toBeGreaterThan(3);
      const gospel = m.readings.find((r) => r.kind === "gospel");
      expect(gospel?.options.length ?? 0, `${d.toDateString()} ${m.name}`).toBeGreaterThan(0);
    }
  });
});

describe("bundled Bible", () => {
  const book = (tr: string, id: string) =>
    JSON.parse(readFileSync(`public/bible/${tr}/${id}.json`, "utf8")) as string[][];
  it("every book has every chapter in both translations", () => {
    for (const tr of ["drc", "cpdv"])
      for (const b of BOOKS) expect(book(tr, b.id).length, `${tr} ${b.id}`).toBe(b.chapters);
  });
  it("psalms use the numbering of the Mass", () =>
    expect(book("drc", "PSA")[22]![0]).toContain("The Lord ruleth me"));
  it("daily verses point at real verses", () => {
    for (const v of VERSES) {
      const [b, c, vs] = v.key.split(".");
      const first = Number(vs!.split("-")[0]);
      expect(book("drc", b!)[Number(c) - 1]![first - 1], v.ref).toBeTruthy();
    }
  });
});
