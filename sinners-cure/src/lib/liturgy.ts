export type LitColor = "green" | "violet" | "white" | "red" | "rose";

export const COLOR_NAMES: Record<LitColor, string> = {
  green: "Green",
  violet: "Violet",
  white: "White",
  red: "Red",
  rose: "Rose",
};

const strip = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function dateKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dayOfYear(d: Date) {
  return Math.round((strip(d).getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000);
}
