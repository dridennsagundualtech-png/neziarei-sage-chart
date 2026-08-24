import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AppShell } from "@/components/AppShell";
import { ChartUploader, toPendingImage, type PendingImage } from "@/components/ChartUploader";
import { EducationalTradePlan } from "@/components/EducationalTradePlan";
import { PremiumGate } from "@/components/PremiumGate";
import { HumanVsAIComparison, HumanVsAIForm, type HumanSubmission } from "@/components/HumanVsAI";
import { ResultView } from "@/components/ResultView";
import { TeachMeThisChart } from "@/components/TeachMeThisChart";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DISCLAIMER, type AnalysisResult } from "@/lib/analysis-types";
import { analyzeChart, analyzeChartFromData } from "@/lib/analyze.functions";
import { DataSourcePicker } from "@/components/DataSourcePicker";
import {
  DEFAULT_SETTINGS,
  LOCAL_USER,
  useAnalyses,
  useAnalysis,
  useSaveAnalysis,
  useSettings,
} from "@/lib/data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChartPilot — Evidence-based chart analysis & journal" },
      {
        name: "description",
        content:
          "Upload trading chart screenshots and get a strict, evidence-based setup checklist, conditional trade plan and journal-driven statistics. Educational tool, not financial advice.",
      },
      { property: "og:title", content: "ChartPilot — Evidence-based chart analysis" },
      {
        property: "og:description",
        content:
          "Strict A+ setup scoring, separated visual evidence and historical performance, plus a trading journal.",
      },
    ],
  }),
  component: AnalyzePage,
});

function AnalyzePage() {
  return (
    <AppShell>
      <PremiumGate>
        <Analyze />
      </PremiumGate>
    </AppShell>
  );
}

