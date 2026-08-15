/**
 * Educational AI layer (server only).
 *
 * Same rules as the analysis layer: report only what is visible, never invent a
 * level, never produce a win probability, never tell the user to trade. These
 * calls TEACH — they explain reasoning, evidence, gaps and invalidation.
 */

import { TEACH_STEPS, TOPICS } from "./education-content";

const MODEL = "google/gemini-2.5-pro";

const BASE_RULES = `You are ChartPilot's teaching engine: a patient, strict trading educator.

ABSOLUTE RULES
1. Only describe what is actually visible in the screenshots. If something is not readable, say "Not visible" or "Unclear" — never invent a price, swing, gap or volume reading.
2. Never output a win probability, accuracy percentage or guarantee. Never say "buy now" or "sell now".
3. Teach reasoning and evidence. Always name what evidence supports a read, what evidence is missing, and what would invalidate it.
4. When evidence is insufficient or conflicting, the correct teaching answer is WAIT. When a setup is invalidated, the answer is NO TRADE.
5. Beginner-friendly language first, jargon explained second. No hype, no emojis.
6. Return JSON only, matching the requested shape exactly.`;

export interface TeachImage {
  dataUrl: string;
  timeframe?: string | null;
}

async function callGateway(system: string, text: string, images: TeachImage[]): Promise<Record<string, unknown>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: `${BASE_RULES}\n\n${system}` },
        {
          role: "user",
          content: [
            { type: "text", text },
            ...images.map((img) => ({ type: "image_url", image_url: { url: img.dataUrl } })),
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
    if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`The teaching engine failed (${response.status}).`);
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("The teaching engine returned an empty response.");

  const cleaned = content.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    throw new Error("The teaching engine returned an unreadable response.");
  }
}

function str(value: unknown, fallback = "Not visible in the screenshots.", max = 700): string {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, max);
}

