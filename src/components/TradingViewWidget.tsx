import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Generic loader for the official free TradingView embed widgets.
 * Optional fullscreen button uses the browser Fullscreen API on the container
 * (works around cross-origin iframe limits: we fullscreen our wrapper, not the iframe guts).
 */
export function TradingViewWidget({
  script,
  config,
  height = 400,
  className,
  allowFullscreen = false,
  title,
}: {
  script: string;
  config: Record<string, unknown>;
  height?: number | string;
  className?: string;
  /** Show a fullscreen toggle above the widget */
  allowFullscreen?: boolean;
  title?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  const configKey = JSON.stringify(
    isFs
      ? {
          ...config,
          width: "100%",
          height: "100%",
          autosize: true,
        }
      : config,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    inner.style.width = "100%";
    container.appendChild(inner);

    const el = document.createElement("script");
    el.src = `https://s3.tradingview.com/external-embedding/${script}`;
    el.type = "text/javascript";
    el.async = true;
    el.innerHTML = configKey;
    container.appendChild(el);

    return () => {
      container.innerHTML = "";
    };
  }, [script, configKey]);

  useEffect(() => {
    const onChange = () => {
      setIsFs(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    const shell = shellRef.current;
    if (!shell) return;
    try {
      if (!document.fullscreenElement) {
        await shell.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Some mobile browsers block fullscreen without a gesture or support
    }
  };

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={shellRef}
      className={cn(
        "relative flex flex-col",
        isFs && "h-dvh w-full bg-background p-2",
        className,
      )}
    >
      {(allowFullscreen || title) && (
        <div className="mb-1 flex items-center justify-between gap-2 px-1">
          {title ? (
            <span className="text-xs font-medium text-muted-foreground">{title}</span>
          ) : (
            <span />
          )}
          {allowFullscreen && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 rounded-lg gap-1.5"
              onClick={toggleFullscreen}
            >
              {isFs ? (
                <>
                  <Minimize2 className="size-3.5" /> Exit full screen
                </>
              ) : (
                <>
                  <Maximize2 className="size-3.5" /> Full screen
                </>
              )}
            </Button>
          )}
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          "tradingview-widget-container min-h-0 w-full",
          isFs ? "flex-1" : "shrink-0",
        )}
        style={isFs ? undefined : { height: heightStyle }}
      />
    </div>
  );
}
