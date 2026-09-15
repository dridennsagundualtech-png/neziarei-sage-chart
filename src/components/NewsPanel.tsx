/**
 * Market news via TradingView's free Timeline widget.
 * No API key — official embed, same family as your charts.
 */
import { Newspaper } from "lucide-react";
import { useState } from "react";

import { TradingViewWidget } from "@/components/TradingViewWidget";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Feed = "all" | "crypto" | "forex" | "stock" | "index";

const FEEDS: { id: Feed; label: string; config: Record<string, unknown> }[] = [
  {
    id: "all",
    label: "All",
    config: {
      feedMode: "all_symbols",
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: 480,
      colorTheme: "dark",
      locale: "en",
    },
  },
  {
    id: "crypto",
    label: "Crypto",
    config: {
      feedMode: "market",
      market: "crypto",
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: 480,
      colorTheme: "dark",
      locale: "en",
    },
  },
  {
    id: "forex",
    label: "Forex",
    config: {
      feedMode: "market",
      market: "forex",
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: 480,
      colorTheme: "dark",
      locale: "en",
    },
  },
  {
    id: "stock",
    label: "Stocks",
    config: {
      feedMode: "market",
      market: "stock",
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: 480,
      colorTheme: "dark",
      locale: "en",
    },
  },
  {
    id: "index",
    label: "Indices",
    config: {
      feedMode: "market",
      market: "index",
      isTransparent: true,
      displayMode: "regular",
      width: "100%",
      height: 480,
      colorTheme: "dark",
      locale: "en",
    },
  },
];

export function NewsPanel({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [feed, setFeed] = useState<Feed>("all");
  const active = FEEDS.find((f) => f.id === feed) ?? FEEDS[0]!;

  return (
    <section className="card-soft space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="size-4 text-primary" />
          <h2 className="font-display text-base font-semibold">Market news</h2>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 rounded-lg"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Powered by TradingView’s free news timeline (no API key). Headlines are for context only —
        not trade signals.
      </p>

      {open && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {FEEDS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFeed(f.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  feed === f.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <TradingViewWidget
              key={feed}
              height={500}
              script="embed-widget-timeline.js"
              allowFullscreen
              title={`${active.label} news`}
              config={active.config}
            />
          </div>
        </>
      )}
    </section>
  );
}
