import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ScrollText, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BacktestResultView } from "@/components/BacktestResultView";
import { ResultView, rowToResult } from "@/components/ResultView";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/lib/account";
import { DEN_MODEL } from "@/lib/ai-models";
import { OUTCOMES } from "@/lib/analysis-types";
import { deleteBacktestRun, listBacktestRuns } from "@/lib/backtest-history.functions";
import {
  DEFAULT_SETTINGS,
  LOCAL_USER,
  useAnalyses,
  useAnalysisImages,
  useDeleteAnalysis,
  useDeleteAnalyses,
  useSaveSettings,
  useSettings,
  type AnalysisRow,
} from "@/lib/data";
import { relativeTime } from "@/lib/sessions";
import { cn } from "@/lib/utils";

function History() {
  const analysesQuery = useAnalyses();
  const settingsQuery = useSettings();
  const remove = useDeleteAnalysis();
  const removeMany = useDeleteAnalyses();

  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<string>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"app" | "admin_market" | "backtests">("app");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { access } = useAccess();
  const isAdmin = Boolean(access?.isAdmin);
  const activeTab = isAdmin ? tab : "app";

  const rows = analysesQuery.data ?? [];
  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const source = row.source ?? "app";
        const inTab =
          activeTab === "admin_market"
            ? source === "admin_market" || source === "den_live"
            : source === "app";
        if (!inTab) return false;
        if (outcome !== "ALL" && row.outcome !== outcome) return false;
        if (!search.trim()) return true;
        const needle = search.trim().toLowerCase();
        return (
          row.asset.toLowerCase().includes(needle) ||
          row.direction.toLowerCase().includes(needle) ||
          (row.primary_timeframe ?? "").toLowerCase().includes(needle)
        );
      }),
    [rows, outcome, search, activeTab],
  );

  const tabCount = rows.filter((row) => {
    const source = row.source ?? "app";
    return activeTab === "admin_market"
      ? source === "admin_market" || source === "den_live"
      : source === "app";
  }).length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected(new Set(filtered.map((r) => r.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const deleteSelected = () => {
    if (selected.size === 0) return;
    const ok = window.confirm(
      `Delete ${selected.size} selected ${selected.size === 1 ? "analysis" : "analyses"}? This cannot be undone.`,
    );
    if (!ok) return;
    removeMany.mutate([...selected], {
      onSuccess: () => {
        toast.success(`Deleted ${selected.size} ${selected.size === 1 ? "analysis" : "analyses"}.`);
        setSelected(new Set());
        setOpenId(null);
      },
      onError: () => toast.error("Could not delete selected analyses."),
    });
  };

  const clearAllHistory = () => {
    const ids = filtered.map((r) => r.id);
    if (ids.length === 0) {
      toast.message("Nothing to clear.");
      return;
    }
    const ok = window.confirm(
      `Clear ALL ${ids.length} analyses in this list? This cannot be undone.\n\nTip: use filters first if you only want to clear some.`,
    );
    if (!ok) return;
    removeMany.mutate(ids, {
      onSuccess: () => {
        toast.success("History cleared.");
        setSelected(new Set());
        setOpenId(null);
      },
      onError: () => toast.error("Could not clear history."),
    });
  };

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="font-display text-xl font-semibold">
          {activeTab === "admin_market"
            ? "Admin market history"
            : activeTab === "backtests"
              ? "Backtest history"
              : "Journal history"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeTab === "backtests"
            ? "Saved backtest runs — reload their exact settings into Backtest, or apply them to live Market Analyze."
            : `${tabCount} saved ${tabCount === 1 ? "analysis" : "analyses"}${
                activeTab === "admin_market" ? " from the admin Market engine" : ""
              }. Recording real outcomes is what makes the statistics meaningful.`}
        </p>
      </header>

      {isAdmin && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-elevated p-1">
          {(
            [
              { id: "app", label: "History" },
              { id: "admin_market", label: "Admin history" },
              { id: "backtests", label: "Backtests" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setSelected(new Set());
                setOpenId(null);
              }}
              className={cn(
                "rounded-xl py-2 text-sm font-medium transition-colors",
                activeTab === item.id ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "backtests" && <BacktestHistoryList />}

      {activeTab !== "backtests" && (
      <>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search asset, direction…"
          className="h-10 min-w-[160px] flex-1 rounded-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="h-10 w-[140px] rounded-xl">
            <SelectValue placeholder="Outcome" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All outcomes</SelectItem>
            {OUTCOMES.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-9 rounded-lg"
          onClick={selectAllFiltered}
          disabled={filtered.length === 0}
        >
          Select all ({filtered.length})
        </Button>
        {selected.size > 0 && (
          <>
            <Button size="sm" variant="secondary" className="h-9 rounded-lg" onClick={clearSelection}>
              Clear selection
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-lg text-bear hover:bg-bear/10"
              onClick={deleteSelected}
              disabled={removeMany.isPending}
            >
              <Trash2 className="size-3.5" />
              Delete selected ({selected.size})
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-9 rounded-lg text-bear hover:bg-bear/10"
          onClick={clearAllHistory}
          disabled={removeMany.isPending || filtered.length === 0}
        >
          <Trash2 className="size-3.5" />
          Clear list
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <ScrollText className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {rows.length === 0
              ? "Analyze a chart and it will be saved here automatically."
              : "No analyses match your filters."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((row) => (
            <li key={row.id} className="animate-float-in card-soft overflow-hidden">
              <div className="flex items-stretch gap-0">
                {/* Checkbox */}
                <button
                  type="button"
                  aria-label={selected.has(row.id) ? "Deselect" : "Select"}
                  onClick={() => toggleSelect(row.id)}
                  className="flex w-11 shrink-0 items-center justify-center border-r border-border/60 hover:bg-muted/40"
                >
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded border text-[11px]",
                      selected.has(row.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card",
                    )}
                  >
                    {selected.has(row.id) ? "✓" : ""}
                  </span>
                </button>

                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left hover:bg-muted/20"
                  onClick={() => setOpenId((id) => (id === row.id ? null : row.id))}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-display text-sm font-semibold">{row.asset}</span>
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {row.direction}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full text-[10px]">
                        {row.score}/{row.max_score}
                      </Badge>
                      {row.outcome && row.outcome !== "OPEN" && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full text-[10px]",
                            row.outcome === "WIN" && "border-bull/40 text-bull",
                            row.outcome === "LOSS" && "border-bear/40 text-bear",
                          )}
                        >
                          {row.outcome}
                          {row.r_result != null ? ` ${row.r_result > 0 ? "+" : ""}${row.r_result}R` : ""}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {row.primary_timeframe ?? "–"} · {relativeTime(row.created_at)}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform",
                      openId === row.id && "rotate-180",
                    )}
                  />
                </button>
              </div>

              {openId === row.id && (
                <div className="space-y-4 border-t border-border/60 p-4">
                  <Screenshots analysisId={row.id} createdAt={row.created_at} />
                  <ResultView
                    result={rowToResult(row)}
                    journal={rows}
                    settings={settings}
                    savedRow={row}
                  />
                  <Button
                    variant="secondary"
                    className="h-11 w-full rounded-xl text-bear"
                    onClick={() =>
                      remove.mutate(row.id, {
                        onSuccess: () => {
                          toast.success("Analysis deleted.");
                          setSelected((prev) => {
                            const next = new Set(prev);
                            next.delete(row.id);
                            return next;
                          });
                          setOpenId(null);
                        },
                        onError: () => toast.error("Could not delete that analysis."),
                      })
                    }
                  >
                    <Trash2 className="size-4" /> Delete analysis
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      </>
      )}
    </div>
  );
}

type SortKey = "recent" | "winRate" | "avgR" | "totalR" | "setups";

const SORTERS: Record<SortKey, { label: string; sort: (a: any, b: any) => number }> = {
  recent: { label: "Most recent", sort: (a, b) => b._created - a._created },
  winRate: { label: "Win rate", sort: (a, b) => (b._winRate ?? -1) - (a._winRate ?? -1) },
  avgR: { label: "Average R", sort: (a, b) => (b._avgR ?? -999) - (a._avgR ?? -999) },
  totalR: { label: "Total R", sort: (a, b) => b._totalR - a._totalR },
  setups: { label: "Setups found", sort: (a, b) => b._setups - a._setups },
};

function BacktestHistoryList() {
  const listFn = useServerFn(listBacktestRuns);
  const deleteFn = useServerFn(deleteBacktestRun);
  const saveSettings = useSaveSettings();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const runsQuery = useQuery({
    queryKey: ["backtest-runs"],
    queryFn: () => listFn({}),
  });

  const rows = runsQuery.data ?? [];

  const sorted = useMemo(() => {
    const withKeys = rows.map((row) => ({
      row,
      _created: new Date(row.created_at).getTime(),
      _winRate: row.result.winRate,
      _avgR: row.result.avgR,
      _totalR: row.result.totalR,
      _setups: row.result.totalSetups,
    }));
    return [...withKeys].sort(SORTERS[sortKey].sort).map((item) => item.row);
  }, [rows, sortKey]);

  const applyToMarket = async (row: (typeof rows)[number]) => {
    try {
      if (row.den_rules) {
        await saveSettings.mutateAsync({ den_rules: row.den_rules });
      }
      const params = new URLSearchParams();
      params.set("symbol", row.symbol);
      params.set("timeframes", row.timeframes.join(","));
      params.set("model", row.engine === "ai" && row.model ? row.model : DEN_MODEL);
      window.location.href = `/market?${params.toString()}`;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not apply these settings.");
    }
  };

  const reloadIntoBacktest = (row: (typeof rows)[number]) => {
    window.location.href = `/backtest?reload=${encodeURIComponent(row.id)}`;
  };

  const removeRun = (id: string) => {
    const ok = window.confirm("Delete this saved backtest run? This cannot be undone.");
    if (!ok) return;
    setDeletingId(id);
    deleteFn({ data: { id } })
      .then(() => {
        toast.success("Deleted.");
        void queryClient.invalidateQueries({ queryKey: ["backtest-runs"] });
        setOpenId((current) => (current === id ? null : current));
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not delete this run."),
      )
      .finally(() => setDeletingId(null));
  };

  if (runsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading saved backtests…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <Sparkles className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Run a backtest and tap “Save this run to history” to keep it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Sort by</span>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORTERS) as SortKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {SORTERS[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="space-y-2">
        {sorted.map((row) => (
          <li key={row.id} className="animate-float-in card-soft overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/20"
              onClick={() => setOpenId((id) => (id === row.id ? null : row.id))}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-display text-sm font-semibold">{row.symbol}</span>
                  <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                    {row.engine}
                  </Badge>
                  {row.label && (
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      {row.label}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {row.timeframes.join(", ")} · {row.result.totalSetups} setups ·{" "}
                  {row.result.winRate === null ? "–" : `${row.result.winRate.toFixed(1)}%`} ·{" "}
                  {row.result.avgR === null
                    ? "–"
                    : `${row.result.avgR >= 0 ? "+" : ""}${row.result.avgR.toFixed(2)}R`}{" "}
                  · {relativeTime(row.created_at)}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-muted-foreground transition-transform",
                  openId === row.id && "rotate-180",
                )}
              />
            </button>

            {openId === row.id && (
              <div className="space-y-4 border-t border-border/60 p-4">
                <BacktestResultView result={row.result} />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-9 flex-1 rounded-lg text-xs"
                    disabled={saveSettings.isPending}
                    onClick={() => applyToMarket(row)}
                  >
                    Apply to Market Analyze
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-9 flex-1 rounded-lg text-xs"
                    onClick={() => reloadIntoBacktest(row)}
                  >
                    Reload into Backtest
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg text-bear hover:bg-bear/10"
                    disabled={deletingId === row.id}
                    onClick={() => removeRun(row.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Screenshots({ analysisId, createdAt }: { analysisId: string; createdAt: string }) {
  const { data } = useAnalysisImages(analysisId);
  if (!data || data.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.map((image) => (
          <a
            key={image.id}
            href={image.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
            aria-label={`Open screenshot ${image.position + 1}`}
          >
            <img
              src={image.url}
              alt={`Chart screenshot ${image.position + 1}${image.timeframe ? ` (${image.timeframe})` : ""}`}
              className="h-24 rounded-xl border border-border object-cover"
            />
          </a>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Taken {relativeTime(createdAt)} · {new Date(createdAt).toLocaleString()}
      </p>
    </div>
  );
}

export type { AnalysisRow };

export function HistorySection() {
  return (
    <SignInPrompt feature="the journal">
      <History />
    </SignInPrompt>
  );
}
