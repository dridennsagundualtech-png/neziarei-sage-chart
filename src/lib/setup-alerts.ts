/**
 * Setup-alert helpers (Den tradable setups → in-app + optional email).
 * Does not change Den math.
 */

export interface SetupAlertRow {
  id: string;
  user_id: string;
  symbol: string;
  direction: string;
  grade: string | null;
  score: number | null;
  max_score: number | null;
  tradable: boolean;
  entry_zone: string | null;
  stop_loss: string | null;
  tp1: string | null;
  tp2: string | null;
  summary: string | null;
  fingerprint: string;
  email_sent: boolean;
  read_at: string | null;
  created_at: string;
}

/** Stable key so the same setup is not spammed every scan. */
export function setupFingerprint(input: {
  symbol: string;
  direction: string;
  entry_zone?: string | null;
  stop_loss?: string | null;
}): string {
  const sym = input.symbol.trim().toUpperCase();
  const dir = input.direction.trim().toUpperCase();
  const entry = (input.entry_zone ?? "").replace(/\s+/g, " ").trim().slice(0, 48);
  const stop = (input.stop_loss ?? "").replace(/\s+/g, " ").trim().slice(0, 48);
  return `${sym}|${dir}|${entry}|${stop}`;
}

export function isActionableDirection(direction: string): boolean {
  const d = direction.toUpperCase();
  return d.includes("LONG") || d.includes("SHORT");
}

export function formatAlertTitle(row: Pick<SetupAlertRow, "symbol" | "direction" | "grade">): string {
  return `${row.symbol} · ${row.direction}${row.grade ? ` · ${row.grade}` : ""}`;
}

export function formatAlertBody(row: SetupAlertRow): string {
  const lines = [
    row.summary?.trim() || "Den marked a tradable setup.",
    row.entry_zone ? `Entry: ${row.entry_zone}` : null,
    row.stop_loss ? `Stop: ${row.stop_loss}` : null,
    row.tp1 ? `TP1: ${row.tp1}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}
