/**
 * Setup-alert scan: Den across watch symbols with Analyze-style candle presets.
 * OHLC reads use admin DB; inserts use the signed-in user client (RLS-safe).
 */
import type { AnyDb } from "./db-types";
import { runDenAnalysis } from "./den-analyzer.server";
import { fetchCandles, listTimeframes, sortTimeframes } from "./market.server";
import {
  candleCountForTf,
  getScanPreset,
  type ScanCandlePreset,
} from "./scan-presets";
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
  scanPresetId?: string | null;
}

export interface ScanHit {
  symbol: string;
  created: boolean;
  reason: string;
  presetName?: string;
  alert?: SetupAlertRow;
}

const ALERT_GRADES = new Set(["A+", "A", "B", "C"]);

const TF_ALIASES: Record<string, string[]> = {
  D1: ["D1", "1D", "1d", "D"],
  H4: ["H4", "4H", "4h"],
  H1: ["H1", "1H", "1h"],
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

function matchDbTimeframes(wanted: string[], available: string[]): string[] {
  const availUpper = new Map(available.map((t) => [t.toUpperCase(), t] as const));
  const out: string[] = [];
  const tryAdd = (label: string) => {
    const hit = availUpper.get(label.toUpperCase());
    if (hit && !out.includes(hit)) {
      out.push(hit);
      return true;
    }
    return false;
  };
  for (const raw of wanted) {
    if (tryAdd(raw)) continue;
    for (const [canonical, aliases] of Object.entries(TF_ALIASES)) {
      if (
        canonical === raw.toUpperCase() ||
        aliases.some((a) => a.toUpperCase() === raw.toUpperCase())
      ) {
        if (tryAdd(canonical)) break;
        for (const a of aliases) {
          if (tryAdd(a)) break;
        }
        break;
      }
    }
  }
  return sortTimeframes(out);
}

function resolveScanTimeframes(preset: ScanCandlePreset, available: string[]): string[] {
  const fromPreset = matchDbTimeframes(preset.timeframes, available);
  if (fromPreset.length) return fromPreset.slice(0, 6);
  return sortTimeframes(available).slice(0, 6);
}

async function resolveSymbolName(db: AnyDb, requested: string): Promise<string | null> {
  const base = requested.trim();
  if (!base) return null;
  // Prefer broker-style .r first when both might exist in UI lists
  const candidates = base.toUpperCase().endsWith(".R")
    ? [base, base.slice(0, -2)]
    : [`${base}.r`, `${base}.R`, base];
  for (const name of candidates) {
    try {
      const tfs = await listTimeframes(db, name);
      if (tfs.length > 0) return name;
    } catch {
      /* next */
    }
  }
  return null;
}

function buildAlertSummary(
  result: {
    summary?: string | null;
    grade?: string | null;
    tradable?: boolean;
    tradable_reasons?: string[];
  },
  preset: ScanCandlePreset,
  tfsUsed: string[],
): string {
  const grade = normalizeGrade(result.grade);
  const denTradable = result.tradable === true;
  const base = (result.summary ?? "").trim();
  const presetLine = `Scan preset: ${preset.name} (${tfsUsed.join(", ") || "default TFs"}).`;
  const reviewNote =
    !denTradable || grade === "C"
      ? "Review on Analyze first for full checklist, invalidation, and levels before acting."
      : "Open Analyze with the same preset to study the full checklist.";
  const qualityNote =
    !denTradable && Array.isArray(result.tradable_reasons) && result.tradable_reasons.length
      ? `Den quality notes: ${result.tradable_reasons.slice(0, 3).join("; ")}.`
      : !denTradable
        ? "Den did not mark this as fully tradable — treat as a watch / plan review."
        : "";
  return [base, presetLine, qualityNote, reviewNote].filter(Boolean).join(" ");
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
  // If RLS blocks, treat as no recent alert (insert will surface real errors)
  if (error) return false;
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
        text: `${formatAlertBody(alert)}\n\nOpen ChartPilot → Analyze with the same preset. Not financial advice.`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * @param ohlcDb - service/admin client for reading ohlc_data
 * @param writeDb - signed-in user client for setup_alerts (RLS: auth.uid() = user_id)
 */
export async function scanSymbolForSetupAlert(
  ohlcDb: AnyDb,
  writeDb: AnyDb,
  prefs: AlertScanPrefs,
  symbol: string,
): Promise<ScanHit> {
  const preset = getScanPreset(prefs.scanPresetId);
  const resolved = await resolveSymbolName(ohlcDb, symbol);
  if (!resolved) {
    return {
      symbol,
      created: false,
      reason: `No ohlc_data for "${symbol}" (tried .r variants).`,
      presetName: preset.name,
    };
  }

  const availableTfs = await listTimeframes(ohlcDb, resolved);
  if (!availableTfs.length) {
    return {
      symbol: resolved,
      created: false,
      reason: "No timeframes in ohlc_data.",
      presetName: preset.name,
    };
  }

  const tfs = resolveScanTimeframes(preset, availableTfs);
  const series = await Promise.all(
    tfs.map(async (timeframe) => {
      const canon =
        Object.keys(TF_ALIASES).find(
          (c) =>
            c === timeframe.toUpperCase() ||
            TF_ALIASES[c].some((a) => a.toUpperCase() === timeframe.toUpperCase()),
        ) ?? timeframe.toUpperCase();
      const n = candleCountForTf(preset, canon);
      return {
        timeframe,
        candles: await fetchCandles(ohlcDb, resolved, timeframe, n),
      };
    }),
  );
  const available = series.filter((s) => s.candles.length >= 12);
  if (!available.length) {
    return {
      symbol: resolved,
      created: false,
      reason: `Not enough candles for preset ${preset.name} (TFs: ${tfs.join(", ")}).`,
      presetName: preset.name,
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
      reason: `Den says ${direction || "empty"} grade ${grade || "—"} (need LONG/SHORT). Preset: ${preset.name}.`,
      presetName: preset.name,
    };
  }

  if (!isAlertableGrade(grade)) {
    return {
      symbol: resolved,
      created: false,
      reason: `Grade ${grade || "none"} below C — ${direction}. Preset: ${preset.name}.`,
      presetName: preset.name,
    };
  }

  const fingerprint = setupFingerprint({
    symbol: resolved,
    direction,
    entry_zone: result.entry_zone,
    stop_loss: result.stop_loss,
  });

  if (await recentFingerprintExists(writeDb, prefs.userId, fingerprint, prefs.cooldownHours)) {
    return {
      symbol: resolved,
      created: false,
      reason: `Already alerted inside cooldown (${direction} ${grade}).`,
      presetName: preset.name,
    };
  }

  const tfsUsed = available.map((s) => s.timeframe);
  const summary = buildAlertSummary(
    {
      summary: result.summary,
      grade: result.grade,
      tradable: denTradable,
      tradable_reasons: (result as { tradable_reasons?: string[] }).tradable_reasons,
    },
    preset,
    tfsUsed,
  );

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

  // User client so RLS insert policy (auth.uid() = user_id) succeeds
  const { data: inserted, error } = await writeDb
    .from("setup_alerts")
    .insert(row)
    .select("*")
    .single();
  if (error) {
    return {
      symbol: resolved,
      created: false,
      reason: `Save failed: ${error.message}`,
      presetName: preset.name,
    };
  }

  const alert = inserted as SetupAlertRow;
  let emailSent = false;
  if (prefs.emailEnabled && prefs.email) {
    emailSent = await sendSetupAlertEmail(prefs.email, alert);
    if (emailSent) {
      await writeDb.from("setup_alerts").update({ email_sent: true }).eq("id", alert.id);
      alert.email_sent = true;
    }
  }

  return {
    symbol: resolved,
    created: true,
    presetName: preset.name,
    reason: emailSent
      ? `${resolved} ${direction} ${grade} · ${preset.name}; email sent`
      : `${resolved} ${direction} ${grade} · ${preset.name}`,
    alert,
  };
}

export async function scanAllSymbolsForUser(
  ohlcDb: AnyDb,
  writeDb: AnyDb,
  prefs: AlertScanPrefs,
): Promise<ScanHit[]> {
  const hits: ScanHit[] = [];
  for (const symbol of prefs.symbols) {
    try {
      hits.push(await scanSymbolForSetupAlert(ohlcDb, writeDb, prefs, symbol));
    } catch (e) {
      hits.push({
        symbol,
        created: false,
        reason: e instanceof Error ? e.message : "Scan failed.",
        presetName: getScanPreset(prefs.scanPresetId).name,
      });
    }
  }
  return hits;
}
