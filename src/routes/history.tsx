import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ScrollText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ResultView, rowToResult } from "@/components/ResultView";
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
import { OUTCOMES } from "@/lib/analysis-types";
import {
  DEFAULT_SETTINGS,
  LOCAL_USER,
  useAnalyses,
  useAnalysisImages,
  useDeleteAnalysis,
  useSettings,
  type AnalysisRow,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Trade journal history — ChartPilot" },
      {
        name: "description",
        content:
          "Review every ChartPilot chart analysis, record outcomes in R and keep an auditable trading journal.",
      },
      { property: "og:title", content: "Trade journal history — ChartPilot" },
      {
        property: "og:description",
        content: "Every past setup, its checklist score and its recorded outcome in one place.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <AppShell>
      <History />
    </AppShell>
  );
}

function History() {
  const analysesQuery = useAnalyses();
  const settingsQuery = useSettings();
  const remove = useDeleteAnalysis();

  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<string>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = analysesQuery.data ?? [];
  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (outcome !== "ALL" && row.outcome !== outcome) return false;
        if (!search.trim()) return true;
        const needle = search.trim().toLowerCase();
        return (
          row.asset.toLowerCase().includes(needle) ||
          row.direction.toLowerCase().includes(needle) ||
          (row.primary_timeframe ?? "").toLowerCase().includes(needle)
        );
      }),
    [rows, outcome, search],
  );

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="font-display text-xl font-semibold">Journal history</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} saved {rows.length === 1 ? "analysis" : "analyses"}. Recording real outcomes
          is what makes the statistics meaningful.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
        <Input
          placeholder="Search asset, direction, timeframe"
          className="h-11 rounded-xl"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All outcomes</SelectItem>
            {OUTCOMES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {analysesQuery.isLoading && (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading your journal…</p>
      )}

      {!analysesQuery.isLoading && filtered.length === 0 && (
        <div className="card-soft grid place-items-center gap-2 p-10 text-center">
          <ScrollText className="size-8 text-muted-foreground" />
          <p className="font-display text-base font-semibold">Nothing here yet</p>
          <p className="text-sm text-muted-foreground">
            Analyze a chart and it will be saved here automatically.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {filtered.map((row) => (
          <li key={row.id} className="animate-float-in card-soft overflow-hidden">
            <button
              type="button"
              className="flex w-full items-start gap-3 p-4 text-left"
              onClick={() => setOpenId(openId === row.id ? null : row.id)}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl font-display text-sm font-semibold",
                  row.grade === "A" && "bg-bull/15 text-bull",
                  row.grade === "B" && "bg-primary/15 text-primary",
                  row.grade === "C" && "bg-warn/15 text-warn",
                  row.grade === "D" && "bg-bear/15 text-bear",
                )}
              >
                {row.score}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-display text-base font-semibold">{row.asset}</p>
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {row.primary_timeframe ?? "TF n/a"}
                  </Badge>
                  <Badge
                    className={cn(
                      "rounded-full text-[10px]",
                      row.direction === "POTENTIAL LONG" && "bg-bull/15 text-bull",
                      row.direction === "POTENTIAL SHORT" && "bg-bear/15 text-bear",
                      row.direction === "NO TRADE" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {row.direction}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()} · {row.outcome}
                  {typeof row.r_result === "number" ? ` · ${row.r_result > 0 ? "+" : ""}${row.r_result}R` : ""}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 size-5 shrink-0 text-muted-foreground transition-transform",
                  openId === row.id && "rotate-180",
                )}
              />
            </button>

            {openId === row.id && (
              <div className="space-y-4 border-t border-border/60 p-4">
                <Screenshots analysisId={row.id} />
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
                      onSuccess: () => toast.success("Analysis deleted."),
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
    </div>
  );
}

function Screenshots({ analysisId }: { analysisId: string }) {
  const { data } = useAnalysisImages(analysisId);
  if (!data || data.length === 0) return null;
  return (
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
  );
}

export type { AnalysisRow };
