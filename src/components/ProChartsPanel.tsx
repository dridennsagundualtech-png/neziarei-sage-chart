import { Camera, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { TradingViewWidget } from "@/components/TradingViewWidget";
import { Button } from "@/components/ui/button";
import { useSaveScreenshot } from "@/lib/data";

const WATCHLIST = [
  { label: "BTCUSDT", symbol: "BINANCE:BTCUSDT" },
  { label: "ETHUSDT", symbol: "BINANCE:ETHUSDT" },
  { label: "XAUUSD", symbol: "OANDA:XAUUSD" },
  { label: "EURUSD", symbol: "FX:EURUSD" },
  { label: "NAS100", symbol: "OANDA:NAS100USD" },
  { label: "SPX500", symbol: "OANDA:SPX500USD" },
];

/**
 * The full TradingView workspace: mini market overview, advanced chart with
 * drawing tools, and a heatmap. Rendered on the home page and at /charts.
 */
export function ProChartsPanel({ heading = true }: { heading?: boolean }) {
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveScreenshot = useSaveScreenshot();

  const store = async (file: File) => {
    await saveScreenshot.mutateAsync({
      file,
      title: `${symbol.split(":").pop() ?? symbol} chart`,
      symbol,
      timeframe: null,
    });
    toast.success("Saved to Journal → Screenshots.");
  };

  /**
   * TradingView renders inside a cross-origin iframe, which no browser API can
   * read directly. Screen capture (getDisplayMedia) is the only way to get a
   * real picture of the chart, so we ask the browser for one frame of the tab.
   */
  const captureChart = async () => {
    setBusy(true);
    try {
      const media = navigator.mediaDevices as MediaDevices & {
        getDisplayMedia?: (c: MediaStreamConstraints) => Promise<MediaStream>;
      };
      if (!media?.getDisplayMedia) {
        throw new Error("Screen capture is not supported here — use “Upload image” instead.");
      }
      const stream = await media.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0]!;
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((resolve) => setTimeout(resolve, 400));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      track.stop();
      stream.getTracks().forEach((item) => item.stop());
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9),
      );
      if (!blob) throw new Error("Could not create the screenshot.");
      await store(new File([blob], "chart.jpg", { type: "image/jpeg" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the screenshot.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {heading && (
        <header className="animate-float-in card-soft p-5">
          <h2 className="font-display text-xl font-semibold">Pro Charts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin-only TradingView workspace: full drawing tools, multi-timeframe charting, market
            overview and heatmap.
          </p>
        </header>
      )}

      <section className="card-soft flex flex-wrap items-center gap-2 p-4">
        <Button className="h-11 flex-1 rounded-xl" onClick={captureChart} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          Screenshot to journal
        </Button>
        <Button
          variant="secondary"
          className="h-11 flex-1 rounded-xl"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          <Upload className="size-4" /> Upload image
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setBusy(true);
            try {
              await store(file);
            } catch {
              toast.error("Could not save that image.");
            } finally {
              setBusy(false);
            }
          }}
        />
        <p className="w-full text-[11px] text-muted-foreground">
          Screenshots land in Journal → Screenshots, where you can rename or delete them.
        </p>
      </section>

      <section className="card-soft space-y-3 p-4">
        <h3 className="text-sm font-semibold">Market overview</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WATCHLIST.map((item) => (
            <button
              key={item.symbol}
              type="button"
              onClick={() => setSymbol(item.symbol)}
              className={`panel overflow-hidden p-1 text-left transition-all ${
                symbol === item.symbol ? "ring-2 ring-primary" : "hover:border-primary/50"
              }`}
            >
              <TradingViewWidget
                height={190}
                script="embed-widget-mini-symbol-overview.js"
                config={{
                  symbol: item.symbol,
                  width: "100%",
                  height: 180,
                  locale: "en",
                  dateRange: "1D",
                  colorTheme: "dark",
                  isTransparent: true,
                  autosize: false,
                  largeChartUrl: "",
                }}
              />
              <span className="block px-2 pb-1 text-[11px] text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card-soft overflow-hidden p-1">
        <TradingViewWidget
          height={640}
          script="embed-widget-advanced-chart.js"
          config={{
            autosize: false,
            width: "100%",
            height: 630,
            symbol,
            interval: "60",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            withdateranges: true,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            details: true,
            calendar: false,
            save_image: true,
            backgroundColor: "rgba(17,19,28,1)",
            support_host: "https://www.tradingview.com",
          }}
        />
      </section>

      <section className="card-soft space-y-3 p-4">
        <h3 className="text-sm font-semibold">Market heatmap</h3>
        <div className="overflow-hidden rounded-xl">
          <TradingViewWidget
            height={480}
            script="embed-widget-stock-heatmap.js"
            config={{
              exchanges: [],
              dataSource: "SPX500",
              grouping: "sector",
              blockSize: "market_cap_basic",
              blockColor: "change",
              locale: "en",
              symbolUrl: "",
              colorTheme: "dark",
              hasTopBar: true,
              isDataSetEnabled: true,
              isZoomEnabled: true,
              hasSymbolTooltip: true,
              isMonoSize: false,
              width: "100%",
              height: 470,
            }}
          />
        </div>
      </section>
    </div>
  );
}
