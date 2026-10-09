// Run: bun scripts/stats-check.ts  (or: npx tsx scripts/stats-check.ts)
import assert from "node:assert/strict";
import { midpointOf, positionSize } from "../src/lib/stats";

assert.equal(midpointOf("4,218–4,224"), 4221);
assert.equal(midpointOf("2318-2322"), 2320);
assert.ok(Math.abs((midpointOf("1.0850 - 1.0860") ?? 0) - 1.0855) < 1e-9);
assert.equal(midpointOf("100 to 110"), 105);
assert.equal(midpointOf("Below 4,196 swing low (1H)"), 4196);
assert.equal(midpointOf("Not visible"), null);
assert.equal(midpointOf(null), null);
assert.equal(positionSize({ balance: 100000, riskPct: 0.5, entry: 2320, stop: 2310 }).units, 50);
console.log("stats-check: ok");
