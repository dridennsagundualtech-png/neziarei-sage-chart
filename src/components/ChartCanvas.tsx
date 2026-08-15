import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export function pointInZone(point: Point, zone: Zone, tolerance = 0.04): boolean {
  return (
    point.x >= zone.x - tolerance &&
    point.x <= zone.x + zone.w + tolerance &&
    point.y >= zone.y - tolerance &&
    point.y <= zone.y + zone.h + tolerance
  );
}

/**
 * A chart screenshot the learner can tap. Coordinates are normalised (0-1) so a
 * reference zone works on any screen size, and the zone is deliberately a
 * tolerance area rather than a single pixel.
 */
export function ChartCanvas({
  src,
  point,
  zone,
  onPick,
  label,
  className,
}: {
  src: string;
  point?: Point | null;
  zone?: Zone | null;
  onPick?: ((point: Point) => void) | undefined;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const handle = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onPick) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    onPick({
      x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1),
    });
  };

  return (
    <div
      ref={ref}
      onClick={handle}
      role={onPick ? "button" : undefined}
      tabIndex={onPick ? 0 : undefined}
      aria-label={onPick ? `Tap the chart to mark ${label ?? "the area"}` : label}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-elevated",
        onPick && "cursor-crosshair",
        className,
      )}
    >
      <img
        src={src}
        alt={label ?? "Trading chart screenshot"}
        onLoad={() => setLoaded(true)}
        className={cn("block w-full transition-opacity", loaded ? "opacity-100" : "opacity-0")}
      />

      {zone && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-lg border-2 border-bull bg-bull/20"
          style={{
            left: `${zone.x * 100}%`,
            top: `${zone.y * 100}%`,
            width: `${zone.w * 100}%`,
            height: `${zone.h * 100}%`,
          }}
        />
      )}

      {point && (
        <span
          aria-hidden
          className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/40"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
        />
      )}
    </div>
  );
}
