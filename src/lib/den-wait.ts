/**
 * Builds specific "what to wait for" messages for the Den Analyzer.
 * Never returns a vague "WAIT" with no next step.
 */
import type { Direction } from "./analysis-types";

export interface WaitContext {
  direction: Direction;
  htfBias: string;
  primaryTimeframe: string;
  /** Numeric levels when known */
  sweepLevel: number | null;
  sweepSide: "high" | "low" | null;
  sweepReclaimed: boolean;
  breakLevel: number | null;
  breakSide: "up" | "down" | null;
  breakClosedBeyond: boolean;
  fvgLow: number | null;
  fvgHigh: number | null;
  fvgSide: "bullish" | "bearish" | null;
  fvgFilled: boolean;
  entry: number | null;
  stop: number | null;
  digits: number;
  score: number;
  maxScore: number;
  minScoreForEntry: number;
  strictMode: boolean;
}

function fmt(price: number, digits: number): string {
  return price.toFixed(digits);
}

/**
 * Returns concrete confirmation lines the user should watch for.
 * Always at least one actionable sentence when direction is WAIT.
 */
export function buildWaitConfirmations(ctx: WaitContext): string[] {
  const lines: string[] = [];
  const d = ctx.digits;
  const tf = ctx.primaryTimeframe;

  const isWait =
    ctx.direction === "WAIT" ||
    ctx.direction === "NO TRADE" ||
    ctx.direction === "INSUFFICIENT DATA";

  // HTF vs LTF conflict
  const bias = ctx.htfBias.toUpperCase();
  if (bias === "BEARISH" && ctx.sweepSide === "low" && !ctx.sweepReclaimed) {
    lines.push(
      `WAIT for a close back above the swept low ${fmt(ctx.sweepLevel!, d)} on ${tf} (reclaim), or for a clear bearish continuation that agrees with the bearish higher-timeframe bias.`,
    );
  }
  if (bias === "BULLISH" && ctx.sweepSide === "high" && !ctx.sweepReclaimed) {
    lines.push(
      `WAIT for a close back below the swept high ${fmt(ctx.sweepLevel!, d)} on ${tf} (reclaim), or for a clear bullish continuation that agrees with the bullish higher-timeframe bias.`,
    );
  }

  // Structure break not closed
  if (ctx.breakLevel != null && !ctx.breakClosedBeyond) {
    const side = ctx.breakSide === "up" ? "above" : "below";
    lines.push(
      `WAIT for a candle to close ${side} ${fmt(ctx.breakLevel, d)} on ${tf} to confirm the structure break.`,
    );
  }

  // Sweep without reclaim (generic if not already covered)
  if (
    ctx.sweepLevel != null &&
    !ctx.sweepReclaimed &&
    !lines.some((l) => l.includes("swept"))
  ) {
    const side = ctx.sweepSide === "high" ? "below" : "above";
    lines.push(
      `WAIT for price to reclaim (close ${side}) ${fmt(ctx.sweepLevel, d)} on ${tf} before treating the sweep as a reversal setup.`,
    );
  }

  // Unfilled FVG as entry wait
  if (
    ctx.fvgLow != null &&
    ctx.fvgHigh != null &&
    !ctx.fvgFilled &&
    (ctx.direction === "POTENTIAL LONG" ||
      ctx.direction === "POTENTIAL SHORT" ||
      ctx.direction === "WAIT")
  ) {
    lines.push(
      `WAIT for price to enter the ${ctx.fvgSide ?? ""} FVG zone ${fmt(ctx.fvgLow, d)}–${fmt(ctx.fvgHigh, d)} on ${tf} and hold it (no close straight through).`.replace(
        "  ",
        " ",
      ),
    );
  }

  // Score too low for entry
  if (ctx.score < ctx.minScoreForEntry && ctx.direction !== "NO TRADE") {
    lines.push(
      `WAIT for more checklist confirmation (currently ${ctx.score}/${ctx.maxScore}; entry threshold ~${ctx.minScoreForEntry}).`,
    );
  }

  // Entry zone not reached yet
  if (
    ctx.entry != null &&
    (ctx.direction === "POTENTIAL LONG" || ctx.direction === "POTENTIAL SHORT")
  ) {
    lines.push(
      `WAIT for price to reach the entry zone near ${fmt(ctx.entry, d)} on ${tf} — do not chase mid-move.`,
    );
  }

  // Strict mode
  if (ctx.strictMode && ctx.direction === "WAIT") {
    lines.push(
      "Strict mode is on: only act after the missing confirmation above prints on the chart.",
    );
  }

  // Fallback so WAIT is never empty
  if (lines.length === 0 && isWait) {
    lines.push(
      `WAIT for a clear liquidity sweep and a confirmed structure break (close beyond a swing) on ${tf} that agrees with the ${ctx.htfBias.toLowerCase()} higher-timeframe bias.`,
    );
  }

  // De-dupe while preserving order
  return [...new Set(lines)].slice(0, 5);
}

/** One-line summary under the direction badge. */
export function buildWaitingForSummary(confirmations: string[]): string | null {
  if (!confirmations.length) return null;
  const first = confirmations[0]!;
  // Strip leading WAIT for a cleaner badge line
  return first.replace(/^WAIT\s+for\s+/i, "Waiting for ").replace(/^WAIT\s+/i, "Waiting: ");
}
