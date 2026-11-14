// Run: bun scripts/result-view-check.tsx
// Renders the real result screen (ResultView) to HTML and checks what it says:
// which segment of the Ready / Wait / No trade strip is lit, and how the
// Settings switch "Require a proven edge" changes it. No browser or sign-in
// needed, so any agent can run it. Add a case here when you change ResultView.
// It renders the first paint only: "Show all details" needs a click, so check
// the opened view in a browser (TESTING_GUIDE.md).
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

// ---- at a glance: the summary card sits on every result, with the simple view by default
{
  const html = page({}, NO_EDGE);
  assert.match(html, /At a glance/);
  for (const label of ["Rules", "Plan", "Stop", "Size", "Odds with no edge"]) {
    assert.match(html, new RegExp(`>${label}<`), `missing the ${label} line`);
  }
  assert.match(html, /R:R 2</);
  assert.match(html, /No edge is proven for this read/);
  // Simple view: the plan and its steps stay; the reference sections wait behind the button.
  assert.match(html, /Show all details/);
  assert.match(html, /aria-expanded="false"/);
  for (const kept of ["Conditional trade plan", "How to follow this plan", "Copy plan"]) {
    assert.match(html, new RegExp(kept), `${kept} should stay visible`);
  }
  for (const folded of [
    "Setup checklist",
    "Risk management",
    "Historical evidence",
    "Chances at your levels",
    "Checklist score",
  ]) {
    assert.doesNotMatch(html, new RegExp(folded), `${folded} should be folded`);
  }
  // A proven edge is the only case where the card says the record beats the odds.
  // (The plan's own footnote says "Only a read that beats these odds…", so match the card's words.)
  const claim = /Its record beats these odds on its history/;
  assert.ok(claim.test(page({}, EDGE)), "a proven edge should be stated on the card");
  assert.ok(!claim.test(html), "the card must not claim an edge that isn't proven");
  assert.ok(!claim.test(page({ require_edge: false }, NO_EDGE)), "the switch must not add a claim");
}

// ---- a read with no trade shows the rules and "no plan", and no size or odds to mislead
{
  const waiting = {
    ...READY,
    direction: "WAIT",
    setup_stage: "SETUP FORMING",
    entry_zone: null,
    stop_loss: null,
    tp1: null,
    risk_reward: null,
  };
  const html = page({}, undefined, waiting);
  assert.equal(strip(html), "Wait");
  assert.match(html, /This read has no trade to plan/);
  assert.doesNotMatch(html, />Size<|>Odds with no edge<|>Stop</);
}

console.log("result-view-check: ok");
