import type { Course } from "@/lib/app-guide/types";

import { FC1_START } from "./m1-start";
import { FC2_RISK } from "./m2-risk";
import { FC3_CHARTS } from "./m3-charts";
import { FC4_SETUP } from "./m4-setup";
import { FC5_PRACTICE } from "./m5-practice";
import { FC6_MEASURE } from "./m6-measure";
import { FC7_LIVE } from "./m7-live";

/** Learning to trade, start to finish, inside the app. Lesson ids start with "fc-". */
export const FULL_COURSE: Course = {
  name: "Full course",
  intro:
    "From zero to a tested plan: risk, charts, one setup, practice on demo, measuring, then small real money. Every lesson has something to try and a short check.",
  modules: [FC1_START, FC2_RISK, FC3_CHARTS, FC4_SETUP, FC5_PRACTICE, FC6_MEASURE, FC7_LIVE],
  startLabel: "Start the course",
  showAccess: false,
  storageKey: "chartpilot.course.done",
  footnote:
    "Education, not financial advice. The starter setup is a practice framework, not a proven strategy: your own journal decides whether it works for you. Signed out, your progress stays on this device.",
};
