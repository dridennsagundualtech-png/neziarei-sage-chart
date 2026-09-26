import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";
import type { SetupAlertRow } from "@/lib/setup-alerts";
import { scanAllSymbolsForUser } from "@/lib/setup-alerts.server";

export const listSetupAlerts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { limit?: number; unreadOnly?: boolean }) => ({
    limit: Math.max(1, Math.min(100, Math.round(Number(data?.limit) || 40))),
    unreadOnly: data?.unreadOnly === true,
  }))
  .handler(async ({ data, context }): Promise<SetupAlertRow[]> => {
    let q = context.supabase
      .from("setup_alerts")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.unreadOnly) q = q.is("read_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as SetupAlertRow[];
  });

export const markSetupAlertRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; all?: boolean }) => ({
    id: String(data?.id ?? ""),
    all: data?.all === true,
  }))
  .handler(async ({ data, context }) => {
    if (data.all) {
      const { error } = await context.supabase
        .from("setup_alerts")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", context.userId)
        .is("read_at", null);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (!data.id) throw new Error("Missing alert id.");
    const { error } = await context.supabase
      .from("setup_alerts")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Manual "Scan now" — runs Den on your watch symbols and creates in-app alerts.
 */
export const scanSetupAlertsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);

    const { data: settings, error } = await context.supabase
      .from("settings")
      .select(
        "min_rr, strict_mode, require_volume, den_rules, preferred_assets, preferred_timeframes, alert_watch_enabled, alert_email_enabled, alert_email, alert_cooldown_hours, alert_symbols",
      )
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const row = settings as Record<string, unknown> | null;
    const symbolsRaw =
      (Array.isArray(row?.alert_symbols) && (row?.alert_symbols as string[]).length
        ? (row?.alert_symbols as string[])
        : null) ??
      (Array.isArray(row?.preferred_assets) ? (row?.preferred_assets as string[]) : []) ??
      [];
    const symbols = symbolsRaw.map((s) => String(s).trim()).filter(Boolean).slice(0, 12);
    if (!symbols.length) {
      throw new Error("Add preferred assets or alert symbols in Settings first.");
    }

    const timeframes = (
      Array.isArray(row?.preferred_timeframes) ? (row?.preferred_timeframes as string[]) : []
    )
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, 8);

    const hits = await scanAllSymbolsForUser(admin, {
      userId: context.userId,
      symbols,
      timeframes,
      minRR: Number(row?.min_rr ?? 2) || 2,
      strictMode: row?.strict_mode !== false,
      requireVolume: row?.require_volume === true,
      denRules: row?.den_rules ?? null,
      cooldownHours: Math.max(1, Math.min(48, Number(row?.alert_cooldown_hours) || 6)),
      emailEnabled: row?.alert_email_enabled === true,
      email: typeof row?.alert_email === "string" ? row.alert_email : null,
    });

    return {
      hits,
      created: hits.filter((h) => h.created).length,
    };
  });
