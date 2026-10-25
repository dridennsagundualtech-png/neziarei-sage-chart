/**
 * What an instrument is priced in and how big one lot is, read from its symbol.
 *
 * A stop distance is measured in the instrument's QUOTE currency (USD for
 * XAUUSD, JPY for USDJPY). A position size is only right once that price risk
 * is converted into the ACCOUNT currency — skipping that step oversizes a PHP
 * account on gold about 60 times and undersizes USDJPY about 150 times.
 */

const CURRENCIES = new Set([
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "SGD",
  "HKD",
  "MXN",
  "ZAR",
  "TRY",
  "PLN",
  "CNH",
  "CNY",
  "PHP",
  "INR",
  "THB",
  "HUF",
  "CZK",
  "ILS",
  "KRW",
  "IDR",
  "MYR",
  "TWD",
  "BRL",
]);

/** Ounces per standard lot. */
const METALS: Record<string, number> = { XAU: 100, XAG: 5000, XPT: 100, XPD: 100 };

const CRYPTO = [
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "LTC",
  "BNB",
  "ADA",
  "DOGE",
  "DOT",
  "AVAX",
  "LINK",
  "BCH",
];

const INDEX_QUOTES: [RegExp, string][] = [
  [/^(US30|DJ30|DJI|WS30|US500|SPX500|SP500|SPX|US100|NAS100|USTEC|NDX|US2000)/, "USD"],
  [/^(GER40|GER30|DE40|DE30|DAX|EU50|STOXX50|FRA40|FR40|ESP35|IT40|NETH25)/, "EUR"],
  [/^(UK100|FTSE)/, "GBP"],
  [/^(JP225|JPN225|NIKKEI)/, "JPY"],
  [/^(AUS200|ASX200)/, "AUD"],
  [/^(HK50|HSI)/, "HKD"],
];

export type InstrumentKind = "forex" | "metal" | "crypto" | "index" | "stock" | "unknown";

export interface Instrument {
  /** Symbol without broker decorations (".r", "m", "#", "-ECN"). */
  core: string;
  kind: InstrumentKind;
  /** Currency the price is quoted in, or null when it can't be told. */
  quote: string | null;
  /** Units in one standard lot (100,000 for FX, 100 oz for gold, 1 otherwise). */
  contractSize: number;
}

