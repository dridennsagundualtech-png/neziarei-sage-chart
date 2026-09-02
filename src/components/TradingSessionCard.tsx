import { Clock, Globe2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  SESSIONS,
  formatCountdown,
  minutesUntilEnd,
  nextSession,
  primarySession,
  sessionRangeLabel,
  activeSessions,
} from "@/lib/sessions";
import { useNow, useSessionFilter } from "@/lib/useSessionFilter";
import { cn } from "@/lib/utils";

/**
 * Compact live read of the current FX session, with an optional
 * "only analyze during selected sessions" filter.
 */
export function TradingSessionCard({ showFilter = true }: { showFilter?: boolean }) {
  const now = useNow(30_000);
  const { filter, setFilter, toggleSession } = useSessionFilter();

  const active = activeSessions(now);
  const current = primarySession(now);
  const next = nextSession(now);
  const activeKeys = new Set(active.map((session) => session.key));

  const utcClock = `${String(now.getUTCHours()).padStart(2, "0")}:${String(
    now.getUTCMinutes(),
  ).padStart(2, "0")} UTC`;

  return (
    <section className="card-soft space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe2 className="size-3.5 text-primary" /> Trading session
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">{utcClock}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {current ? (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              current.tone,
            )}
          >
            {current.label} session
          </span>
        ) : (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            Between sessions
          </span>
        )}
        {active
          .filter((session) => session.key !== current?.key)
          .map((session) => (
            <span
              key={session.key}
              className="rounded-full border border-border bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              {session.label} open
            </span>
          ))}
      </div>

      <div className="grid gap-1.5 text-[11px] text-muted-foreground sm:grid-cols-2">
        <p className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {current
            ? `${current.label} ends in ${formatCountdown(minutesUntilEnd(now, current))}`
            : "No session is currently open"}
        </p>
        {next && (
          <p className="flex items-center gap-1.5 sm:justify-end">
            <Clock className="size-3.5" />
            {next.session.label} starts in {formatCountdown(next.minutes)}
          </p>
        )}
      </div>

      {showFilter && (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Only analyze during selected sessions</p>
              <p className="text-[11px] text-muted-foreground">
                Blocks a run when none of your chosen sessions is open.
              </p>
            </div>
            <Switch
              checked={filter.enabled}
              onCheckedChange={(checked) => setFilter({ ...filter, enabled: checked })}
              aria-label="Only analyze during selected sessions"
            />
          </div>

          {filter.enabled && (
            <>
              <div className="flex flex-wrap gap-2">
                {SESSIONS.map((session) => {
                  const on = filter.sessions.includes(session.key);
                  return (
                    <button
                      key={session.key}
                      type="button"
                      onClick={() => toggleSession(session.key)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                        on
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-elevated text-muted-foreground",
                        activeKeys.has(session.key) && !on && "border-primary/40",
                      )}
                    >
                      {session.label}
                      <span className="ml-1.5 opacity-60">{sessionRangeLabel(session)}</span>
                    </button>
                  );
                })}
              </div>
              {filter.sessions.length === 0 && (
                <p className="text-[11px] text-warn">
                  Pick at least one session, otherwise the filter lets everything through.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
