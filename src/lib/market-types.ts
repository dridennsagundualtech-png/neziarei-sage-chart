import type { AnalysisResult } from "./analysis-types";

export interface TimeframeStats {
  timeframe: string;
  candles: number;
  from: string | null;
  to: string | null;
  last_close: number | null;
  change_pct: number | null;
  ema20: number | null;
  ema50: number | null;
  trend: "UP" | "DOWN" | "FLAT" | "UNKNOWN";
  atr14: number | null;
  range_high: number | null;
  range_low: number | null;
  range_position_pct: number | null;
  swing_highs: number[];
  swing_lows: number[];
  volume_trend: "EXPANDING" | "CONTRACTING" | "FLAT" | "UNKNOWN";
}

export interface MarketAnalysis extends AnalysisResult {
  symbol: string;
  data_as_of: string | null;
  stats: TimeframeStats[];
  support_levels: string[];
  resistance_levels: string[];
  momentum: string;
  timeframe_reads: { timeframe: string; read: string }[];
}
