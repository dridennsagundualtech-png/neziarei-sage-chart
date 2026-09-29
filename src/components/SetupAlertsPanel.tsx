/**
 * Batch Den scan — Analyze all symbols in ohlc_data at once (same engine as Market Analyze).
 * Click "Open full analysis" to jump to Admin market analyze with that symbol selected.
 */
import { ChevronDown, ExternalLink, Loader2, ScanSearch } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { TermTooltip } from "@/components/TermTooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runBatchDen, type BatchDenRow } from "@/lib/batch-den.functions";
import { DEFAULT_SCAN_PRESET_ID, SCAN_CANDLE_PRESETS } from "@/lib/scan-presets";
import { cn } from "@/lib/utils";

function openFullAnalysis(symbol: string, presetId: string, timeframes: string[]) {
  const params = new URLSearchParams();
  params.set("symbol", symbol);
  params.set("model", "den");
  if (timeframes.length) params.set("timeframes", timeframes.join(","));
  params.set("alertPreset", presetId);
  // Home → open admin market section via hash-friendly query (MarketSection already reads ?symbol=)
  window.location.href = `/?${params.toString()}`;
}

export function SetupAlertsPanel({ compact = false }: { compact?: boolean }) {
  const batchFn = useServerFn(runBatchDen);
  const [open, setOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [presetId, setPresetId] = useState(DEFAULT_SCAN_PRESET_ID);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [rows, setRows] = useState<BatchDenRow[]>([]);

  const run = async () => {
    setRunning(true);
    try {
      const res = (await batchFn({ data: { scanPresetId: presetId } })) as {
        results: BatchDenRow[];
        presetName: string;
        count: number;
      };
      setRows(res.results ?? []);
      setPresetName(res.presetName);
      const actionable = (res.results ?? []).filter(
        (r) =>
          r.direction.toUpperCase().includes("LONG") ||
          r.direction.toUpperCase().includes("SHORT"),
      ).length;
      toast.success(
        `Analyzed ${res.count} symbol(s) · ${actionable} long/short · preset ${res.presetName}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Batch analyze failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className={cn("card-soft", compact ? "p-3" : "p-4")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <ScanSearch className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold">
              <TermTooltip term="Batch Den" label="Analyze all symbols" />
            </p>
            <p className="text-[11px] text-muted-foreground">
              Same Den as Market Analyze — runs on every symbol in your OHLC data
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <p className="text-[11px] text-muted-foreground">
            Pick a candle preset (like Analyze), press the button, then open any row for the full
            checklist and chart on that symbol.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {SCAN_CANDLE_PRESETS.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={presetId === p.id ? "default" : "outline"}
                className="h-8 rounded-xl text-xs"
                onClick={() => setPresetId(p.id)}
              >
                {p.name}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            className="h-10 w-full rounded-xl"
            disabled={running}
            onClick={() => void run()}
          >
            {running ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ScanSearch className="size-4" />
            )}
            {running ? "Analyzing all symbols…" : "Analyze all symbols"}
          </Button>

          {presetName && (
            <p className="text-[11px] text-muted-foreground">
              Last run preset: <span className="text-foreground">{presetName}</span>
              {rows.length ? ` · ${rows.length} symbols` : ""}
            </p>
          )}

          {rows.length > 0 && (
            <ul className="space-y-2">
              {rows.map((row) => {
                const actionable =
                  row.direction.toUpperCase().includes("LONG") ||
                  row.direction.toUpperCase().includes("SHORT");
                return (
                  <li
                    key={row.symbol}
                    className={cn(
                      "rounded-xl border border-border p-3 text-sm",
                      row.tradable && "border-primary/50 bg-primary/5",
                      actionable && !row.tradable && "border-amber-500/30",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {row.symbol}{" "}
                          <span className="text-muted-foreground">· {row.direction}</span>
                          {row.grade !== "—" && (
                            <Badge variant="secondary" className="ml-1.5 rounded-full">
                              {row.grade}
                              {row.score != null ? ` ${row.score}` : ""}
                            </Badge>
                          )}
                          {row.tradable && (
                            <Badge className="ml-1 rounded-full" variant="default">
                              tradable
                            </Badge>
                          )}
                        </p>
                        {row.timeframesUsed.length > 0 && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            TFs: {row.timeframesUsed.join(", ")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[11px]"
                        onClick={() =>
                          openFullAnalysis(row.symbol, presetId, row.timeframesUsed)
                        }
                      >
                        <ExternalLink className="size-3" />
                        Open full analysis
                      </Button>
                    </div>
                    {row.summary && (
                      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{row.summary}</p>
                    )}
                    {(row.entryZone || row.stopLoss || row.tp1) && (
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        {row.entryZone && <span>Entry {row.entryZone}</span>}
                        {row.stopLoss && <span>Stop {row.stopLoss}</span>}
                        {row.tp1 && <span>TP1 {row.tp1}</span>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
