/**
 * Server-only: scan symbols with Den, insert setup_alerts, optional email via Resend.
 *
 * Alert gate (looser than full "tradable" profitability gate):
 * - Direction must be POTENTIAL LONG / SHORT
 * - Grade A+, A, B, or C is enough to alert
 * - Grade C / non-tradable still alerts, but summary tells user to open Analyze first
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

/** Grades that may create an alert (C and above). D is ignored. */
const ALERT_GRADES = new Set(["A+", "A", "B", "C"]);

function normalizeGrade(grade: unknown): string {
  return String(grade ?? "")
    .trim()
    .toUpperCase();
}

function isAlertableGrade(grade: string): boolean {
  if (ALERT_GRADES.has(grade)) return true;
  // Numeric bands sometimes stored as letter only
  return grade.startsWith("A") || grade.startsWith("B") || grade.startsWith("C");
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

/** Send email if RESEND_API_KEY is set; otherwise no-op (in-app only). */
export async function sendSetupAlertEmail(to: string, alert: SetupAlertRow): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM ?? "ChartPilot <onboarding@resend.dev>";
  if (!apiKey || !to.includes("@")) return false;

  const grade = normalizeGrade(alert.grade);
  const subjectExtra =
    grade === "C" || !alert.tradable ? " — review on Analyze first" : "";

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
  const tfs =
    prefs.timeframes.length > 0
      ? sortTimeframes(prefs.timeframes)
      : sortTimeframes(await listTimeframes(db, symbol));
  if (!tfs.length) {
    return { symbol, created: false, reason: "No timeframes in ohlc_data." };
  }

  const count = Math.max(40, Math.min(300, prefs.candleCount ?? 150));
  const series = await Promise.all(
    tfs.slice(0, 6).map(async (timeframe) => ({
      timeframe,
      candles: await fetchCandles(db, symbol, timeframe, count),
    })),
  );
  const available = series.filter((s) => s.candles.length >= 12);
  if (!available.length) {
    return { symbol, created: false, reason: "Not enough candles." };
  }

  const result = runDenAnalysis({
    symbol,
    series: available,
    minRR: prefs.minRR,
    requireVolume: prefs.requireVolume,
    strictMode: prefs.strictMode,
    rules: prefs.denRules,
  });

  const direction = String(result.direction ?? "");
  if (!isActionableDirection(direction)) {
    return {
      symbol,
      created: false,
      reason: `Direction is ${direction || "empty"} (not long/short).`,
    };
  }

  const grade = normalizeGrade(result.grade);
  const denTradable =
    typeof (result as { tradable?: boolean }).tradable === "boolean"
      ? Boolean((result as { tradable?: boolean }).tradable)
      : ["A", "A+", "B"].includes(grade);

  // Pass: long/short + grade C or better (A+/A/B/C). D and blank grades still blocked.
  if (!isAlertableGrade(grade)) {
    return {
      symbol,
      created: false,
      reason: `Grade ${grade || "none"} is below C — not alerted.`,
    };
  }

  const fingerprint = setupFingerprint({
    symbol,
    direction,
    entry_zone: result.entry_zone,
    stop_loss: result.stop_loss,
  });

  if (await recentFingerprintExists(db, prefs.userId, fingerprint, prefs.cooldownHours)) {
    return { symbol, created: false, reason: "Same setup already alerted inside cooldown." };
  }

  const summary = buildAlertSummary({
    summary: result.summary,
    grade: result.grade,
    tradable: denTradable,
    tradable_reasons: (result as { tradable_reasons?: string[] }).tradable_reasons,
  });

  const row = {
    user_id: prefs.userId,
    symbol: symbol.toUpperCase(),
    direction,
    grade: result.grade ?? null,
    score: result.score ?? null,
    max_score: result.max_score ?? null,
    // Store Den's real tradable flag (C may be false — still alerted)
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

  const { data: inserted, error } = await db
    .from("setup_alerts")
    .insert(row)
    .select("*")
    .single();
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

  const tier =
    grade === "C" || !denTradable ? "alerted (review on Analyze first)" : "alerted";
  return {
    symbol,
    created: true,
    reason: emailSent ? `${tier}; email sent.` : `${tier} (in-app).`,
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
