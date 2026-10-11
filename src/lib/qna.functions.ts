import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(60),
  model: z.string().max(64).nullable().optional(),
});

async function requireAccess(context: { userId: string; claims: Record<string, unknown> }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { requirePremiumAccess } = await import("./premium.server");
  const email = (context.claims["email"] as string | undefined) ?? null;
  await requirePremiumAccess(supabaseAdmin, context.userId, email);
}

/** Journal "Ask AI": one answer for the latest question, using the Analyze model cascade. */
export const askTradingQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => chatSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAccess(context);
    const { answerQuestion } = await import("./qna.server");
    return answerQuestion({ messages: data.messages, model: data.model ?? null });
  });

/** Turns the chat into a summary note: summary, key points, terms, follow-ups and the questions asked. */
export const summarizeQnaChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => chatSchema.parse(data))
  .handler(async ({ data, context }) => {
    await requireAccess(context);
    const { summarizeChat } = await import("./qna.server");
    return summarizeChat({ messages: data.messages, model: data.model ?? null });
  });
