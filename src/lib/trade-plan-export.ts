/**
 * Practical trade-plan export helpers for ChartPilot.
 *
 * Generates clean, copy-paste ready text for journals, Discord/Telegram,
 * and simple TradingView alert ideas. Never invents prices or probabilities.
 */

import type { AnalysisResult } from "./analysis-types";
import { midpointOf } from "./stats";

export type EaSignalLevel = "READY" | "DEVELOPING" | "WAIT" | "NO_TRADE";

export interface EaSignal {
  level: EaSignalLevel;
  label: string;
  shortReason: string;
}

/**
 * Practical "EA readiness" summary derived only from score, direction and stage.
 * This is a rule-based convenience label, not a prediction.
 */
export function eaSignalOf(result: AnalysisResult, minScoreForReady = 12): EaSignal {
  const dir = result.direction;
  const stage = result.setup_stage;
  const score = result.score;
  const max = result.max_score || 16;
  const ratio = max > 0 ? score / max : 0;

  if (
    dir === "NO TRADE" ||
    dir === "INSUFFICIENT DATA" ||
    stage === "NO TRADE" ||
    stage === "SETUP INVALIDATED"
  ) {
    return {
      level: "NO_TRADE",
      label: "NO TRADE",
      shortReason: "Evidence does not support a position right now.",
    };
  }

  if (dir === "WAIT" || stage === "SETUP FORMING") {
    return {
      level: "WAIT",
      label: "WAIT",
      shortReason: "Setup is developing — confirmation is still required.",
    };
  }

  const isDirectional =
    dir === "POTENTIAL LONG" || dir === "POTENTIAL SHORT";
  const isActionableStage =
    stage === "SETUP CONFIRMED" || stage === "ENTRY AVAILABLE";

  if (isDirectional && isActionableStage && score >= minScoreForReady && ratio >= 0.7) {
    return {
      level: "READY",
      label: "EA READY",
      shortReason: `High-quality ${dir.replace("POTENTIAL ", "")} with score ${score}/${max}. Still confirm live structure before size.`,
    };
  }

  if (isDirectional && score >= Math.floor(minScoreForReady * 0.7)) {
    return {
      level: "DEVELOPING",
      label: "DEVELOPING",
      shortReason: "Direction is readable but confirmation or R:R is incomplete.",
    };
  }

  return {
    level: "WAIT",
    label: "WAIT",
    shortReason: "Not yet ready for an actionable plan.",
  };
}

export function formatTradePlanText(
  result: AnalysisResult,
  opts?: {
    riskAmount?: number | null;
    units?: number | null;
    currency?: string;
    riskPct?: number;
  },
): string {
  const signal = eaSignalOf(result);
  const lines: string[] = [];

  lines.push(`ChartPilot Trade Plan — ${result.asset}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Signal: ${signal.label}`);
  lines.push(`Direction: ${result.direction}`);
  lines.push(`Stage: ${result.setup_stage}`);
  lines.push(`Score: ${result.score}/${result.max_score} (${result.grade})`);
  lines.push(`HTF bias: ${result.htf_bias}`);
  if (result.primary_timeframe) lines.push(`Primary TF: ${result.primary_timeframe}`);
  lines.push("");

  lines.push(`ENTRY:  ${result.entry_zone ?? "— not readable from chart"}`);
  lines.push(`STOP:   ${result.stop_loss ?? "— not readable from chart"}`);
  lines.push(`TP1:    ${result.tp1 ?? "—"}`);
  lines.push(`TP2:    ${result.tp2 ?? "—"}`);
  lines.push(
    `R:R:    ${
      typeof result.risk_reward === "number"
        ? `${result.risk_reward.toFixed(1)}R`
        : "not measurable"
    }`,
  );
  lines.push("");

  if (opts?.riskAmount != null && opts.riskAmount > 0) {
    lines.push(
      `Risk:   ${opts.currency ?? "USD"} ${opts.riskAmount.toFixed(2)} (${opts.riskPct ?? 1}% of account)`,
    );
    if (opts.units != null && opts.units > 0) {
      lines.push(`Size:   ~${opts.units.toFixed(4)} units (based on entry/stop distance)`);
    }
    lines.push("");
  }

  if (result.required_confirmation.length) {
    lines.push("Confirmation required:");
    result.required_confirmation.forEach((c) => lines.push(`  • ${c}`));
    lines.push("");
  }

  if (result.invalidation.length) {
    lines.push("Invalidation:");
    result.invalidation.forEach((i) => lines.push(`  • ${i}`));
    lines.push("");
  }

  if (result.summary) {
    lines.push(`Summary: ${result.summary}`);
    lines.push("");
  }

  lines.push("— Educational analysis only. Not financial advice. Confirm live price action before risking capital.");

  return lines.join("\n");
}

