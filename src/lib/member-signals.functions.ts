import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";
import { requireAdmin } from "@/lib/premium.server";

export interface MemberSignalRow {
  id: string;
  published_by: string;
  symbol: string;
  direction: string;
  grade: string | null;
  score: number | null;
  entry_zone: string | null;
  stop_loss: string | null;
  tp1: string | null;
  tp2: string | null;
  summary: string | null;
  source_alert_id: string | null;
  created_at: string;
}

export const listMemberSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number }) => ({
    limit: Math.max(1, Math.min(100, Math.round(Number(data?.limit) || 40))),
  }))
  .handler(async ({ data, context }): Promise<MemberSignalRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("member_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return (rows ?? []) as MemberSignalRow[];
  });

export const publishAlertToMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { alertId: string }) => ({
    alertId: String(data?.alertId ?? ""),
  }))
  .handler(async ({ data, context }) => {
    if (!data.alertId) throw new Error("Missing alert id.");

    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);

    const { data: alert, error: aErr } = await context.supabase
      .from("setup_alerts")
      .select("*")
      .eq("id", data.alertId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!alert) throw new Error("Alert not found.");

    const row = alert as Record<string, unknown>;
    const { data: inserted, error } = await admin
      .from("member_signals")
      .insert({
        published_by: context.userId,
        symbol: row.symbol,
        direction: row.direction,
        grade: row.grade ?? null,
        score: row.score ?? null,
        entry_zone: row.entry_zone ?? null,
        stop_loss: row.stop_loss ?? null,
        tp1: row.tp1 ?? null,
        tp2: row.tp2 ?? null,
        summary: row.summary ?? null,
        source_alert_id: data.alertId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inserted as MemberSignalRow;
  });
