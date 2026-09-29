/**
 * Admin: batch Den + share full analysis in-app.
 * Members: only shared list + unread handling (no batch controls).
 */
import {
  CheckCheck,
  ChevronDown,
  ExternalLink,
  Loader2,
  ScanSearch,
  Share2,
  Users,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { TermTooltip } from "@/components/TermTooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/account";
import { runBatchDen, type BatchDenRow } from "@/lib/batch-den.functions";
import {
  listMemberSignals,
  markMemberSignalRead,
  publishFullAnalysisToMembers,
  type MemberSignalRow,
} from "@/lib/member-signals.functions";
import { SharedSignalDetail } from "@/components/SharedSignalDetail";
import { DEFAULT_SCAN_PRESET_ID, SCAN_CANDLE_PRESETS } from "@/lib/scan-presets";
import { cn } from "@/lib/utils";

function openFullAnalysis(symbol: string, presetId: string, timeframes: string[]) {
  const params = new URLSearchParams();
  params.set("symbol", symbol);
  params.set("model", "den");
  if (timeframes.length) params.set("timeframes", timeframes.join(","));
  params.set("alertPreset", presetId);
  window.location.href = `/?${params.toString()}`;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return iso.slice(0, 16).replace("T", " ");
}

export function SetupAlertsPanel({ compact = false }: { compact?: boolean }) {
  const { access } = useAccess();
  const isAdmin = Boolean(access?.isAdmin);
  const batchFn = useServerFn(runBatchDen);
  const listMembersFn = useServerFn(listMemberSignals);
  const markReadFn = useServerFn(markMemberSignalRead);
  const publishFn = useServerFn(publishFullAnalysisToMembers);
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [presetId, setPresetId] = useState(DEFAULT_SCAN_PRESET_ID);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [rows, setRows] = useState<BatchDenRow[]>([]);
  const [sharingKey, setSharingKey] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: ["member-signals"],
    queryFn: () => listMembersFn({ data: { limit: 40 } }),
    refetchInterval: 60_000,
  });
  const memberRows = (membersQuery.data ?? []) as MemberSignalRow[];
  const unreadMembers = memberRows.filter((r) => !r.is_read).length;

  const invalidateSignals = async () => {
    await queryClient.invalidateQueries({ queryKey: ["member-signals"] });
    await queryClient.invalidateQueries({ queryKey: ["member-signals-unread"] });
  };

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
        `Analyzed ${res.count} symbol(s) · ${actionable} long/short · ${res.presetName}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Batch analyze failed.");
    } finally {
      setRunning(false);
    }
  };

  const share = async (row: BatchDenRow) => {
    if (row.direction === "—" || row.error) {
      toast.message("Nothing useful to share on this row.");
      return;
    }
    setSharingKey(row.symbol);
    try {
      await publishFn({
        data: {
          symbol: row.symbol,
          direction: row.direction,
          grade: row.grade,
          score: row.score,
          entryZone: row.entryZone,
          stopLoss: row.stopLoss,
          tp1: row.tp1,
          tp2: row.tp2,
          summary: row.summary,
          timeframes: row.timeframesUsed,
          details: row.details,
        },
      });
      await invalidateSignals();
      toast.success(`Shared ${row.symbol} with in-app members.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Share failed.");
    } finally {
      setSharingKey(null);
    }
  };

  const markOne = async (id: string) => {
    try {
      await markReadFn({ data: { id } });
      await invalidateSignals();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark read.");
    }
  };

  const markAll = async () => {
    try {
      await markReadFn({ data: { all: true } });
      await invalidateSignals();
      toast.success("All shared signals marked read.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark read.");
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
          <span className="relative grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            {isAdmin ? <ScanSearch className="size-4" /> : <Users className="size-4" />}
            {unreadMembers > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                {unreadMembers > 9 ? "9+" : unreadMembers}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold">
              <TermTooltip
                term={isAdmin ? "Batch Den" : "Shared signals"}
                label={isAdmin ? "Analyze all symbols" : "Shared signals"}
              />
              {unreadMembers > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full align-middle">
                  {unreadMembers} new
                </Badge>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isAdmin
                ? "Admin tools + what you shared with members"
                : "Analyses the admin shared with you (in-app only)"}
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
        <div className="mt-3 space-y-4 border-t border-border pt-3">
          {/* ——— Admin only: batch + share ——— */}
          {isAdmin && (
            <>
              <p className="text-[11px] text-muted-foreground">
                Only you see batch Analyze. Members only see what you{" "}
                <span className="font-medium text-foreground">Share in-app</span> (no email).
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
                  Last run: <span className="text-foreground">{presetName}</span>
                  {rows.length ? ` · ${rows.length} symbols` : ""}
                </p>
              )}

              {rows.length > 0 && (
                <ul className="space-y-2">
                  {rows.map((row) => (
                    <li
                      key={row.symbol}
                      className={cn(
                        "rounded-xl border border-border p-3 text-sm",
                        row.tradable && "border-primary/50 bg-primary/5",
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
                              </Badge>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
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
                            Open full
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[11px]"
                            disabled={sharingKey === row.symbol || Boolean(row.error)}
                            onClick={() => void share(row)}
                          >
                            {sharingKey === row.symbol ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Share2 className="size-3" />
                            )}
                            Share in-app
                          </Button>
                        </div>
                      </div>
                      {row.summary && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {row.summary}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* ——— Everyone: shared list ——— */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <Users className="size-3.5" />
                Shared with members
              </p>
              {unreadMembers > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => void markAll()}
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </Button>
              )}
            </div>

            {membersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : memberRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? "Nothing shared yet. Use Share in-app on a batch result."
                  : "No shared signals yet."}
              </p>
            ) : (
              <ul className="space-y-2">
                {memberRows.map((row) => {
                  const openDetails = expandedMember === row.id;
                  const details = row.details as Record<string, unknown> | null;
                  return (
                    <li
                      key={row.id}
                      className={cn(
                        "rounded-xl border border-border p-3 text-sm",
                        !row.is_read && "border-primary/40 bg-primary/5",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {row.symbol} · {row.direction}
                            {row.grade ? ` · ${row.grade}` : ""}
                            {!row.is_read && (
                              <Badge variant="secondary" className="ml-1.5 rounded-full">
                                new
                              </Badge>
                            )}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {relativeTime(row.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[11px]"
                            onClick={() => {
                              void markOne(row.id);
                              openFullAnalysis(
                                row.symbol,
                                DEFAULT_SCAN_PRESET_ID,
                                row.timeframes ?? [],
                              );
                            }}
                          >
                            <ExternalLink className="size-3" />
                            Open full
                          </Button>
                          {details && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px]"
                              onClick={() => {
                                setExpandedMember(openDetails ? null : row.id);
                                if (!row.is_read) void markOne(row.id);
                              }}
                            >
                              {openDetails ? "Hide full view" : "Full view"}
                            </Button>
                          )}
                          {!row.is_read && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px]"
                              onClick={() => void markOne(row.id)}
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                      {row.summary && (
                        <p className="mt-2 text-xs text-muted-foreground">{row.summary}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        {row.entry_zone && <span>Entry {row.entry_zone}</span>}
                        {row.stop_loss && <span>Stop {row.stop_loss}</span>}
                        {row.tp1 && <span>TP1 {row.tp1}</span>}
                      </div>
                      {openDetails && (
                        <SharedSignalDetail
                          details={details}
                          fallback={{
                            summary: row.summary,
                            entry: row.entry_zone,
                            stop: row.stop_loss,
                            tp1: row.tp1,
                            tp2: row.tp2,
                            direction: row.direction,
                            grade: row.grade,
                          }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
