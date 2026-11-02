export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("sc-toast", { detail: message }));
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied");
  } catch {
    toast("Could not copy");
  }
}

export async function shareText(text: string) {
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
