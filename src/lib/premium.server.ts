/**
 * Server-only premium / admin helpers.
 *
 * Premium access and redeemable codes are stored in the backend. Codes are
 * created only by an admin and grant a configurable number of days.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export const ADMIN_EMAIL = "dridennsagun.dualtech@gmail.com";

export interface AccessState {
  userId: string;
  email: string | null;
  isAdmin: boolean;
  premiumUntil: string | null;
  isPremium: boolean;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(prefix: string): string {
  const block = (length: number) =>
    Array.from(
      { length },
      () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)] as string,
    ).join("");
  const clean = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
  return [clean || "CP", block(4), block(4)].join("-");
}

type Admin = SupabaseClient<Database>;

/** Resolves the caller's access, promoting the configured admin email once. */
export async function resolveAccess(
  admin: Admin,
  userId: string,
  email: string | null,
): Promise<AccessState> {
  let isAdmin = false;

  if (email && email.toLowerCase() === ADMIN_EMAIL) {
    await admin.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
    isAdmin = true;
  } else {
    const { data } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    isAdmin = Boolean(data);
  }

  const { data: access } = await admin
    .from("premium_access")
    .select("premium_until")
    .eq("user_id", userId)
    .maybeSingle();

  const premiumUntil = access?.premium_until ?? null;
  const active = premiumUntil ? new Date(premiumUntil).getTime() > Date.now() : false;

  return { userId, email, isAdmin, premiumUntil, isPremium: isAdmin || active };
}

export async function requireAdmin(admin: Admin, userId: string, email: string | null) {
  const access = await resolveAccess(admin, userId, email);
  if (!access.isAdmin) throw new Error("Forbidden: admin access required.");
  return access;
}

export interface RedeemResult {
  ok: boolean;
  message: string;
  premiumUntil: string | null;
}

export async function redeem(
  admin: Admin,
  userId: string,
  rawCode: string,
): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, message: "Enter a code.", premiumUntil: null };

  const { data: row } = await admin
    .from("premium_codes")
    .select("id, code, duration_days, max_uses, uses, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (!row) return { ok: false, message: "That code doesn't exist.", premiumUntil: null };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, message: "That code has expired.", premiumUntil: null };
  }
  if (row.uses >= row.max_uses) {
    return { ok: false, message: "That code has already been used.", premiumUntil: null };
  }

  const { data: current } = await admin
    .from("premium_access")
    .select("premium_until")
    .eq("user_id", userId)
    .maybeSingle();

  const base = current?.premium_until && new Date(current.premium_until).getTime() > Date.now()
    ? new Date(current.premium_until)
    : new Date();
  const until = new Date(base.getTime() + row.duration_days * 24 * 60 * 60 * 1000);

  const { error: grantError } = await admin.from("premium_access").upsert(
    {
      user_id: userId,
      premium_until: until.toISOString(),
      last_code: row.code,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (grantError) {
    return { ok: false, message: "Could not activate premium. Try again.", premiumUntil: null };
  }

  await admin
    .from("premium_codes")
    .update({ uses: row.uses + 1 })
    .eq("id", row.id);

  return {
    ok: true,
    message: `Premium unlocked for ${row.duration_days} day${row.duration_days === 1 ? "" : "s"}.`,
    premiumUntil: until.toISOString(),
  };
}
