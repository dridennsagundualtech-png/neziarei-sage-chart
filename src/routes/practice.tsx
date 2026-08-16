import { createFileRoute } from "@tanstack/react-router";
import { Crosshair, GraduationCap, HelpCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ChartUploader, toPendingImage, type PendingImage } from "@/components/ChartUploader";
import { IdentifyIt } from "@/components/IdentifyIt";
import { QuizRunner } from "@/components/QuizRunner";
import { TeachMeThisChart } from "@/components/TeachMeThisChart";
import { UncertaintyNote } from "@/components/UncertaintyNote";
import { Button } from "@/components/ui/button";
import { DEFAULT_SETTINGS, LOCAL_USER, useSettings } from "@/lib/data";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice — quiz, identify-it & guided chart reading | ChartPilot" },
      {
        name: "description",
        content:
          "Practise on your own screenshots: answer quiz questions before seeing the analysis, tap where concepts appear, or walk a chart step by step. Educational only — not financial advice.",
      },
      { property: "og:title", content: "Practice modes — ChartPilot" },
      {
        property: "og:description",
        content: "Quiz mode, Identify-it taps and guided chart walkthroughs on your own charts.",
      },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  return (
    <AppShell>
      <Practice />
    </AppShell>
  );
}

const MODES = [
  { key: "quiz" as const, label: "Quiz", icon: HelpCircle, hint: "Answer first, then see the reading and why you were right or wrong." },
  { key: "identify" as const, label: "Identify-it", icon: Crosshair, hint: "Tap where a concept appears on the chart." },
  { key: "teach" as const, label: "Guided", icon: GraduationCap, hint: "Ten steps through your chart, asking you before explaining." },
];

function Practice() {
  const settingsQuery = useSettings();
  const settings = settingsQuery.data ?? { user_id: LOCAL_USER, ...DEFAULT_SETTINGS };
  const [images, setImages] = useState<PendingImage[]>([]);
  const [mode, setMode] = useState<"quiz" | "identify" | "teach">("quiz");
  const [session, setSession] = useState(0);

  const addFiles = async (files: File[]) => {
    const room = 4 - images.length;
    if (room <= 0) {
      toast.error("Four screenshots is plenty for practice.");
      return;
    }
    const pending = await Promise.all(files.slice(0, room).map(toPendingImage));
    setImages((current) => [...current, ...pending]);
  };

  const payload = images.map((image) => ({ dataUrl: image.dataUrl, timeframe: image.timeframe }));

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="font-display text-xl font-semibold">Practice on real charts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a screenshot, then choose a mode. You always answer before ChartPilot shows its
          reading — the goal is your own independent judgement, not agreement with the AI.
        </p>
      </header>

      <ChartUploader
        images={images}
        timeframes={settings.preferred_timeframes}
        onAdd={addFiles}
        onRemove={(id) => setImages((current) => current.filter((image) => image.id !== id))}
        onMove={(id, direction) =>
          setImages((current) => {
            const index = current.findIndex((image) => image.id === id);
            const next = index + direction;
            if (index < 0 || next < 0 || next >= current.length) return current;
            const copy = [...current];
            const [item] = copy.splice(index, 1);
            copy.splice(next, 0, item!);
            return copy;
          })
        }
        onTimeframe={(id, timeframe) =>
          setImages((current) =>
            current.map((image) => (image.id === id ? { ...image, timeframe } : image)),
          )
        }
        compact={images.length > 0}
      />

      <div className="grid grid-cols-3 gap-2">
        {MODES.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.key}
              variant={mode === item.key ? "default" : "secondary"}
              className="h-11 rounded-xl"
              onClick={() => {
                setMode(item.key);
                setSession((n) => n + 1);
              }}
            >
              <Icon className="size-4" /> {item.label}
            </Button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">{MODES.find((m) => m.key === mode)?.hint}</p>

      {images.length === 0 ? (
        <p className="card-soft p-4 text-xs leading-relaxed text-muted-foreground">
          Add at least one chart screenshot above to start practising.
        </p>
      ) : (
        <>
          {mode === "quiz" && (
            <QuizRunner key={`quiz-${session}`} images={payload} beginner={settings.beginner_mode} />
          )}
          {mode === "identify" && <IdentifyIt key={`id-${session}`} images={payload} />}
          {mode === "teach" && (
            <TeachMeThisChart
              key={`teach-${session}`}
              images={payload}
              beginner={settings.beginner_mode}
            />
          )}
          <Button
            variant="secondary"
            className="h-11 w-full rounded-xl"
            onClick={() => setSession((n) => n + 1)}
          >
            <RotateCcw className="size-4" /> Restart this mode
          </Button>
        </>
      )}

      <UncertaintyNote />
    </div>
  );
}
