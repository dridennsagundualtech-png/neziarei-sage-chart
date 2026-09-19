/**
 * Fixed-fractional position sizing.
 * Risk a fixed percentage of the account. If the stop is hit, you lose exactly that %.
 */

export interface PositionSizeResult {
  riskAmount: number;
  riskPerUnit: number;
  positionSize: number;
  positionValue: number;
}

/**
 * @param accountBalance - Total account balance in account currency
 * @param riskPct - Risk per trade in percent (e.g. 1 = 1%)
 * @param entry - Entry price
 * @param stop - Stop loss price
 */
export function computePositionSize(
  accountBalance: number,
  riskPct: number,
  entry: number,
  stop: number,
): PositionSizeResult | null {
  if (
    !Number.isFinite(accountBalance) ||
    !Number.isFinite(riskPct) ||
    !Number.isFinite(entry) ||
    !Number.isFinite(stop)
  ) {
    return null;
  }

  if (accountBalance <= 0 || riskPct <= 0 || entry <= 0 || stop <= 0) {
    return null;
  }

  if (entry === stop) return null;

  const riskAmount = accountBalance * (riskPct / 100);
  const riskPerUnit = Math.abs(entry - stop);
  const positionSize = riskAmount / riskPerUnit;
  const positionValue = positionSize * entry;

  return {
    riskAmount: Number(riskAmount.toFixed(2)),
    riskPerUnit: Number(riskPerUnit.toFixed(6)),
    positionSize: Number(positionSize.toFixed(4)),
    positionValue: Number(positionValue.toFixed(2)),
  };
}
