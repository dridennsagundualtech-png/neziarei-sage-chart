export type CurrencyCode = "USD" | "PHP" | "EUR" | "GBP";

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "PHP", symbol: "₱", label: "PHP (₱)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
];

export type TaxMode = "percent" | "fixed";

export interface SplitMember {
  id: string;
  name: string;
  /** Amount this member contributed to the trade capital. */
  contribution: string;
}

export interface SplitState {
  currency: CurrencyCode;
  profit: string;
  taxMode: TaxMode;
  taxPercent: string;
  taxFixed: string;
  members: SplitMember[];
}

export interface SavedTrade {
  id: string;
  label: string;
  savedAt: string;
  state: SplitState;
}

export const SPLIT_STORAGE_KEY = "chartpilot.split.state.v2";
export const SPLIT_HISTORY_KEY = "chartpilot.split.history.v2";

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const SAMPLE_STATE: SplitState = {
  currency: "PHP",
  profit: "100000",
  taxMode: "percent",
  taxPercent: "10",
  taxFixed: "0",
  members: [
    { id: "m1", name: "Trader A", contribution: "5000" },
    { id: "m2", name: "Trader B", contribution: "3000" },
    { id: "m3", name: "Trader C", contribution: "2000" },
  ],
};

/** Parse a user-entered number safely: never NaN, never negative. */
export function num(value: string): number {
  const parsed = Number.parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

/** Round to 2 decimals without float drift (e.g. 1.005 -> 1.01). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface MemberResult extends SplitMember {
  cutValue: number;
  payout: number;
}

export interface SplitResult {
  gross: number;
  taxRate: number;
  taxAmount: number;
  net: number;
  totalCut: number;
  distributed: number;
  remainder: number;
  remainderPercent: number;
  cutStatus: "exact" | "under" | "over";
  members: MemberResult[];
}

export function computeSplit(state: SplitState): SplitResult {
  const gross = round2(num(state.profit));

  let taxAmount: number;
  if (state.taxMode === "fixed") {
    taxAmount = Math.min(round2(num(state.taxFixed)), gross);
  } else {
    const pct = Math.min(num(state.taxPercent), 100);
    taxAmount = round2(gross * (pct / 100));
  }
  taxAmount = Math.min(taxAmount, gross);
  const net = round2(gross - taxAmount);
  const taxRate = gross > 0 ? round2((taxAmount / gross) * 100) : 0;

  const members: MemberResult[] = state.members.map((member) => {
    const cutValue = Math.min(num(member.cut), 100);
    return { ...member, cutValue, payout: round2(net * (cutValue / 100)) };
  });

  const totalCut = round2(members.reduce((sum, member) => sum + member.cutValue, 0));
  const distributed = round2(members.reduce((sum, member) => sum + member.payout, 0));
  const remainder = round2(net - distributed);
  const remainderPercent = round2(100 - totalCut);
  const cutStatus = totalCut > 100.0001 ? "over" : totalCut < 99.9999 ? "under" : "exact";

  return {
    gross,
    taxRate,
    taxAmount,
    net,
    totalCut,
    distributed,
    remainder,
    remainderPercent,
    cutStatus,
    members,
  };
}

export function formatMoney(value: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(round2(value));
}

export function formatPercent(value: number): string {
  return `${round2(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}
