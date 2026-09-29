/**
 * Server-only: scan symbols with Den → setup_alerts (+ optional email).
 *
 * Aligns better with live Den Analyze:
 * - Normalizes TF labels (1H→H1, 15M→M15, …)
 * - Resolves symbol aliases (EURUSD ↔ EURUSD.r) against ohlc_data
 * - Alerts on grade C+ long/short (not only strict "tradable")
 * - Always returns a clear per-symbol reason
 */
import type { AnyDb } from "./db-types";
import { runDenAnalysis } from "./den-analyzer.server";
import { fetchCandles, listTimeframes, sortTimeframes } from "./market.server";
import {
  formatAlertBody,
  formatAlertTitle,
  isActionableDirection,
  setupFingerprint,
  type SetupAlertRow,
} from "./setup-alerts";

export interface AlertScanPrefs {
  userId: string;
  symbols: string[];
  timeframes: string[];
  minRR: number;
  strictMode: boolean;
  requireVolume: boolean;
  denRules?: unknown;
  cooldownHours: number;
  emailEnabled: boolean;
  email: string | null;
  candleCount?: number;
}

export interface ScanHit {
  symbol: string;
  created: boolean;
  reason: string;
  alert?: SetupAlertRow;
}

const ALERT_GRADES = new Set(["A+", "A", "B", "C"]);

/** Map Settings / UI labels → common ohlc_data labels */
const TF_ALIASES: Record<string, string[]> = {
  D1: ["D1", "1D", "1d", "D", "DAY"],
  H4: ["H4", "4H", "4h"],
  H1: ["H1", "1H", "1h", "60"],
  M30: ["M30", "30M", "30m"],
  M15: ["M15", "15M", "15m"],
  M5: ["M5", "5M", "5m"],
  M1: ["M1", "1M", "1m"],
};

function normalizeGrade(grade: unknown): string {
  return String(grade ?? "").trim().toUpperCase();
}

function isAlertableGrade(grade: string): boolean {
  if (ALERT_GRADES.has(grade)) return true;
  return grade.startsWith("A") || grade.startsWith("B") || grade.startsWith("C");
}

function expandTimeframeRequest(preferred: string[], available: string[]): string[] {
  const availSet = new Set(available.map((t) => t.trim()));
  const availUpper = new Map(available.map((t) => [t.toUpperCase(), t] as const));
  const out: string[] = [];

  const tryAdd = (label: string) => {
    if (availSet.has(label) && !out.includes(label)) {
      out.push(label);
      return true;
    }
    const hit = availUpper.get(label.toUpperCase());
    if (hit && !out.includes(hit)) {
      out.push(hit);
      return true;
    }
    return false;
  };

  for (const raw of preferred) {
    const key = raw.trim();
    if (!key) continue;
    if (tryAdd(key)) continue;
    // Map alias → canonical key then to whatever exists in DB
    for (const [canonical, aliases] of Object.entries(TF_ALIASES)) {
      if (aliases.some((a) => a.toUpperCase() === key.toUpperCase()) || canonical === key.toUpperCase()) {
        if (tryAdd(canonical)) break;
        for (const a of aliases) {
          if (tryAdd(a)) break;
        }
        break;
      }
    }
  }

  // If nothing matched, use whatever the symbol actually has
  if (!out.length) return sortTimeframes(available).slice(0, 6);
  return sortTimeframes(out).slice(0, 6);
}

async function resolveSymbolName(db: AnyDb, requested: string): Promise<string | null> {
  const base = requested.trim();
  if (!base) return null;

  const candidates = [base];
  if (base.toUpperCase().endsWith(".R")) {
    candidates.push(base.slice(0, -2));
  } else {
    candidates.push(`${base}.r`, `${base}.R`);
  }

  for (const name of candidates) {
    try {
      const tfs = await listTimeframes(db, name);
      if (tfs.length > 0) return name;
    } catch {
      // try next
    }
  }
  return null;
}

function buildAlertSummary(result: {
  summary?: string | null;
  grade?: string | null;
  tradable?: boolean;
  tradable_reasons?: string[];
}): string {
  const grade = normalizeGrade(result.grade);
  const denTradable = result.tradable === true;
  const base = (result.summary ?? "").trim();

  const reviewNote =
    !denTradable || grade === "C"
      ? "Review on Analyze first for full checklist, invalidation, and levels before acting."
      : "Open Analyze if you want the full checklist and chart context.";

  const qualityNote =
    !denTradable && Array.isArray(result.tradable_reasons) && result.tradable_reasons.length
      ? `Den quality notes: ${result.tradable_reasons.slice(0, 3).join("; ")}.`
      : !denTradable
        ? "Den did not mark this as fully tradable — treat as a watch / plan review, not an auto entry."
        : "";

  return [base, qualityNote, reviewNote].filter(Boolean).join(" ");
}

