/**
 * In-app setup alerts — collapsible card on Home.
 * Manual "Scan now" + optional background cron (not automatic inside the browser alone).
 */
import { Bell, CheckCheck, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TermTooltip } from "@/components/TermTooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listSetupAlerts,
  markSetupAlertRead,
  scanSetupAlertsNow,
} from "@/lib/setup-alerts.functions";
import type { SetupAlertRow } from "@/lib/setup-alerts";
import { formatAlertTitle } from "@/lib/setup-alerts";
import { cn } from "@/lib/utils";

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
  const listFn = useServerFn(listSetupAlerts);
  const markFn = useServerFn(markSetupAlertRead);
  const scanFn = useServerFn(scanSetupAlertsNow);
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["setup-alerts"],
    queryFn: () => listFn({ data: { limit: 40 } }),
    refetchInterval: 60_000,
  });

  const rows = (query.data ?? []) as SetupAlertRow[];
  const unread = rows.filter((r) => !r.read_at);

  // Open once when there are unread alerts (first load / new unread)
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
      const result = (await scanFn({})) as {
        created: number;
        hits: { symbol: string; reason: string }[];
      };
      await queryClient.invalidateQueries({ queryKey: ["setup-alerts"] });
      setOpen(true);
      if (result.created > 0) {
        toast.success(`${result.created} new setup alert(s).`);
      } else {
        toast.message("Scan finished — no new tradable setups.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <section className={cn("card-soft", compact ? "p-3" : "p-4")}>
      {/* Dropdown header */}
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
                ? "Tap to hide the list"
                : "Tap to open — Den notes when a setup looks ready"}
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
            Simple meaning: a list of setups Den already checked.{" "}
            <span className="font-medium text-foreground">Scan now</span> checks again right
            away. Automatic checks only run if you set up the background cron — the app does not
            scan by itself just because Home is open.
          </p>

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

          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading alerts…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No alerts yet. Tap Scan now, or turn on watch + cron for background checks.
            </p>
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
                        {row.email_sent ? " · email sent" : ""}
                        {row.score != null ? ` · score ${row.score}` : ""}
                      </p>
                    </div>
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
                  {row.summary && (
                    <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{row.summary}</p>
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
      )}
    </section>
  );
}
