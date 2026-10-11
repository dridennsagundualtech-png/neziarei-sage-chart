/**
 * Journal "Ask AI": a trading tutor chat on the same model cascade as Analyze
 * (selected Gemini model → Gemini 2.5 Pro → OpenRouter free), plus a summary
 * that becomes an "AI QnA" note. Server only.
 */
import { cascadeModels } from "./ai-models";
import { chatWithFallback } from "./ai-gateway.server";

export interface QnaMessage {
  role: "user" | "assistant";
  content: string;
}

const TUTOR_RULES = `You are ChartPilot's trading tutor, answering questions inside the user's trading journal.

RULES
1. Educational only. Never tell the user to buy or sell, never give a win probability, never promise a result. If asked whether to take a trade, explain how to judge it instead: bias, liquidity, structure, entry, invalidation and risk.
2. You cannot see the user's charts, account or live prices unless they paste the numbers. Say so when it matters. Never invent prices, news, dates or statistics.
3. Be honest about uncertainty and about where traders disagree (for example, ICT and SMC definitions vary between teachers).
4. Plain words first, then the technical term. Short paragraphs; use a bullet or numbered list for steps. Stay under about 250 words unless the user asks for more depth.
5. When maths is involved (position size, reward-to-risk, expectancy, drawdown), show the working with the user's numbers.
6. Mention the stop, invalidation and position size whenever a question touches on taking a trade.
7. No hype and no emojis. Answer in the language the user writes in.`;

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project.");
  return key;
}

function trimHistory(messages: QnaMessage[], keep: number): QnaMessage[] {
  return messages.slice(-keep).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

export async function answerQuestion(input: { messages: QnaMessage[]; model: string | null }) {
  const history = trimHistory(input.messages, 12);
  if (history.length === 0 || history[history.length - 1]?.role !== "user") {
    throw new Error("Ask a question first.");
  }
  const result = await chatWithFallback(apiKey(), cascadeModels(input.model), {
    messages: [{ role: "system", content: TUTOR_RULES }, ...history],
    temperature: 0.3,
  });
  return { answer: result.content.trim(), provider: result.provider, model: result.model };
}

/* ------------------------------------------------------------- summary */

const SUMMARY_RULES = `You turn a trading Q&A chat into a short study note.
Return JSON only, exactly this shape:
{"title": string (max 60 characters, names the topic), "summary": string (2 to 4 plain sentences), "key_points": string[] (3 to 6 short points), "terms": [{"term": string, "meaning": string}] (0 to 6 trading terms that came up), "follow_up": string[] (0 to 3 questions worth asking next)}
Rules: only use what was said in the chat; do not add new facts, prices or advice; no buy or sell instructions; no emojis.`;

function parseJsonObject(text: string): Record<string, unknown> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start)
    throw new Error("The AI returned an unreadable summary. Try again.");
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("The AI returned an unreadable summary. Try again.");
  }
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strList = (v: unknown, max: number, itemMax: number) =>
  Array.isArray(v)
    ? v
        .map((x) => str(x, itemMax))
        .filter(Boolean)
        .slice(0, max)
    : [];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Light markdown → safe note HTML: paragraphs, bullet/numbered lists (also after an intro line), headings, **bold**. */
export function markdownToHtml(text: string): string {
  const inline = (s: string) =>
    escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "$1");
  const out: string[] = [];
  for (const block of text.split(/\n{2,}/)) {
    let kind: "p" | "ul" | "ol" | null = null;
    let items: string[] = [];
    const flush = () => {
      if (!kind || items.length === 0) return;
      if (kind === "p") out.push(`<p>${items.map(inline).join("<br>")}</p>`);
      else
        out.push(`<${kind}>${items.map((i) => `<li><p>${inline(i)}</p></li>`).join("")}</${kind}>`);
      items = [];
    };
    for (const raw of block.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      if (/^#{1,6}\s+/.test(line)) {
        flush();
        kind = null;
        out.push(`<h3>${inline(line.replace(/^#{1,6}\s+/, ""))}</h3>`);
        continue;
      }
      const next = /^[-*•]\s+/.test(line) ? "ul" : /^\d+[.)]\s+/.test(line) ? "ol" : "p";
      if (next !== kind) {
        flush();
        kind = next;
      }
      items.push(next === "p" ? line : line.replace(/^([-*•]|\d+[.)])\s+/, ""));
    }
    flush();
  }
  return out.join("");
}

export async function summarizeChat(input: { messages: QnaMessage[]; model: string | null }) {
  const history = trimHistory(input.messages, 40);
  if (!history.some((m) => m.role === "assistant"))
    throw new Error("There is no answer to summarize yet.");

  const transcript = history
    .map((m) => `${m.role === "user" ? "USER" : "TUTOR"}: ${m.content}`)
    .join("\n\n")
    .slice(0, 24000);

  const result = await chatWithFallback(apiKey(), cascadeModels(input.model), {
    messages: [
      { role: "system", content: SUMMARY_RULES },
      { role: "user", content: transcript },
    ],
    temperature: 0,
    response_format: { type: "json_object" },
  });

  const raw = parseJsonObject(result.content);
  const firstQuestion = history.find((m) => m.role === "user")?.content ?? "AI QnA";
  const title = str(raw["title"], 60) || firstQuestion.slice(0, 60);
  const summary = str(raw["summary"], 900);
  const points = strList(raw["key_points"], 6, 300);
  const followUp = strList(raw["follow_up"], 3, 200);
  const terms = Array.isArray(raw["terms"])
    ? (raw["terms"] as unknown[])
        .map((t) => {
          const row = (t ?? {}) as Record<string, unknown>;
          return { term: str(row["term"], 60), meaning: str(row["meaning"], 300) };
        })
        .filter((t) => t.term && t.meaning)
        .slice(0, 6)
    : [];

  const parts: string[] = [];
  if (summary) parts.push(`<h2>Summary</h2><p>${escapeHtml(summary)}</p>`);
  if (points.length)
    parts.push(
      `<h3>Key points</h3><ul>${points.map((p) => `<li><p>${escapeHtml(p)}</p></li>`).join("")}</ul>`,
    );
  if (terms.length) {
    parts.push(
      `<h3>Terms</h3><ul>${terms.map((t) => `<li><p><strong>${escapeHtml(t.term)}:</strong> ${escapeHtml(t.meaning)}</p></li>`).join("")}</ul>`,
    );
  }
  if (followUp.length)
    parts.push(
      `<h3>Ask next</h3><ul>${followUp.map((q) => `<li><p>${escapeHtml(q)}</p></li>`).join("")}</ul>`,
    );
  parts.push(
    `<h3>Conversation</h3>${history
      .map((m) =>
        m.role === "user"
          ? `<p><strong>You:</strong> ${escapeHtml(m.content)}</p>`
          : `<p><strong>AI:</strong></p>${markdownToHtml(m.content)}`,
      )
      .join("")}`,
  );
  parts.push(
    `<p><em>Answered by ${escapeHtml(result.provider)}. Educational only, not financial advice.</em></p>`,
  );

  return { title, html: parts.join(""), provider: result.provider };
}
