import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
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

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data: result }) => {
      setSession(result.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, ready, user: session?.user ?? null };
}

export function useSettings(userId?: string) {
  return useQuery({
    queryKey: ["settings", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<SettingsRow> => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as SettingsRow;

      const insert = { user_id: userId!, ...DEFAULT_SETTINGS };
      const { data: created, error: insertError } = await supabase
        .from("settings")
        .insert(insert)
        .select("*")
        .single();
      if (insertError) throw insertError;
      return created as SettingsRow;
    },
  });
}

export function useSaveSettings(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<SettingsRow>) => {
      const { error } = await supabase
        .from("settings")
        .update(patch)
        .eq("user_id", userId!);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", userId] }),
  });
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

function coerceRow(row: Record<string, unknown>): AnalysisRow {
  const asArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  return {
    ...(row as unknown as AnalysisRow),
    checklist: (Array.isArray(row["checklist"]) ? row["checklist"] : []) as ChecklistItem[],
    timeframes: asArray(row["timeframes"]),
    requested_additional_images: asArray(row["requested_additional_images"]),
    required_confirmation: asArray(row["required_confirmation"]),
    invalidation: asArray(row["invalidation"]),
    reasoning: asArray(row["reasoning"]),
  };
}

export function useAnalyses(userId?: string) {
  return useQuery({
    queryKey: ["analyses", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<AnalysisRow[]> => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => coerceRow(row as Record<string, unknown>));
    },
  });
}

export function useAnalysis(id?: string) {
  return useQuery({
    queryKey: ["analysis", id],
    enabled: Boolean(id),
    queryFn: async (): Promise<AnalysisRow | null> => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data ? coerceRow(data as Record<string, unknown>) : null;
    },
  });
}

export interface StoredImage {
  id: string;
  storage_path: string;
  timeframe: string | null;
  position: number;
  url?: string | undefined;
}

export function useAnalysisImages(analysisId?: string) {
  return useQuery({
    queryKey: ["analysis-images", analysisId],
    enabled: Boolean(analysisId),
    queryFn: async (): Promise<StoredImage[]> => {
      const { data, error } = await supabase
        .from("analysis_images")
        .select("id, storage_path, timeframe, position")
        .eq("analysis_id", analysisId!)
        .order("position");
      if (error) throw error;
      const rows = (data ?? []) as StoredImage[];
      return Promise.all(
        rows.map(async (row) => {
          const { data: signed } = await supabase.storage
            .from("chart-screenshots")
            .createSignedUrl(row.storage_path, 3600);
          return { ...row, url: signed?.signedUrl };
        }),
      );
    },
  });
}

export interface SaveAnalysisArgs {
  userId: string;
  result: AnalysisResult;
  images: { file: File; timeframe: string | null }[];
}

export function useSaveAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, result, images }: SaveAnalysisArgs) => {
      const { data, error } = await supabase
        .from("analyses")
        .insert({
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
          checklist: result.checklist as unknown as never,
          entry_zone: result.entry_zone,
          stop_loss: result.stop_loss,
          tp1: result.tp1,
          tp2: result.tp2,
          risk_reward: result.risk_reward,
          required_confirmation: result.required_confirmation as unknown as never,
          invalidation: result.invalidation as unknown as never,
          reasoning: result.reasoning as unknown as never,
          summary: result.summary,
          sufficient_information: result.sufficient_information,
          requested_additional_images: result.requested_additional_images as unknown as never,
          raw: result as unknown as never,
          outcome: result.direction === "NO TRADE" ? "NO TRADE" : "OPEN",
        })
        .select("id")
        .single();
      if (error) throw error;

      const analysisId = (data as { id: string }).id;

      for (const [index, image] of images.entries()) {
        const extension = image.file.name.split(".").pop()?.toLowerCase() ?? "png";
        const path = `${userId}/${analysisId}/${index}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("chart-screenshots")
          .upload(path, image.file, { upsert: true });
        if (uploadError) continue;
        await supabase.from("analysis_images").insert({
          analysis_id: analysisId,
          user_id: userId,
          storage_path: path,
          timeframe: image.timeframe,
          position: index,
        });
      }

      return analysisId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
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
      const { error } = await supabase.from("analyses").update(patch).eq("id", id);
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
      const { error } = await supabase.from("analyses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analyses"] }),
  });
}
