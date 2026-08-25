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
  /** Contribution amount as a number. */
  contributionValue: number;
  /** Share of the pool this contribution represents, in percent. */
  cutValue: number;
  payout: number;
}

export interface SplitResult {
  gross: number;
  taxRate: number;
  taxAmount: number;
  net: number;
  totalContribution: number;
  distributed: number;
  remainder: number;
  hasContributions: boolean;
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

  const totalContribution = round2(
    state.members.reduce((sum, member) => sum + num(member.contribution), 0),
  );
  const hasContributions = totalContribution > 0;

  const members: MemberResult[] = state.members.map((member) => {
    const contributionValue = round2(num(member.contribution));
    const cutValue = hasContributions ? round2((contributionValue / totalContribution) * 100) : 0;
    const payout = hasContributions
      ? round2(net * (contributionValue / totalContribution))
      : 0;
    return { ...member, contributionValue, cutValue, payout };
  });

  const distributed = round2(members.reduce((sum, member) => sum + member.payout, 0));
  const remainder = round2(net - distributed);

  return {
    gross,
    taxRate,
    taxAmount,
    net,
    totalContribution,
    distributed,
    remainder,
    hasContributions,
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