function imagesNote(images: TeachImage[]): string {
  return images
    .map((img, i) => `Screenshot ${i + 1}: ${img.timeframe ? `timeframe ${img.timeframe}` : "timeframe not labelled"}.`)
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* 1. Teach me this chart                                              */
/* ------------------------------------------------------------------ */

export interface TeachStepResult {
  key: string;
  title: string;
  question: string;
  answer: string;
  evidence: string;
  missing: string;
  invalidation: string;
  mistake: string;
  verdictHint: string;
}

export async function teachChart(input: {
  images: TeachImage[];
  context?: string | null;
  beginner: boolean;
}): Promise<{ steps: TeachStepResult[]; closing: string }> {
  const stepList = TEACH_STEPS.map((s, i) => `${i + 1}. key "${s.key}" — ${s.title}: ${s.question}`).join("\n");

  const raw = await callGateway(
    `Walk the learner through THIS chart in ten fixed steps. For every step return: answer (what is actually on this chart, 2-4 sentences), evidence (what visibly supports it), missing (what cannot be read from the screenshot), invalidation (what would prove this reading wrong), mistake (the common beginner error at this step), verdictHint (one short line telling the learner how to check their own answer).
${input.beginner ? "Beginner mode is ON: use plain words, expand every abbreviation on first use, one idea per sentence." : "Use normal trading terminology but still explain each term briefly."}

Steps:
${stepList}

Return {"steps":[{"key","answer","evidence","missing","invalidation","mistake","verdictHint"}],"closing":"one paragraph on uncertainty and risk"}.`,
    [
      imagesNote(input.images),
      input.context ? `Existing ChartPilot analysis context: ${input.context}` : "",
      "Teach step by step. JSON only.",
    ]
      .filter(Boolean)
      .join(" "),
    input.images,
  );

  const list = Array.isArray(raw["steps"]) ? (raw["steps"] as Record<string, unknown>[]) : [];

  return {
    steps: TEACH_STEPS.map((spec) => {
      const found = list.find((item) => item?.["key"] === spec.key) ?? {};
      return {
        key: spec.key,
        title: spec.title,
        question: spec.question,
        answer: str(found["answer"]),
        evidence: str(found["evidence"], "No clear supporting evidence visible."),
        missing: str(found["missing"], "Nothing further could be determined from this screenshot."),
        invalidation: str(found["invalidation"], "A close beyond the level this read depends on."),
        mistake: str(found["mistake"], "Reading more into the chart than it actually shows."),
        verdictHint: str(found["verdictHint"], "Compare your own answer with this one before moving on.", 240),
      };
    }),
    closing: str(
      raw["closing"],
      "Everything above is a conditional interpretation of one screenshot, not a prediction. When evidence is insufficient or conflicting, waiting is the correct action.",
      900,
    ),
  };
}

/* ------------------------------------------------------------------ */
/* 2. Quiz mode                                                        */
/* ------------------------------------------------------------------ */

export type QuizType = "multiple_choice" | "true_false" | "short_answer" | "identify";

export interface QuizQuestion {
  id: string;
  topic: string;
  type: QuizType;
  prompt: string;
  options: string[];
  answerIndex: number | null;
  modelAnswer: string;
  explanation: string;
  /** Normalised reference box (0-1) for identify questions. */
  zone: { x: number; y: number; w: number; h: number } | null;
  imageIndex: number;
}

const TOPIC_KEYS = TOPICS.map((t) => t.key);

export async function makeQuiz(input: {
  images: TeachImage[];
  count: number;
  beginner: boolean;
}): Promise<{ questions: QuizQuestion[] }> {
  const raw = await callGateway(
    `Create a quiz about THIS chart, testing whether the learner can read it themselves.

Cover a spread of these topics: ${TOPIC_KEYS.join(", ")}.
Use a mix of types: "multiple_choice" (3-4 options, exactly one best answer), "true_false" (options ["True","False"]), "short_answer", and "identify" (the learner taps an area of the chart).
Include questions such as: what is the market structure, what is the likely directional bias, where is the nearest liquidity, was liquidity swept, was there a bullish/bearish MSS, where is invalidation, which area is a reasonable entry, is this a trade or a WAIT, is there enough evidence at all.
For "identify" questions include zone = the correct area as normalised coordinates {x,y,w,h} with 0,0 at the top-left of the referenced screenshot; make the zone generous (at least 0.08 wide and tall) because the learner is tapping with a finger.
Every question needs an explanation that teaches WHY, never just the answer. Only ask about things visible in the screenshots. ${input.beginner ? "Beginner mode ON: simple wording, expand abbreviations." : ""}

Return {"questions":[{"topic","type","prompt","options":[],"answerIndex",_"modelAnswer","explanation","zone","imageIndex"}]} with ${input.count} questions.`,
    `${imagesNote(input.images)} Produce ${input.count} questions. JSON only.`,
    input.images,
  );

  const list = Array.isArray(raw["questions"]) ? (raw["questions"] as Record<string, unknown>[]) : [];

  const questions = list.slice(0, 12).map((item, index): QuizQuestion => {
    const type = (["multiple_choice", "true_false", "short_answer", "identify"] as QuizType[]).includes(
      item["type"] as QuizType,
    )
      ? (item["type"] as QuizType)
      : "short_answer";
    const options = Array.isArray(item["options"])
      ? (item["options"] as unknown[]).slice(0, 5).map((o) => String(o).slice(0, 160))
      : [];
    const zoneRaw = item["zone"] as Record<string, unknown> | undefined;
    const num = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : fallback;

    return {
      id: `q${index}`,
      topic: TOPIC_KEYS.includes(item["topic"] as never) ? String(item["topic"]) : "market_structure",
      type,
      prompt: str(item["prompt"], "Describe what you see.", 400),
      options: type === "true_false" && options.length < 2 ? ["True", "False"] : options,
      answerIndex:
        typeof item["answerIndex"] === "number" && Number.isFinite(item["answerIndex"])
          ? Math.max(0, Math.round(item["answerIndex"] as number))
          : null,
      modelAnswer: str(item["modelAnswer"], "See the explanation.", 500),
      explanation: str(item["explanation"], "Explanation unavailable.", 700),
      zone:
        type === "identify" && zoneRaw
          ? {
              x: num(zoneRaw["x"], 0.4),
              y: num(zoneRaw["y"], 0.4),
              w: Math.max(num(zoneRaw["w"], 0.15), 0.08),
              h: Math.max(num(zoneRaw["h"], 0.15), 0.08),
            }
          : null,
      imageIndex:
        typeof item["imageIndex"] === "number" && item["imageIndex"] >= 0
          ? Math.min(Math.round(item["imageIndex"] as number), Math.max(input.images.length - 1, 0))
          : 0,
    };
  });

  if (questions.length === 0) throw new Error("No quiz could be built from these screenshots.");
  return { questions };
}

/* ------------------------------------------------------------------ */
/* 3. Short-answer grading                                             */
/* ------------------------------------------------------------------ */

export async function gradeAnswers(input: {
  items: { id: string; prompt: string; modelAnswer: string; userAnswer: string }[];
}): Promise<{ results: { id: string; verdict: string; explanation: string }[] }> {
  const raw = await callGateway(
    `Grade each learner answer against the reference answer. verdict is exactly "CORRECT", "PARTIALLY CORRECT" or "INCORRECT". Be fair to different wording that shows the same understanding, and strict about claims the chart cannot support. The explanation must teach WHY, and name the missed concept when relevant.

Return {"results":[{"id","verdict","explanation"}]}.`,
    JSON.stringify(input.items).slice(0, 8000),
    [],
  );

  const list = Array.isArray(raw["results"]) ? (raw["results"] as Record<string, unknown>[]) : [];
  return {
    results: input.items.map((item) => {
      const found = list.find((r) => String(r?.["id"]) === item.id) ?? {};
      const verdict = String(found["verdict"] ?? "").toUpperCase();
      return {
        id: item.id,
        verdict: ["CORRECT", "PARTIALLY CORRECT", "INCORRECT"].includes(verdict) ? verdict : "PARTIALLY CORRECT",
        explanation: str(found["explanation"], "Compare your answer with the reference answer.", 700),
      };
    }),
  };
}

/* ------------------------------------------------------------------ */
/* 4. Identify-it reference zones                                      */
/* ------------------------------------------------------------------ */

export interface IdentifyTarget {
  label: string;
  topic: string;
  zone: { x: number; y: number; w: number; h: number };
  explanation: string;
  imageIndex: number;
}

const IDENTIFY_LABELS = [
  "Swing high",
  "Swing low",
  "Support",
  "Resistance",
  "Liquidity",
  "Liquidity sweep",
  "MSS / BOS",
  "FVG",
  "Entry",
  "Invalidation",
  "Target",
];

export async function identifyTargets(input: { images: TeachImage[] }): Promise<{ targets: IdentifyTarget[] }> {
  const raw = await callGateway(
    `Mark reference areas on this chart so a learner can practise pointing them out.

For each of these labels, IF and ONLY IF it is genuinely visible, return a normalised box {x,y,w,h} (0,0 = top-left of the referenced screenshot) covering the area, plus an explanation of why that area qualifies. Skip any label that is not visible — never invent one. Make each box a tolerance zone, at least 0.08 wide and 0.08 tall.

Labels: ${IDENTIFY_LABELS.join(", ")}.

Return {"targets":[{"label","topic","zone":{"x","y","w","h"},"explanation","imageIndex"}]}.`,
    `${imagesNote(input.images)} JSON only.`,
    input.images,
  );

  const list = Array.isArray(raw["targets"]) ? (raw["targets"] as Record<string, unknown>[]) : [];
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : fallback;

  const targets = list
    .filter((item) => IDENTIFY_LABELS.includes(String(item?.["label"])))
    .slice(0, 11)
    .map((item): IdentifyTarget => {
      const zone = (item["zone"] ?? {}) as Record<string, unknown>;
      return {
        label: String(item["label"]),
        topic: TOPIC_KEYS.includes(item["topic"] as never) ? String(item["topic"]) : "market_structure",
        zone: {
          x: num(zone["x"], 0.4),
          y: num(zone["y"], 0.4),
          w: Math.max(num(zone["w"], 0.15), 0.08),
          h: Math.max(num(zone["h"], 0.15), 0.08),
        },
        explanation: str(item["explanation"], "Reference area.", 500),
        imageIndex:
          typeof item["imageIndex"] === "number" && item["imageIndex"] >= 0
            ? Math.min(Math.round(item["imageIndex"] as number), Math.max(input.images.length - 1, 0))
            : 0,
      };
    });

  if (targets.length === 0) throw new Error("Nothing could be marked reliably on this screenshot.");
  return { targets };
}

/* ------------------------------------------------------------------ */
/* 5. Human vs AI comparison                                           */
/* ------------------------------------------------------------------ */

export interface CompareField {
  label: string;
  verdict: string;
  explanation: string;
}

export async function compareHuman(input: {
  human: Record<string, string>;
  analysis: string;
  beginner: boolean;
}): Promise<{ fields: CompareField[]; score: number; max: number; missed: string; encouragement: string }> {
  const raw = await callGateway(
    `Compare the learner's own analysis with ChartPilot's analysis, field by field, to make the learner more independent.

For each field return verdict "CORRECT", "PARTIALLY CORRECT" or "INCORRECT" (use "PARTIALLY CORRECT" generously when the reasoning is reasonable but incomplete), plus an explanation that teaches. Judge reasoning quality, not agreement with the AI: if the learner's read is defensible from the chart, say so even where it differs. Where the learner missed a concept, explain that concept properly in "missed".
${input.beginner ? "Beginner mode ON: simple wording." : ""}

Return {"fields":[{"label","verdict","explanation"}],"missed":"...","encouragement":"one honest paragraph, no flattery, reminding that neither analysis is a prediction"}.`,
    `LEARNER ANALYSIS: ${JSON.stringify(input.human).slice(0, 3000)}\n\nCHARTPILOT ANALYSIS: ${input.analysis.slice(0, 5000)}\n\nJSON only.`,
    [],
  );

  const list = Array.isArray(raw["fields"]) ? (raw["fields"] as Record<string, unknown>[]) : [];
  const fields = list.slice(0, 12).map((item): CompareField => {
    const verdict = String(item["verdict"] ?? "").toUpperCase();
    return {
      label: str(item["label"], "Field", 60),
      verdict: ["CORRECT", "PARTIALLY CORRECT", "INCORRECT"].includes(verdict) ? verdict : "PARTIALLY CORRECT",
      explanation: str(item["explanation"], "No explanation returned.", 600),
    };
  });

  const earned = fields.reduce(
    (sum, f) => sum + (f.verdict === "CORRECT" ? 1 : f.verdict === "PARTIALLY CORRECT" ? 0.5 : 0),
    0,
  );

  return {
    fields,
    score: Math.round(earned * 10) / 10,
    max: fields.length,
    missed: str(raw["missed"], "Nothing significant was missed.", 900),
    encouragement: str(
      raw["encouragement"],
      "Neither your analysis nor ChartPilot's is a prediction. Both are conditional readings of one screenshot — the goal is better reasoning, not agreement.",
      900,
    ),
  };
}
