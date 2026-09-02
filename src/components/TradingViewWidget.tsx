import { useEffect, useRef } from "react";

/**
 * Generic loader for the official free TradingView embed widgets.
 * Each widget is a <script> tag with a JSON config appended into a container.
 */
export function TradingViewWidget({
  script,
  config,
  height = 400,
  className,
}: {
  script: string;
  config: Record<string, unknown>;
  height?: number | string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const configKey = JSON.stringify(config);

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

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container${className ? ` ${className}` : ""}`}
      style={{ height: typeof height === "number" ? `${height}px` : height, width: "100%" }}
    />
  );
}
