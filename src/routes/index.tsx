import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Layers, Lock, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AppShell } from "@/components/AppShell";
import { PageGate } from "@/components/PageGate";
import { ProChartsPanel } from "@/components/ProChartsPanel";
import { TradingSessionCard } from "@/components/TradingSessionCard";
import { inSelectedSessions } from "@/lib/sessions";
import { useSessionFilter } from "@/lib/useSessionFilter";
import { ChartUploader, toPendingImage, type PendingImage } from "@/components/ChartUploader";
import { EducationalTradePlan } from "@/components/EducationalTradePlan";
import { PremiumGate } from "@/components/PremiumGate";
import { MarketSection } from "@/components/pages/MarketSection";

import { HumanVsAIComparison, HumanVsAIForm, type HumanSubmission } from "@/components/HumanVsAI";
import { ResultView } from "@/components/ResultView";
import { ScreenshotCompiler } from "@/components/ScreenshotCompiler";
import { TeachMeThisChart } from "@/components/TeachMeThisChart";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccess } from "@/lib/account";
import { DISCLAIMER, type AnalysisResult } from "@/lib/analysis-types";
import { analyzeChart, analyzeChartFromData } from "@/lib/analyze.functions";
import { DataSourcePicker } from "@/components/DataSourcePicker";
import { ModelPicker } from "@/components/ModelPicker";
import { DEFAULT_ANALYSIS_MODEL } from "@/lib/ai-models";
import { classifyFreshness } from "@/lib/freshness";
import { useDataFreshness } from "@/lib/useFreshness";
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
  const { access } = useAccess();
  const [adminMarket, setAdminMarket] = useState(false);
  const [proCharts, setProCharts] = useState(true);

  return (
    <AppShell>
      <PageGate page="/">
        <div className="mb-4">
          <TradingSessionCard />
        </div>
        {access?.isAdmin && (
          <div className="mb-4 space-y-2">
            <Button
              variant={proCharts ? "default" : "secondary"}
              className="h-11 w-full rounded-xl"
              onClick={() => setProCharts((current) => !current)}
            >
              <CandlestickChart className="size-4" />
              {proCharts ? "Hide Pro Charts" : "Pro Charts — TradingView workspace"}
            </Button>
            {proCharts && <ProChartsPanel heading={false} />}
          </div>
        )}
        {access?.isAdmin && (
          <div className="mb-4 space-y-2">
            <Button
              variant={adminMarket ? "default" : "secondary"}
              className="h-11 w-full rounded-xl"
              onClick={() => setAdminMarket((current) => !current)}
            >
              <ShieldCheck className="size-4" />
              {adminMarket ? "Hide admin market analysis" : "Admin feature — market analysis"}
            </Button>
            {adminMarket && <MarketSection />}
          </div>
        )}
        {!adminMarket && (
          <PremiumGate>
            <Analyze />
          </PremiumGate>
        )}
      </PageGate>
    </AppShell>
  );
}


function Analyze() {
  const { access } = useAccess();
  const marketDataAllowed = Boolean(access?.marketDataEnabled);
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
  const [compilerOpen, setCompilerOpen] = useState(false);
  const [directUpload, setDirectUpload] = useState(false);
  const [dataModel, setDataModel] = useState<string>(DEFAULT_ANALYSIS_MODEL);

  const savedQuery = useAnalysis(savedId ?? undefined);
  const freshnessQuery = useDataFreshness(mode === "data" && marketDataAllowed ? symbol : null, dataTimeframes);
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
          model: dataModel,
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
      if (!marketDataAllowed) {
        toast.error("Market data analysis is not enabled for your account.");
        return;
      }
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
          {marketDataAllowed ? (
            <Button
              variant={mode === "data" ? "default" : "secondary"}
              className="h-11 rounded-xl"
              onClick={() => setMode("data")}
            >
              Market data
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="h-11 rounded-xl opacity-60"
              disabled
              title="Ask an admin to enable this"
            >
              <Lock className="size-3.5" /> Market data
            </Button>
          )}
        </div>
      )}

      {!running && !marketDataAllowed && (
        <p className="text-center text-[11px] text-muted-foreground">
          Market data analysis is locked — ask an admin to enable it for your account.
        </p>
      )}

      {!running && mode === "data" && marketDataAllowed && (
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

      {!running && mode === "data" && marketDataAllowed && (
        <div className="card-soft p-4">
          <ModelPicker value={dataModel} onChange={setDataModel} />
        </div>
      )}

      {!running && (mode === "screenshot" || !marketDataAllowed) && (
        <>
          <div className="panel space-y-3 p-5 text-center">
            <span className="mx-auto grid size-16 animate-breathe place-items-center rounded-3xl bg-primary/15 text-primary">
              <Layers className="size-8" />
            </span>
            <div>
              <p className="font-display text-base font-semibold">Compile your screenshots</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Merge up to 5 charts (1D → 4H → 1H → 15M → 5M) into one clean image, then analyze it.
              </p>
            </div>
            <Button
              type="button"
              className="h-12 w-full rounded-xl"
              onClick={() => setCompilerOpen(true)}
            >
              <Layers className="size-4" /> Open screenshot compiler
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full rounded-xl text-xs"
            onClick={() => setDirectUpload((current) => !current)}
          >
            {directUpload ? "Hide direct upload" : "Or upload screenshots directly (optional)"}
          </Button>

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
            hideDropzone={!directUpload}
          />

          <ScreenshotCompiler
            open={compilerOpen}
            onOpenChange={setCompilerOpen}
            onUse={(file) => addFiles([file])}
          />
        </>
      )}



      {!running && (mode === "screenshot" || !marketDataAllowed) && !result && settings.learning_mode && images.length > 0 && (
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
