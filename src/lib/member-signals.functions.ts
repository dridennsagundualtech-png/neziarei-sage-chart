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
  details: Record<string, unknown> | null;
  timeframes: string[] | null;
  created_at: string;
  /** Filled client-side or by list handler */
  is_read?: boolean;
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

    const list = (rows ?? []) as MemberSignalRow[];
    if (!list.length) return list;

    const ids = list.map((r) => r.id);
    const { data: reads } = await context.supabase
      .from("member_signal_reads")
      .select("signal_id")
      .eq("user_id", context.userId)
      .in("signal_id", ids);

    const readSet = new Set((reads ?? []).map((r) => r.signal_id as string));
    return list.map((r) => ({ ...r, is_read: readSet.has(r.id) }));
  });

/** Unread shared signals for badge (all signed-in users). */
export const countUnreadMemberSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ count: number }> => {
    const { data: signals, error } = await context.supabase
      .from("member_signals")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const ids = (signals ?? []).map((s) => s.id as string);
    if (!ids.length) return { count: 0 };

    const { data: reads, error: rErr } = await context.supabase
      .from("member_signal_reads")
      .select("signal_id")
      .eq("user_id", context.userId)
      .in("signal_id", ids);
    if (rErr) throw new Error(rErr.message);

    const readSet = new Set((reads ?? []).map((r) => r.signal_id as string));
    return { count: ids.filter((id) => !readSet.has(id)).length };
  });

export const markMemberSignalRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id?: string; all?: boolean }) => ({
    id: data?.id ? String(data.id) : "",
    all: data?.all === true,
  }))
  .handler(async ({ data, context }) => {
    if (data.all) {
      const { data: signals } = await context.supabase
        .from("member_signals")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(100);
      const ids = (signals ?? []).map((s) => s.id as string);
      if (!ids.length) return { ok: true };
      const rows = ids.map((signal_id) => ({
        user_id: context.userId,
        signal_id,
      }));
      const { error } = await context.supabase
        .from("member_signal_reads")
        .upsert(rows, { onConflict: "user_id,signal_id" });
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (!data.id) throw new Error("Missing signal id.");
    const { error } = await context.supabase.from("member_signal_reads").upsert(
      { user_id: context.userId, signal_id: data.id },
      { onConflict: "user_id,signal_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const publishFullAnalysisToMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      symbol: string;
      direction: string;
      grade?: string | null;
      score?: number | null;
      entryZone?: string | null;
      stopLoss?: string | null;
      tp1?: string | null;
      tp2?: string | null;
      summary?: string | null;
      timeframes?: string[];
      details?: Record<string, unknown> | null;
    }) => ({
      symbol: String(data?.symbol ?? "").trim().slice(0, 32),
      direction: String(data?.direction ?? "").trim().slice(0, 48),
      grade: data?.grade != null ? String(data.grade).slice(0, 8) : null,
      score: data?.score != null && Number.isFinite(Number(data.score)) ? Number(data.score) : null,
      entryZone: data?.entryZone != null ? String(data.entryZone).slice(0, 120) : null,
      stopLoss: data?.stopLoss != null ? String(data.stopLoss).slice(0, 120) : null,
      tp1: data?.tp1 != null ? String(data.tp1).slice(0, 120) : null,
      tp2: data?.tp2 != null ? String(data.tp2).slice(0, 120) : null,
      summary: data?.summary != null ? String(data.summary).slice(0, 800) : null,
      timeframes: Array.isArray(data?.timeframes)
        ? data.timeframes.map((t) => String(t).slice(0, 12)).slice(0, 8)
        : [],
      details:
        data?.details && typeof data.details === "object"
          ? (data.details as Record<string, unknown>)
          : null,
    }),
  )
  .handler(async ({ data, context }) => {
    if (!data.symbol || !data.direction) {
      throw new Error("Symbol and direction are required.");
    }
    // Ensure admin role (promotes configured admin email if needed)
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const adminDb = anyDb(rawAdmin);
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(adminDb, context.userId, email);

    // Insert with the signed-in user client so RLS (auth.uid() = published_by + admin role) passes
    const { data: inserted, error } = await context.supabase
      .from("member_signals")
      .insert({
        published_by: context.userId,
        symbol: data.symbol.toUpperCase(),
        direction: data.direction,
        grade: data.grade,
        score: data.score,
        entry_zone: data.entryZone,
        stop_loss: data.stopLoss,
        tp1: data.tp1,
        tp2: data.tp2,
        summary: data.summary,
        timeframes: data.timeframes.length ? data.timeframes : null,
        details: data.details,
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(
        error.message.includes("permission") || error.code === "42501"
          ? "Permission denied on member_signals. Run member_signals_fix_rls.sql in Supabase, and ensure your account is in user_roles as admin."
          : error.message,
      );
    }

    // Group F: optional Telegram (does not block in-app share if it fails)
    try {
      const { data: settings } = await context.supabase
        .from("settings")
        .select("telegram_notify_enabled, telegram_chat_ids")
        .eq("user_id", context.userId)
        .maybeSingle();
      const row = settings as {
        telegram_notify_enabled?: boolean;
        telegram_chat_ids?: string;
      } | null;
      if (row?.telegram_notify_enabled) {
        const { parseTelegramChatIds, sendTelegramMessage, formatSharedSignalTelegram } =
          await import("@/lib/telegram");
        const text = formatSharedSignalTelegram({
          symbol: data.symbol,
          direction: data.direction,
          grade: data.grade,
          score: data.score,
          entry_zone: data.entryZone,
          stop_loss: data.stopLoss,
          tp1: data.tp1,
          summary: data.summary,
        });
        for (const chatId of parseTelegramChatIds(row.telegram_chat_ids)) {
          await sendTelegramMessage(chatId, text);
        }
      }
    } catch {
      /* ignore telegram errors */
    }

    return inserted as MemberSignalRow;
  });
