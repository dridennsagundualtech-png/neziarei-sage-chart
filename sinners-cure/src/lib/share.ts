export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("sc-toast", { detail: message }));
}

import { shareNative } from "./native";
import { t } from "./lang";

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t("Copied", "Nakopya na"));
  } catch {
    // Older WebViews: fall back to a hidden text box.
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    toast(ok ? t("Copied", "Nakopya na") : t("Could not copy", "Hindi makopya"));
  }
}

export async function shareText(text: string) {
  if (await shareNative(text)) return;
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      return;
    }
  }
  await copyText(text);
}
