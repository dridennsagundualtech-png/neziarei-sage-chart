import { TermTooltip } from "@/components/TermTooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FlaskConical,
  ListChecks,
  MinusCircle,
  ScrollText,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BacktestResultView } from "@/components/BacktestResultView";
import {
  ChoiceChips,
  ConfirmDialog,
  EmptyState,
  JSection,
  RowList,
  fmtPct,
  fmtR,
  signTone,
  useConfirm,
} from "@/components/journal/parts";
import { ResultView, rowToResult } from "@/components/ResultView";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type View = "app" | "admin_market" | "backtests";

/** "POTENTIAL LONG" -> "Long", "NO TRADE" -> "No trade" */
function directionLabel(direction: string): { text: string; Icon: LucideIcon | null } {
  const lower = direction.toLowerCase().replace(/^potential\s+/, "");
  const text = lower.charAt(0).toUpperCase() + lower.slice(1);
  if (lower === "long") return { text, Icon: TrendingUp };
  if (lower === "short") return { text, Icon: TrendingDown };
  return { text, Icon: null };
}

function outcomeText(outcome: string): string {
  const lower = outcome.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** How a read ended: icon + word + result in R. Never colour alone. */
function Ending({ row }: { row: AnalysisRow }) {
  const outcome = row.outcome;
  let Icon: LucideIcon = Clock;
  let tone = "text-muted-foreground";
  let text = "Open";
  if (outcome && outcome !== "OPEN") {
    text = outcomeText(outcome);
    if (outcome === "WIN") {
      Icon = CheckCircle2;
      tone = "text-bull";
    } else if (outcome === "LOSS") {
      Icon = XCircle;
      tone = "text-bear";
    } else if (outcome === "BREAKEVEN") {
      Icon = MinusCircle;
    } else {
      Icon = Ban;
    }
  }
  return (
    <span className={cn("flex shrink-0 flex-col items-end text-[14px] font-semibold", tone)}>
      <span className="inline-flex items-center gap-1.5">
        <Icon className="size-4" aria-hidden />
        {text}
      </span>
      {row.r_result != null && outcome !== "OPEN" && (
        <span className="tabular-nums">{fmtR(row.r_result, 1)}</span>
      )}
    </span>
  );
}

type DeleteTarget = { kind: "selected" } | { kind: "one"; id: string };

function History() {
  const analysesQuery = useAnalyses();
  const settingsQuery = useSettings();
  const remove = useDeleteAnalysis();
  const removeMany = useDeleteAnalyses();

  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<string>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<View>("app");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const del = useConfirm<DeleteTarget>();
  const { access } = useAccess();
  const isAdmin = Boolean(access?.isAdmin);
  const activeView: View = isAdmin ? view : "app";

  const rows = useMemo(() => analysesQuery.data ?? [], [analysesQuery.data]);
  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };

  const inView = (row: AnalysisRow, which: View) => {
    const source = row.source ?? "app";
    return which === "admin_market"
      ? source === "admin_market" || source === "den_live"
      : source === "app";
  };

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (!inView(row, activeView)) return false;
        if (outcome !== "ALL" && row.outcome !== outcome) return false;
        if (!search.trim()) return true;
        const needle = search.trim().toLowerCase();
        return (
          row.asset.toLowerCase().includes(needle) ||
          row.direction.toLowerCase().includes(needle) ||
          (row.primary_timeframe ?? "").toLowerCase().includes(needle)
        );
      }),
    [rows, outcome, search, activeView],
  );

  const appCount = rows.filter((row) => inView(row, "app")).length;
  const adminCount = rows.filter((row) => inView(row, "admin_market")).length;
  const viewCount = activeView === "admin_market" ? adminCount : appCount;

  const switchView = (next: View) => {
    setView(next);
    setSelected(new Set());
    setSelecting(false);
    setOpenId(null);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = filtered.length > 0 && filtered.every((row) => selected.has(row.id));

  const finishSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const runDelete = () => {
    const target = del.target;
    if (!target) return;
    if (target.kind === "selected") {
      const ids = [...selected];
      removeMany.mutate(ids, {
        onSuccess: () => {
          toast.success(`Deleted ${ids.length} ${ids.length === 1 ? "read" : "reads"}.`);
          finishSelecting();
          setOpenId(null);
          del.close();
        },
        onError: () => {
          toast.error("Could not delete the selected reads.");
          del.close();
        },
      });
      return;
    }
    remove.mutate(target.id, {
      onSuccess: () => {
        toast.success("Deleted.");
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(target.id);
          return next;
        });
        setOpenId(null);
        del.close();
      },
      onError: () => {
        toast.error("Could not delete that read.");
        del.close();
      },
    });
  };

  const hints: Record<View, string> = {
    app: `${appCount} saved. Add how each one ended and your statistics become honest.`,
    admin_market:
      "Saved reads from the admin Den Analyzer. Recording the real ending is what keeps stats honest.",
    backtests:
      "Practice runs on past data. Reload the same settings, or send them to Market Analyze.",
  };

  const titles: Record<View, ReactNode> = {
    app: <TermTooltip term="Journal history" label="Your reads" />,
    admin_market: <TermTooltip term="Admin market history" label="Admin reads" />,
    backtests: <TermTooltip term="Backtest history" label="Backtest runs" />,
  };

  return (
    <div>
      {isAdmin && (
        <div className="pt-6">
          <ChoiceChips<View>
            scroll
            label="History source"
            value={activeView}
            onChange={switchView}
            options={[
              { value: "app", label: "My reads", count: appCount },
              { value: "admin_market", label: "Admin reads", count: adminCount },
              { value: "backtests", label: "Backtest runs" },
            ]}
          />
        </div>
      )}

      <JSection title={titles[activeView]} hint={hints[activeView]} className="pt-6">
        {activeView === "backtests" ? (
          <BacktestHistoryList />
        ) : (
          <>
            <div className="space-y-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  aria-label="Search reads by asset, direction or timeframe"
                  placeholder="Search asset, direction…"
                  className="h-11 rounded-xl pl-11 text-base md:text-base"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <ChoiceChips
                scroll
                label="Filter by how it ended"
                value={outcome}
                onChange={setOutcome}
                options={[
                  { value: "ALL", label: "All" },
                  ...OUTCOMES.map((item) => ({ value: item as string, label: outcomeText(item) })),
                ]}
              />
            </div>

            <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
              <p className="text-[15px] text-muted-foreground" aria-live="polite">
                {filtered.length === viewCount
                  ? `${filtered.length} ${filtered.length === 1 ? "read" : "reads"}`
                  : `${filtered.length} of ${viewCount} reads`}
              </p>
              {selecting ? (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 rounded-xl px-3 text-[15px]"
                    onClick={() =>
                      setSelected(allSelected ? new Set() : new Set(filtered.map((row) => row.id)))
                    }
                  >
                    {allSelected ? "Clear" : "Select all"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 rounded-xl px-4 text-[15px]"
                    onClick={finishSelecting}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl px-3 text-[15px]"
                  disabled={filtered.length === 0}
                  onClick={() => setSelecting(true)}
                >
                  <ListChecks className="size-5" /> Select
                </Button>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title={rows.length === 0 ? "No reads yet" : "Nothing matches"}
              >
                {rows.length === 0
                  ? "Analyze a chart and it will be saved here automatically."
                  : "Try a different search, or choose All above."}
              </EmptyState>
            ) : (
              <RowList>
                {filtered.map((row) => {
                  const open = openId === row.id;
                  const picked = selected.has(row.id);
                  const direction = directionLabel(row.direction);
                  return (
                    <li key={row.id}>
                      <div className="flex items-stretch">
                        {selecting && (
                          <button
                            type="button"
                            aria-pressed={picked}
                            aria-label={`${picked ? "Deselect" : "Select"} ${row.asset} ${direction.text}`}
                            onClick={() => toggleSelect(row.id)}
                            className="flex w-12 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span
                              className={cn(
                                "grid size-6 place-items-center rounded-md border-2",
                                picked
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-muted-foreground",
                              )}
                            >
                              {picked && <Check className="size-4" aria-hidden />}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenId((id) => (id === row.id ? null : row.id))}
                          className="flex min-h-[76px] min-w-0 flex-1 items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-x-2.5">
                              <span className="font-display text-lg font-semibold">
                                {row.asset}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[15px] text-muted-foreground">
                                {direction.Icon && (
                                  <direction.Icon className="size-4" aria-hidden />
                                )}
                                {direction.text}
                              </span>
                            </span>
                            <span className="mt-0.5 block text-[14px] text-muted-foreground">
                              {row.primary_timeframe ? `${row.primary_timeframe} · ` : ""}
                              Score {row.score}/{row.max_score} · {relativeTime(row.created_at)}
                            </span>
                          </span>
                          <Ending row={row} />
                          <ChevronDown
                            className={cn(
                              "size-5 shrink-0 text-muted-foreground transition-transform",
                              open && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </button>
                      </div>

                      {open && (
                        <div className="space-y-5 pb-6 pt-3">
                          <Screenshots analysisId={row.id} createdAt={row.created_at} />
                          <ResultView
                            result={rowToResult(row)}
                            journal={rows}
                            settings={settings}
                            savedRow={row}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-12 w-full justify-start rounded-xl text-base font-semibold text-bear hover:text-bear"
                            onClick={() => del.ask({ kind: "one", id: row.id })}
                          >
                            <Trash2 className="size-5" /> Delete this read
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </RowList>
            )}

            {selecting && selected.size > 0 && (
              <div className="sticky bottom-20 z-20 -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-3">
                <p className="text-base font-semibold">{selected.size} selected</p>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-12 rounded-xl px-6 text-base font-semibold text-background"
                  onClick={() => del.ask({ kind: "selected" })}
                >
                  <Trash2 className="size-5" /> Delete
                </Button>
              </div>
            )}
          </>
        )}
      </JSection>

      <ConfirmDialog
        open={del.open}
        onOpenChange={(open) => !open && del.close()}
        title={
          del.target?.kind === "selected"
            ? `Delete ${selected.size} ${selected.size === 1 ? "read" : "reads"}?`
            : "Delete this read?"
        }
        description={
          del.target?.kind === "selected"
            ? "Their screenshots and results are removed too. This cannot be undone."
            : "Its screenshots and result are removed too. This cannot be undone."
        }
        confirmLabel="Delete"
        pending={remove.isPending || removeMany.isPending}
        onConfirm={runDelete}
      />
    </div>
  );
}

type SortKey = "recent" | "winRate" | "avgR" | "totalR" | "setups";

interface SortItem {
  _created: number;
  _winRate: number | null;
  _avgR: number | null;
  _totalR: number;
  _setups: number;
}

const SORTERS: Record<SortKey, { label: string; sort: (a: SortItem, b: SortItem) => number }> = {
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
  const queryClient = useQueryClient();

  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const del = useConfirm<string>();

  const runsQuery = useQuery({
    queryKey: ["backtest-runs"],
    queryFn: () => listFn({}),
  });

  const rows = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);

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
      .finally(() => {
        setDeletingId(null);
        del.close();
      });
  };

  if (runsQuery.isLoading) {
    return (
      <p className="py-10 text-center text-[15px] text-muted-foreground">
        Loading saved backtests…
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState icon={FlaskConical} title="No saved runs yet">
        Run a backtest and tap “Save this run to history” to keep it here.
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[15px] text-muted-foreground">Sort by</p>
        <ChoiceChips<SortKey>
          scroll
          label="Sort saved runs"
          value={sortKey}
          onChange={setSortKey}
          options={(Object.keys(SORTERS) as SortKey[]).map((key) => ({
            value: key,
            label: SORTERS[key].label,
          }))}
        />
      </div>

      <RowList>
        {sorted.map((row) => {
          const open = openId === row.id;
          return (
            <li key={row.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId((id) => (id === row.id ? null : row.id))}
                className="flex min-h-[76px] w-full items-center gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2.5">
                    <span className="font-display text-lg font-semibold">{row.symbol}</span>
                    <span className="text-[15px] text-muted-foreground">
                      {row.engine === "ai" ? "AI" : "Den"}
                      {row.label ? ` · ${row.label}` : ""}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[14px] text-muted-foreground">
                    {row.timeframes.join(", ")} · {row.result.totalSetups} setups ·{" "}
                    {fmtPct(row.result.winRate)} wins · {relativeTime(row.created_at)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end">
                  <span
                    className={cn(
                      "text-base font-semibold tabular-nums",
                      signTone(row.result.avgR),
                    )}
                  >
                    {fmtR(row.result.avgR)}
                  </span>
                  <span className="text-[13px] text-muted-foreground">avg</span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              {open && (
                <div className="space-y-5 pb-6 pt-3">
                  <BacktestResultView result={row.result} />
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-12 w-full rounded-xl text-base"
                      disabled={saveSettings.isPending}
                      onClick={() => applyToMarket(row)}
                    >
                      Apply to Market Analyze
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-12 w-full rounded-xl text-base"
                      onClick={() => reloadIntoBacktest(row)}
                    >
                      Reload into Backtest
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-12 w-full justify-start rounded-xl text-base font-semibold text-bear hover:text-bear"
                      disabled={deletingId === row.id}
                      onClick={() => del.ask(row.id)}
                    >
                      <Trash2 className="size-5" /> Delete this run
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </RowList>

      <ConfirmDialog
        open={del.open}
        onOpenChange={(open) => !open && del.close()}
        title="Delete this saved run?"
        description="The run and its results are removed for good. It cannot be undone."
        confirmLabel="Delete"
        pending={deletingId !== null}
        onConfirm={() => del.target && removeRun(del.target)}
      />
    </div>
  );
}

function Screenshots({ analysisId, createdAt }: { analysisId: string; createdAt: string }) {
  const { data } = useAnalysisImages(analysisId);
  if (!data || data.length === 0) return null;
  return (
    <div className="space-y-2">
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
              className="h-28 rounded-xl border border-border object-cover"
            />
          </a>
        ))}
      </div>
      <p className="text-[13px] text-muted-foreground">
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
