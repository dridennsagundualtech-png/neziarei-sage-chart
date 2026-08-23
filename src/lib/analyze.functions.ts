import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAnalysis } from "./analyze.server";

const inputSchema = z.object({
  images: z
    .array(
      z.object({
        dataUrl: z.string().min(32),
        timeframe: z.string().max(8).nullable().optional(),
      }),
    )
    .min(1)
    .max(6),
  assetHint: z.string().max(24).nullable().optional(),
  minRR: z.number().min(0).max(20).default(2),
  requireVolume: z.boolean().default(false),
  strictMode: z.boolean().default(true),
});

export const analyzeChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requirePremiumAccess } = await import("./premium.server");
    const email = (context.claims["email"] as string | undefined) ?? null;
    await requirePremiumAccess(supabaseAdmin, context.userId, email);
    return runAnalysis({
      images: data.images.map((img) => ({ dataUrl: img.dataUrl, timeframe: img.timeframe ?? null })),
      assetHint: data.assetHint ?? null,
      minRR: data.minRR,
      requireVolume: data.requireVolume,
      strictMode: data.strictMode,
    });
  });
