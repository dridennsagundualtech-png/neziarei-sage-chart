/**
 * EA check: reads an MT5 report saved as HTML (Strategy Tester › Report, or
 * Toolbox › History › Report) and judges the trades in it. Runs on the device;
 * nothing is uploaded.
 *
 * Fixed in advance, nothing to tune:
 *   martingale  an entry at 1.5× the previous lot or more, after a loss or while
 *               adding to a losing position, on 30% or more of such chances (5+)
 *   grid        4 or more trades open in the same direction on one symbol, mostly
 *               added at worse prices
 *   no stop     20% or more of positions closed without a stop loss (history reports only)
 *   big losses  the largest loss is 10× the average win or more, or a win rate of
 *               80%+ with losses 3× the wins
 *   luck        each trade's result kept or flipped by a coin, one coin per day
 *               (coinFlipP); passes at 5% with 100+ trades over 180+ days
 */
import { coinFlipP, MAX_P } from "./edge-verdict";

export interface Deal {
  time: string;
  symbol: string;
  type: string;
  direction: string;
  volume: number;
  price: number;
  /** Profit + commission + fee + swap. */
  net: number;
  balance: number | null;
}

export interface Mt5Report {
  deals: Deal[];
  /** Stop loss per closed position, when the report has a Positions table. */
  stops: (number | null)[] | null;
  /** First balance deal (the deposit), when the report has one. */
  deposit: number | null;
}

