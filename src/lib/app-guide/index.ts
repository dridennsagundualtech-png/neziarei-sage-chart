import { shuffleOptions } from "@/lib/breakthrough/quizzes";
import type { StaticQuestion } from "@/lib/static-quizzes";

import { M1_START } from "./m1-start";
import { M2_HOME } from "./m2-home";
import { M3_ANALYZE } from "./m3-analyze";
import { M4_RESULTS } from "./m4-results";
import { M5_DEN } from "./m5-den";
import { M6_RULEBOOK } from "./m6-rulebook";
import { M7_BACKTEST } from "./m7-backtest";
import { M8_HISTORY } from "./m8-history";
import { M9_STATS } from "./m9-stats";
import { M10_TOOLS } from "./m10-tools";
import { M11_ACADEMY } from "./m11-academy";
import { M12_SETTINGS } from "./m12-settings";
import { M13_ADMIN } from "./m13-admin";
import { M14_WORKFLOWS } from "./m14-workflows";
import type { Course, GuideAccess, GuideLesson, GuideModule } from "./types";

export type { Course, GuideAccess, GuideLesson, GuideModule } from "./types";

/** The App guide, in reading order. Nothing here is ever locked. */
export const GUIDE_MODULES: GuideModule[] = [
  M1_START,
  M2_HOME,
  M3_ANALYZE,
  M4_RESULTS,
  M5_DEN,
  M6_RULEBOOK,
  M7_BACKTEST,
  M8_HISTORY,
  M9_STATS,
  M10_TOOLS,
  M11_ACADEMY,
  M12_SETTINGS,
  M13_ADMIN,
  M14_WORKFLOWS,
];

export const ACCESS_LABEL: Record<GuideAccess, string> = {
  everyone: "Everyone",
  "signed-in": "Signed in",
  premium: "Premium",
  "market-data": "Market data access",
  admin: "Admin only",
};

/** Plain text of a lesson, for search. */
function lessonText(lesson: GuideLesson): string {
  return [
    lesson.title,
    lesson.summary,
    lesson.where,
    lesson.task ?? "",
    ...lesson.steps.flatMap((s) => [s.title, s.body, s.tip ?? "", ...(s.bullets ?? [])]),
  ]
    .join(" ")
    .replace(/\*\*/g, "")
    .toLowerCase();
}

/** Lesson order, lookups and search for one course. */
export function courseIndex(modules: GuideModule[]) {
  const lessons = modules.flatMap((m) => m.lessons);
  const text = new Map(lessons.map((l) => [l.id, lessonText(l)]));
  return {
    lessons,
    /** Lesson after this one, across modules. */
    next: (id: string): GuideLesson | null => {
      const i = lessons.findIndex((l) => l.id === id);
      return i >= 0 ? (lessons[i + 1] ?? null) : null;
    },
    moduleOf: (id: string) => modules.find((m) => m.lessons.some((l) => l.id === id)),
    /** Lessons whose text contains every word of the query. */
    search: (query: string): GuideLesson[] => {
      const words = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      return lessons.filter((l) => words.every((w) => (text.get(l.id) ?? "").includes(w)));
    },
  };
}

export const APP_GUIDE: Course = {
  name: "App guide",
  intro: "How to use every screen of ChartPilot, with the real button names.",
  modules: GUIDE_MODULES,
  startLabel: "Start the guide",
  showAccess: true,
  storageKey: "chartpilot.guide.done",
  footnote:
    "Badges show who can open each screen: Everyone, Signed in, Premium, Market data access (switched on by an admin) or Admin only. Signed out, your guide progress stays on this device.",
};

/** Lesson checks in the shape QuizFlow takes. They never count towards trading topic strength. */
export function guideQuestions(lesson: GuideLesson): StaticQuestion[] {
  return lesson.checks.map((c) =>
    shuffleOptions({
      id: c.id,
      topic: "trade_planning",
      prompt: c.prompt,
      options: c.options,
      correctIndex: c.correctIndex,
      explanation: c.explanation,
      ...(c.visual ? { visual: c.visual } : {}),
    }),
  );
}
