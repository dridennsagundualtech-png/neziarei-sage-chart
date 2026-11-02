import { describe, expect, it } from "vitest";
import { mysteriesForDate } from "@/data/rosary";
import { rosarySteps, chapletSteps, decadeHailMaryRun } from "@/lib/steps";
import { BOOKS } from "@/data/books";
import { seasonFor } from "@/lib/liturgy";
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
  it("has 53 Hail Marys", () => expect(steps.filter((s) => s.title === "Hail Mary").length).toBe(53));
  it("opens with Sign of the Cross, Creed, Our Father", () =>
    expect(steps.slice(1, 4).map((s) => s.title)).toEqual(["Sign of the Cross", "Apostles' Creed", "Our Father"]));
  it("has 5 Fatima prayers", () => expect(steps.filter((s) => s.title === "Fatima Prayer").length).toBe(5));
  it("St Michael is optional", () =>
    expect(rosarySteps("joyful", { litany: false, stMichael: false }).some((s) => s.title === "Prayer to St Michael")).toBe(false));
});

describe("decade Hail Mary shortcut", () => {
  const steps = rosarySteps("joyful", { litany: false, stMichael: false });
  const firstDecade = steps.findIndex((s) => s.subtitle?.includes("of 10"));
  it("offers the shortcut on decade Hail Marys", () => expect(decadeHailMaryRun(steps, firstDecade)).not.toBeNull());
  it("one tap stands for 10 Hail Marys", () => expect(decadeHailMaryRun(steps, firstDecade)!.count).toBe(10));
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
  it("Advent 2026 starts Nov 29 in violet", () => expect(seasonFor(new Date(2026, 10, 29))).toEqual({ name: "Advent", color: "violet" }));
  it("All Souls uses its own color", () => expect(getToday(new Date(2026, 10, 2)).color).toBe("violet"));
});

describe("streak", () => {
  it("counts consecutive days to today", () =>
    expect(computeStreak(["2026-11-01", "2026-11-02", "2026-11-03"], new Date(2026, 10, 3))).toBe(3));
  it("breaks on a missed day", () => expect(computeStreak(["2026-11-01", "2026-11-03"], new Date(2026, 10, 3))).toBe(1));
});

import { bestStreak, goalMet } from "@/lib/streak";
describe("daily goal", () => {
  it("'any' goal is met by one step", () => expect(goalMet(["prayer"], "any")).toBe(true));
  it("'full' goal needs readings + rosary", () => {
    expect(goalMet(["readings"], "full")).toBe(false);
    expect(goalMet(["readings", "rosary"], "full")).toBe(true);
  });
  it("best streak finds the longest run", () => expect(bestStreak(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-10"])).toBe(3));
});
