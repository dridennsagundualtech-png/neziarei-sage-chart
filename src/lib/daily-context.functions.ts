import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DailyContext } from "./daily-context.server";

/**
 * A symbol's daily context (typical day and price map) from stored daily bars,
 * for "Check my trade". Same access as an analysis: premium, or the owner.
 * A symbol with no stored bars comes back empty rather than failing.
 */
export const getDailyContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { symbol: string }) => ({
    symbol: String(data?.symbol ?? "").slice(0, 24),
  }))
  .handler(async ({ data, context }): Promise<DailyContext> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requirePremiumAccess } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requirePremiumAccess(supabaseAdmin, context.userId, email);
    const { anyDb } = await import("./db-types");
    const { dailyContextFor } = await import("./daily-context.server");
    return dailyContextFor(anyDb(supabaseAdmin), data.symbol);
  });
