/**
 * Read-aloud using the phone's built-in voice (speechSynthesis). No internet needed
 * when the device has an offline voice installed.
 */
import { useSyncExternalStore } from "react";
import { readLocal } from "./storage";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from "./settings";
import { toast } from "./share";
import { isNative } from "./native";

let current: string | null = null;
let token = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

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

export function speechSupported() {
  return typeof window !== "undefined" && (isNative() || "speechSynthesis" in window);
}

/** Android app: the phone's own text-to-speech engine (works offline with an installed voice). */
async function speakNative(my: number, list: string[], rate: number, onEnd?: () => void) {
  const { TextToSpeech } = await import("@capacitor-community/text-to-speech");
  try {
    for (const chunk of list) {
      if (my !== token) return;
      await TextToSpeech.speak({ text: chunk, lang: "en-US", rate, category: "playback" });
    }
  } catch {
    if (my === token) toast("Install a text-to-speech voice in your phone's settings to listen");
  }
  if (my !== token) return;
  current = null;
  emit();
  onEnd?.();
}

export function speak(id: string, text: string, onEnd?: () => void) {
  if (isNative()) {
    const my = ++token;
    current = id;
    emit();
    const { voiceRate } = {
      ...DEFAULT_SETTINGS,
      ...readLocal<Partial<Settings>>(SETTINGS_KEY, {}),
    };
    void import("@capacitor-community/text-to-speech")
      .then(({ TextToSpeech }) => TextToSpeech.stop().catch(() => undefined))
      .then(() => speakNative(my, chunks(text), voiceRate, onEnd));
    return;
  }
  if (!speechSupported()) {
    toast("Listening isn't available on this device");
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const my = ++token;
  current = id;
  emit();
  const { voiceRate } = { ...DEFAULT_SETTINGS, ...readLocal<Partial<Settings>>(SETTINGS_KEY, {}) };
  const voice =
    synth.getVoices().find((v) => v.lang.startsWith("en") && v.localService) ??
    synth.getVoices().find((v) => v.lang.startsWith("en"));
  const list = chunks(text);
  list.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c);
    u.rate = voiceRate;
    if (voice) u.voice = voice;
    if (i === list.length - 1) {
      u.onend = () => {
        if (my !== token) return;
        current = null;
        emit();
        onEnd?.();
      };
    }
    synth.speak(u);
  });
}

export function stopSpeaking() {
  token++;
  current = null;
  if (isNative())
    void import("@capacitor-community/text-to-speech")
      .then(({ TextToSpeech }) => TextToSpeech.stop())
      .catch(() => undefined);
  else if (speechSupported()) window.speechSynthesis.cancel();
  emit();
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
