/**
 * Human-readable Den-style view of a shared member signal (no raw JSON).
 */
import { ListChecks, ShieldX, Target, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CHECKLIST_BY_KEY } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  key?: string;
  label?: string;
  score?: number;
  max?: number;
  status?: string;
  evidence?: string;
  note?: string;
};

function asItems(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as ChecklistItem[];
}

function labelFor(item: ChecklistItem): string {
  if (item.label) return item.label;
  const key = String(item.key ?? "");
  const meta = (CHECKLIST_BY_KEY as Record<string, { label?: string } | undefined>)[key];
  if (meta?.label) return meta.label;
  return key.replace(/_/g, " ") || "Checklist item";
}

export function SharedSignalDetail({
  details,
  fallback,
}: {
  details: Record<string, unknown> | null | undefined;
  fallback?: {
    summary?: string | null;
    entry?: string | null;
    stop?: string | null;
    tp1?: string | null;
    tp2?: string | null;
    direction?: string | null;
    grade?: string | null;
  };
}) {
  const d = details ?? {};
  const direction = String(d.direction ?? fallback?.direction ?? "—");
  const grade = String(d.grade ?? fallback?.grade ?? "—");
  const score = d.score != null ? Number(d.score) : null;
  const maxScore = d.max_score != null ? Number(d.max_score) : null;
  const summary = String(d.summary ?? fallback?.summary ?? "").trim();
  const entry = String(d.entry_zone ?? fallback?.entry ?? "").trim();
  const stop = String(d.stop_loss ?? fallback?.stop ?? "").trim();
  const tp1 = String(d.tp1 ?? fallback?.tp1 ?? "").trim();
  const tp2 = String(d.tp2 ?? fallback?.tp2 ?? "").trim();
  const tradable = d.tradable === true;
  const preset = d.preset != null ? String(d.preset) : null;
  const setupStage = d.setup_stage != null ? String(d.setup_stage) : null;
  const reasons = Array.isArray(d.tradable_reasons)
    ? (d.tradable_reasons as unknown[]).map(String).filter(Boolean)
    : [];
  const invalidation = Array.isArray(d.invalidation)
    ? (d.invalidation as unknown[]).map(String).filter(Boolean)
    : Array.isArray(d.invalidationConditions)
      ? (d.invalidationConditions as unknown[]).map(String).filter(Boolean)
      : [];
  const checklist = asItems(d.checklist);
  const isLong = direction.toUpperCase().includes("LONG");
  const isShort = direction.toUpperCase().includes("SHORT");

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      {/* Header strip */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            isLong && "bg-bull/15 text-bull",
            isShort && "bg-bear/15 text-bear",
            !isLong && !isShort && "bg-muted text-muted-foreground",
          )}
        >
          {isLong ? (
            <TrendingUp className="size-3.5" />
          ) : isShort ? (
            <TrendingDown className="size-3.5" />
          ) : null}
          {direction}
        </span>
        {grade !== "—" && (
          <Badge variant="secondary" className="rounded-full">
            Grade {grade}
            {score != null ? ` · ${score}${maxScore != null ? `/${maxScore}` : ""}` : ""}
          </Badge>
        )}
        {tradable ? (
          <Badge className="rounded-full">Tradable</Badge>
        ) : (
          <Badge variant="outline" className="rounded-full">
            Review first
          </Badge>
        )}
        {preset && <span className="text-xs text-muted-foreground">Preset: {preset}</span>}
        {setupStage && <span className="text-xs text-muted-foreground">Stage: {setupStage}</span>}
      </div>

      {summary && <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>}

      {/* Trade plan */}
      {(entry || stop || tp1 || tp2) && (
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
            <Target className="size-3.5 text-primary" />
            Trade plan
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {entry && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Entry</p>
                <p className="font-medium tabular-nums">{entry}</p>
              </div>
            )}
            {stop && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Stop</p>
                <p className="font-medium tabular-nums">{stop}</p>
              </div>
            )}
            {tp1 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">TP1</p>
                <p className="font-medium tabular-nums">{tp1}</p>
              </div>
            )}
            {tp2 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">TP2</p>
                <p className="font-medium tabular-nums">{tp2}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invalidation / quality notes */}
      {(invalidation.length > 0 || reasons.length > 0) && (
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
            <ShieldX className="size-3.5 text-warn" />
            What to watch / quality notes
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            {invalidation.map((line, i) => (
              <li key={`inv-${i}`}>{line}</li>
            ))}
            {reasons.map((line, i) => (
              <li key={`r-${i}`}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Checklist like Den */}
      {checklist.length > 0 && (
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
            <ListChecks className="size-3.5 text-primary" />
            Setup checklist
          </p>
          <ul className="space-y-2">
            {checklist.map((item, i) => {
              const max = Number(item.max ?? 2) || 2;
              const sc = Number(item.score ?? 0);
              const pct = Math.max(0, Math.min(100, (sc / max) * 100));
              return (
                <li key={item.key ?? i} className="rounded-lg border border-border/60 p-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium">{labelFor(item)}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {sc}/{max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        sc >= max ? "bg-bull" : sc > 0 ? "bg-warn" : "bg-muted-foreground/30",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {(item.status || item.evidence || item.note) && (
                    <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                      {[item.status, item.evidence, item.note].filter(Boolean).join(" — ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!summary && !entry && checklist.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No extra detail was stored with this share. Use Open full to run Den on this symbol.
        </p>
      )}
    </div>
  );
}
