import type { Direction } from "./analysis-types";

interface InvalidationParams {
  direction: Direction;
  stop: number | null;
  digits: number;
  primaryTimeframe: string;
  hasFvg: boolean;
  htfBias: string;
}

function formatPrice(price: number, digits: number): string {
  return price.toFixed(digits);
}

/**
 * Builds clear, actionable invalidation conditions.
 */
export function buildInvalidationConditions(params: InvalidationParams): string[] {
  const { direction, stop, digits, primaryTimeframe, hasFvg, htfBias } = params;
  const conditions: string[] = [];

  if (stop != null) {
    const side = direction.includes("LONG") ? "below" : "above";
    conditions.push(
      `A close ${side} ${formatPrice(stop, digits)} on the ${primaryTimeframe} timeframe.`,
    );
  }

  if (hasFvg) {
    conditions.push("Price returns to the Fair Value Gap and closes through it.");
  }

  if (htfBias === "BULLISH" && direction.includes("LONG")) {
    conditions.push("Higher-timeframe structure flips bearish (lower low forms).");
  }

  if (htfBias === "BEARISH" && direction.includes("SHORT")) {
    conditions.push("Higher-timeframe structure flips bullish (higher high forms).");
  }

  if (conditions.length === 0) {
    conditions.push("No clear invalidation conditions could be derived from the current data.");
  }

  return conditions;
}
