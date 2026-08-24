import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";

export const listMarketSymbols = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const { listSymbols } = await import("./market.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);
    return listSymbols(admin);
  });

export const analyzeMarketData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    symbol: string;
    minRR?: number;
    strictMode?: boolean;
    requireVolume?: boolean;
  }) => ({
    symbol: String(data.symbol ?? "").trim().slice(0, 24),
    minRR: Number.isFinite(Number(data.minRR)) ? Number(data.minRR) : 2,
    strictMode: data.strictMode !== false,
    requireVolume: data.requireVolume === true,
  }))
  .handler(async ({ data, context }) => {
    if (!data.symbol) throw new Error("Pick a symbol to analyse.");
    const { supabaseAdmin: rawAdmin } = await import("@/integrations/supabase/client.server");
    const admin = anyDb(rawAdmin);
    const { requireAdmin } = await import("./premium.server");
    const { runMarketAnalysis } = await import("./market.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requireAdmin(admin, context.userId, email);
    return runMarketAnalysis(admin, data);
  });
