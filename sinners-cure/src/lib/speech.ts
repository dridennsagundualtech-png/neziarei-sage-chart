/**
 * Read-aloud, fully offline.
 * - English in the Android app: a bundled neural voice (Grace, Gabriel or Alan; see
 *   NaturalVoicePlugin.java), unless Settings says "Phone's voice" or the voice files are missing.
 * - Tagalog, or the "Phone's voice" setting: the phone's own text-to-speech engine
 *   (Filipino voice for Tagalog). In a browser: speechSynthesis.
 * Every reading is split into chunks that keep their place in the text, so screens can light up
 * the word being read and jump on tap (read-along.ts).
 */
import { useSyncExternalStore } from "react";
import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { readLocal, useLocal, writeLocal } from "./storage";
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  normalizeVoice,
  type NeuralVoice,
  type Settings,
  type VoiceId,
} from "./settings";
import { toast } from "./share";
import { isNative } from "./native";
import { LANG, t, type Lang } from "./lang";
import { chunkText, chunksFrom, offsetAt, setReadPos, setSeeker, type Chunk } from "./read-along";

type Available = Record<NeuralVoice, boolean>;
const NONE: Available = { grace: false, gabriel: false, alan: false };

interface NaturalVoice {
  available(): Promise<Available>;
  prepare(o: { voice: NeuralVoice }): Promise<void>;
  speak(o: { chunks: string[]; voice: NeuralVoice; speed: number; tag: string }): Promise<{
    completed: boolean;
    rtf?: number;
    underruns?: number;
    startMs?: number;
  }>;
  prefetch(o: { chunks: string[]; voice: NeuralVoice; speed: number }): Promise<void>;
  stop(): Promise<void>;
  addListener(
    e: "progress",
    cb: (d: { tag: string; chunk: number; pos: number; dur: number }) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    e: "loading",
    cb: (d: { tag: string; done: number }) => void,
  ): Promise<PluginListenerHandle>;
}

/** While a neural voice prepares a reading before speaking: its id and share prepared (0-1). */
let loading: { id: string; done: number } | null = null;
const loadingListeners = new Set<() => void>();
function setLoading(l: typeof loading) {
  loading = l;
  loadingListeners.forEach((f) => f());
}
/** "Loading voice…" state for reading `id`: share prepared (0-1), or null when not loading. */
export function useVoiceLoading(id?: string): number | null {
  return useSyncExternalStore(
    (cb) => {
      loadingListeners.add(cb);
      return () => loadingListeners.delete(cb);
    },
    () =>
      loading && (id === undefined || loading.id === id)
        ? Math.round(loading.done * 100) / 100
        : null,
    () => null,
  );
}

/**
 * Measured speed of each neural voice on this phone: seconds of work per second of speech
 * (below 1 keeps up; the plugin buffers ahead so it plays without pauses).
 */
export type VoiceSpeed = Partial<Record<NeuralVoice, number>>;
const SPEED_KEY = "sc.voiceSpeed";
export const useVoiceSpeed = () => useLocal<VoiceSpeed>(SPEED_KEY, {});
const NaturalVoice = registerPlugin<NaturalVoice>("NaturalVoice");

let current: string | null = null;
let token = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** The reading now playing, kept so a tap can restart it from another word. */
let playing: {
  id: string;
  text: string;
  chunks: Chunk[];
  onEnd: (() => void) | undefined;
  lang: Lang;
} | null = null;

const settingsNow = (): Settings => {
  const s = { ...DEFAULT_SETTINGS, ...readLocal<Partial<Settings>>(SETTINGS_KEY, {}) };
  return { ...s, voice: normalizeVoice(s.voice) };
};

/** Neural voice: one sentence per chunk (see chunkText); phone voice: grouped to ~220. */
const neuralChunks = (text: string) => chunkText(text, 180);
const phoneChunks = (text: string) => chunkText(text, 220, 220);

/** The chunks the neural voice would say for `text` (exported for tests). */
export const naturalChunks = (text: string) => neuralChunks(text).map((c) => c.say);

// Read-along position from the neural voice.
if (typeof window !== "undefined" && isNative()) {
  void NaturalVoice.addListener("loading", (d) => {
    if (!playing || d.tag !== String(token)) return;
    setLoading({ id: playing.id, done: Math.min(0.99, d.done) });
  }).catch(() => undefined);
  void NaturalVoice.addListener("progress", (d) => {
    if (!playing || d.tag !== String(token)) return;
    if (loading) setLoading(null);
    const c = playing.chunks[d.chunk];
    if (!c) return;
    setReadPos({
      id: playing.id,
      start: c.start,
      end: c.end,
      at: offsetAt(playing.text, c, d.pos, d.dur),
    });
  }).catch(() => undefined);
}

/** The phone voice's 0.75 / 0.9 / 1.05 steps, as the neural voice's speed. */
const naturalSpeed = (rate: number) => (rate >= 1 ? 1 : rate >= 0.9 ? 0.92 : 0.82);

