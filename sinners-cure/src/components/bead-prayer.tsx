import { ChevronLeft, Pause, RotateCcw, Share2, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BeadRing } from "./bead-ring";
import { Btn, IconBtn, PrayerText } from "./app-ui";
import { beadAt, decadeHailMaryRun, type Step } from "@/lib/steps";
import { markPath, type PathItem } from "@/lib/streak";
import { useLocal } from "@/lib/storage";
import { speak, stopSpeaking } from "@/lib/speech";
import { shareText } from "@/lib/share";
import { tick } from "@/lib/native";
import { refLabel, usePassage, verseKey } from "@/data/bible";

const ORDINAL = ["", "First", "Second", "Third", "Fourth", "Fifth"];

function MysteryQuote({ step }: { step: Step }) {
  const verses = usePassage(step.quote ? [step.quote] : undefined);
  if (!step.quote) return null;
  const [book, ch, v] = step.quote;
  return (
    <figure className="my-5 border-l-2 border-primary pl-4">
      <blockquote className="scripture italic">
        {verses?.map((x) => x.text).join(" ") ?? " "}
      </blockquote>
      <figcaption className="mt-1 text-[0.95rem] text-muted-foreground">
        {refLabel(verseKey(book, ch, v))}
      </figcaption>
    </figure>
  );
}

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
  const textRef = useRef<HTMLDivElement>(null);
  useEffect(() => setTenConfirm(false), [index]);
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
    speak(
      `step-${index}`,
      `${s.title}. ${s.fruit ? `Fruit of the mystery: ${s.fruit}. ` : ""}${s.text.replace(/^[VR]\. /gm, "").replace(/\([^)]*\)/g, "")}`,
      () => {
        timer = setTimeout(() => onIndexRef.current(index + 1), 900);
      },
    );
    return () => clearTimeout(timer);
  }, [audio, index, finished, steps]);

  useEffect(() => () => stopSpeaking(), []);

  if (finished) {
    return (
      <div className="pt-2 text-center">
        <BeadRing current={60} className="mx-auto w-44" />
        <h2 className="mt-5 font-serif text-[1.9rem] font-semibold">{doneLabel}</h2>
        <p className="mt-2 text-muted-foreground">Thanks be to God. It's ticked on today's plan.</p>
        <p className="scripture mx-auto mt-5 max-w-sm italic">
          “Whatsoever you shall ask the Father in my name, that will I do.”
        </p>
        <p className="mt-1 text-[0.95rem] text-muted-foreground">John 14:13</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Btn variant="outline" onClick={() => onIndex(steps.length - 1)}>
            <ChevronLeft className="size-5" aria-hidden /> Back
          </Btn>
          <Btn variant="outline" onClick={() => shareText(shareMessage)}>
            <Share2 className="size-5" aria-hidden /> Share
          </Btn>
          <Btn onClick={() => onIndex(0)}>
            <RotateCcw className="size-5" aria-hidden /> Pray again
          </Btn>
        </div>
      </div>
    );
  }

  const step = steps[index]!;
  const go = (i: number) => {
    stopSpeaking();
    tick();
    onIndex(i);
    textRef.current?.scrollIntoView({ block: "nearest" });
  };
  const next = () => go(index + 1);
  const back = () => go(Math.max(0, index - 1));
  const pct = Math.round((index / steps.length) * 100);
  const hail = /(\d+) of (10|3)$/.exec(step.subtitle ?? "");

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={next}
          className="mx-auto block w-full max-w-[10.5rem]"
          aria-label="Next prayer"
        >
          <BeadRing current={beadAt(steps, index)} className="w-full" />
        </button>
        <IconBtn
          label={audio ? "Turn guided audio off" : "Guided audio: read each prayer aloud"}
          onClick={() => {
            if (audio) stopSpeaking();
            setAudio(!audio);
          }}
          aria-pressed={audio}
          className={`absolute right-0 top-0 ${audio ? "bg-primary text-primary-foreground hover:bg-primary" : "bg-secondary"}`}
        >
          {audio ? (
            <Pause className="size-5" aria-hidden />
          ) : (
            <Volume2 className="size-5" aria-hidden />
          )}
        </IconBtn>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-secondary" aria-hidden>
        <div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>

      <div ref={textRef} className="scroll-mt-4 pt-5" aria-live="polite">
        {step.mystery ? (
          <>
            <p className="rubric">{step.subtitle?.replace(/^(\w+) /, `The $1 `)}</p>
            <h2 className="mt-1 font-serif text-[2rem] font-semibold leading-tight">
              {step.title}
            </h2>
            {step.fruit && (
              <p className="mt-2 text-muted-foreground">
                Fruit of the mystery:{" "}
                <span className="font-semibold text-foreground">{step.fruit}</span>
              </p>
            )}
            <MysteryQuote step={step} />
            <PrayerText text={step.text} />
            <p className="mt-4 text-[0.95rem] text-muted-foreground">Read more: {step.scripture}</p>
          </>
        ) : (
          <>
            {step.subtitle && (
              <p className="rubric">
                {hail ? step.subtitle.replace(/ · \d+ of (10|3)$/, "") : step.subtitle}
              </p>
            )}
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-[1.75rem] font-semibold leading-tight">
                {step.title}
              </h2>
              {hail && (
                <span
                  className="shrink-0 font-serif text-[1.4rem] text-muted-foreground"
                  aria-label={`${hail[1]} of ${hail[2]}`}
                >
                  {hail[1]}/{hail[2]}
                </span>
              )}
            </div>
            <PrayerText text={step.text} className="mt-4" />
          </>
        )}
        <p className="mt-6 text-center text-[0.9rem] text-muted-foreground">
          Step {index + 1} of {steps.length}
          {step.mystery ? ` · ${ORDINAL[step.mystery]} decade` : ""}
        </p>
      </div>

      <div className="sticky bottom-[calc(4rem+max(env(safe-area-inset-bottom),var(--safe-area-inset-bottom,0px)))] z-10 -mx-4 mt-4 border-t bg-background/95 px-4 pb-3 pt-3 backdrop-blur-sm">
        {ten && tenConfirm && (
          <div
            className="mb-3 rounded-xl bg-secondary p-4"
            role="alertdialog"
            aria-label="Count ten Hail Marys"
          >
            <p className="font-semibold">Count the rest of this decade as prayed?</p>
            <p className="mt-1 text-[0.95rem] text-muted-foreground">
              Use this when you pray the Hail Marys aloud or on your own beads, then carry on here.
            </p>
            <div className="mt-3 flex gap-3">
              <Btn variant="outline" className="flex-1" onClick={() => setTenConfirm(false)}>
                Not now
              </Btn>
              <Btn
                className="flex-1"
                onClick={() => {
                  setTenConfirm(false);
                  go(ten.to);
                }}
              >
                Count them
              </Btn>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Btn
            variant="outline"
            onClick={back}
            disabled={index === 0}
            aria-label="Back"
            className="px-4"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Btn>
          {ten && !tenConfirm && (
            <Btn variant="quiet" onClick={() => setTenConfirm(true)} className="px-4">
              Skip to Glory Be
            </Btn>
          )}
          <Btn className="flex-1" onClick={next}>
            {index === steps.length - 1 ? "Finish" : "Next"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
