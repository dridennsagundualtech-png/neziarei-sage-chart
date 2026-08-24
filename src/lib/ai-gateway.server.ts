import type { ModelHealth, ModelStatus } from "./ai-models";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function classify(status: number): ModelHealth {
  if (status === 429) return "rate_limited";
  if (status === 402) return "no_credits";
  if (status === 403) return "blocked";
  return "unavailable";
}

export function healthMessage(health: ModelHealth): string {
  switch (health) {
    case "ok":
      return "Available";
    case "rate_limited":
      return "Rate limited right now — try again shortly";
    case "no_credits":
      return "AI credit limit reached for this workspace";
    case "blocked":
      return "Blocked by workspace policy";
    default:
      return "Not available for this project";
  }
}

export interface GatewayResult {
  content: string;
  model: string;
  fallbacks: { model: string; reason: string }[];
}

/**
 * Calls the gateway with each candidate model in order and returns the first
 * successful completion. A model that is rate limited, out of credits, blocked
 * or unsupported is skipped and the next candidate is tried.
 */
export async function chatWithFallback(
  apiKey: string,
  models: string[],
  body: Record<string, unknown>,
): Promise<GatewayResult> {
  const fallbacks: { model: string; reason: string }[] = [];
  let lastError = "No model was available.";

  for (const model of models) {
    let response: Response;
    try {
      response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ ...body, model }),
      });
    } catch {
      lastError = "Could not reach the analysis engine.";
      fallbacks.push({ model, reason: lastError });
      continue;
    }

    if (response.ok) {
      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content;
      if (content) return { content, model, fallbacks };
      lastError = "The analysis engine returned an empty response.";
      fallbacks.push({ model, reason: lastError });
      continue;
    }

    const detail = await response.text();
    const health = classify(response.status);
    lastError = `${healthMessage(health)} (${response.status}) ${detail.slice(0, 200)}`;
    fallbacks.push({ model, reason: healthMessage(health) });
  }

  throw new Error(`All selected AI models failed. Last reason: ${lastError}`);
}

/** Cheap one-token probe used by the availability checker. */
export async function probeModel(apiKey: string, model: string): Promise<ModelStatus> {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ok" }],
        max_tokens: 1,
      }),
    });
    if (response.ok) return { id: model, health: "ok", detail: healthMessage("ok") };
    const health = classify(response.status);
    return { id: model, health, detail: healthMessage(health) };
  } catch {
    return { id: model, health: "unavailable", detail: "Could not reach the analysis engine." };
  }
}
