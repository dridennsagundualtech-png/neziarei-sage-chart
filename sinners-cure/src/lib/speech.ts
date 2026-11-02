/**
 * Read-aloud, fully offline.
 * - English in the Android app: a bundled neural voice (Bella or Alan, see NaturalVoicePlugin.java),
 *   unless Settings says "Phone's voice" or the voice files are missing.
 * - Tagalog, or the "Phone's voice" setting: the phone's own text-to-speech engine
 *   (Filipino voice for Tagalog). In a browser: speechSynthesis.
 */
import { useSyncExternalStore } from "react";
import { registerPlugin } from "@capacitor/core";
import { readLocal } from "./storage";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings, type VoiceId } from "./settings";
import { toast } from "./share";
import { isNative } from "./native";
import { LANG, t, type Lang } from "./lang";

interface NaturalVoice {
  available(): Promise<{ alan: boolean; bella: boolean }>;
  prepare(o: { voice: VoiceId }): Promise<void>;
  speak(o: { chunks: string[]; voice: VoiceId; speed: number }): Promise<{ completed: boolean }>;
  stop(): Promise<void>;
}
const NaturalVoice = registerPlugin<NaturalVoice>("NaturalVoice");

let current: string | null = null;
let token = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const settingsNow = (): Settings => ({
  ...DEFAULT_SETTINGS,
  ...readLocal<Partial<Settings>>(SETTINGS_KEY, {}),
});

