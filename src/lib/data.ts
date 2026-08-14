/**
 * Local-first storage layer.
 *
 * ChartPilot has no login: your settings, analyses and screenshots live in this
 * browser only. Nothing is uploaded to an account, and nothing is shared.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AnalysisResult, ChecklistItem, Outcome } from "./analysis-types";
import type { JournalRow } from "./stats";

const SETTINGS_KEY = "chartpilot.settings.v1";
const ANALYSES_KEY = "chartpilot.analyses.v1";
const IMAGES_KEY = "chartpilot.images.v1";

export interface SettingsRow {
  user_id: string;
  account_balance: number;
  currency: string;
  risk_pct: number;
  min_rr: number;
  min_sample_size: number;
  require_volume: boolean;
  learning_mode: boolean;
  strict_mode: boolean;
  preferred_assets: string[];
  preferred_timeframes: string[];
}

export const DEFAULT_SETTINGS: Omit<SettingsRow, "user_id"> = {
  account_balance: 0,
  currency: "USD",
  risk_pct: 1,
  min_rr: 2,
  min_sample_size: 100,
  require_volume: false,
  learning_mode: false,
  strict_mode: true,
  preferred_assets: ["BTCUSD", "ETHUSD", "XAUUSD", "EURUSD", "NVDA", "AMD"],
  preferred_timeframes: ["1D", "4H", "1H", "15M", "5M"],
};

export const LOCAL_USER = "local";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export interface AnalysisRow extends JournalRow {
  user_id: string;
  htf_bias: string;
  visual_evidence: string;
  entry_zone: string | null;
  stop_loss: string | null;
  tp1: string | null;
  tp2: string | null;
  summary: string | null;
  sufficient_information: boolean;
  requested_additional_images: string[];
  required_confirmation: string[];
  invalidation: string[];
  reasoning: string[];
  notes: string | null;
  invalidation_reason: string | null;
  closed_at: string | null;
}

export interface StoredImage {
  id: string;
  storage_path: string;
  timeframe: string | null;
  position: number;
  url?: string | undefined;
}

type ImageStore = Record<string, { dataUrl: string; timeframe: string | null }[]>;

function readAnalyses(): AnalysisRow[] {
  return readJson<AnalysisRow[]>(ANALYSES_KEY, []);
}

/** Shrinks a screenshot so a long journal still fits in browser storage. */
async function compress(file: File, maxSize = 1200, quality = 0.72): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode the image."));
      element.src = dataUrl;
    });
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return dataUrl;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

export function useSettings(_userId?: string) {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<SettingsRow> => ({
      user_id: LOCAL_USER,
      ...DEFAULT_SETTINGS,
      ...readJson<Partial<SettingsRow>>(SETTINGS_KEY, {}),
    }),
  });
}

export function useSaveSettings(_userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<SettingsRow>) => {
      const current = readJson<Partial<SettingsRow>>(SETTINGS_KEY, {});
      writeJson(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...current, ...patch, user_id: LOCAL_USER });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useAnalyses(_userId?: string) {
  return useQuery({
    queryKey: ["analyses"],
    queryFn: async (): Promise<AnalysisRow[]> =>
      readAnalyses()
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  });
}

export function useAnalysis(id?: string) {
  return useQuery({
    queryKey: ["analysis", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<AnalysisRow | null> =>
      readAnalyses().find((row) => row.id === id) ?? null,
  });
}

export function useAnalysisImages(analysisId?: string) {
  return useQuery({
    queryKey: ["analysis-images", analysisId],
    enabled: Boolean(analysisId),
    queryFn: async (): Promise<StoredImage[]> => {
      const store = readJson<ImageStore>(IMAGES_KEY, {});
      return (store[analysisId!] ?? []).map((image, index) => ({
        id: `${analysisId}-${index}`,
        storage_path: `${analysisId}/${index}`,
        timeframe: image.timeframe,
        position: index,
        url: image.dataUrl,
      }));
    },
  });
}

export interface SaveAnalysisArgs {
  userId?: string;
  result: AnalysisResult;
  images: { file: File; timeframe: string | null }[];
}

export function useSaveAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ result, images }: SaveAnalysisArgs) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const row: AnalysisRow = {
        id,
        user_id: LOCAL_USER,
        created_at: new Date().toISOString(),
        asset: result.asset,
        market_type: result.market_type,
        timeframes: result.timeframes,
        primary_timeframe: result.primary_timeframe,
        direction: result.direction,
        setup_stage: result.setup_stage,
        score: result.score,
        max_score: result.max_score,
        grade: result.grade,
        visual_evidence: result.visual_evidence,
        htf_bias: result.htf_bias,
        checklist: result.checklist as ChecklistItem[],
        entry_zone: result.entry_zone,
        stop_loss: result.stop_loss,
        tp1: result.tp1,
        tp2: result.tp2,
        risk_reward: result.risk_reward,
        required_confirmation: result.required_confirmation,
        invalidation: result.invalidation,
        reasoning: result.reasoning,
        summary: result.summary,
        sufficient_information: result.sufficient_information,
        requested_additional_images: result.requested_additional_images,
        outcome: (result.direction === "NO TRADE" ? "NO TRADE" : "OPEN") as Outcome,
        r_result: null,
        notes: null,
        invalidation_reason: null,
        closed_at: null,
      };

      writeJson(ANALYSES_KEY, [row, ...readAnalyses()]);

      // Screenshots are stored separately so a quota problem never loses the analysis.
      try {
        const stored = await Promise.all(
          images.map(async (image) => ({
            dataUrl: await compress(image.file),
            timeframe: image.timeframe,
          })),
        );
        const store = readJson<ImageStore>(IMAGES_KEY, {});
        store[id] = stored;
        writeJson(IMAGES_KEY, store);
      } catch {
        // Out of browser storage: keep the analysis, drop the images silently.
      }

      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analyses"] }),
  });
}

export function useUpdateAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<{
        outcome: Outcome;
        r_result: number | null;
        setup_stage: string;
        notes: string | null;
        invalidation_reason: string | null;
        closed_at: string | null;
      }>;
    }) => {
      writeJson(
        ANALYSES_KEY,
        readAnalyses().map((row) => (row.id === id ? { ...row, ...patch } : row)),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analysis", variables.id] });
    },
  });
}

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      writeJson(
        ANALYSES_KEY,
        readAnalyses().filter((row) => row.id !== id),
      );
      const store = readJson<ImageStore>(IMAGES_KEY, {});
      delete store[id];
      writeJson(IMAGES_KEY, store);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analyses"] }),
  });
}
