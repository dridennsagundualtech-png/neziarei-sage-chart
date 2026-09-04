export interface AnalysisModelOption {
  id: string;
  label: string;
  note: string;
}

export const DEFAULT_ANALYSIS_MODEL = "google/gemini-3.7-flash";

/** Sentinel id: the server picks the first model in AUTO_MODEL_CHAIN that answers. */
export const AUTO_MODEL = "auto";

/** Sentinel id: admin server — fixed rules over the OHLC data. */
export const DEN_MODEL = "den-analyzer";

export const DEN_MODEL_OPTION: AnalysisModelOption = {
  id: DEN_MODEL,
  label: "Den Analyzer (recommended)",
  note: "Instant, free and fully deterministic — fixed rules read the OHLC data only",
};

export const AUTO_MODEL_OPTION: AnalysisModelOption = {
  id: AUTO_MODEL,
  label: "Automatic (AI cascade)",
  note: "Tries the AI models in order, falling back automatically if one is unavailable or out of credits",
};

/**
 * Only models that are strong at structured numeric reasoning and accept the
 * request shape this app sends (temperature + json_object) are listed.
 */
export const ANALYSIS_MODELS: AnalysisModelOption[] = [
  {
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    note: "Cheapest — fastest, may miss subtler structure",
  },
  {
    id: DEFAULT_ANALYSIS_MODEL,
    label: "Gemini 3.7 Flash",
    note: "Balanced — current default",
  },
  {
    id: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    note: "Expensive — deep reasoning, proven",
  },
];

/** Order the automatic mode walks: cheap-but-good first, deep reasoning last. */
export const AUTO_MODEL_CHAIN: string[] = [
  DEFAULT_ANALYSIS_MODEL,
  "google/gemini-3.6-flash",
  "google/gemini-3.5-flash",
  "google/gemini-3.1-flash-lite",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
];

export const SELECTABLE_MODELS: AnalysisModelOption[] = [
  DEN_MODEL_OPTION,
  AUTO_MODEL_OPTION,
  ...ANALYSIS_MODELS,
];

/** True when the selection runs the rule-based engine instead of any model. */
export function isDenModel(model?: string | null): boolean {
  return model === DEN_MODEL;
}

export const ANALYSIS_MODEL_IDS = ANALYSIS_MODELS.map((m) => m.id);

export function resolveAnalysisModel(model?: string | null): string {
  return model && ANALYSIS_MODEL_IDS.includes(model) ? model : DEFAULT_ANALYSIS_MODEL;
}

/** Models to attempt, in order, for a given selection. */
export function modelCandidates(model?: string | null): string[] {
  if (model === AUTO_MODEL) return [...AUTO_MODEL_CHAIN];
  const picked = resolveAnalysisModel(model);
  return [picked, ...AUTO_MODEL_CHAIN.filter((id) => id !== picked)];
}

export const FALLBACK_MODEL = "google/gemini-2.5-pro";

/**
 * Gateway cascade for a user selection: the selected model (or the default in
 * automatic mode) first, then Gemini 2.5 Pro. The OpenRouter free model is
 * appended by the server as the third and last step.
 */
export function cascadeModels(model?: string | null): string[] {
  const first = model === AUTO_MODEL ? DEFAULT_ANALYSIS_MODEL : resolveAnalysisModel(model);
  return first === FALLBACK_MODEL ? [first] : [first, FALLBACK_MODEL];
}

/** Human-readable label for a gateway model id, for the "ran on" note. */
export function providerLabelFor(model: string): string {
  if (model === DEN_MODEL) return DEN_MODEL_OPTION.label;
  const option = ANALYSIS_MODELS.find((item) => item.id === model);
  return option ? option.label : model;
}


export type ModelHealth = "ok" | "rate_limited" | "no_credits" | "blocked" | "unavailable";

export interface ModelStatus {
  id: string;
  health: ModelHealth;
  detail: string;
}
