import type { GuideModule } from "@/lib/app-guide/types";
import { go, k } from "@/lib/breakthrough/scene";
import { flow, scene } from "@/lib/breakthrough/types";

/** The starter setup, built one step at a time. Entry 51.2, stop 47.9, target 58: about 2R. */
const PULLBACK_LONG = scene({
  start: 44,
  items: [
    go(48.6, 3, "h1"),
    go(46.2, 3, "l1"),
    go(58, 6, "h2"),
    go(49.6, 5, "pb"),
    k(49.6, 49.9, 48.3, 49.7, "sw"),
    k(49.7, 51.4, 49.5, 51.2, "conf"),
    go(58.4, 6, "end"),
  ],
  zones: [
    { from: "h1", top: 49.6, bottom: 48.4, tone: "bull", label: "support zone", appear: "pb" },
  ],
  lines: [
    { y: 58, from: "conf", label: "target", tone: "bull", appear: "conf" },
    { y: 51.2, from: "conf", label: "entry", tone: "primary", appear: "conf" },
    { y: 47.9, from: "conf", label: "stop", tone: "bear", appear: "conf" },
  ],
  marks: [{ at: "sw", y: 48.3, text: "sweep", dir: "up", tone: "warn", appear: "sw" }],
  steps: [
    { upTo: "h2", text: "Step 1 · Higher highs and higher lows: only longs are allowed." },
    { upTo: "pb", text: "Step 2 · Price pulls back into a zone: the old high, now support." },
    {
      upTo: "sw",
      text: "Step 3 · A wick dips under the last small low and closes back inside: stops taken.",
    },
    { upTo: "conf", text: "Step 4 · A strong candle closes up. Entry at its close." },
    {
      upTo: 99,
      text: "Step 5 · Stop below the sweep, target at the last swing high: about 2R. This one worked; many won't.",
    },
  ],
});

/** Same pattern upside down, unlabelled, for the check. */
const PULLBACK_SHORT = scene({
  start: 60,
  items: [
    go(52, 4),
    go(55, 3),
    go(42.5, 6),
    go(50.4, 5),
    k(50.4, 51.7, 50.1, 50.3),
    k(50.3, 50.5, 48.6, 48.8),
    go(44, 3),
  ],
  steps: [{ upTo: 99, text: "" }],
});