let available: Promise<Available> | null = null;
export function naturalVoices(): Promise<Available> {
  if (!isNative()) return Promise.resolve(NONE);
  available ??= NaturalVoice.available()
    .then((a) => ({ ...NONE, ...a }))
    .catch(() => NONE);
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
  playing = null;
  setReadPos(null);
  setLoading(null);
  emit();
  onEnd?.();
}

async function speakNatural(
  my: number,
  text: string,
  chunks: Chunk[],
  voice: NeuralVoice,
  s: Settings,
  onEnd?: () => void,
) {
  try {
    const r = await NaturalVoice.speak({
      chunks: chunks.map((c) => c.say),
      voice,
      speed: naturalSpeed(s.voiceRate),
      tag: String(my),
    });
    if (r.rtf && r.rtf > 0) {
      const prev = readLocal<VoiceSpeed>(SPEED_KEY, {});
      const old = prev[voice];
      // Smooth over runs so one busy moment doesn't swing the reading.
      writeLocal(SPEED_KEY, { ...prev, [voice]: old ? old * 0.5 + r.rtf * 0.5 : r.rtf });
    }
    if (r.completed) done(my, onEnd);
  } catch {
    if (my !== token) return;
    // Fall back to the phone's own voice.
    await speakPhone(my, text, "en", s.voiceRate, onEnd);
  }
}

/**
 * Prepares audio ahead (e.g. the next prayer of the Rosary) so it starts at once when its turn
 * comes. English neural voices only; otherwise does nothing.
 */
export function prefetchSpeech(text: string, lang: Lang = LANG) {
  if (!isNative() || lang !== "en") return;
  const s = settingsNow();
  const voice = s.voice;
  if (voice === "phone") return;
  void naturalVoices().then((a) => {
    if (!a[voice]) return;
    void NaturalVoice.prefetch({
      chunks: naturalChunks(text),
      voice,
      speed: naturalSpeed(s.voiceRate),
    }).catch(() => undefined);
  });
}

let filipinoChecked = false;
/** Android app: the phone's own text-to-speech engine (works offline with an installed voice). */
async function speakPhone(
  my: number,
  text: string,
  lang: Lang,
  rate: number,
  onEnd?: () => void,
  from = 0,
) {
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
    const list = chunksFrom(text, phoneChunks(text), from);
    if (playing && my === token) playing.chunks = list;
    for (const c of list) {
      if (my !== token) return;
      // The phone voice only says when a chunk starts: light up the whole sentence.
      if (playing) setReadPos({ id: playing.id, start: c.start, end: c.end, at: -1 });
      await TextToSpeech.speak({ text: c.say, lang: code, rate, category: "playback" });
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
 * scripture is always "en". `from` starts at that character (tap-to-jump). Calling speak
 * again or stopSpeaking() cancels the previous one.
 */
export function speak(id: string, text: string, onEnd?: () => void, lang: Lang = LANG, from = 0) {
  const s = settingsNow();
  setReadPos(null);
  if (isNative()) {
    const my = ++token;
    current = id;
    playing = { id, text, chunks: [], onEnd, lang };
    emit();
    void (async () => {
      const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
      await Promise.all([
        TextToSpeech.stop().catch(() => undefined),
        NaturalVoice.stop().catch(() => undefined),
      ]);
      if (my !== token) return;
      const voices = await naturalVoices();
      const voice = s.voice;
      if (lang === "en" && voice !== "phone" && voices[voice]) {
        const chunks = chunksFrom(text, neuralChunks(text), from);
        if (playing) playing.chunks = chunks;
        setLoading({ id, done: 0 });
        await speakNatural(my, text, chunks, voice, s, onEnd);
      } else await speakPhone(my, text, lang, s.voiceRate, onEnd, from);
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
  const list = chunksFrom(text, phoneChunks(text), from);
  playing = { id, text, chunks: list, onEnd, lang };
  emit();
  const prefix = lang === "tl" ? "fil" : "en";
  const all = synth.getVoices();
  const voice =
    all.find((v) => v.lang.toLowerCase().startsWith(prefix) && v.localService) ??
    all.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    (lang === "tl" ? all.find((v) => v.lang.toLowerCase().startsWith("tl")) : undefined);
  list.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c.say);
    u.rate = s.voiceRate;
    u.lang = lang === "tl" ? "fil-PH" : "en-US";
    if (voice) u.voice = voice;
    u.onstart = () => {
      if (my === token) setReadPos({ id, start: c.start, end: c.end, at: -1 });
    };
    if (i === list.length - 1) u.onend = () => done(my, onEnd);
    synth.speak(u);
  });
}

// Tap-to-jump: restart the reading that is playing from another word.
setSeeker((id, offset) => {
  if (!playing || playing.id !== id) return false;
  const { text, onEnd, lang } = playing;
  speak(id, text, onEnd, lang, offset);
  return true;
});

export function stopSpeaking() {
  token++;
  current = null;
  playing = null;
  setReadPos(null);
  setLoading(null);
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
