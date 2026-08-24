import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Probes every selectable model with a 1-token request so the UI can show
 * which ones are usable and which are rate limited / out of credits.
 */
export const checkModelAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The AI engine is not configured for this project.");
    const { ANALYSIS_MODELS } = await import("./ai-models");
    const { probeModel } = await import("./ai-gateway.server");
    return Promise.all(ANALYSIS_MODELS.map((model) => probeModel(apiKey, model.id)));
  });
