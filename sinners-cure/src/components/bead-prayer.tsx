import { ChevronLeft, Pause, RotateCcw, Share2, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BeadRing } from "./bead-ring";
import { Btn, PrayerText } from "./app-ui";
import { beadAt, decadeHailMaryRun, type Step } from "@/lib/steps";
import { markPath, type PathItem } from "@/lib/streak";
import { useLocal } from "@/lib/storage";
import { speak, stopSpeaking } from "@/lib/speech";
import { shareText } from "@/lib/share";

/** One-step-at-a-time bead prayer. Parent owns `index` (persisted). */
export function BeadPrayer({
  steps,
  index,
  onIndex,
  doneLabel,
  pathItem,
  shareMessage,
}: {
  steps: Step[];
  index: number;
  onIndex: (i: number) => void;
  doneLabel: string;
  pathItem: PathItem;
  shareMessage: string;
}) {
  const finished = index >= steps.length;
  const [audio, setAudio] = useLocal<boolean>("sc.audioGuide", false);
  const onIndexRef = useRef(onIndex);
  onIndexRef.current = onIndex;
  const [tenConfirm, setTenConfirm] = useState(false);
  const prevIndexRef = useRef(index);
  useEffect(() => {
    if (prevIndexRef.current !== index) {
      prevIndexRef.current = index;
      setTenConfirm(false);
    }
  }, [index]);
  const ten = finished ? null : decadeHailMaryRun(steps, index);

  useEffect(() => {
    if (finished) markPath(pathItem);
  }, [finished, pathItem]);

  // Guided audio: read the step aloud, then move on by itself.
  useEffect(() => {
    if (!audio || finished) return;
    const s = steps[index];
    if (!s) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    speak(`step-${index}`, `${s.title}. ${s.fruit ? `Fruit of the mystery: ${s.fruit}. ` : ""}${s.text.replace(/^[VR]\. /gm, "")}`, () => {
      timer = setTimeout(() => onIndexRef.current(index + 1), 900);
    });
    return () => clearTimeout(timer);
  }, [audio, index, finished, steps]);

  useEffect(() => () => stopSpeaking(), []);

  const toggleAudio = () => {
    if (audio) stopSpeaking();
    setAudio(!audio);
  };

  if (finished) {
    return (
      <div className="card-surface p-6 text-center">
        <BeadRing current={60} className="mx-auto w-40" />
        <h2 className="mt-4 font-serif text-2xl font-semibold">{doneLabel}</h2>
        <p className="mt-2 text-muted-foreground">Thanks be to God. This prayer is counted on today's path.</p>
        <p className="scripture mt-4 italic">“Whatever you ask in my name, I will do it.” — John 14:13</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Btn variant="outline" onClick={() => onIndex(steps.length - 1)}>
            <ChevronLeft className="size-5" /> Back
          </Btn>
          <Btn variant="outline" onClick={() => shareText(shareMessage)}>
            <Share2 className="size-5" /> Share
          </Btn>
          <Btn onClick={() => onIndex(0)}>
            <RotateCcw className="size-5" /> Start over
          </Btn>
        </div>
      </div>
    );
  }

  const step = steps[index]!;
  const next = () => {
    stopSpeaking();
    onIndex(index + 1);
  };
  const back = () => {
    stopSpeaking();
    onIndex(Math.max(0, index - 1));
  };
  const pct = Math.round((index / steps.length) * 100);

  return (
    <div>
      <div className="flex items-center gap-4">
        <BeadRing current={beadAt(steps, index)} className="w-32 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="eyebrow">
            Step {index + 1} of {steps.length} · {pct}%
          </p>
          {step.subtitle && <p className="mt-1 text-muted-foreground">{step.subtitle}</p>}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <button
            onClick={toggleAudio}
            aria-pressed={audio}
            className={`mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-semibold ${audio ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}
          >
            {audio ? <Pause className="size-5" /> : <Volume2 className="size-5" />}
            {audio ? "Guided audio on" : "Guided audio"}
          </button>
        </div>
      </div>

      <button type="button" onClick={next} className="card-surface mt-4 block w-full p-5 text-left">
        <h2 className="font-serif text-[1.65rem] font-semibold leading-tight text-primary">{step.title}</h2>
        {(step.scripture || step.fruit) && (
          <div className="mt-2 space-y-0.5 text-muted-foreground">
            {step.scripture && <p>Scripture: {step.scripture}</p>}
            {step.fruit && <p>Fruit of the mystery: {step.fruit}</p>}
          </div>
        )}
        <div className="mt-4">
          <PrayerText text={step.text} />
        </div>
        <p className="mt-5 text-center text-sm text-muted-foreground">{audio ? "Listening… tap to skip ahead" : "Tap anywhere here to continue"}</p>
      </button>

      <div className="sticky bottom-20 mt-4 space-y-3 bg-background pb-1 pt-2">
        {ten && tenConfirm && (
          <div className="card-surface p-5" role="alertdialog" aria-label="Count ten Hail Marys">
            <p className="font-serif text-xl font-semibold">One tap, ten Hail Marys</p>
            <p className="mt-2 text-muted-foreground">
              This tap stands for the <strong>10 Hail Marys</strong> of this decade. Keep the mystery in your heart and say them together in your spirit, then carry on.
            </p>
            <div className="mt-4 flex gap-3">
              <Btn variant="outline" className="flex-1" onClick={() => setTenConfirm(false)}>
                Never mind
              </Btn>
              <Btn className="flex-1" onClick={() => { setTenConfirm(false); onIndex(ten.to); }}>
                Count all 10
              </Btn>
            </div>
          </div>
        )}
        {ten && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setTenConfirm(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-card px-4 font-semibold text-primary"
            >
              <Sparkles className="size-5" /> Pray all 10 Hail Marys at once
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <Btn variant="outline" onClick={back} disabled={index === 0} aria-label="Back">
            <ChevronLeft className="size-5" /> Back
          </Btn>
          <Btn className="flex-1" onClick={next}>
            {index === steps.length - 1 ? "Finish" : "Next"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