/** Phone voice: sentences grouped up to ~220 characters. */
function chunks(text: string): string[] {
  const parts = text.replace(/\s+/g, " ").match(/[^.!?;:]+[.!?;:]*\s*/g) ?? [text];
  const out: string[] = [];
  let buf = "";
  for (const p of parts) {
    if ((buf + p).length > 220 && buf) {
      out.push(buf);
      buf = "";
    }
    buf += p;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/**
 * Neural voice: one sentence per chunk (long sentences split at ; : or commas) so the first
 * words start quickly and the next sentence is generated while the current one plays.
 * Lines without punctuation (litanies) get a comma so they are read as phrases.
 */
export function naturalChunks(text: string): string[] {
  const joined = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (/[.!?,;:…”"')]$/.test(l) ? l : `${l},`))
    .join(" ")
    .replace(/℣\.|℟\./g, "")
    .replace(/\s+/g, " ");
  const sentences = joined.match(/[^.!?]+[.!?]+["”')]*\s*|[^.!?]+$/g) ?? [joined];
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= 180) {
      if (s.trim()) out.push(s.trim());
      continue;
    }
    let buf = "";
    for (const part of s.match(/[^;:,]+[;:,]?\s*/g) ?? [s]) {
      if ((buf + part).length > 160 && buf) {
        out.push(buf.trim());
        buf = "";
      }
      buf += part;
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out;
}

/** The phone voice's 0.75 / 0.9 / 1.05 steps, as the neural voice's speed. */
const naturalSpeed = (rate: number) => (rate >= 1 ? 1 : rate >= 0.9 ? 0.92 : 0.82);

let available: Promise<{ alan: boolean; bella: boolean }> | null = null;
export function naturalVoices() {
  if (!isNative()) return Promise.resolve({ alan: false, bella: false });
  available ??= NaturalVoice.available().catch(() => ({ alan: false, bella: false }));
  return available;
}

/** Loads the chosen neural voice in the background (first use takes a few seconds). */
export function prepareVoice(voice: VoiceId) {
  if (!isNative() || voice === "phone") return;
  void naturalVoices().then((a) => {
    if (a[voice]) void NaturalVoice.prepare({ voice }).catch(() => undefined);
  });
}

export function speechSupported() {
  return typeof window !== "undefined" && (isNative() || "speechSynthesis" in window);
}

function done(my: number, onEnd?: () => void) {
  if (my !== token) return;
  current = null;
  emit();
  onEnd?.();
}

async function speakNatural(my: number, text: string, s: Settings, onEnd?: () => void) {
  try {
    const r = await NaturalVoice.speak({
      chunks: naturalChunks(text),
      voice: s.voice,
      speed: naturalSpeed(s.voiceRate),
    });
    if (r.completed) done(my, onEnd);
  } catch {
    if (my !== token) return;
    // Fall back to the phone's own voice.
    await speakPhone(my, text, "en", s.voiceRate, onEnd);
  }
}

let filipinoChecked = false;
/** Android app: the phone's own text-to-speech engine (works offline with an installed voice). */
async function speakPhone(my: number, text: string, lang: Lang, rate: number, onEnd?: () => void) {
  const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
  const code = lang === "tl" ? "fil-PH" : "en-US";
  if (lang === "tl" && !filipinoChecked) {
    filipinoChecked = true;
    const ok = await TextToSpeech.isLanguageSupported({ lang: code }).catch(() => ({
      supported: false,
    }));
    if (!ok.supported)
      toast(
        t(
          "Install the Filipino voice in your phone's text-to-speech settings",
          "I-install ang Filipino na boses sa text-to-speech ng iyong telepono",
        ),
      );
  }
  try {
    for (const chunk of chunks(text)) {
      if (my !== token) return;
      await TextToSpeech.speak({ text: chunk, lang: code, rate, category: "playback" });
    }
  } catch {
    if (my === token)
      toast(
        t(
          "Install a text-to-speech voice in your phone's settings to listen",
          "Mag-install ng text-to-speech na boses sa settings ng iyong telepono upang makinig",
        ),
      );
  }
  done(my, onEnd);
}

/**
 * Reads `text` aloud. `lang` is the language of the text (default: the app language);
 * scripture is always "en". Calling speak again or stopSpeaking() cancels the previous one.
 */
export function speak(id: string, text: string, onEnd?: () => void, lang: Lang = LANG) {
  const s = settingsNow();
  if (isNative()) {
    const my = ++token;
    current = id;
    emit();
    void (async () => {
      const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
      await Promise.all([
        TextToSpeech.stop().catch(() => undefined),
        NaturalVoice.stop().catch(() => undefined),
      ]);
      if (my !== token) return;
      const voices = await naturalVoices();
      if (lang === "en" && s.voice !== "phone" && voices[s.voice])
        await speakNatural(my, text, s, onEnd);
      else await speakPhone(my, text, lang, s.voiceRate, onEnd);
    })();
    return;
  }
  if (!speechSupported()) {
    toast(
      t(
        "Listening isn't available on this device",
        "Hindi available ang pakikinig sa device na ito",
      ),
    );
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const my = ++token;
  current = id;
  emit();
  const prefix = lang === "tl" ? "fil" : "en";
  const all = synth.getVoices();
  const voice =
    all.find((v) => v.lang.toLowerCase().startsWith(prefix) && v.localService) ??
    all.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    (lang === "tl" ? all.find((v) => v.lang.toLowerCase().startsWith("tl")) : undefined);
  const list = chunks(text);
  list.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c);
    u.rate = s.voiceRate;
    u.lang = lang === "tl" ? "fil-PH" : "en-US";
    if (voice) u.voice = voice;
    if (i === list.length - 1) u.onend = () => done(my, onEnd);
    synth.speak(u);
  });
}

export function stopSpeaking() {
  token++;
  current = null;
  if (isNative()) {
    void NaturalVoice.stop().catch(() => undefined);
    void import("@capacitor-community/text-to-speech")
      .then(({ TextToSpeech }) => TextToSpeech.stop())
      .catch(() => undefined);
  } else if (speechSupported()) window.speechSynthesis.cancel();
  emit();
}

/** Opens the phone's screen for installing text-to-speech voices (e.g. Filipino). */
export function openVoiceInstall() {
  if (!isNative()) return;
  void import("@capacitor-community/text-to-speech")
    .then(({ TextToSpeech }) => TextToSpeech.openInstall())
    .catch(() => undefined);
}

export function useSpeaking() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => null,
  );
}
