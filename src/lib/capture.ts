/**
 * Screenshot helper.
 *
 * Uses html-to-image (SVG foreignObject) instead of html2canvas because the
 * design system uses `oklch()` colours, which html2canvas cannot parse
 * ("Attempting to parse an unsupported color function oklch").
 *
 * Note: cross-origin iframes (TradingView) cannot be captured by any browser
 * API, so those areas render as empty space in the snapshot.
 */
export async function captureElement(
  node: HTMLElement,
  filename = "screenshot.jpg",
): Promise<File> {
  const { toBlob } = await import("html-to-image");
  const blob = await toBlob(node, {
    backgroundColor: "#11131c",
    pixelRatio: Math.min(2, window.devicePixelRatio || 1),
    cacheBust: true,
    filter: (element) => {
      const tag = (element as HTMLElement).tagName;
      return tag !== "IFRAME";
    },
  });
  if (!blob) throw new Error("Could not create the screenshot.");
  return new File([blob], filename, { type: blob.type || "image/png" });
}

export function screenshotFilename(prefix: string) {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
}
