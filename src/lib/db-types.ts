import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Loosely-typed Supabase client.
 *
 * The generated `Database` type in `src/integrations/supabase/types.ts` is
 * regenerated from the live database. When the connected project has not had
 * the ChartPilot schema applied yet, every table name resolves to `never`,
 * which breaks typechecking across the whole app. Routing our queries through
 * this alias keeps the app compiling regardless of the generated types, while
 * runtime behaviour is unchanged.
 */
export type AnyDb = SupabaseClient<any, "public", any>;

export const anyDb = (client: unknown): AnyDb => client as AnyDb;
