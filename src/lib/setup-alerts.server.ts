/**
 * Server-only: scan symbols with Den, insert setup_alerts, optional email via Resend.
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
        subject: `[ChartPilot] ${formatAlertTitle(alert)}`,
        text: `${formatAlertBody(alert)}\n\nOpen ChartPilot → Alerts to review. Not financial advice.`,
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
    return { symbol, created: false, reason: `Direction is ${direction || "empty"} (not long/short).` };
  }

  // Prefer tradable gate when present; otherwise allow high grades
  const tradable =
    typeof (result as { tradable?: boolean }).tradable === "boolean"
      ? Boolean((result as { tradable?: boolean }).tradable)
      : ["A", "A+", "B"].includes(String(result.grade ?? "").toUpperCase());

  if (!tradable) {
    return { symbol, created: false, reason: "Setup not tradable / quality gate failed." };
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

  const row = {
    user_id: prefs.userId,
    symbol: symbol.toUpperCase(),
    direction,
    grade: result.grade ?? null,
    score: result.score ?? null,
    max_score: result.max_score ?? null,
    tradable: true,
    entry_zone: result.entry_zone ?? null,
    stop_loss: result.stop_loss ?? null,
    tp1: result.tp1 ?? null,
    tp2: result.tp2 ?? null,
    summary: result.summary ?? null,
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

  return {
    symbol,
    created: true,
    reason: emailSent ? "Alert saved and email sent." : "Alert saved (in-app).",
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
