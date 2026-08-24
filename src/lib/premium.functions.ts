import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";

export const getMyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = anyDb(rawAdmin);
    const { resolveAccess } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    return resolveAccess(supabaseAdmin, context.userId, email);
  });

export const redeemPremiumCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => ({ code: String(data.code ?? "") }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = anyDb(rawAdmin);
    const { redeem } = await import("./premium.server");
    return redeem(supabaseAdmin, context.userId, data.code);
  });

export const createPremiumCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    count: number;
    durationDays: number;
    maxUses: number;
    codeExpiresInDays: number | null;
    prefix: string;
    note: string;
  }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = anyDb(rawAdmin);
    const { requireAdmin, generateCode } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(supabaseAdmin, context.userId, email);

    const count = Math.min(50, Math.max(1, Math.round(data.count) || 1));
    const durationDays = Math.min(3650, Math.max(1, Math.round(data.durationDays) || 30));
    const maxUses = Math.min(1000, Math.max(1, Math.round(data.maxUses) || 1));
    const codeExpiresAt =
      data.codeExpiresInDays && data.codeExpiresInDays > 0
        ? new Date(Date.now() + data.codeExpiresInDays * 86_400_000).toISOString()
        : null;

    const rows = Array.from({ length: count }, () => ({
      code: generateCode(data.prefix ?? ""),
      duration_days: durationDays,
      max_uses: maxUses,
      expires_at: codeExpiresAt,
      note: data.note?.trim() ? data.note.trim() : null,
      created_by: context.userId,
    }));

    const { data: inserted, error } = await supabaseAdmin
      .from("premium_codes")
      .insert(rows)
      .select("id, code, duration_days, max_uses, uses, expires_at, note, created_at");

    if (error) throw new Error("Could not create codes. Try again.");
    return inserted ?? [];
  });

export const listPremiumCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(supabaseAdmin, context.userId, email);

    const { data } = await supabaseAdmin
      .from("premium_codes")
      .select("id, code, duration_days, max_uses, uses, expires_at, note, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const deletePremiumCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(supabaseAdmin, context.userId, email);
    await supabaseAdmin.from("premium_codes").delete().eq("id", data.id);
    return { ok: true };
  });

export const listPremiumUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data?: { search?: string }) => ({ search: String(data?.search ?? "") }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = anyDb(rawAdmin);
    const { requireAdmin, listUsersWithPremium } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(supabaseAdmin, context.userId, email);
    return listUsersWithPremium(supabaseAdmin, data.search);
  });

export const adjustPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    userId: string;
    action: "add" | "set" | "revoke";
    days?: number | null;
    until?: string | null;
  }) => data)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = anyDb(rawAdmin);
    const { requireAdmin, adjustPremiumAccess } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(supabaseAdmin, context.userId, email);
    return adjustPremiumAccess(supabaseAdmin, data);
  });

export const setMarketDataEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string; enabled: boolean }) => ({
    userId: String(data.userId),
    enabled: Boolean(data.enabled),
  }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const supabaseAdmin = anyDb(rawAdmin);
    const { requireAdmin, setMarketDataAccess } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(supabaseAdmin, context.userId, email);
    return setMarketDataAccess(supabaseAdmin, data);
  });