const entity: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
};
const clean = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(
      /&(#?\w+);/g,
      (m, e: string) =>
        entity[e] ?? (e.startsWith("#") ? String.fromCharCode(Number(e.slice(1))) : m),
    )
    .replace(/\s+/g, " ")
    .trim();
const key = (text: string) => text.toLowerCase().replace(/[^a-z/]/g, "");
/** "10 000.00", "-1 234.5", "0.10 / 0.10" → the first number. */
const num = (text: string | undefined) => {
  const match = (text ?? "").replace(/[\s ]/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};
const DATE = /^\d{4}\.\d{2}\.\d{2}/;

function rowsOf(html: string): string[][] {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
    [...row[1]!.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => clean(cell[1]!)),
  );
}

/** The rows after a header row that has every one of `need`, while their first cell is a date. */
function table(rows: string[][], need: string[]) {
  const at = rows.findIndex((cells) => need.every((n) => cells.some((c) => key(c) === n)));
  if (at < 0) return null;
  const head = rows[at]!.map(key);
  const body: string[][] = [];
  for (const cells of rows.slice(at + 1)) {
    if (!DATE.test(cells[0] ?? "") || cells.length < head.length) break;
    body.push(cells);
  }
  return { head, body };
}

export function parseMt5Report(html: string): Mt5Report {
  const rows = rowsOf(html);
  const dealTable = table(rows, [
    "time",
    "deal",
    "symbol",
    "type",
    "direction",
    "volume",
    "price",
    "profit",
  ]);
  if (!dealTable) return { deals: [], stops: null, deposit: null };
  const col = (name: string) => dealTable.head.indexOf(name);
  const [iTime, iSym, iType, iDir, iVol, iPrice, iProfit, iBal] = [
    "time",
    "symbol",
    "type",
    "direction",
    "volume",
    "price",
    "profit",
    "balance",
  ].map(col);
  const costs = ["commission", "fee", "swap"].map(col).filter((i) => i >= 0);

  let deposit: number | null = null;
  const deals: Deal[] = [];
  for (const cells of dealTable.body) {
    const type = (cells[iType!] ?? "").toLowerCase();
    if (type === "balance" || type === "credit") {
      deposit ??= num(cells[iProfit!]);
      continue;
    }
    if (type !== "buy" && type !== "sell") continue;
    const net = (num(cells[iProfit!]) ?? 0) + costs.reduce((s, i) => s + (num(cells[i]) ?? 0), 0);
    deals.push({
      time: cells[iTime!]!.replace(/^(\d{4})\.(\d{2})\.(\d{2})\s?/, "$1-$2-$3T") + "Z",
      symbol: cells[iSym!] ?? "",
      type,
      direction: (cells[iDir!] ?? "").toLowerCase(),
      volume: num(cells[iVol!]) ?? 0,
      price: num(cells[iPrice!]) ?? 0,
      net,
      balance: iBal! >= 0 ? num(cells[iBal!]) : null,
    });
  }

  // Account history reports also list closed positions with their final stop loss.
  const positions = table(rows, ["position", "symbol", "type", "volume", "s/l", "t/p"]);
  const iStop = positions ? positions.head.indexOf("s/l") : -1;
  const stops = positions
    ? positions.body.map((cells) => {
        const v = num(cells[iStop]);
        return v && v > 0 ? v : null;
      })
    : null;
  return { deals, stops, deposit };
}

export interface EaFlag {
  key: "martingale" | "grid" | "nostop" | "bigloss";
  label: string;
  /** true: the warning applies. null: the report can't show it. */
  hit: boolean | null;
  detail: string;
}

export interface EaCheck {
  trades: number;
  net: number;
  winRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  largestLoss: number | null;
  profitFactor: number | null;
  /** Deepest fall of the closed-trade balance from its peak, 0–1. */
  maxDrawdown: number | null;
  days: number;
  flags: EaFlag[];
  coinFlip: number | null;
  level: "empty" | "none" | "danger" | "thin" | "unproven" | "passes";
  headline: string;
}

const money = (v: number) =>
  (v < 0 ? "−" : "") +
  Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export function checkEa(report: Mt5Report): EaCheck {
  const { deals } = report;
  // Results per closing deal; opening costs ride on the next close of that symbol.
  const pendingCost = new Map<string, number>();
  const results: { time: string; net: number; symbol: string }[] = [];
  // Open entries per symbol and side, for stacking and lot-growth checks.
  const open = new Map<string, { volume: number; price: number }[]>();
  const lastResult = new Map<string, number>();
  const lastEntry = new Map<string, { volume: number; price: number }>();
  let chances = 0;
  let steps = 0;
  let maxStack = 0;
  let stackAdds = 0;
  let worseAdds = 0;

  for (const d of deals) {
    const closing =
      d.direction.startsWith("out") || d.direction === "in/out" || d.direction === "inout";
    const opening = d.direction === "in" || d.direction === "in/out" || d.direction === "inout";
    if (closing) {
      const net = d.net + (pendingCost.get(d.symbol) ?? 0);
      pendingCost.set(d.symbol, 0);
      results.push({ time: d.time, net, symbol: d.symbol });
      lastResult.set(d.symbol, net);
      // A closing buy closes sells and the other way round, oldest first.
      const side = `${d.symbol}|${d.type === "buy" ? "sell" : "buy"}`;
      let left = d.volume;
      const list = open.get(side) ?? [];
      while (left > 1e-9 && list.length) {
        const take = Math.min(left, list[0]!.volume);
        list[0]!.volume -= take;
        left -= take;
        if (list[0]!.volume <= 1e-9) list.shift();
      }
    } else if (opening) {
      pendingCost.set(d.symbol, (pendingCost.get(d.symbol) ?? 0) + d.net);
    }
    if (d.direction === "in") {
      const side = `${d.symbol}|${d.type}`;
      const list = open.get(side) ?? [];
      const prev = lastEntry.get(d.symbol);
      const prevOpen = list[list.length - 1];
      const worse = prevOpen
        ? d.type === "buy"
          ? d.price < prevOpen.price
          : d.price > prevOpen.price
        : false;
      if (prevOpen) {
        stackAdds += 1;
        if (worse) worseAdds += 1;
      }
      if (prev && (worse || (!prevOpen && (lastResult.get(d.symbol) ?? 0) < 0))) {
        chances += 1;
        if (d.volume >= prev.volume * 1.5) steps += 1;
      }
      list.push({ volume: d.volume, price: d.price });
      open.set(side, list);
      maxStack = Math.max(maxStack, list.length);
      lastEntry.set(d.symbol, { volume: d.volume, price: d.price });
    }
  }

  const n = results.length;
  const wins = results.filter((r) => r.net > 0);
  const losses = results.filter((r) => r.net < 0);
  const net = results.reduce((s, r) => s + r.net, 0);
  const sum = (list: typeof results) => list.reduce((s, r) => s + r.net, 0);
  const avgWin = wins.length ? sum(wins) / wins.length : null;
  const avgLoss = losses.length ? -sum(losses) / losses.length : null;
  const largestLoss = losses.length ? -Math.min(...losses.map((r) => r.net)) : null;
  const winRate = n ? wins.length / n : null;
  const profitFactor = losses.length ? sum(wins) / -sum(losses) : null;

  let peak = report.deposit ?? null;
  let maxDrawdown: number | null = null;
  let balance = report.deposit ?? 0;
  for (const r of results) {
    balance += r.net;
    if (peak === null || balance > peak) peak = balance;
    if (peak > 0) maxDrawdown = Math.max(maxDrawdown ?? 0, (peak - balance) / peak);
  }
  const days =
    deals.length > 1
      ? (Date.parse(deals[deals.length - 1]!.time) - Date.parse(deals[0]!.time)) / 86_400_000
      : 0;

  const noStops = report.stops ? report.stops.filter((s) => s === null).length : null;
  const flags: EaFlag[] = [
    {
      key: "martingale",
      label: "Raises the lot after losses",
      hit: chances >= 5 ? steps / chances >= 0.3 : false,
      detail:
        chances === 0
          ? "No entry followed a loss or added to a losing trade."
          : `${steps} of ${chances} entries after a loss, or added to a losing trade, were 1.5× the previous lot or more.`,
    },
    {
      key: "grid",
      label: "Stacks trades against the move",
      hit: maxStack >= 4 && worseAdds > stackAdds / 2,
      detail: `Up to ${maxStack} trade${maxStack === 1 ? "" : "s"} open on one symbol in one direction; ${worseAdds} of ${stackAdds} added trades came in at a worse price.`,
    },
    {
      key: "nostop",
      label: "Trades without a stop loss",
      hit: report.stops && report.stops.length ? noStops! / report.stops.length >= 0.2 : null,
      detail:
        report.stops && report.stops.length
          ? `${noStops} of ${report.stops.length} positions closed with no stop loss set.`
          : "This report doesn't list stop losses. An account history report does.",
    },
    {
      key: "bigloss",
      label: "Rare losses wipe out many wins",
      hit:
        avgWin !== null && largestLoss !== null && avgLoss !== null
          ? largestLoss >= 10 * avgWin || ((winRate ?? 0) >= 0.8 && avgLoss >= 3 * avgWin)
          : false,
      detail:
        avgWin !== null && largestLoss !== null
          ? `The largest loss is ${(largestLoss / avgWin).toFixed(1)}× the average win.`
          : "Not enough wins and losses to compare.",
    },
  ];

  const coinFlip =
    n >= 100 && net > 0
      ? coinFlipP(
          results.map((r) => ({
            time: r.time,
            outcome: "TP1",
            realizedR: r.net,
            mirrorOutcome: "TP1",
            mirrorR: -r.net,
          })),
          MAX_P,
        )
      : null;

  const danger = flags.filter((f) => f.hit === true);
  let level: EaCheck["level"];
  let headline: string;
  if (n === 0) {
    level = "empty";
    headline = "No closed trades found. Save the report as HTML (not Open XML) and open that file.";
  } else if (danger.length) {
    level = "danger";
    headline = `Dangerous: ${danger.map((f) => f.label.toLowerCase()).join(", ")}. Profit here can vanish in one bad run.`;
  } else if (net <= 0) {
    level = "none";
    headline = `No edge: ${money(net)} over ${n} trades, after costs.`;
  } else if (n < 100 || days < 180) {
    level = "thin";
    headline = `Too few to judge: ${n} trades over ${Math.round(days)} days. It needs 100+ trades over 6+ months.`;
  } else if (coinFlip === null || coinFlip > MAX_P) {
    level = "unproven";
    headline = `Positive but not proven: a coin flip on each trade's result did as well ${coinFlip === null ? "too often" : `${Math.round(coinFlip * 100)}% of the time`}.`;
  } else {
    level = "passes";
    headline = `Passes the luck check: a coin flip did as well only ${coinFlip < 0.01 ? "under 1%" : `${Math.round(coinFlip * 100)}%`} of the time.`;
  }

  return {
    trades: n,
    net,
    winRate,
    avgWin,
    avgLoss,
    largestLoss,
    profitFactor,
    maxDrawdown,
    days,
    flags,
    coinFlip,
    level,
    headline,
  };
}
