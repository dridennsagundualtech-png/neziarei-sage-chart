/**
 * Pre-defined rulebook combinations used by Auto Optimize.
 * Keep the list small (max ~12) so the backtest stays fast.
 */
import type { DenComponents } from "./den-rules";

export interface RuleCombination {
  id: string;
  name: string;
  description: string;
  components: DenComponents;
}

/**
 * Helper to build a full components object.
 * Any key not listed is set to false.
 */
function build(active: Partial<DenComponents>): DenComponents {
  return {
    htf_structure: false,
    support_resistance: false,
    liquidity: false,
    amd: false,
    liquidity_sweep: false,
    mss_bos: false,
    displacement: false,
    fvg: false,
    volume: false,
    risk_reward: false,
    choch: false,
    order_block: false,
    breaker_block: false,
    fibonacci: false,
    ...active,
  };
}

export const RULE_COMBINATIONS: RuleCombination[] = [
  {
    id: "simple",
    name: "Simple Mode",
    description: "Core structure + sweep + displacement + RR",
    components: build({
      htf_structure: true,
      liquidity: true,
      liquidity_sweep: true,
      mss_bos: true,
      displacement: true,
      fibonacci: true,
      risk_reward: true,
    }),
  },
  {
    id: "structure-heavy",
    name: "Structure Heavy",
    description: "Focus on HTF + BOS/MSS + Displacement",
    components: build({
      htf_structure: true,
      mss_bos: true,
      displacement: true,
      liquidity_sweep: true,
      risk_reward: true,
    }),
  },
  {
    id: "sweep-reversal",
    name: "Sweep Reversal",
    description: "Liquidity Sweep + CHoCH + FVG style",
    components: build({
      htf_structure: true,
      liquidity: true,
      liquidity_sweep: true,
      choch: true,
      fvg: true,
      displacement: true,
      risk_reward: true,
    }),
  },
  {
    id: "order-block",
    name: "Order Block Focus",
    description: "Order Block + BOS + Displacement",
    components: build({
      htf_structure: true,
      mss_bos: true,
      order_block: true,
      displacement: true,
      liquidity_sweep: true,
      risk_reward: true,
    }),
  },
  {
    id: "full-smc",
    name: "Full SMC",
    description: "Almost everything enabled",
    components: build({
      htf_structure: true,
      support_resistance: true,
      liquidity: true,
      amd: true,
      liquidity_sweep: true,
      mss_bos: true,
      displacement: true,
      fvg: true,
      order_block: true,
      choch: true,
      fibonacci: true,
      risk_reward: true,
    }),
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Only the strongest filters",
    components: build({
      htf_structure: true,
      liquidity_sweep: true,
      mss_bos: true,
      displacement: true,
      risk_reward: true,
    }),
  },
  {
    id: "fib-entry",
    name: "Fib Entry",
    description: "Structure + Fibonacci + RR",
    components: build({
      htf_structure: true,
      mss_bos: true,
      displacement: true,
      fibonacci: true,
      liquidity_sweep: true,
      risk_reward: true,
    }),
  },
  {
    id: "no-fib",
    name: "No Fibonacci",
    description: "Simple mode without Fib",
    components: build({
      htf_structure: true,
      liquidity: true,
      liquidity_sweep: true,
      mss_bos: true,
      displacement: true,
      risk_reward: true,
    }),
  },
  {
    id: "with-fvg",
    name: "With FVG",
    description: "Simple + Fair Value Gap",
    components: build({
      htf_structure: true,
      liquidity: true,
      liquidity_sweep: true,
      mss_bos: true,
      displacement: true,
      fvg: true,
      risk_reward: true,
    }),
  },
  {
    id: "with-ob-fvg",
    name: "OB + FVG",
    description: "Order Block + FVG + core structure",
    components: build({
      htf_structure: true,
      mss_bos: true,
      displacement: true,
      order_block: true,
      fvg: true,
      liquidity_sweep: true,
      risk_reward: true,
    }),
  },
  {
    id: "strict-smc",
    name: "Strict SMC",
    description: "Core SMC with CHoCH and OB",
    components: build({
      htf_structure: true,
      liquidity_sweep: true,
      mss_bos: true,
      choch: true,
      order_block: true,
      displacement: true,
      fibonacci: true,
      risk_reward: true,
    }),
  },
  {
    id: "amd-focus",
    name: "AMD Focus",
    description: "AMD + Displacement + Structure",
    components: build({
      htf_structure: true,
      amd: true,
      displacement: true,
      mss_bos: true,
      liquidity_sweep: true,
      risk_reward: true,
    }),
  },
];
