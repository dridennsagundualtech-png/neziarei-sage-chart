/**
 * Candle/TF presets for Setup Alert scans — same idea as Analyze "Candle presets".
 * Server-safe (no localStorage). Keep in sync with CandlePresets.tsx built-ins.
 */

export type ScanCandlePreset = {
  id: string;
  name: string;
  /** TF keys (D1, H4, …) this preset turns ON */
  timeframes: string[];
  /** Candles per TF */
  values: Record<string, number>;
  /** If set, every TF uses this count */
  all?: number;
};

export const SCAN_CANDLE_PRESETS: ScanCandlePreset[] = [
  {
    id: "balanced",
    name: "Balanced",
    timeframes: ["D1", "H4", "H1", "M15"],
    values: { D1: 150, H4: 150, H1: 120, M30: 100, M15: 100, M5: 80, M1: 60 },
  },
  {
    id: "scalper",
    name: "Scalper",
    timeframes: ["M15", "M5", "M1"],
    values: { D1: 60, H4: 60, H1: 50, M30: 40, M15: 40, M5: 30, M1: 30 },
  },
  {
    id: "daytrader",
    name: "Day Trader",
    timeframes: ["H1", "M30", "M15", "M5"],
    values: { D1: 120, H4: 120, H1: 100, M30: 80, M15: 80, M5: 60, M1: 50 },
  },
  {
    id: "swing",
    name: "Swing Trader",
    timeframes: ["D1", "H4", "H1"],
    values: { D1: 200, H4: 180, H1: 150, M30: 130, M15: 120, M5: 100, M1: 80 },
  },
  {
    id: "maximum",
    name: "Maximum",
    timeframes: ["D1", "H4", "H1", "M30", "M15", "M5", "M1"],
    values: {},
    all: 300,
  },
];

export const DEFAULT_SCAN_PRESET_ID = "daytrader";

export function getScanPreset(id: string | null | undefined): ScanCandlePreset {
  const found = SCAN_CANDLE_PRESETS.find((p) => p.id === id);
  return found ?? SCAN_CANDLE_PRESETS.find((p) => p.id === DEFAULT_SCAN_PRESET_ID)!;
}

/** Count for one TF under a preset (10–300). */
export function candleCountForTf(preset: ScanCandlePreset, tf: string): number {
  const n = preset.all ?? preset.values[tf] ?? preset.values[tf.toUpperCase()] ?? 150;
  return Math.max(10, Math.min(300, Math.round(n)));
}
