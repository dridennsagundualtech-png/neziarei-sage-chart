/**
 * Learning progress store (account-backed, same as the journal).
 *
 * Tracks quiz/practice attempts per topic, completed lessons, saved practice
 * charts, human-vs-AI comparisons and post-trade reviews. Nothing here is a
 * performance promise — it only measures what the user has actually answered.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "./account";
import { ALL_LESSONS, TOPICS, type Lesson, type PracticeTag, type TopicKey } from "./education-content";


export type Verdict = "CORRECT" | "PARTIALLY CORRECT" | "INCORRECT";

export const VERDICT_WEIGHT: Record<Verdict, number> = {
  CORRECT: 1,
  "PARTIALLY CORRECT": 0.5,
  INCORRECT: 0,
};

export interface Attempt {
  id: string;
  topic: TopicKey;
  verdict: Verdict;
  at: string;
  source: "quiz" | "identify" | "teach" | "human_vs_ai" | "practice";
}

export interface PracticeEntry {
  analysisId: string;
  tag: PracticeTag;
  note: string | null;
  at: string;
}

export interface PostTradeReview {
  analysisId: string;
  lessons: string[];
  processQuality: "GOOD PROCESS" | "FLAWED PROCESS" | "UNCLEAR";
  note: string | null;
  at: string;
}

export interface Comparison {
  id: string;
  analysisId: string | null;
  asset: string;
  score: number;
  max: number;
  at: string;
  fields: { label: string; verdict: Verdict; explanation: string }[];
}

export interface LearningState {
  attempts: Attempt[];
  lessons: Record<string, string>;
  practice: PracticeEntry[];
  reviews: Record<string, PostTradeReview>;
  comparisons: Comparison[];
}

const EMPTY: LearningState = {
  attempts: [],
  lessons: {},
  practice: [],
  reviews: {},
  comparisons: [],
};

async function read(userId: string | null): Promise<LearningState> {
  if (!userId) return EMPTY;
  const { data } = await supabase
    .from("learning_progress")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  return { ...EMPTY, ...((data?.state ?? {}) as Partial<LearningState>) };
}

async function write(userId: string, state: LearningState): Promise<void> {
  await supabase
    .from("learning_progress")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ user_id: userId, state: state as any } as any, { onConflict: "user_id" });
}


function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface TopicScore {
  topic: TopicKey;
  attempts: number;
  /** null until at least 3 attempts exist — small samples mean nothing. */
  percent: number | null;
  wrong: number;
}

export function topicScores(state: LearningState): TopicScore[] {
  return TOPICS.map(({ key }) => {
    const list = state.attempts.filter((a) => a.topic === key);
    const wrong = list.filter((a) => a.verdict === "INCORRECT").length;
    const earned = list.reduce((sum, a) => sum + VERDICT_WEIGHT[a.verdict], 0);
    return {
      topic: key,
      attempts: list.length,
      wrong,
      percent: list.length >= 3 ? Math.round((earned / list.length) * 100) : null,
    };
  });
}

export function knowledgeScore(state: LearningState): number | null {
  const scored = topicScores(state).filter((t) => t.percent !== null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((s, t) => s + (t.percent ?? 0), 0) / scored.length);
}

export function weakTopics(state: LearningState): TopicScore[] {
  return topicScores(state)
    .filter((t) => t.attempts > 0 && (t.percent === null || t.percent < 70))
    .sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0));
}

export function recommendedLessons(state: LearningState, limit = 4): Lesson[] {
  const weak = weakTopics(state).map((t) => t.topic);
  const done = new Set(Object.keys(state.lessons));
  const byWeak = ALL_LESSONS.filter((l) => weak.includes(l.topic) && !done.has(l.id));
  const rest = ALL_LESSONS.filter((l) => !done.has(l.id) && !byWeak.includes(l));
  return [...byWeak, ...rest].slice(0, limit);
}

/** Spaced practice prompt: the topic missed most often, with a nudge. */
export function spacedPrompt(state: LearningState): { topic: TopicKey; wrong: number } | null {
  const worst = topicScores(state)
    .filter((t) => t.wrong >= 2)
    .sort((a, b) => b.wrong - a.wrong)[0];
  return worst ? { topic: worst.topic, wrong: worst.wrong } : null;
}

export function useLearning() {
  const session = useSession();
  return useQuery({
    queryKey: ["learning", session.userId],
    enabled: !session.loading,
    queryFn: async () => read(session.userId),
  });
}

function useLearningMutation<T>(apply: (state: LearningState, input: T) => LearningState) {
  const queryClient = useQueryClient();
  const session = useSession();
  return useMutation({
    mutationFn: async (input: T) => {
      const userId = session.userId;
      if (!userId) throw new Error("Sign in to save your progress.");
      await write(userId, apply(await read(userId), input));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning"] }),
  });
}


export function useRecordAttempts() {
  return useLearningMutation<{ topic: TopicKey; verdict: Verdict; source: Attempt["source"] }[]>(
    (state, items) => ({
      ...state,
      attempts: [
        ...items.map((item) => ({ id: newId(), at: new Date().toISOString(), ...item })),
        ...state.attempts,
      ].slice(0, 800),
    }),
  );
}

export function useCompleteLesson() {
  return useLearningMutation<string>((state, lessonId) => ({
    ...state,
    lessons: { ...state.lessons, [lessonId]: new Date().toISOString() },
  }));
}

export function useSavePractice() {
  return useLearningMutation<{ analysisId: string; tag: PracticeTag; note?: string | null }>(
    (state, input) => ({
      ...state,
      practice: [
        { analysisId: input.analysisId, tag: input.tag, note: input.note ?? null, at: new Date().toISOString() },
        ...state.practice.filter((p) => p.analysisId !== input.analysisId),
      ],
    }),
  );
}

export function useSaveReview() {
  return useLearningMutation<Omit<PostTradeReview, "at">>((state, input) => ({
    ...state,
    reviews: { ...state.reviews, [input.analysisId]: { ...input, at: new Date().toISOString() } },
  }));
}

export function useSaveComparison() {
  return useLearningMutation<Omit<Comparison, "id" | "at">>((state, input) => ({
    ...state,
    comparisons: [{ id: newId(), at: new Date().toISOString(), ...input }, ...state.comparisons].slice(0, 200),
  }));
}
