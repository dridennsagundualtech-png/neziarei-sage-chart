// Run: bun scripts/result-view-check.tsx
// Renders the real result screen (ResultView) to HTML and checks what it says:
// which segment of the Ready / Wait / No trade strip is lit, and how the
// Settings switch "Require a proven edge" changes it. No browser or sign-in
// needed, so any agent can run it. Add a case here when you change ResultView.
import assert from "node:assert/strict";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";

import { ResultView } from "../src/components/ResultView";
import { DEFAULT_SETTINGS, type SettingsRow } from "../src/lib/data";

/** A read that meets every rule: long, entry available, 14/16, passes the quality gate. */
const READY = {
  asset: "EURUSD",
  market_type: "forex",
  timeframes: ["H1", "M15"],
  primary_timeframe: "M15",
  sufficient_information: true,
  requested_additional_images: [],
  missing_information: [],
  htf_bias: "Bullish",
  direction: "POTENTIAL LONG",
  setup_stage: "ENTRY AVAILABLE",
  checklist: [],
  score: 14,
  max_score: 16,
  grade: "A",
  visual_evidence: "HIGH",
  summary: "Test read.",
  entry_zone: "1.0850",
  stop_loss: "1.0820",
  tp1: "1.0910",
  tp2: null,
  risk_reward: 2,
  required_confirmation: [],
  invalidation: [],
  reasoning: [],
  tradable: true,
  // Stored candles make it a live read, which is what shows the plan steps.
  series: [
    {
      timeframe: "M15",
      candles: Array.from({ length: 5 }, (_, i) => ({
        time: new Date(Date.now() - (6 - i) * 15 * 60_000).toISOString(),
        open: 1.086,
        high: 1.0875,
        low: 1.0855,
        close: 1.087,
        tick_volume: 10,
      })),
    },
  ],
};

function page(settings: Partial<SettingsRow>, proof: unknown, result: object = READY): string {
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <ResultView
        result={result as never}
        journal={[]}
        settings={{ user_id: "u", ...DEFAULT_SETTINGS, account_balance: 60000, ...settings }}
        proof={proof as never}
      />
    </QueryClientProvider>,
  );
}

const strip = (html: string) => /aria-label="Checklist verdict: ([^"]+)"/.exec(html)?.[1];
const NO_EDGE = { level: "none", headline: "No edge" };
const EDGE = { level: "edge", headline: "Edge" };

// ---- "Require a proven edge" on (the default): rules met but no edge reads Wait
{
  const html = page({}, NO_EDGE);
  assert.equal(strip(html), "Wait");
  assert.match(html, /Paper-trade it/);
  assert.match(html, /demo account only/);
  // A settings row saved before the column existed has no value: it must behave as on.
  assert.equal(strip(page({ require_edge: undefined as never }, NO_EDGE)), "Wait");
  // Still loading the track record: not ready yet.
  assert.equal(strip(page({}, null)), "Wait");
}

// ---- off: Ready lights on the rules, and the result says no edge is proven
{
  const html = page({ require_edge: false }, NO_EDGE);
  assert.equal(strip(html), "Ready");
  assert.match(html, /Ready here means the rules are met/);
  assert.match(html, /turned that requirement off in Settings/);
  assert.match(html, /The edge requirement is off in Settings, so the decision is yours/);
  assert.doesNotMatch(html, /demo account only/);

  const loading = page({ require_edge: false }, null);
  assert.equal(strip(loading), "Ready");
  assert.match(loading, /no edge is proven yet/);
}

// ---- a measured edge reads the same either way: Ready, with no warning line
for (const require_edge of [true, false]) {
  const html = page({ require_edge }, EDGE);
  assert.equal(strip(html), "Ready");
  assert.doesNotMatch(html, /Ready here means|Paper-trade it/);
  assert.match(html, /have shown an edge on this history/);
}

// ---- AI screenshot reads pass no track record: the switch doesn't touch them
for (const require_edge of [true, false]) {
  assert.equal(strip(page({ require_edge }, undefined)), "Ready");
}

// ---- the quality gate and invalidation still win over the switch
{
  const gated = { ...READY, tradable: false, tradable_reasons: ["R:R too low"] };
  assert.equal(strip(page({ require_edge: false }, NO_EDGE, gated)), "Wait");
  const dead = { ...READY, setup_stage: "SETUP INVALIDATED" };
  assert.equal(strip(page({ require_edge: false }, NO_EDGE, dead)), "No trade");
}

console.log("result-view-check: ok");
