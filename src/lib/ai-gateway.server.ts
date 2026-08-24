import type { ModelHealth, ModelStatus } from "./ai-models";
import { providerLabelFor } from "./ai-models";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// The ":free" tier for this model was retired by OpenRouter (404); the paid
// slug is the working equivalent and is still very cheap.
export const OPENROUTER_MODEL = "openai/gpt-oss-20b";

function classify(status: number): ModelHealth {
  if (status === 429) return "rate_limited";
  if (status === 402) return "no_credits";
  if (status === 403) return "blocked";
  return "unavailable";
}

/**
 * Availability-type failures only: credits exhausted, rate limited, upstream
 * server errors. Everything else (400 bad request, 401/403 auth/policy) is
 * terminal and must NOT trigger a provider fallback.
 */
function isAvailabilityFailure(status: number): boolean {
  return status === 402 || status === 429 || status >= 500;
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
  /** Model id that actually served the response. */
  model: string;
  /** Human-readable provider/model label for the UI. */
  provider: string;
  fallbacks: { model: string; reason: string }[];
}

interface Attempt {
  url: string;
  model: string;
  apiKey: string;
  provider: string;
  /** OpenRouter free tier may reject response_format. */
  allowResponseFormat: boolean;
}

async function callOnce(
  attempt: Attempt,
  body: Record<string, unknown>,
): Promise<{ content: string } | { retryable: boolean; reason: string }> {
  const payload: Record<string, unknown> = { ...body, model: attempt.model };
  if (!attempt.allowResponseFormat) delete payload["response_format"];

  let response: Response;
  try {
    response = await fetch(attempt.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${attempt.apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Network / timeout failure — treat as an availability problem.
    return { retryable: true, reason: "Could not reach the provider (network error)." };
  }

  if (response.ok) {
    let parsed: { choices?: { message?: { content?: string } }[] };
    try {
      parsed = (await response.json()) as typeof parsed;
    } catch {
      return { retryable: true, reason: "The provider returned an unreadable response." };
    }
    const content = parsed.choices?.[0]?.message?.content;
    if (content && content.trim()) return { content };
    return { retryable: true, reason: "The provider returned an empty response." };
  }

  const detail = (await response.text().catch(() => "")).slice(0, 200);
  const retryable = isAvailabilityFailure(response.status);
  const reason = `${healthMessage(classify(response.status))} (${response.status}) ${detail}`.trim();
  return { retryable, reason };
}

/**
 * Provider fallback cascade. Gateway models are tried in order; if every one
 * fails with an availability-type error, the OpenRouter free model is tried
 * last. Terminal errors (bad request, auth, policy) stop the cascade.
 */
export async function chatWithFallback(
  apiKey: string,
  models: string[],
  body: Record<string, unknown>,
): Promise<GatewayResult> {
  const attempts: Attempt[] = models.map((model) => ({
    url: GATEWAY_URL,
    model,
    apiKey,
    provider: providerLabelFor(model),
    allowResponseFormat: true,
  }));

  const openRouterKey = process.env["OPENROUTER_API_KEY"];
  if (openRouterKey) {
    attempts.push({
      url: OPENROUTER_URL,
      model: OPENROUTER_MODEL,
      apiKey: openRouterKey,
      provider: "OpenRouter free fallback (gpt-oss-20b)",
      allowResponseFormat: false,
    });
  }

  const fallbacks: { model: string; reason: string }[] = [];
  let lastError = "No provider was available.";

  for (const attempt of attempts) {
    const result = await callOnce(attempt, body);
    if ("content" in result) {
      return {
        content: result.content,
        model: attempt.model,
        provider: attempt.provider,
        fallbacks,
      };
    }
    lastError = result.reason;
    fallbacks.push({ model: attempt.model, reason: result.reason });
    if (!result.retryable) break;
  }

  const suffix = openRouterKey
    ? ""
    : " (OpenRouter fallback is not configured — add an OPENROUTER_API_KEY secret to enable it.)";
  throw new Error(`All AI providers failed. Last reason: ${lastError}${suffix}`);
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
