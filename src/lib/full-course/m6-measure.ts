import type { GuideModule } from "@/lib/app-guide/types";
import { calc, flow } from "@/lib/breakthrough/types";

export const FC6_MEASURE: GuideModule = {
  id: "fc-measure",
  title: "Measure and improve",
  blurb:
    "A 15-minute weekly review, knowing when the numbers mean something, and improving one change at a time.",
  lessons: [
    {
      id: "fc-review",
      title: "Your weekly review",
      summary: "Fifteen minutes, once a week, with three numbers and your notes.",
      where: "Journal › Stats",
      access: "everyone",
      open: { to: "/journal", tab: "stats", label: "Open Stats" },
      steps: [
        {
          title: "Three numbers",
          body: "Open **Journal › Stats** and write down:",
          bullets: [
            "**Average R per trade**: above 0 means your trades earn on average, after costs if you recorded them honestly.",
            "**Profit factor**: total R won ÷ total R lost. Above 1 earns; 1.3 or more is solid.",
            "**Number of trades**: how much the first two numbers can be trusted.",
          ],
          visual: calc("profitfactor"),
        },
        {
          title: "One more: how often you followed the rules",
          body: "Count the 'Followed rules: no' notes. If more than 1 in 10 trades broke your rules, the stats are measuring your mistakes, not your plan. Fix discipline before touching the rules.",
        },
        {
          title: "Look at the worst three trades",
          mock: {
            where: "Journal › History, sorted by result",
            parts: [
              {
                kind: "rows",
                rows: [
                  { left: "EURUSD long · followed rules: no", right: "−2.1R", tone: "bear" },
                  { left: "EURUSD short · followed rules: yes", right: "−1.0R", tone: "bear" },
                  { left: "EURUSD long · followed rules: yes", right: "−1.0R", tone: "bear" },
                ],
              },
              {
                kind: "note",
                text: "The −2.1R broke the rules (stop moved). That's the lesson, not the setup.",
                tone: "info",
              },
            ],
          },
          body: "Open your three biggest losses. Were they on-card? Was the stop where the card says? Bad trades that followed the rules are the cost of doing business. Bad trades that broke them are lessons.",
        },
        {
          title: "Write one sentence",
          body: "End the review with one sentence in **Notes**: what you'll do the same next week, or the one thing you'll change. Keep these; reading three months of them later is surprisingly useful.",
        },
      ],
      checks: [
        {
          id: "fc-review-1",
          prompt:
            "Average R per trade is +0.15 over 40 trades, but 9 of them broke your rules. What first?",
          options: [
            "Fix the rule-breaking before judging the plan",
            "Double the size, it's profitable",
            "Change the setup",
            "Stop recording the broken ones",
          ],
          correctIndex: 0,
          explanation:
            "Almost a quarter of the trades weren't your plan, so the number doesn't measure your plan yet.",
        },
        {
          id: "fc-review-2",
          prompt: "Profit factor 0.8 means…",
          options: [
            "For every 1R lost, only 0.8R was won: losing overall",
            "80% of trades won",
            "Profitable, slightly",
            "The spread is 0.8 pips",
          ],
          correctIndex: 0,
          explanation: "Below 1, losses outweigh wins.",
        },
      ],
      task: "Pick a fixed time each week for your review, for example Saturday morning, and do the first one this week.",
    },
    {
      id: "fc-sample",
      title: "When are your numbers real?",
      summary: "Ten trades say almost nothing. Thirty is a start. A hundred is worth trusting.",
      where: "Journal › Stats",
      access: "everyone",
      steps: [
        {
          title: "Small samples swing wildly",
          body: "With 10 trades, a plan that truly wins 45% of the time can easily show 20% or 70%. The fewer trades, the wider the range of what the 'real' number might be. Try it:",
          visual: calc("sample"),
        },
        {
          title: "The rule of thumb",
          visual: flow({
            nodes: [
              { label: "Under 30", note: "An anecdote.", tone: "muted" },
              { label: "30 to 100", note: "An early read.", tone: "warn" },
              { label: "100 and more", note: "Starting to trust it.", tone: "bull" },
            ],
          }),
          bullets: [
            "**Under 30 trades:** an anecdote. Keep going, don't change anything.",
            "**30–100 trades:** an early read. Big problems show up here.",
            "**100+ trades:** something you can start to trust, if they all followed the same rules.",
          ],
          body: "Use these as checkpoints:",
        },
        {
          title: "Good and bad stretches are normal",
          body: "Even a plan that earns will have weeks and months below its peak. The deeper and longer those stretches, the harder it is to keep going. Knowing what is normal for your plan is what stops you quitting a good plan at the bottom, or keeping a bad one out of hope.",
          visual: calc("drawdown"),
        },
      ],
      checks: [
        {
          id: "fc-sample-1",
          prompt: "After 12 trades your win rate is 75%. What can you conclude?",
          options: [
            "Very little yet: keep going",
            "You have a proven edge",
            "Raise your risk",
            "The plan is perfect",
          ],
          correctIndex: 0,
          explanation: "Twelve trades is far too few; the real win rate could be much lower.",
        },
        {
          id: "fc-sample-2",
          prompt: "When is it reasonable to start trusting your stats?",
          options: [
            "Around 100 trades with the same rules",
            "After 5 trades",
            "After one good week",
            "Never",
          ],
          correctIndex: 0,
          explanation: "About 100 trades of the same plan gives a usable picture.",
        },
      ],
    },
    {
      id: "fc-improve",
      title: "Change one thing at a time",
      summary: "How to improve the plan without fooling yourself.",
      where: "Journal › Notes and Backtest",
      access: "everyone",
      steps: [
        {
          title: "One change, then measure again",
          body: "If your review points at something, for example 'my losses are mostly in the first hour after London opens', change only that ('no entries before 5 pm Philippine time'). Then trade the next 30 or more setups and compare. Change two things at once and you'll never know which one helped.",
          visual: flow({
            loop: true,
            nodes: [
              { label: "Spot a pattern", note: "From at least 30 recorded trades." },
              { label: "Change one rule", note: "Write the date and the change.", tone: "primary" },
              { label: "Trade 30+ more", note: "Same everything else." },
              { label: "Compare", note: "Better, worse, or noise?", tone: "warn" },
            ],
          }),
        },
        {
          title: "Don't tune to the past",
          body: "It's easy to find a rule that would have avoided last week's losses. Rules made that way usually fail next week. A change should make sense on its own ('the first hour is choppy'), not just fit your recent losses.",
        },
        {
          title: "Testing on history",
          body: "If you have admin access, ChartPilot's **Backtest** page can replay rule changes over stored candles, with costs. Its **Verdict** tells you whether a result beats a coin flip. Use the **Forward record** date (the day you changed the rule) to see only the signals the new rule had never seen.",
        },
      ],
      checks: [
        {
          id: "fc-improve-1",
          prompt: "Your review suggests two changes. What do you do?",
          options: [
            "Make one now, the other after the next 30+ trades",
            "Make both at once to save time",
            "Make neither, ever",
            "Ask a signal group",
          ],
          correctIndex: 0,
          explanation: "One change at a time is the only way to know what helped.",
        },
        {
          id: "fc-improve-2",
          prompt: "A new rule would have avoided all of last week's 4 losses. Is it a good rule?",
          options: [
            "Not necessarily: it may just fit last week",
            "Yes, clearly",
            "Yes, if it's complicated",
            "Only on Fridays",
          ],
          correctIndex: 0,
          explanation:
            "A rule tailored to recent losses often fails on new trades. Test it forward.",
        },
      ],
      task: "When you make your first change, write the date and the exact change in Notes, so you can compare before and after.",
    },
  ],
};
