import type { Tone } from "@/lib/breakthrough/scene";

/** Chart colours for each tone, as CSS variables so light and dark themes both work. */
export const TONE: Record<Tone, string> = {
  bull: "var(--color-bull)",
  bear: "var(--color-bear)",
  warn: "var(--color-warn)",
  primary: "var(--color-primary)",
  muted: "var(--color-muted-foreground)",
};
