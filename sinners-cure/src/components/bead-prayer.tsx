import { ChevronLeft, Pause, RotateCcw, Share2, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BeadRing } from "./bead-ring";
import { Btn, IconBtn, PrayerText } from "./app-ui";
import { beadAt, decadeHailMaryRun, type Step } from "@/lib/steps";
import { markPath, type PathItem } from "@/lib/streak";
import { useLocal } from "@/lib/storage";
import { prefetchSpeech, speak, stopSpeaking } from "@/lib/speech";
import { shareText } from "@/lib/share";
import { tick } from "@/lib/native";
import { refLabel, usePassage, verseKey } from "@/data/bible";
import { TL, t } from "@/lib/lang";

const ORDINAL = t(
  ["", "First", "Second", "Third", "Fourth", "Fifth"],
  ["", "Unang", "Ikalawang", "Ikatlong", "Ikaapat na", "Ikalimang"],
);
const FRUIT = t("Fruit of the mystery", "Bunga ng misteryo");

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

/** What the guided audio reads for a step (rubrics in parentheses and ℣/℟ marks left out). */
const spoken = (s: Step) =>
  `${s.title}. ${s.fruit ? `${FRUIT}: ${s.fruit}. ` : ""}${s.text.replace(/^[VR]\. /gm, "").replace(/\([^)]*\)/g, "")}`;

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
    speak(`step-${index}`, spoken(s), () => {
      timer = setTimeout(() => onIndexRef.current(index + 1), 500);
    });
    // Prepare the next prayer while this one plays, so there is no wait between them.
    const next = steps[index + 1];
    if (next) prefetchSpeech(spoken(next));
    return () => clearTimeout(timer);
  }, [audio, index, finished, steps]);

  useEffect(() => () => stopSpeaking(), []);

  if (finished) {
    return (
      <div className="pt-2 text-center">
        <BeadRing current={60} className="mx-auto w-44" />
        <h2 className="mt-5 font-serif text-[1.9rem] font-semibold">{doneLabel}</h2>
        <p className="mt-2 text-muted-foreground">
          {t(
            "Thanks be to God. It's ticked on today's plan.",
            "Salamat sa Diyos. Naitala na ito sa plano mo ngayon.",
          )}
        </p>
        <p className="scripture mx-auto mt-5 max-w-sm italic">
          {t(
            "“Whatsoever you shall ask the Father in my name, that will I do.”",
            "“Anumang hingin ninyo sa Ama sa Aking pangalan, iyon ay gagawin Ko.”",
          )}
        </p>
        <p className="mt-1 text-[0.95rem] text-muted-foreground">{t("John 14:13", "Juan 14:13")}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Btn variant="outline" onClick={() => onIndex(steps.length - 1)}>
            <ChevronLeft className="size-5" aria-hidden /> {t("Back", "Bumalik")}
          </Btn>
          <Btn variant="outline" onClick={() => shareText(shareMessage)}>
            <Share2 className="size-5" aria-hidden /> {t("Share", "Ibahagi")}
          </Btn>
          <Btn onClick={() => onIndex(0)}>
            <RotateCcw className="size-5" aria-hidden /> {t("Pray again", "Magdasal muli")}
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
  const hail = /(\d+) (?:of|sa) (10|3)$/.exec(step.subtitle ?? "");

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={next}
          className="mx-auto block w-full max-w-[10.5rem]"
          aria-label={t("Next prayer", "Susunod na dasal")}
        >
          <BeadRing current={beadAt(steps, index)} className="w-full" />
        </button>
        <IconBtn
          label={
            audio
              ? t("Turn guided audio off", "Patayin ang gabay na boses")
              : t(
                  "Guided audio: read each prayer aloud",
                  "Gabay na boses: basahin nang malakas ang bawat dasal",
                )
          }
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
            <p className="rubric">
              {TL ? step.subtitle : step.subtitle?.replace(/^(\w+) /, `The $1 `)}
            </p>
            <h2 className="mt-1 font-serif text-[2rem] font-semibold leading-tight">
              {step.title}
            </h2>
            {step.fruit && (
              <p className="mt-2 text-muted-foreground">
                {FRUIT}: <span className="font-semibold text-foreground">{step.fruit}</span>
              </p>
            )}
            <MysteryQuote step={step} />
            <PrayerText text={step.text} />
            <p className="mt-4 text-[0.95rem] text-muted-foreground">
              {t("Read more", "Basahin pa")}: {step.scripture}
            </p>
          </>
        ) : (
          <>
            {step.subtitle && (
              <p className="rubric">
                {hail ? step.subtitle.replace(/ · \d+ (?:of|sa) (10|3)$/, "") : step.subtitle}
              </p>
            )}
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-[1.75rem] font-semibold leading-tight">
                {step.title}
              </h2>
              {hail && (
                <span
                  className="shrink-0 font-serif text-[1.4rem] text-muted-foreground"
                  aria-label={t(`${hail[1]} of ${hail[2]}`, `${hail[1]} sa ${hail[2]}`)}
                >
                  {hail[1]}/{hail[2]}
                </span>
              )}
            </div>
            <PrayerText text={step.text} className="mt-4" />
          </>
        )}
        <p className="mt-6 text-center text-[0.9rem] text-muted-foreground">
          {t(`Step ${index + 1} of ${steps.length}`, `Hakbang ${index + 1} sa ${steps.length}`)}
          {step.mystery
            ? t(` · ${ORDINAL[step.mystery]} decade`, ` · ${ORDINAL[step.mystery]} misteryo`)
            : ""}
        </p>
      </div>

      <div className="sticky bottom-[calc(4rem+max(env(safe-area-inset-bottom),var(--safe-area-inset-bottom,0px)))] z-10 -mx-4 mt-4 border-t bg-background/95 px-4 pb-3 pt-3 backdrop-blur-sm">
        {ten && tenConfirm && (
          <div
            className="mb-3 rounded-xl bg-secondary p-4"
            role="alertdialog"
            aria-label={t("Count ten Hail Marys", "Bilangin ang sampung Aba Ginoong Maria")}
          >
            <p className="font-semibold">
              {t(
                "Count the rest of this decade as prayed?",
                "Ituring nang nadasal ang natitira sa misteryong ito?",
              )}
            </p>
            <p className="mt-1 text-[0.95rem] text-muted-foreground">
              {t(
                "Use this when you pray the Hail Marys aloud or on your own beads, then carry on here.",
                "Gamitin ito kapag dinasal mo nang malakas o sa sarili mong rosaryo ang mga Aba Ginoong Maria, at saka magpatuloy rito.",
              )}
            </p>
            <div className="mt-3 flex gap-3">
              <Btn variant="outline" className="flex-1" onClick={() => setTenConfirm(false)}>
                {t("Not now", "Huwag muna")}
              </Btn>
              <Btn
                className="flex-1"
                onClick={() => {
                  setTenConfirm(false);
                  go(ten.to);
                }}
              >
                {t("Count them", "Bilangin")}
              </Btn>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Btn
            variant="outline"
            onClick={back}
            disabled={index === 0}
            aria-label={t("Back", "Bumalik")}
            className="px-4"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Btn>
          {ten && !tenConfirm && (
            <Btn variant="quiet" onClick={() => setTenConfirm(true)} className="px-4">
              {t("Skip to Glory Be", "Lumaktaw sa Luwalhati")}
            </Btn>
          )}
          <Btn className="flex-1" onClick={next}>
            {index === steps.length - 1 ? t("Finish", "Tapusin") : t("Next", "Susunod")}
          </Btn>
        </div>
      </div>
    </div>
  );
}