export const FC4_SETUP: GuideModule = {
  id: "fc-setup",
  title: "One setup, written down",
  blurb:
    "Why one setup, a simple starter setup, your rules card, and ChartPilot as your checklist.",
  lessons: [
    {
      id: "fc-one",
      title: "Why only one setup",
      summary: "You can only measure something you do the same way every time.",
      where: "Anywhere",
      access: "everyone",
      steps: [
        {
          title: "Many setups, no answers",
          body: "Trade breakouts on Monday, reversals on Tuesday and news on Wednesday, and after 50 trades you have 50 different experiments with one result each. You learn nothing. One setup, repeated, gives you a real sample.",
        },
        {
          title: "The loop that makes traders better",
          body: "Do the same thing, record it, look at the numbers, change one thing, repeat:",
          visual: flow({
            loop: true,
            nodes: [
              { label: "Trade the plan", note: "Same rules every time.", tone: "primary" },
              { label: "Record it", note: "Result in R, and whether you followed the rules." },
              { label: "Review weekly", note: "Average R, profit factor, mistakes." },
              { label: "Change one thing", note: "Only after enough trades.", tone: "warn" },
            ],
          }),
        },
        {
          title: "Boring is the goal",
          body: "A good plan feels repetitive. If trading feels exciting, it usually means you are improvising. Excitement is for later, once the numbers say your plan works.",
        },
      ],
      checks: [
        {
          id: "fc-one-1",
          prompt: "Why stick to one setup while learning?",
          options: [
            "So the results measure one thing and can be trusted",
            "Because other setups are illegal",
            "One setup always wins",
            "It needs no stop-loss",
          ],
          correctIndex: 0,
          explanation: "Mixing setups mixes results; you can't tell what works.",
        },
        {
          id: "fc-one-2",
          prompt: "When should you change your rules?",
          options: [
            "After enough trades to judge, one change at a time",
            "After every loss",
            "Whenever a video suggests something new",
            "Never, under any circumstances",
          ],
          correctIndex: 0,
          explanation:
            "Changing after each loss means you never measure anything. Change on evidence, one thing at a time.",
        },
      ],
    },
    {
      id: "fc-pullback",
      title: "A starter setup: the trend pullback",
      summary:
        "Trade in the direction of the 4-hour trend, after a pullback into a zone and a sign of rejection.",
      where: "4-hour and 1-hour charts",
      access: "everyone",
      steps: [
        {
          title: "Watch it build",
          body: "Step through the chart. Every part has a reason: the trend gives the direction, the zone gives the location, the sweep and strong close give the timing, and the swing high gives the target.",
          visual: PULLBACK_LONG,
          tip: "Tap through the steps slowly. Say each step out loud before you reveal it.",
        },
        {
          title: "The rules (long; mirror them for shorts)",
          visual: flow({
            nodes: [
              { label: "Trend", note: "4H: higher highs and higher lows.", tone: "primary" },
              { label: "Location", note: "1H pullback into your marked zone." },
              { label: "Trigger", note: "Sweep of the last small low, then a strong close up." },
              { label: "Stop", note: "Just below the lowest wick.", tone: "bear" },
              { label: "Target", note: "Last swing high, at least 2R, or skip.", tone: "bull" },
            ],
          }),
          body: "Only take the trade if every line is true:",
          bullets: [
            "**Trend:** the 4-hour chart shows higher highs and higher lows.",
            "**Location:** on the 1-hour chart, price pulls back into a zone you marked before (old swing high, support band or yesterday's value area).",
            "**Trigger:** a candle wicks below the last small swing low and closes back above it, and the next candle closes strongly up. Enter at that close.",
            "**Stop:** just below the lowest wick of the pullback.",
            "**Target:** the last swing high. If that is less than 2R away, skip.",
          ],
        },
        {
          title: "When not to take it",
          visual: flow({
            layout: "grid",
            nodes: [
              { label: "4H is ranging", note: "No trend, no trade.", tone: "muted" },
              { label: "Zone already broken", note: "Price closed through it.", tone: "bear" },
              { label: "Big news within 30 min", note: "Wait until it's out.", tone: "warn" },
              { label: "Daily limit hit", note: "Done for today.", tone: "bear" },
            ],
          }),
          body: "Skip it if the 4-hour chart is ranging, if the pullback has already gone through the zone, if high-impact news is due within 30 minutes, or if you have already hit your daily loss limit.",
        },
        {
          title: "An honest note",
          body: "This is a common, reasonable starter plan: it trades with the trend, has a clear stop and a clear target. It is **not** proven to make money. ChartPilot's own tests found no automatic rule set that beats costs on its own. You practise this setup to build skill and to find out, with your own numbers, whether you can trade it well.",
        },
      ],
      checks: [
        {
          id: "fc-pullback-1",
          prompt:
            "The 4-hour chart makes lower highs and lower lows. On the 1-hour chart, price rose into a zone, wicked above it and closed back below. What does the setup allow?",
          visual: PULLBACK_SHORT,
          options: [
            "A short, stop above the wick, target the last swing low if it is at least 2R",
            "A long, because the last candles went up",
            "Nothing: shorts are not allowed",
            "A long with no stop",
          ],
          correctIndex: 0,
          explanation:
            "Same rules, upside down: downtrend, pullback up into a zone, a sweep above and a close back down.",
        },
        {
          id: "fc-pullback-2",
          prompt: "Everything fits, but the last swing high is only 1.4R away. What do you do?",
          options: [
            "Skip it",
            "Take it anyway",
            "Move the stop closer to make it 2R",
            "Pick a target further away",
          ],
          correctIndex: 0,
          explanation:
            "The target comes from the chart, not from the R:R you want. Below 2R, skip.",
        },
      ],
    },
    {
      id: "fc-rules",
      title: "Write your rules card",
      summary: "If it isn't written down, it isn't a rule.",
      where: "Journal › Notes",
      access: "everyone",
      open: { to: "/journal", tab: "notes", label: "Open Notes" },
      steps: [
        {
          title: "Why write it",
          body: "In the moment, your brain will bend any rule. A written card turns 'I think this is a setup' into 'does it meet lines 1 to 5?'. You also need the exact rules later to know what your stats are measuring.",
        },
        {
          title: "Your card",
          body: "Copy this into a note and fill in your own choices:",
          mock: {
            where: "Journal › Notes › My rules",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "Market", right: "EURUSD" },
                  { left: "Hours", right: "4–7 pm PH, no big news" },
                  { left: "Direction", right: "4H trend only; range = no trade" },
                  { left: "Setup", right: "1H pullback into my zone" },
                  { left: "Trigger", right: "Sweep + strong close back" },
                  { left: "Stop", right: "Beyond the sweep wick" },
                  { left: "Target", right: "Last swing; skip under 2R" },
                  { left: "Size", right: "App's position size at 0.5%" },
                  { left: "Limits", right: "Max 2 trades a day, stop at −2R" },
                ],
              },
            ],
          },
        },
        {
          title: "One management rule",
          body: "Decide now what you do once the trade is on, and keep it simple: leave it alone until the stop or the target. No closing early because it 'feels' like it will turn. Fiddling with open trades is one of the main reasons beginner results get worse.",
        },
      ],
      checks: [
        {
          id: "fc-rules-1",
          prompt:
            "Your card says 'max 2 trades a day'. You took 2 and a third perfect setup appears. What do you do?",
          options: [
            "Skip it and note it as a missed setup",
            "Take it, it's perfect",
            "Take it at double size",
            "Change the rule for today",
          ],
          correctIndex: 0,
          explanation:
            "Rules only work if they hold when it's tempting. Note it; if it happens often, review the rule at your weekly review.",
        },
        {
          id: "fc-rules-2",
          prompt: "Why decide how you manage open trades before entering?",
          options: [
            "So fear and hope don't decide it in the moment",
            "Brokers require it",
            "It doubles the win rate",
            "It removes the need for a stop",
          ],
          correctIndex: 0,
          explanation:
            "Decisions made calmly beforehand are better than ones made while watching price move.",
        },
      ],
      task: "Write your rules card in **Journal › Notes** with the title “My rules”.",
    },
    {
      id: "fc-app-check",
      title: "Use ChartPilot as your checklist",
      summary: "Your rules decide the trade. The app checks the plan, sizes it and records it.",
      where: "Analyze",
      access: "everyone",
      open: { to: "/analyze", label: "Open Analyze" },
      steps: [
        {
          title: "Your call first",
          body: "When you add a chart, **Your bias first** asks for your own read before ChartPilot shows its own: **Long**, **Short**, **Wait** or **No trade**. Write one line on why, then **Lock in my bias**. This keeps the app from doing your thinking.",
          mock: {
            where: "Analyze",
            parts: [
              { kind: "title", text: "Your bias first" },
              { kind: "chips", items: ["Long", "Short", "Wait", "No trade"], on: [0] },
              { kind: "button", label: "Lock in my bias", tone: "primary" },
            ],
          },
        },
        {
          title: "Read the result as a second opinion",
          body: "The analysis marks structure, levels and a possible plan. Compare it with your card. If it disagrees, ask why, but your card decides. The **Ready / Wait** strip will rarely say Ready: it only does when that kind of signal has a proven track record.",
        },
        {
          title: "Let it check your plan",
          mock: {
            where: "Analyze › result",
            parts: [
              {
                kind: "note",
                text: "Reward-to-risk is below your minimum (1.4 vs 2).",
                tone: "warn",
              },
              {
                kind: "stats",
                items: [
                  ["Position size", "0.05 lots"],
                  ["Risk", "₱125 at 1 USD = ₱58.20"],
                ],
              },
            ],
          },
          body: "ChartPilot refuses plans that can't work, warns when **Reward-to-risk is below your minimum**, and shows the **Position size** in your currency. If your own entry, stop and target differ from its plan, size from your stop.",
        },
        {
          title: "Record it before you forget",
          body: "After the trade ends, open the analysis in the Journal and use **Journal this setup**: choose the **Outcome**, type the **Result in R**, add a note, **Save result**. Setups you skip get recorded too: pick **No trade** and write why.",
        },
      ],
      checks: [
        {
          id: "fc-app-check-1",
          prompt:
            "ChartPilot's analysis says Wait, but your rules card says the setup is valid. Who decides?",
          options: [
            "Your card: the app is a second opinion and a plan check",
            "The app always",
            "Flip a coin",
            "Take both directions",
          ],
          correctIndex: 0,
          explanation:
            "You're measuring your plan. The app checks geometry and size and points out what you may have missed.",
        },
        {
          id: "fc-app-check-2",
          prompt: "Why lock in your own bias before seeing ChartPilot's read?",
          options: [
            "So your own judgement gets practised and measured",
            "It makes the analysis faster",
            "The app needs it to draw the chart",
            "It changes the market",
          ],
          correctIndex: 0,
          explanation: "If you always read the app first, you never build or test your own eye.",
        },
      ],
      task: "Run one analysis on your market today: lock in your bias first, then compare. Don't trade it; just practise the flow.",
    },
  ],
};
