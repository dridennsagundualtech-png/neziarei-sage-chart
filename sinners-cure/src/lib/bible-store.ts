import { useLocal } from "./storage";

export type HlColor = "yellow" | "green" | "blue" | "rose";
export const HL_COLORS: HlColor[] = ["yellow", "green", "blue", "rose"];
export const HL_BG: Record<HlColor, string> = {
  yellow: "bg-hl-yellow",
  green: "bg-hl-green",
  blue: "bg-hl-blue",
  rose: "bg-hl-rose",
};

export const useHighlights = () => useLocal<Record<string, HlColor>>("sc.highlights", {});
export const useBookmarks = () => useLocal<string[]>("sc.bookmarks", []);
export const useNotes = () => useLocal<Record<string, string>>("sc.notes", {});
export const useLastRead = () => useLocal<{ book: string; ch: number } | null>("sc.bible.last", null);
