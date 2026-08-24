export interface AnalysisModelOption {
  id: string;
  label: string;
  note: string;
}

export const DEFAULT_ANALYSIS_MODEL = "google/gemini-3.7-flash";

export const ANALYSIS_MODELS: AnalysisModelOption[] = [
  {
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    note: "Cheapest — fastest, may miss subtler structure",
  },
  {
    id: "google/gemini-3.1-flash-lite",
    label: "Gemini 3.1 Flash-Lite",
    note: "Very cheap — similar tier, slightly newer",
  },
  {
    id: "google/gemini-3.7-flash",
    label: "Gemini 3.7 Flash",
    note: "Balanced — current default",
  },
  {
    id: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    note: "Most expensive — deepest reasoning",
  },
];

export const ANALYSIS_MODEL_IDS = ANALYSIS_MODELS.map((m) => m.id);

export function resolveAnalysisModel(model?: string | null): string {
  return model && ANALYSIS_MODEL_IDS.includes(model) ? model : DEFAULT_ANALYSIS_MODEL;
}
