import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CandlePreset = {
  id: string;
  name: string;
  values: Record<string, number>;
  /** Normalised timeframe keys (M1, M5, …) this preset switches on. */
  timeframes?: string[];
};

const STORAGE_KEY = "chartpilot:candle-presets";

/** Normalise 1D/D1, 4H/H4, … to a single key so presets match any stored naming. */
function normalize(tf: string): string {
  const raw = tf.trim().toUpperCase();
  const swapped = /^\d+[A-Z]$/.test(raw) ? `${raw.slice(-1)}${raw.slice(0, -1)}` : raw;
  return swapped;
}

const BUILT_IN: {
  id: string;
  name: string;
  values: Record<string, number>;
  /** Normalised timeframe keys to switch ON; everything else is switched OFF. */
  on: string[];
  all?: number;
}[] = [
  {
    id: "balanced",
    name: "Balanced",
    values: { D1: 150, H4: 150, H1: 120, M30: 100, M15: 100, M5: 80, M1: 60 },
    on: ["M15", "H1", "H4", "D1"],
  },
  {
    id: "scalper",
    name: "Scalper",
    values: { D1: 60, H4: 60, H1: 50, M30: 40, M15: 40, M5: 30, M1: 30 },
    on: ["M1", "M5", "M15"],
  },
  {
    id: "daytrader",
    name: "Day Trader",
    values: { D1: 120, H4: 120, H1: 100, M30: 80, M15: 80, M5: 60, M1: 50 },
    on: ["M5", "M15", "M30", "H1"],
  },
  {
    id: "swing",
    name: "Swing Trader",
    values: { D1: 200, H4: 180, H1: 150, M30: 130, M15: 120, M5: 100, M1: 80 },
    on: ["H1", "H4", "D1"],
  },
  { id: "max", name: "Maximum", values: {}, on: [], all: 300 },
];

const clamp = (n: number) => Math.max(10, Math.min(300, Math.round(n)));

function resolve(
  preset: { values: Record<string, number>; all?: number | undefined },
  timeframes: string[],
  fallback: (tf: string) => number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const tf of timeframes) {
    const value = preset.all ?? preset.values[normalize(tf)];
    out[tf] = clamp(value ?? fallback(tf));
  }
  return out;
}

function countsMatch(
  target: Record<string, number>,
  counts: Record<string, number>,
  timeframes: string[],
) {
  return timeframes.length > 0 && timeframes.every((tf) => (counts[tf] ?? 150) === target[tf]);
}

function sameSet(a: string[], b: string[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

function loadCustom(): CandlePreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CandlePreset[]) : [];
  } catch {
    return [];
  }
}

export function CandlePresets({
  timeframes,
  availableTimeframes,
  counts,
  onApply,
  onApplyTimeframes,
}: {
  /** Currently selected (ON) timeframes. */
  timeframes: string[];
  /** Every timeframe available for the current symbol. */
  availableTimeframes: string[];
  counts: Record<string, number>;
  onApply: (next: Record<string, number>) => void;
  onApplyTimeframes: (next: string[]) => void;
}) {
  const availableList = Array.isArray(availableTimeframes) ? availableTimeframes : [];
  const selected = Array.isArray(timeframes) ? timeframes : [];
  const countMap = counts ?? {};
  const [custom, setCustom] = useState<CandlePreset[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    setCustom(loadCustom());
  }, []);

  const persist = (next: CandlePreset[]) => {
    setCustom(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — presets stay in memory */
    }
  };

  const fallback = (tf: string) => counts[tf] ?? 150;

  /** Which of the available timeframes a preset wants switched on. */
  const targetTimeframes = (preset: {
    on?: string[];
    timeframes?: string[];
    all?: number | undefined;
  }): string[] => {
    if (preset.all) return [...availableTimeframes];
    const wanted = new Set((preset.on ?? preset.timeframes ?? []).map(normalize));
    return availableTimeframes.filter((tf) => wanted.has(normalize(tf)));
  };

  const apply = (preset: {
    values: Record<string, number>;
    on?: string[];
    timeframes?: string[];
    all?: number | undefined;
  }) => {
    const target = targetTimeframes(preset);
    const nextTfs = target.length > 0 ? target : timeframes;
    if (target.length > 0) onApplyTimeframes(nextTfs);
    onApply(resolve(preset, nextTfs, fallback));
  };

  // Default to Balanced on first load once timeframes are known.
  useEffect(() => {
    if (initialized.current || availableTimeframes.length === 0) return;
    initialized.current = true;
    apply(BUILT_IN[0]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTimeframes]);

  const all = [
    ...BUILT_IN.map((preset) => ({ ...preset, custom: false })),
    ...custom.map((preset) => ({ ...preset, custom: true, all: undefined as number | undefined })),
  ];

  const activeId =
    all.find((preset) => {
      const target = targetTimeframes(preset);
      // A preset is only "active" when both the selected timeframes and the
      // candle counts match it exactly — any manual change flips to Custom.
      const spec = preset as { all?: number; on?: string[]; timeframes?: string[] };
      const hasTfSpec = spec.all != null || Boolean(spec.on?.length || spec.timeframes?.length);
      const tfMatch = hasTfSpec ? target.length > 0 && sameSet(target, timeframes) : true;
      return tfMatch && countsMatch(resolve(preset, timeframes, fallback), counts, timeframes);
    })?.id ?? null;

  const savePreset = () => {
    const trimmed = name.trim().slice(0, 32);
    if (!trimmed) {
      toast.error("Give the preset a name first.");
      return;
    }
    const values = Object.fromEntries(timeframes.map((tf) => [normalize(tf), clamp(fallback(tf))]));
    persist([
      ...custom.filter((preset) => preset.name.toLowerCase() !== trimmed.toLowerCase()),
      {
        id: `custom-${Date.now()}`,
        name: trimmed,
        values,
        timeframes: timeframes.map(normalize),
      },
    ]);
    setName("");
    setNaming(false);
    toast.success(`Preset “${trimmed}” saved.`);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Candle presets</span>
        <span className="text-[11px] text-muted-foreground">
          {activeId ? all.find((preset) => preset.id === activeId)?.name : "Custom"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {all.map((preset) => (
          <span key={preset.id} className="relative inline-flex">
            <button
              type="button"
              disabled={availableTimeframes.length === 0}
              onClick={() => apply(preset)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50",
                preset.custom && "pr-7",
                activeId === preset.id
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-elevated text-muted-foreground",
              )}
            >
              {activeId === preset.id && <Check className="mr-1 inline size-3" />}
              {preset.name}
            </button>
            {preset.custom && (
              <button
                type="button"
                aria-label={`Delete preset ${preset.name}`}
                onClick={() => persist(custom.filter((item) => item.id !== preset.id))}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </span>
        ))}

        {!naming && (
          <button
            type="button"
            disabled={availableTimeframes.length === 0}
            onClick={() => setNaming(true)}
            className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground disabled:opacity-50"
          >
            <Plus className="mr-1 inline size-3" />
            Save as Preset
          </button>
        )}
      </div>

      {naming && (
        <div className="flex items-center gap-2">
          <Input
            autoFocus
            value={name}
            maxLength={32}
            placeholder="Preset name"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && savePreset()}
            className="h-9 rounded-xl text-xs"
          />
          <Button type="button" size="sm" className="h-9 rounded-xl" onClick={savePreset}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-9 rounded-xl"
            onClick={() => {
              setNaming(false);
              setName("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