export function instrumentOf(symbol: string): Instrument {
  // "EUR/USD" → "EURUSD"; then drop broker decorations: "XAUUSD.r", "GBPJPY#", "BTCUSD-ECN".
  const upper = symbol.trim().toUpperCase().replace(/\//g, "");
  const core = upper.split(/[.#_\-\s]/)[0] || upper;
  const base = core.slice(0, 3);
  const quote = core.slice(3, 6);

  if (core.length >= 6 && METALS[base] && CURRENCIES.has(quote)) {
    return { core: base + quote, kind: "metal", quote, contractSize: METALS[base]! };
  }
  if (core.length >= 6 && CURRENCIES.has(base) && CURRENCIES.has(quote)) {
    return { core: base + quote, kind: "forex", quote, contractSize: 100_000 };
  }
  const coin = CRYPTO.find((c) => core.startsWith(c));
  if (coin) {
    const rest = core.slice(coin.length);
    const q = rest.startsWith("USDT") || rest.startsWith("USDC") ? "USD" : rest.slice(0, 3);
    return { core, kind: "crypto", quote: CURRENCIES.has(q) ? q : null, contractSize: 1 };
  }
  const index = INDEX_QUOTES.find(([pattern]) => pattern.test(core));
  if (index) return { core, kind: "index", quote: index[1], contractSize: 1 };
  // Energies and other CFDs such as XTIUSD / XBRUSD: the quote is readable, the
  // lot size is broker-specific, so sizes are shown in units.
  if (core.length === 6 && CURRENCIES.has(quote)) {
    return { core, kind: "unknown", quote, contractSize: 1 };
  }
  if (/^[A-Z]{1,5}$/.test(core)) return { core, kind: "stock", quote: "USD", contractSize: 1 };
  return { core, kind: "unknown", quote: null, contractSize: 1 };
}

/**
 * Typical spread + commission for one round trip on a raw-spread account, in
 * price units: a starting point for backtests, not a quote from your broker.
 * Zero when the instrument is unknown.
 */
export function typicalCost(symbol: string): number {
  const inst = instrumentOf(symbol);
  if (inst.kind === "metal") return inst.core.startsWith("XAU") ? 0.3 : 0.03;
  if (inst.kind === "forex") return inst.quote === "JPY" ? 0.012 : 0.0001;
  return 0;
}

/** "₱", "php ", "Php" → "PHP". Unknown text is returned upper-cased. */
export function normalizeCurrency(text: string | null | undefined): string {
  const t = String(text ?? "").trim();
  const bySign: Record<string, string> = {
    "₱": "PHP",
    $: "USD",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
  };
  return (
    bySign[t] ??
    (t
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 3) ||
      "USD")
  );
}

export interface Sizing {
  riskAmount: number;
  quote: string | null;
  account: string;
  /** Price risk per unit, in the quote currency. */
  riskPerUnit: number | null;
  /** 1 quote = rate account; null when needed but not known yet. */
  rate: number | null;
  units: number | null;
  lots: number | null;
  contractSize: number;
  kind: InstrumentKind;
  /** True when the quote currency differs from the account and no rate is known. */
  needsRate: boolean;
  /**
   * Account-currency risk of the smallest common lot (0.01) at this stop, for
   * lot-based instruments. When it exceeds riskAmount, even the minimum trade
   * breaks the risk rule.
   */
  minLotRisk: number | null;
  /**
   * Lots you can actually send: rounded down to the 0.01 step so the trade
   * never risks more than the budget, or the 0.01 minimum when that is within
   * 5% of it. Null below the minimum and for instruments sized in units.
   */
  tradeLots: number | null;
  /** Account-currency risk at tradeLots. */
  tradeRisk: number | null;
}

/** The lot step most brokers accept, and how far over budget the minimum lot may go unflagged. */
export const LOT_STEP = 0.01;
export const MIN_LOT_SLACK = 1.05;

export function sizePosition(opts: {
  symbol: string;
  balance: number;
  riskPct: number;
  accountCurrency: string;
  entry: number | null;
  stop: number | null;
  /** 1 quote = this many account units. Ignored when they are the same currency. */
  quoteToAccount?: number | null;
}): Sizing {
  const inst = instrumentOf(opts.symbol);
  const account = normalizeCurrency(opts.accountCurrency);
  const riskAmount =
    Number.isFinite(opts.balance) && Number.isFinite(opts.riskPct)
      ? (Math.max(0, opts.balance) * Math.max(0, opts.riskPct)) / 100
      : 0;
  const riskPerUnit =
    opts.entry && opts.stop && opts.entry !== opts.stop ? Math.abs(opts.entry - opts.stop) : null;
  const same = inst.quote === account;
  const rate = same
    ? 1
    : opts.quoteToAccount && opts.quoteToAccount > 0
      ? opts.quoteToAccount
      : null;
  const units = riskPerUnit && rate && riskAmount > 0 ? riskAmount / (riskPerUnit * rate) : null;
  const lots = units === null ? null : units / inst.contractSize;
  const minLotRisk =
    inst.contractSize > 1 && riskPerUnit && rate
      ? LOT_STEP * inst.contractSize * riskPerUnit * rate
      : null;
  // Whole steps, then divide: the epsilon keeps 0.05 from flooring to 0.04 on float noise.
  const stepsPerLot = Math.round(1 / LOT_STEP);
  let tradeLots =
    lots === null || inst.contractSize <= 1
      ? null
      : Math.floor(lots * stepsPerLot + 1e-9) / stepsPerLot;
  if (tradeLots === 0) {
    tradeLots = minLotRisk !== null && minLotRisk <= riskAmount * MIN_LOT_SLACK ? LOT_STEP : null;
  }
  return {
    riskAmount,
    quote: inst.quote,
    account,
    riskPerUnit,
    rate,
    units,
    lots,
    contractSize: inst.contractSize,
    kind: inst.kind,
    needsRate: !same && rate === null,
    minLotRisk,
    tradeLots,
    tradeRisk:
      tradeLots !== null && riskPerUnit && rate
        ? tradeLots * inst.contractSize * riskPerUnit * rate
        : null,
  };
}

/**
 * Daily reference rate (European Central Bank via frankfurter.dev, falling back
 * to open.er-api.com). Accurate to well under 1% for sizing, which is far
 * inside a stop's own slippage.
 */
export async function fetchFxRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  const sources: [string, (json: unknown) => number | undefined][] = [
    [
      `https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`,
      (json) => (json as { rates?: Record<string, number> }).rates?.[to],
    ],
    [
      `https://open.er-api.com/v6/latest/${from}`,
      (json) => (json as { rates?: Record<string, number> }).rates?.[to],
    ],
  ];
  for (const [url, read] of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const rate = read(await res.json());
      if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) return rate;
    } catch {
      /* try the next source */
    }
  }
  return null;
}

/** "0.37 lots (37,000 units)": the size you can send, with sensible precision per instrument. */
export function formatSize(
  s: Pick<Sizing, "units" | "lots" | "contractSize" | "kind" | "tradeLots">,
): string {
  if (s.units === null || s.lots === null) return "—";
  if (s.contractSize === 1) {
    const units = s.units.toLocaleString(undefined, {
      maximumFractionDigits: s.units < 10 ? 4 : 0,
    });
    const noun = s.kind === "stock" ? "shares" : s.kind === "crypto" ? "coins" : "units";
    return `${units} ${noun}`;
  }
  if (s.tradeLots === null) return `Under ${LOT_STEP} lots`;
  const units = Math.round(s.tradeLots * s.contractSize).toLocaleString("en-US");
  return `${s.tradeLots.toFixed(2)} lots (${units} units)`;
}
