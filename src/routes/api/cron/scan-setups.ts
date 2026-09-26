/**
 * Continuous scan endpoint (in-app + email).
 *
 * Call every 5–15 minutes with:
 *   Authorization: Bearer <LOVABLE_CRON_SECRET>
 *
 * Example:
 *   POST https://YOUR_APP/api/cron/scan-setups
 */
import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { anyDb } from "@/lib/db-types";
import { scanAllSymbolsForUser } from "@/lib/setup-alerts.server";

export const Route = createFileRoute("/api/cron/scan-setups")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        try {
          const { supabaseAdmin: rawAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          const db = anyDb(rawAdmin);

          const { data: users, error } = await db
            .from("settings")
            .select(
              "user_id, min_rr, strict_mode, require_volume, den_rules, preferred_assets, preferred_timeframes, alert_watch_enabled, alert_email_enabled, alert_email, alert_cooldown_hours, alert_symbols",
            )
            .eq("alert_watch_enabled", true)
            .limit(50);

          if (error) {
            return Response.json({ ok: false, error: error.message }, { status: 500 });
          }

          const summary: { userId: string; created: number; errors: number }[] = [];

          for (const row of users ?? []) {
            const r = row as Record<string, unknown>;
            const userId = String(r.user_id ?? "");
            if (!userId) continue;

            const symbolsRaw =
              (Array.isArray(r.alert_symbols) && (r.alert_symbols as string[]).length
                ? (r.alert_symbols as string[])
                : null) ??
              (Array.isArray(r.preferred_assets) ? (r.preferred_assets as string[]) : []) ??
              [];
            const symbols = symbolsRaw.map((s) => String(s).trim()).filter(Boolean).slice(0, 12);
            if (!symbols.length) {
              summary.push({ userId, created: 0, errors: 0 });
              continue;
            }

            const timeframes = (
              Array.isArray(r.preferred_timeframes) ? (r.preferred_timeframes as string[]) : []
            )
              .map((t) => String(t).trim())
              .filter(Boolean)
              .slice(0, 8);

            try {
              const hits = await scanAllSymbolsForUser(db, {
                userId,
                symbols,
                timeframes,
                minRR: Number(r.min_rr ?? 2) || 2,
                strictMode: r.strict_mode !== false,
                requireVolume: r.require_volume === true,
                denRules: r.den_rules ?? null,
                cooldownHours: Math.max(1, Math.min(48, Number(r.alert_cooldown_hours) || 6)),
                emailEnabled: r.alert_email_enabled === true,
                email: typeof r.alert_email === "string" ? r.alert_email : null,
              });
              summary.push({
                userId,
                created: hits.filter((h) => h.created).length,
                errors: hits.filter((h) => h.reason.includes("failed")).length,
              });
            } catch {
              summary.push({ userId, created: 0, errors: 1 });
            }
          }

          return Response.json({ ok: true, users: summary.length, summary });
        } catch (e) {
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : "Scan failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
