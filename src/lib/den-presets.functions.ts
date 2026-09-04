import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anyDb } from "@/lib/db-types";
import { DEN_COMPONENT_KEYS, type DenComponents } from "@/lib/den-rules";

export interface DenPresetRow {
  id: string;
  name: string;
  components: DenComponents;
  created_at: string;
}

function sanitizeComponents(raw: unknown): DenComponents {
  const source = (raw ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    DEN_COMPONENT_KEYS.map((key) => [key, Boolean(source[key])]),
  ) as DenComponents;
}

export const listDenPresets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DenPresetRow[]> => {
    const db = anyDb(context.supabase);
    const { data, error } = await db
      .from("den_presets")
      .select("id, name, components, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      components: sanitizeComponents(row.components),
      created_at: row.created_at as string,
    }));
  });

export const saveDenPreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name: string; components: Record<string, boolean> }) => ({
    name: String(data?.name ?? "").trim().slice(0, 60),
    components: data?.components ?? {},
  }))
  .handler(async ({ data, context }): Promise<DenPresetRow> => {
    if (!data.name) throw new Error("Preset name is required.");
    const db = anyDb(context.supabase);
    const { data: row, error } = await db
      .from("den_presets")
      .upsert(
        {
          user_id: context.userId,
          name: data.name,
          components: sanitizeComponents(data.components),
        },
        { onConflict: "user_id,name" },
      )
      .select("id, name, components, created_at")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id as string,
      name: row.name as string,
      components: sanitizeComponents(row.components),
      created_at: row.created_at as string,
    };
  });

export const deleteDenPreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data, context }) => {
    if (!data.id) throw new Error("Preset id is required.");
    const db = anyDb(context.supabase);
    const { error } = await db
      .from("den_presets")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
