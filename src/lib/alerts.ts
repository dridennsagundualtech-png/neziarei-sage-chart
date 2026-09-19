/**
 * Simple Alert Engine helpers.
 * Store key levels from the Den Analyzer, then check them against live price
 * in a scheduled Supabase Edge Function.
 */

export type AlertType =
  | "APPROACHING_SUPPORT"
  | "APPROACHING_RESISTANCE"
  | "ENTERING_FVG"
  | "STRUCTURE_LEVEL"
  | "ORDER_BLOCK"
  | "CUSTOM";

export interface PriceAlert {
  id: string;
  symbol: string;
  type: AlertType;
  price: number;
  direction: "above" | "below" | "touch";
  message: string;
  createdAt: string;
  triggeredAt: string | null;
  active: boolean;
}

/**
 * Returns true if the current price should trigger the alert.
 */
export function shouldTriggerAlert(alert: PriceAlert, currentPrice: number, tolerance = 0): boolean {
  if (!alert.active || alert.triggeredAt) return false;

  switch (alert.direction) {
    case "above":
      return currentPrice >= alert.price - tolerance;
    case "below":
      return currentPrice <= alert.price + tolerance;
    case "touch":
      return Math.abs(currentPrice - alert.price) <= tolerance;
    default:
      return false;
  }
}

/**
 * Helper to create a clean alert object from Den Analyzer levels.
 */
export function createAlertFromLevel(params: {
  symbol: string;
  type: AlertType;
  price: number;
  direction: "above" | "below" | "touch";
  message: string;
}): Omit<PriceAlert, "id" | "createdAt" | "triggeredAt" | "active"> {
  return {
    symbol: params.symbol,
    type: params.type,
    price: params.price,
    direction: params.direction,
    message: params.message,
  };
}
