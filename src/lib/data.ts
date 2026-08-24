/**
 * Account-backed storage layer.
 *
 * Settings, analyses and screenshots now live in the signed-in user's account
 * (database + private storage), so the same journal shows up on any device.
 * Everything is scoped by row-level security to the account that created it.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { anyDb } from "@/lib/db-types";

const sb = anyDb(supabase);
import { useSession } from "./account";
import type { AnalysisResult, ChecklistItem, Outcome } from "./analysis-types";
import type { JournalRow } from "./stats";

export interface SettingsRow {
  user_id: string;
  account_balance: number;
  currency: string;
  risk_pct: number;
  min_rr: number;
  min_sample_size: number;
  require_volume: boolean;
  learning_mode: boolean;
  beginner_mode: boolean;
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
  learning_mode: true,
  beginner_mode: true,
  strict_mode: true,
  preferred_assets: ["BTCUSD", "ETHUSD", "XAUUSD", "EURUSD", "NVDA", "AMD"],
  preferred_timeframes: ["1D", "4H", "1H", "15M", "5M"],
};

/** Placeholder id used before the session resolves. */
export const LOCAL_USER = "local";

const BUCKET = "chart-screenshots";

export type AnalysisSource = "app" | "admin_market";

export interface AnalysisRow extends JournalRow {
  user_id: string;
  source: AnalysisSource;
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

function toRow(row: Record<string, unknown>): AnalysisRow {
  return {
    ...(row as unknown as AnalysisRow),
    checklist: (row["checklist"] ?? []) as ChecklistItem[],
    timeframes: (row["timeframes"] ?? []) as string[],
    required_confirmation: (row["required_confirmation"] ?? []) as string[],
    invalidation: (row["invalidation"] ?? []) as string[],
    reasoning: (row["reasoning"] ?? []) as string[],
    requested_additional_images: (row["requested_additional_images"] ?? []) as string[],
  };
}

/** Shrinks a screenshot before uploading it so the journal stays quick to load. */
async function compress(file: File, maxSize = 1400, quality = 0.78): Promise<Blob> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read the image."));
      reader.readAsDataURL(file);
    });
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
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), "image/jpeg", quality),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

export function useSettings(_userId?: string) {
  const session = useSession();
  const userId = session.userId;

  return useQuery({
    queryKey: ["settings", userId],
    enabled: !session.loading,
    queryFn: async (): Promise<SettingsRow> => {
      if (!userId) return { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };
      const { data } = await sb
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!data) return { user_id: userId, ...DEFAULT_SETTINGS };
      return {
        ...DEFAULT_SETTINGS,
        ...(data as unknown as SettingsRow),
        account_balance: Number(data.account_balance),
        risk_pct: Number(data.risk_pct),
        min_rr: Number(data.min_rr),
      };
    },
  });
}

export function useSaveSettings(_userId?: string) {
  const queryClient = useQueryClient();
  const session = useSession();

  return useMutation({
    mutationFn: async (patch: Partial<SettingsRow>) => {
      const userId = session.userId;
      if (!userId) throw new Error("Sign in to save your settings.");
      const { data: current } = await sb
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      const next = {
        ...DEFAULT_SETTINGS,
        ...((current ?? {}) as unknown as Partial<SettingsRow>),
        ...patch,
        user_id: userId,
      };
      const { error } = await sb
        .from("settings")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(next as any, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useAnalyses(_userId?: string) {
  const session = useSession();
  const userId = session.userId;

  return useQuery({
    queryKey: ["analyses", userId],
    enabled: !session.loading,
    queryFn: async (): Promise<AnalysisRow[]> => {
      if (!userId) return [];
      const { data } = await sb
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []).map((row) => toRow(row as Record<string, unknown>));
    },
  });
}

export function useAnalysis(id?: string) {
  return useQuery({
    queryKey: ["analysis", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<AnalysisRow | null> => {
      const { data } = await sb.from("analyses").select("*").eq("id", id!).maybeSingle();
      return data ? toRow(data as Record<string, unknown>) : null;
    },
  });
}

export function useAnalysisImages(analysisId?: string) {
  return useQuery({
    queryKey: ["analysis-images", analysisId],
    enabled: Boolean(analysisId),
    queryFn: async (): Promise<StoredImage[]> => {
      const { data } = await sb
        .from("analysis_images")
        .select("id, storage_path, timeframe, position")
        .eq("analysis_id", analysisId!)
        .order("position", { ascending: true });
      const rows = data ?? [];
      if (rows.length === 0) return [];
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(rows.map((row) => row.storage_path), 3600);
      return rows.map((row, index) => ({
        id: row.id,
        storage_path: row.storage_path,
        timeframe: row.timeframe,
        position: row.position,
        url: signed?.[index]?.signedUrl ?? undefined,
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
  const session = useSession();

  return useMutation({
    mutationFn: async ({ result, images }: SaveAnalysisArgs) => {
      const userId = session.userId;
      if (!userId) throw new Error("Sign in to save this analysis.");

      const insert = {
        user_id: userId,
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
        checklist: result.checklist,
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
      };

      const { data: row, error } = await sb
        .from("analyses")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insert as any)
        .select("id")
        .single();
      if (error || !row) throw error ?? new Error("Could not save the analysis.");
      const id = row.id;

      // Screenshots upload after the row exists, so a failed upload never loses the analysis.
      try {
        let position = 0;
        for (const image of images) {
          const blob = await compress(image.file);
          const path = `${userId}/${id}/${position}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, blob, { contentType: "image/jpeg", upsert: true });
          if (!uploadError) {
            await sb.from("analysis_images").insert({
              analysis_id: id,
              user_id: userId,
              storage_path: path,
              timeframe: image.timeframe,
              position,
            });
          }
          position += 1;
        }
      } catch {
        // Keep the analysis even if screenshots could not be stored.
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await sb.from("analyses").update(patch as any).eq("id", id);
      if (error) throw error;
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
      const { data: images } = await sb
        .from("analysis_images")
        .select("storage_path")
        .eq("analysis_id", id);
      if (images && images.length > 0) {
        await supabase.storage.from(BUCKET).remove(images.map((image) => image.storage_path));
      }
      await sb.from("analysis_images").delete().eq("analysis_id", id);
      const { error } = await sb.from("analyses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analyses"] }),
  });
}
