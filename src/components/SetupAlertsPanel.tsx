/**
 * Setup alerts — collapsible. Scan uses Analyze-style candle presets across all watch symbols.
 */
import {
  Bell,
  CheckCheck,
  ChevronDown,
  ExternalLink,
  Loader2,
  RefreshCw,
  Share2,
  Users,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TermTooltip } from "@/components/TermTooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAccess } from "@/lib/account";
import {
  listMemberSignals,
  publishAlertToMembers,
  type MemberSignalRow,
} from "@/lib/member-signals.functions";
import { DEFAULT_SCAN_PRESET_ID, SCAN_CANDLE_PRESETS } from "@/lib/scan-presets";
import {
  listSetupAlerts,
  markSetupAlertRead,
  scanSetupAlertsNow,
} from "@/lib/setup-alerts.functions";
import type { SetupAlertRow } from "@/lib/setup-alerts";
import { formatAlertTitle } from "@/lib/setup-alerts";
import { cn } from "@/lib/utils";

const PRESET_KEY = "chartpilot:alert-scan-preset";

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return iso.slice(0, 16).replace("T", " ");
}

function openAnalyzeLikeAlert(symbol: string, presetId: string) {
  // Home admin market + query so you can mirror the scan (open Admin market analysis)
  const url = `/?alertSymbol=${encodeURIComponent(symbol)}&alertPreset=${encodeURIComponent(presetId)}`;
  window.location.href = url;
}

export function SetupAlertsPanel({ compact = false }: { compact?: boolean }) {
  const { access } = useAccess();
  const isAdmin = Boolean(access?.isAdmin);
  const listFn = useServerFn(listSetupAlerts);
  const markFn = useServerFn(markSetupAlertRead);
  const scanFn = useServerFn(scanSetupAlertsNow);
  const listMembersFn = useServerFn(listMemberSignals);
  const publishFn = useServerFn(publishAlertToMembers);
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [presetId, setPresetId] = useState(DEFAULT_SCAN_PRESET_ID);
  const [lastPresetLabel, setLastPresetLabel] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRESET_KEY);
      if (saved && SCAN_CANDLE_PRESETS.some((p) => p.id === saved)) setPresetId(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const query = useQuery({
    queryKey: ["setup-alerts"],
    queryFn: () => listFn({ data: { limit: 40 } }),
    refetchInterval: 60_000,
  });

  const membersQuery = useQuery({
    queryKey: ["member-signals"],
    queryFn: () => listMembersFn({ data: { limit: 40 } }),
    refetchInterval: 60_000,
  });

  const rows = (query.data ?? []) as SetupAlertRow[];
  const memberRows = (membersQuery.data ?? []) as MemberSignalRow[];
  const unread = rows.filter((r) => !r.read_at);

  useEffect(() => {
    if (unread.length > 0) setOpen(true);
  }, [unread.length]);

  const markRead = async (id?: string) => {
    try {
      await markFn({ data: id ? { id } : { id: "", all: true } });
      await queryClient.invalidateQueries({ queryKey: ["setup-alerts"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update alert.");
    }
  };

  const scanNow = async () => {
    setScanning(true);
    try {
      try {
        localStorage.setItem(PRESET_KEY, presetId);
      } catch {
        /* ignore */
      }
      const result = (await scanFn({ data: { scanPresetId: presetId } })) as {
        created: number;
        presetName?: string;
        hits?: { symbol: string; reason: string }[];
      };
      await queryClient.invalidateQueries({ queryKey: ["setup-alerts"] });
      setOpen(true);
      setLastPresetLabel(result.presetName ?? presetId);
      if (result.created > 0) {
        toast.success(
          `${result.created} alert(s) · preset ${result.presetName ?? presetId}`,
        );
      } else {
        const detail = (result.hits ?? [])
          .slice(0, 4)
          .map((h) => `${h.symbol}: ${h.reason}`)
          .join(" · ");
        toast.message(detail || `Scan done (${result.presetName ?? presetId}) — nothing to alert.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  };

  const publish = async (alertId: string) => {
    setPublishingId(alertId);
    try {
      await publishFn({ data: { alertId } });
      await queryClient.invalidateQueries({ queryKey: ["member-signals"] });
      toast.success("Shared with registered users.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not share signal.");
    } finally {
      setPublishingId(null);
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
            <Bell className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold">
              <TermTooltip term="Setup alerts" label="Setup alerts" />
              {unread.length > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-full align-middle">
                  {unread.length} new
                </Badge>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {open
                ? "Tap to hide"
                : "Scans all watch symbols like Analyze (pick a candle preset)"}
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
          <p className="text-[11px] text-muted-foreground">
            Scan runs your Den rules on every watch symbol using the same kind of{" "}
            <span className="font-medium text-foreground">candle preset</span> as Analyze (Day
            Trader, Balanced, …). It reports which preset was used. Use{" "}
            <span className="font-medium text-foreground">Open Analyze</span> on an alert to study
            that symbol with the same preset id in the URL.
          </p>

          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Scan candle preset</p>
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
            {lastPresetLabel && (
              <p className="text-[11px] text-muted-foreground">
                Last scan preset: <span className="text-foreground">{lastPresetLabel}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {unread.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-xl text-xs"
                onClick={() => void markRead()}
              >
                <CheckCheck className="size-3.5" /> Mark all read
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-xl text-xs"
              disabled={scanning}
              onClick={() => void scanNow()}
            >
              {scanning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Scan now
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold">Your alerts</p>
            {query.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No personal alerts yet.</p>
            ) : (
              <ul className="space-y-2">
                {rows.map((row) => (
                  <li
                    key={row.id}
                    className={cn(
                      "rounded-xl border border-border p-3 text-sm",
                      !row.read_at && "border-primary/40 bg-primary/5",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{formatAlertTitle(row)}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {relativeTime(row.created_at)}
                          {row.score != null ? ` · score ${row.score}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 text-[11px]"
                          onClick={() => openAnalyzeLikeAlert(row.symbol, presetId)}
                        >
                          <ExternalLink className="size-3" />
                          Open Analyze
                        </Button>
                        {isAdmin && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[11px]"
                            disabled={publishingId === row.id}
                            onClick={() => void publish(row.id)}
                          >
                            {publishingId === row.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Share2 className="size-3" />
                            )}
                            Share
                          </Button>
                        )}
                        {!row.read_at && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px]"
                            onClick={() => void markRead(row.id)}
                          >
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                    {row.summary && (
                      <p className="mt-2 line-clamp-4 text-xs text-muted-foreground">{row.summary}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                      {row.entry_zone && <span>Entry {row.entry_zone}</span>}
                      {row.stop_loss && <span>Stop {row.stop_loss}</span>}
                      {row.tp1 && <span>TP1 {row.tp1}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Users className="size-3.5" />
              Member signals
              <span className="font-normal text-muted-foreground">(all signed-in users)</span>
            </p>
            {membersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : memberRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No shared signals yet.
                {isAdmin ? " Use Share on one of your alerts." : " Wait for the admin to share one."}
              </p>
            ) : (
              <ul className="space-y-2">
                {memberRows.map((row) => (
                  <li key={row.id} className="rounded-xl border border-border bg-elevated p-3 text-sm">
                    <p className="font-medium">
                      {row.symbol} · {row.direction}
                      {row.grade ? ` · ${row.grade}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {relativeTime(row.created_at)} · shared
                    </p>
                    {row.summary && (
                      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{row.summary}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
