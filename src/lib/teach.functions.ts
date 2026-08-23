import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  compareHuman,
  gradeAnswers,
  identifyTargets,
  makeQuiz,
  teachChart,
} from "./teach.server";

const imagesSchema = z
  .array(
    z.object({
      dataUrl: z.string().min(32),
      timeframe: z.string().max(8).nullable().optional(),
    }),
  )
  .min(1)
  .max(6);

export const teachThisChart = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        images: imagesSchema,
        context: z.string().max(6000).nullable().optional(),
        beginner: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requirePremiumAccess } = await import("./premium.server");
    await requirePremiumAccess(supabaseAdmin, context.userId, (context.claims["email"] as string | undefined) ?? null);
    return teachChart({
      images: data.images.map((i) => ({ dataUrl: i.dataUrl, timeframe: i.timeframe ?? null })),
      context: data.context ?? null,
      beginner: data.beginner,
    });
  });

export const buildQuiz = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        images: imagesSchema,
        count: z.number().int().min(3).max(10).default(6),
        beginner: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requirePremiumAccess } = await import("./premium.server");
    await requirePremiumAccess(supabaseAdmin, context.userId, (context.claims["email"] as string | undefined) ?? null);
    return makeQuiz({
      images: data.images.map((i) => ({ dataUrl: i.dataUrl, timeframe: i.timeframe ?? null })),
      count: data.count,
      beginner: data.beginner,
    });
  });

export const gradeShortAnswers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        items: z
          .array(
            z.object({
              id: z.string().max(40),
              prompt: z.string().max(600),
              modelAnswer: z.string().max(900),
              userAnswer: z.string().max(900),
            }),
          )
          .min(1)
          .max(10),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requirePremiumAccess } = await import("./premium.server");
    await requirePremiumAccess(supabaseAdmin, context.userId, (context.claims["email"] as string | undefined) ?? null);
    return gradeAnswers({ items: data.items });
  });

export const buildIdentifyTargets = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ images: imagesSchema }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requirePremiumAccess } = await import("./premium.server");
    await requirePremiumAccess(supabaseAdmin, context.userId, (context.claims["email"] as string | undefined) ?? null);
    return identifyTargets({
      images: data.images.map((i) => ({ dataUrl: i.dataUrl, timeframe: i.timeframe ?? null })),
    });
  });

export const compareWithChartPilot = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        human: z.record(z.string(), z.string().max(600)),
        analysis: z.string().min(10).max(8000),
        beginner: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { requirePremiumAccess } = await import("./premium.server");
    await requirePremiumAccess(supabaseAdmin, context.userId, (context.claims["email"] as string | undefined) ?? null);
    return compareHuman({ human: data.human, analysis: data.analysis, beginner: data.beginner });
  });
