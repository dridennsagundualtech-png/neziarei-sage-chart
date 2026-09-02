import { useState } from "react";

import { TradingViewWidget } from "@/components/TradingViewWidget";

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
