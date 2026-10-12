/**
 * One picture per Den Analyzer component, reusing the Academy's illustrations,
 * so the rulebook shows what each switch actually detects.
 */
import type { DenComponentKey } from "@/lib/den-rules";

import { BREAKTHROUGH } from "./index";
import { LESSON_VISUALS } from "./lesson-visuals";
import type { Visual } from "./types";

const term = (name: string): Visual | undefined =>
  BREAKTHROUGH.chapters.flatMap((c) => c.terms).find((t) => t.term === name)?.visual;

export const DEN_COMPONENT_VISUALS: Partial<Record<DenComponentKey, Visual>> = Object.fromEntries(
  Object.entries({
    htf_structure: LESSON_VISUALS["l1-structure"],
    support_resistance: LESSON_VISUALS["l1-sr"],
    liquidity: LESSON_VISUALS["l2-equal"],
    liquidity_sweep: LESSON_VISUALS["l2-sweeps"],
    mss_bos: LESSON_VISUALS["l3-bos"],
    choch: term("Change of character"),
    displacement: LESSON_VISUALS["l4-displacement"],
    amd: LESSON_VISUALS["l5-phases"],
    order_block: term("Order block"),
    fvg: LESSON_VISUALS["l4-fvg"],
    breaker_block: term("Breaker block"),
    fibonacci: term("Optimal trade entry"),
    volume: LESSON_VISUALS["l1-volume"],
    risk_reward: LESSON_VISUALS["l6-targets"],
  }).filter(([, visual]) => visual !== undefined),
);