async function recentFingerprintExists(
  db: AnyDb,
  userId: string,
  fingerprint: string,
  cooldownHours: number,
): Promise<boolean> {
  const since = new Date(Date.now() - Math.max(1, cooldownHours) * 3600_000).toISOString();
  const { data, error } = await db
    .from("setup_alerts")
    .select("id")
    .eq("user_id", userId)
    .eq("fingerprint", fingerprint)
    .gte("created_at", since)
    .limit(1);
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function sendSetupAlertEmail(to: string, alert: SetupAlertRow): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM ?? "ChartPilot <onboarding@resend.dev>";
  if (!apiKey || !to.includes("@")) return false;

  const grade = normalizeGrade(alert.grade);
  const subjectExtra = grade === "C" || !alert.tradable ? " — review on Analyze first" : "";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[ChartPilot] ${formatAlertTitle(alert)}${subjectExtra}`,
        text: `${formatAlertBody(alert)}\n\nOpen ChartPilot → Analyze for full detail. Not financial advice.`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function scanSymbolForSetupAlert(
  db: AnyDb,
  prefs: AlertScanPrefs,
  symbol: string,
): Promise<ScanHit> {
  const resolved = await resolveSymbolName(db, symbol);
  if (!resolved) {
    return {
      symbol,
      created: false,
      reason: `No ohlc_data for "${symbol}" (tried .r variants too).`,
    };
  }

  const availableTfs = await listTimeframes(db, resolved);
  if (!availableTfs.length) {
    return { symbol: resolved, created: false, reason: "No timeframes in ohlc_data." };
  }

  const tfs = expandTimeframeRequest(prefs.timeframes, availableTfs);
  const count = Math.max(40, Math.min(300, prefs.candleCount ?? 150));

  const series = await Promise.all(
    tfs.map(async (timeframe) => ({
      timeframe,
      candles: await fetchCandles(db, resolved, timeframe, count),
    })),
  );
  const available = series.filter((s) => s.candles.length >= 12);
  if (!available.length) {
    return {
      symbol: resolved,
      created: false,
      reason: `Not enough candles (tried TFs: ${tfs.join(", ") || "none"}).`,
    };
  }

  const result = runDenAnalysis({
    symbol: resolved,
    series: available,
    minRR: prefs.minRR,
    requireVolume: prefs.requireVolume,
    strictMode: prefs.strictMode,
    rules: prefs.denRules,
  });

  const direction = String(result.direction ?? "");
  const grade = normalizeGrade(result.grade);
  const denTradable =
    typeof (result as { tradable?: boolean }).tradable === "boolean"
      ? Boolean((result as { tradable?: boolean }).tradable)
      : ["A", "A+", "B"].includes(grade);

  if (!isActionableDirection(direction)) {
    return {
      symbol: resolved,
      created: false,
      reason: `Den says ${direction || "empty"} grade ${grade || "—"} (need LONG/SHORT).`,
    };
  }

  if (!isAlertableGrade(grade)) {
    return {
      symbol: resolved,
      created: false,
      reason: `Grade ${grade || "none"} below C — ${direction}.`,
    };
  }

  const fingerprint = setupFingerprint({
    symbol: resolved,
    direction,
    entry_zone: result.entry_zone,
    stop_loss: result.stop_loss,
  });

  if (await recentFingerprintExists(db, prefs.userId, fingerprint, prefs.cooldownHours)) {
    return {
      symbol: resolved,
      created: false,
      reason: `Already alerted inside cooldown (${direction} ${grade}).`,
    };
  }

  const summary = buildAlertSummary({
    summary: result.summary,
    grade: result.grade,
    tradable: denTradable,
    tradable_reasons: (result as { tradable_reasons?: string[] }).tradable_reasons,
  });

  const row = {
    user_id: prefs.userId,
    symbol: resolved.toUpperCase(),
    direction,
    grade: result.grade ?? null,
    score: result.score ?? null,
    max_score: result.max_score ?? null,
    tradable: denTradable,
    entry_zone: result.entry_zone ?? null,
    stop_loss: result.stop_loss ?? null,
    tp1: result.tp1 ?? null,
    tp2: result.tp2 ?? null,
    summary,
    fingerprint,
    email_sent: false,
    read_at: null,
  };

  const { data: inserted, error } = await db.from("setup_alerts").insert(row).select("*").single();
  if (error) throw new Error(error.message);

  const alert = inserted as SetupAlertRow;
  let emailSent = false;
  if (prefs.emailEnabled && prefs.email) {
    emailSent = await sendSetupAlertEmail(prefs.email, alert);
    if (emailSent) {
      await db.from("setup_alerts").update({ email_sent: true }).eq("id", alert.id);
      alert.email_sent = true;
    }
  }

  const note =
    grade === "C" || !denTradable
      ? `${resolved} ${direction} ${grade} — review Analyze first`
      : `${resolved} ${direction} ${grade}`;
  return {
    symbol: resolved,
    created: true,
    reason: emailSent ? `${note}; email sent` : note,
    alert,
  };
}

export async function scanAllSymbolsForUser(
  db: AnyDb,
  prefs: AlertScanPrefs,
): Promise<ScanHit[]> {
  const hits: ScanHit[] = [];
  for (const symbol of prefs.symbols) {
    try {
      hits.push(await scanSymbolForSetupAlert(db, prefs, symbol));
    } catch (e) {
      hits.push({
        symbol,
        created: false,
        reason: e instanceof Error ? e.message : "Scan failed.",
      });
    }
  }
  return hits;
}