/** Compact format good for Discord / Telegram. */
export function formatTradePlanCompact(result: AnalysisResult): string {
  const signal = eaSignalOf(result);
  const dirEmoji =
    result.direction === "POTENTIAL LONG"
      ? "🟢"
      : result.direction === "POTENTIAL SHORT"
        ? "🔴"
        : "⚪";

  return [
    `${dirEmoji} **${result.asset}** · ${signal.label}`,
    `${result.direction} · ${result.score}/${result.max_score} ${result.grade}`,
    `Entry: ${result.entry_zone ?? "—"}`,
    `Stop: ${result.stop_loss ?? "—"}`,
    `TP1 / TP2: ${result.tp1 ?? "—"} / ${result.tp2 ?? "—"}`,
    `R:R ${typeof result.risk_reward === "number" ? result.risk_reward.toFixed(1) + "R" : "n/a"}`,
    `_Confirm live. Educational only._`,
  ].join("\n");
}

/**
 * Very simple TradingView-style alert idea based on readable levels.
 * Does not invent prices. Returns null when prices cannot be parsed.
 */
export function generateSimplePineAlert(result: AnalysisResult): string | null {
  const entry = midpointOf(result.entry_zone);
  const stop = midpointOf(result.stop_loss);
  if (entry == null || stop == null) return null;

  const isLong = result.direction === "POTENTIAL LONG";
  const isShort = result.direction === "POTENTIAL SHORT";
  if (!isLong && !isShort) return null;

  const tp1 = midpointOf(result.tp1);
  const symbol = result.asset.replace(/[^A-Za-z0-9]/g, "") || "SYMBOL";

  // Minimal educational snippet — user must adapt to their chart and session.
  const lines = [
    `// ChartPilot educational alert idea for ${result.asset}`,
    `// Direction: ${result.direction} | Score ${result.score}/${result.max_score}`,
    `// Paste into Pine Editor → add to chart → set alerts. Always verify levels live.`,
    ``,
    `//@version=5`,
    `indicator("ChartPilot Plan — ${symbol}", overlay=true)`,
    ``,
    `entryLevel = ${entry}`,
    `stopLevel  = ${stop}`,
    tp1 != null ? `tp1Level   = ${tp1}` : `// tp1 not readable`,
    ``,
    `plot(entryLevel, "Entry", color=color.teal, linewidth=2)`,
    `plot(stopLevel,  "Stop",  color=color.red,  linewidth=2)`,
    tp1 != null ? `plot(tp1Level, "TP1", color=color.green, linewidth=1)` : "",
    ``,
    isLong
      ? `alertcondition(close >= entryLevel and close > stopLevel, title="Long zone touch", message="${symbol} long zone reached — confirm structure")`
      : `alertcondition(close <= entryLevel and close < stopLevel, title="Short zone touch", message="${symbol} short zone reached — confirm structure")`,
    ``,
    `// Reminder: this is not an EA. Confirm MSS/BOS and session context live.`,
  ].filter(Boolean);

  return lines.join("\n");
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
  }
  return false;
}
