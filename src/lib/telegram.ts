/**
 * Optional Telegram notifications (Group F).
 * Uses TELEGRAM_BOT_TOKEN from env (Lovable secret) — never expose in VITE_.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId.trim()) return false;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: text.slice(0, 4000),
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function parseTelegramChatIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function formatSharedSignalTelegram(row: {
  symbol: string;
  direction: string;
  grade?: string | null;
  score?: number | null;
  entry_zone?: string | null;
  stop_loss?: string | null;
  tp1?: string | null;
  summary?: string | null;
}): string {
  const lines = [
    "ChartPilot shared signal",
    `${row.symbol} · ${row.direction}${row.grade ? ` · ${row.grade}` : ""}${row.score != null ? ` · score ${row.score}` : ""}`,
  ];
  if (row.entry_zone) lines.push(`Entry: ${row.entry_zone}`);
  if (row.stop_loss) lines.push(`Stop: ${row.stop_loss}`);
  if (row.tp1) lines.push(`TP1: ${row.tp1}`);
  if (row.summary) lines.push("", row.summary.slice(0, 500));
  lines.push("", "Open the app for full checklist. Not financial advice.");
  return lines.join("\n");
}
