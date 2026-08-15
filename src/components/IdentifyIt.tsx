import { useServerFn } from "@tanstack/react-start";
import { Crosshair, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ChartCanvas, pointInZone, type Point, type Zone } from "@/components/ChartCanvas";
import { Button } from "@/components/ui/button";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import type { TopicKey } from "@/lib/education-content";
import { useRecordAttempts, type Verdict } from "@/lib/learning";
import { buildIdentifyTargets } from "@/lib/teach.functions";
import { cn } from "@/lib/utils";

interface Target {
  label: string;
  topic: string;
  zone: Zone;
  explanation: string;
  imageIndex: number;
}

/**
 * Identify-It mode: the learner taps where a concept appears, and their tap is
 * compared with a tolerance zone rather than a single exact pixel.
 */
export function IdentifyIt({
  images,
}: {
  images: { dataUrl: string; timeframe: string | null }[];
}) {
  const run = useServerFn(buildIdentifyTargets);
  const record = useRecordAttempts();

  const [targets, setTargets] = useState<Target[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [point, setPoint] = useState<Point | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const start = async () => {
    setLoading(true);
    try {
      const result = (await run({ data: { images } })) as { targets: Target[] };
      setTargets(result.targets);
      setIndex(0);
      setPoint(null);
      setVerdict(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reference areas could not be marked.");
    } finally {
      setLoading(false);
    }
  };

  if (!targets) {
    return (
      <section className="card-soft p-4">
        <p className="flex items-center gap-2 font-display text-base font-semibold">
          <Crosshair className="size-4 text-primary" /> Identify-it practice
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          ChartPilot marks only what is genuinely visible on your chart, then asks you to point at each
          one. Your tap is compared to a tolerance zone, not a single pixel.
        </p>
        <Button className="mt-3 h-11 w-full rounded-xl" onClick={start} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Marking reference areas…" : "Start identify-it"}
        </Button>
      </section>
    );
  }

  const target = targets[index]!;
  const image = images[Math.min(target.imageIndex, images.length - 1)]!;

  const check = () => {
    if (!point) {
      toast.error("Tap the chart first.");
      return;
    }
    const result: Verdict = pointInZone(point, target.zone)
      ? "CORRECT"
      : pointInZone(point, target.zone, 0.12)
        ? "PARTIALLY CORRECT"
        : "INCORRECT";
    setVerdict(result);
    record.mutate([{ topic: (target.topic as TopicKey) ?? "market_structure", verdict: result, source: "identify" }]);
  };

  return (
    <section className="card-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-base font-semibold">
          <Crosshair className="size-4 text-primary" /> Identify-it practice
        </p>
        <span className="rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground">
          {index + 1} / {targets.length}
        </span>
      </div>

      <p className="mt-2 font-display text-sm font-semibold">
        Tap where you see: <span className="text-primary">{target.label}</span>
      </p>

      <div className="mt-3">
        <ChartCanvas
          src={image.dataUrl}
          point={point}
          zone={verdict ? target.zone : null}
          onPick={verdict ? undefined : setPoint}
          label={target.label}
        />
      </div>

      {!verdict ? (
        <Button className="mt-3 h-11 w-full rounded-xl" onClick={check}>
          Check my answer
        </Button>
      ) : (
        <div className="mt-3 space-y-2">
          <p
            className={cn(
              "rounded-xl px-3 py-2 font-display text-sm font-semibold",
              verdict === "CORRECT" && "bg-bull/12 text-bull",
              verdict === "PARTIALLY CORRECT" && "bg-warn/12 text-warn",
              verdict === "INCORRECT" && "bg-bear/12 text-bear",
            )}
          >
            {verdict}
          </p>
          <p className="panel p-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground/90">Why this area: </span>
            {target.explanation}
          </p>
          {index < targets.length - 1 ? (
            <Button
              className="h-11 w-full rounded-xl"
              onClick={() => {
                setIndex((i) => i + 1);
                setPoint(null);
                setVerdict(null);
              }}
            >
              Next concept
            </Button>
          ) : (
            <Button variant="secondary" className="h-11 w-full rounded-xl" onClick={() => setTargets(null)}>
              Finish practice
            </Button>
          )}
        </div>
      )}

      <UncertaintyNote compact className="mt-3" />
    </section>
  );
}