function Analyze() {
  const settingsQuery = useSettings();
  const analysesQuery = useAnalyses();
  const saveAnalysis = useSaveAnalysis();
  const runAnalyze = useServerFn(analyzeChart);
  const runAnalyzeData = useServerFn(analyzeChartFromData);

  const [images, setImages] = useState<PendingImage[]>([]);
  const [assetHint, setAssetHint] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [human, setHuman] = useState<HumanSubmission | null>(null);
  const [mode, setMode] = useState<"screenshot" | "data">("screenshot");
  const [symbol, setSymbol] = useState<string | null>(null);
  const [dataTimeframes, setDataTimeframes] = useState<string[]>([]);

  const savedQuery = useAnalysis(savedId ?? undefined);
  const freshnessQuery = useDataFreshness(mode === "data" ? symbol : null, dataTimeframes);
  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };
  const journal = analysesQuery.data ?? [];

  const addFiles = async (files: File[]) => {
    const room = 6 - images.length;
    if (room <= 0) {
      toast.error("Six screenshots is the maximum for one analysis.");
      return;
    }
    const pending = await Promise.all(files.slice(0, room).map(toPendingImage));
    setImages((current) => [...current, ...pending]);
  };

  const move = (id: string, direction: -1 | 1) => {
    setImages((current) => {
      const index = current.findIndex((image) => image.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item!);
      return copy;
    });
  };

  const analyzeFromData = async () => {
    if (!symbol) {
      toast.error("Pick a symbol to analyze.");
      return;
    }
    if (dataTimeframes.length === 0) {
      toast.error("Pick at least one timeframe.");
      return;
    }
    const veryStale = (freshnessQuery.data ?? []).some(
      (row) => classifyFreshness(row.timeframe, row.lastTime) === "very-stale",
    );
    if (veryStale) {
      toast.warning(
        "Your market data hasn't updated recently — results may be based on old candles.",
      );
    }
    setRunning(true);
    setResult(null);
    setSavedId(null);
    try {
      const analysis = (await runAnalyzeData({
        data: {
          symbol,
          timeframes: dataTimeframes,
          minRR: Number(settings.min_rr),
          requireVolume: settings.require_volume,
          strictMode: settings.strict_mode,
        },
      })) as AnalysisResult;
      setResult(analysis);
      try {
        const id = await saveAnalysis.mutateAsync({ result: analysis, images: [] });
        setSavedId(id);
      } catch {
        toast.error("Analysis finished but saving to your journal failed.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The analysis could not be completed. Try again.",
      );
    } finally {
      setRunning(false);
    }
  };

  const analyze = async () => {
    if (mode === "data") {
      await analyzeFromData();
      return;
    }
    if (images.length === 0) {
      toast.error("Add at least one chart screenshot.");
      return;
    }
    setRunning(true);
    setResult(null);
    setSavedId(null);
    try {
      const analysis = (await runAnalyze({
        data: {
          images: images.map((image) => ({ dataUrl: image.dataUrl, timeframe: image.timeframe })),
          assetHint: assetHint.trim() || null,
          minRR: Number(settings.min_rr),
          requireVolume: settings.require_volume,
          strictMode: settings.strict_mode,
        },
      })) as AnalysisResult;
      setResult(analysis);

      try {
        const id = await saveAnalysis.mutateAsync({
          result: analysis,
          images: images.map((image) => ({ file: image.file, timeframe: image.timeframe })),
        });
        setSavedId(id);
      } catch {
        toast.error("Analysis finished but saving to your journal failed.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The analysis could not be completed. Try again.",
      );
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setImages([]);
    setResult(null);
    setSavedId(null);
    setAssetHint("");
    setHuman(null);
    setDataTimeframes([]);
  };

  return (
    <div className="space-y-5">
      {!result && !running && (
        <section className="animate-float-in card-soft p-5">
          <h1 className="font-display text-2xl font-semibold leading-tight">
            Read your chart like a strict analyst
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ChartPilot only reports what is actually visible in your screenshots. If context is
            missing, it asks for more instead of guessing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {["Synced to your account", "16-point checklist", "No hype", "Journal-backed stats", "Not financial advice"].map(
              (chip) => (
                <span key={chip} className="rounded-full border border-border bg-elevated px-2.5 py-1">
                  {chip}
                </span>
              ),
            )}
          </div>
        </section>
      )}

      {!running && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mode === "screenshot" ? "default" : "secondary"}
            className="h-11 rounded-xl"
            onClick={() => setMode("screenshot")}
          >
            Screenshots
          </Button>
          <Button
            variant={mode === "data" ? "default" : "secondary"}
            className="h-11 rounded-xl"
            onClick={() => setMode("data")}
          >
            Market data
          </Button>
        </div>
      )}

      {!running && mode === "data" && (
        <DataSourcePicker
          symbol={symbol}
          timeframes={dataTimeframes}
          onSymbol={(next) => {
            setSymbol(next);
            setDataTimeframes([]);
          }}
          onToggleTimeframe={(timeframe) =>
            setDataTimeframes((current) =>
              current.includes(timeframe)
                ? current.filter((item) => item !== timeframe)
                : [...current, timeframe].slice(0, 6),
            )
          }
        />
      )}

      {!running && mode === "screenshot" && (
        <ChartUploader
          images={images}
          timeframes={settings.preferred_timeframes}
          onAdd={addFiles}
          onRemove={(id) => setImages((current) => current.filter((image) => image.id !== id))}
          onMove={move}
          onTimeframe={(id, timeframe) =>
            setImages((current) =>
              current.map((image) => (image.id === id ? { ...image, timeframe } : image)),
            )
          }
          compact={images.length > 0}
        />
      )}

      {!running && mode === "screenshot" && !result && settings.learning_mode && images.length > 0 && (
        <HumanVsAIForm onSubmit={setHuman} submitted={human !== null} />
      )}

      {!running && (
        <div className="space-y-3">
          {mode === "screenshot" && (
          <div className="space-y-1.5">
            <Label htmlFor="asset">Asset (optional — helps if the ticker is cropped)</Label>
            <Input
              id="asset"
              placeholder="BTCUSD, XAUUSD, NVDA…"
              className="h-11 rounded-xl"
              value={assetHint}
              onChange={(event) => setAssetHint(event.target.value.toUpperCase())}
            />
          </div>
          )}
          <div className="flex gap-2">
            <Button className="h-12 flex-1 rounded-xl text-base" onClick={analyze}>
              <Sparkles className="size-4" /> Analyze setup
            </Button>
            {(images.length > 0 || result) && (
              <Button
                variant="secondary"
                className="h-12 rounded-xl"
                onClick={reset}
                aria-label="Start over"
              >
                <RotateCcw className="size-4" />
              </Button>
            )}
          </div>
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />
            {DISCLAIMER}
          </p>
        </div>
      )}

      {running && <AnalysisProgress />}

      {result && !running && (
        <ResultView
          result={result}
          journal={journal}
          settings={settings}
          savedRow={savedQuery.data ?? null}
        />
      )}

      {result && !running && mode === "screenshot" && settings.learning_mode && (
        <>
          <EducationalTradePlan result={result} settings={settings} />
          <TeachMeThisChart
            images={images.map((image) => ({ dataUrl: image.dataUrl, timeframe: image.timeframe }))}
            context={result.summary}
            beginner={settings.beginner_mode}
          />
          {human && (
            <HumanVsAIComparison
              human={human}
              result={result}
              analysisId={savedId}
              beginner={settings.beginner_mode}
            />
          )}
          <UncertaintyNote />
        </>
      )}
    </div>
  );
}
