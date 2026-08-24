/**
 * Server-only premium / admin helpers.
 *
 * Premium access and redeemable codes are stored in the backend. Codes are
 * created only by an admin and grant a configurable number of days.
 */
import type { AnyDb } from "@/lib/db-types";

export const ADMIN_EMAIL = "dridennsagun.dualtech@gmail.com";

export interface AccessState {
  userId: string;
  email: string | null;
  isAdmin: boolean;
  premiumUntil: string | null;
  isPremium: boolean;
  marketDataEnabled: boolean;
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

type Admin = AnyDb;

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
    .select("premium_until, market_data_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  const premiumUntil = access?.premium_until ?? null;
  const active = premiumUntil ? new Date(premiumUntil).getTime() > Date.now() : false;

  return {
    userId,
    email,
    isAdmin,
    premiumUntil,
    isPremium: isAdmin || active,
    marketDataEnabled: isAdmin || Boolean(access?.market_data_enabled),
  };
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

export interface PremiumUser {
  userId: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  premiumUntil: string | null;
  daysLeft: number | null;
  isPremium: boolean;
  isAdmin: boolean;
  lastCode: string | null;
  marketDataEnabled: boolean;
}

function daysBetween(target: string): number {
  return Math.ceil((new Date(target).getTime() - Date.now()) / 86_400_000);
}

/** Admin overview: every account with its premium end date and days left. */
export async function listUsersWithPremium(
  admin: Admin,
  search = "",
): Promise<PremiumUser[]> {
  const users: { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const batch = data.users ?? [];
    users.push(
      ...batch.map((user) => ({
        id: user.id,
        email: user.email ?? null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at ?? null,
      })),
    );
    if (batch.length < 200) break;
  }

  const [{ data: accessRows }, { data: adminRows }] = await Promise.all([
    admin.from("premium_access").select("user_id, premium_until, last_code, market_data_enabled"),
    admin.from("user_roles").select("user_id").eq("role", "admin"),
  ]);

  const accessById = new Map((accessRows ?? []).map((row) => [row.user_id, row]));
  const adminIds = new Set((adminRows ?? []).map((row) => row.user_id));
  const needle = search.trim().toLowerCase();

  return users
    .filter((user) => !needle || (user.email ?? "").toLowerCase().includes(needle))
    .map((user) => {
      const access = accessById.get(user.id);
      const premiumUntil = access?.premium_until ?? null;
      const active = premiumUntil ? new Date(premiumUntil).getTime() > Date.now() : false;
      const isAdmin = adminIds.has(user.id);
      return {
        userId: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        premiumUntil,
        daysLeft: active && premiumUntil ? Math.max(0, daysBetween(premiumUntil)) : null,
        isPremium: isAdmin || active,
        isAdmin,
        lastCode: access?.last_code ?? null,
        marketDataEnabled: isAdmin || Boolean(access?.market_data_enabled),
      };
    })
    .sort((a, b) => (b.premiumUntil ?? "").localeCompare(a.premiumUntil ?? ""));
}

export interface AdjustPremiumInput {
  userId: string;
  action: "add" | "set" | "revoke";
  days?: number | null;
  until?: string | null;
}

/** Admin edit of one account's premium window. */
export async function adjustPremiumAccess(
  admin: Admin,
  input: AdjustPremiumInput,
): Promise<{ ok: boolean; premiumUntil: string | null; message: string }> {
  if (input.action === "revoke") {
    await admin.from("premium_access").delete().eq("user_id", input.userId);
    return { ok: true, premiumUntil: null, message: "Premium removed." };
  }

  const { data: current } = await admin
    .from("premium_access")
    .select("premium_until")
    .eq("user_id", input.userId)
    .maybeSingle();

  let until: Date;
  if (input.action === "set") {
    const parsed = input.until ? new Date(input.until) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) {
      return { ok: false, premiumUntil: current?.premium_until ?? null, message: "Pick a valid end date." };
    }
    until = parsed;
  } else {
    const days = Math.round(input.days ?? 0);
    if (!days) {
      return { ok: false, premiumUntil: current?.premium_until ?? null, message: "Enter a number of days." };
    }
    const base =
      current?.premium_until && new Date(current.premium_until).getTime() > Date.now()
        ? new Date(current.premium_until)
        : new Date();
    until = new Date(base.getTime() + days * 86_400_000);
  }

  const { error } = await admin.from("premium_access").upsert(
    {
      user_id: input.userId,
      premium_until: until.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, premiumUntil: null, message: "Could not update premium." };

  return {
    ok: true,
    premiumUntil: until.toISOString(),
    message: until.getTime() > Date.now() ? "Premium updated." : "Premium set to an expired date.",
  };
}

/** Admin toggle of one account's access to the Market data analysis mode. */
export async function setMarketDataAccess(
  admin: Admin,
  input: { userId: string; enabled: boolean },
): Promise<{ ok: boolean; enabled: boolean; message: string }> {
  const { data: current } = await admin
    .from("premium_access")
    .select("premium_until")
    .eq("user_id", input.userId)
    .maybeSingle();

  const { error } = await admin.from("premium_access").upsert(
    {
      user_id: input.userId,
      // Keep any existing premium window untouched; new rows start expired.
      premium_until: current?.premium_until ?? new Date(0).toISOString(),
      market_data_enabled: input.enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, enabled: !input.enabled, message: "Could not update market data access." };

  return {
    ok: true,
    enabled: input.enabled,
    message: input.enabled ? "Market data mode enabled." : "Market data mode disabled.",
  };
}

/** Throws unless the caller may use the Market data analysis mode. */
export async function requireMarketDataAccess(
  admin: Admin,
  userId: string,
  email: string | null,
): Promise<AccessState> {
  const access = await resolveAccess(admin, userId, email);
  if (!access.isPremium) throw new Error("Premium access required.");
  if (!access.marketDataEnabled) {
    throw new Error("Market data analysis is not enabled for your account.");
  }
  return access;
}

/** Throws unless the caller has active premium (or is admin). */
export async function requirePremiumAccess(
  admin: Admin,
  userId: string,
  email: string | null,
): Promise<AccessState> {
  const access = await resolveAccess(admin, userId, email);
  if (!access.isPremium) throw new Error("Premium access required.");
  return access;
}
