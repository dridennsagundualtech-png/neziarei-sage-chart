import type { GuideModule } from "@/lib/app-guide/types";
import { calc, flow } from "@/lib/breakthrough/types";

export const FC7_LIVE: GuideModule = {
  id: "fc-live",
  title: "Going live, small",
  blurb:
    "When you're ready for real money, how small to start, handling emotions, and when to step back.",
  lessons: [
    {
      id: "fc-golive",
      title: "The go-live checklist",
      summary: "Real money only when your demo numbers and your discipline say so.",
      where: "Journal › Stats",
      access: "everyone",
      open: { to: "/journal", tab: "stats", label: "Open Stats" },
      steps: [
        {
          title: "Every box ticked",
          body: "Move to real money only when all of these are true:",
          visual: flow({
            layout: "grid",
            nodes: [
              { label: "About 100 demo trades", note: "Same rules throughout.", tone: "primary" },
              { label: "Average R above 0", note: "After costs, honestly recorded.", tone: "bull" },
              { label: "Rules followed 9 in 10", note: "From your journal notes.", tone: "bull" },
              {
                label: "A drawdown you can stand",
                note: "You lived through the worst stretch calmly.",
                tone: "warn",
              },
            ],
          }),
        },
        {
          title: "Money you can afford to lose",
          body: "The account must hold money you could lose completely without it hurting your bills, savings or family. Never borrowed money, never money set aside for something else. If losing it would change your life, it's not trading money.",
        },
        {
          title: "If the boxes aren't ticked",
          body: "Keep practising. There is no deadline. Every month on demo costs nothing; every month of live trading without an edge costs money.",
        },
      ],
      checks: [
        {
          id: "fc-golive-1",
          prompt: "60 demo trades, average +0.3R, rules followed 95% of the time. Ready?",
          options: [
            "Not yet: keep going to about 100 trades",
            "Yes, go big",
            "Yes, but without stops",
            "Never",
          ],
          correctIndex: 0,
          explanation: "It looks promising, but 60 trades is still an early read.",
        },
        {
          id: "fc-golive-2",
          prompt: "Which money is fine to trade with?",
          options: [
            "Money you could lose completely without it hurting your life",
            "Next month's rent",
            "A loan",
            "Emergency savings",
          ],
          correctIndex: 0,
          explanation: "Only money you can afford to lose entirely.",
        },
      ],
    },
    {
      id: "fc-small",
      title: "Start smaller than you think",
      summary: "The first live trades are for practising your nerves, not making money.",
      where: "Settings and MT5",
      access: "everyone",
      open: { to: "/settings", label: "Open Settings" },
      steps: [
        {
          title: "Smallest size first",
          body: "Start at 0.25–0.5% risk per trade, or the broker's minimum of 0.01 lot if that's smaller. Put the live balance into **Settings › Account balance**, so every position size is right.",
          visual: calc("sizing"),
        },
        {
          title: "Live feels different",
          body: "The same setup feels very different with real money. You'll want to close winners early and move stops. That's why the first 30 live trades are about doing exactly what you did on demo. Compare your live journal with your demo journal after 30 trades.",
        },
        {
          title: "Growing slowly",
          visual: flow({
            nodes: [
              { label: "0.25–0.5%", note: "First 50 live trades.", tone: "primary" },
              { label: "0.75%", note: "Only if average R > 0 and rules followed." },
              { label: "1%", note: "After another 50 good trades.", tone: "bull" },
              { label: "Back down", note: "After a bad stretch, go back a step.", tone: "warn" },
            ],
          }),
          body: "Only raise risk after about 50 live trades with a positive average R and rules followed. Raise it in small steps (for example 0.5% to 0.75%), never after a big win, and go back down after a bad stretch.",
        },
      ],
      checks: [
        {
          id: "fc-small-1",
          prompt:
            "After 10 great live trades you want to triple your size. What does the course say?",
          options: [
            "Wait for about 50 live trades, then raise in small steps",
            "Triple it now",
            "Double it, as a compromise",
            "Remove your daily limit",
          ],
          correctIndex: 0,
          explanation:
            "Ten trades is noise, and raising size after a hot streak is a classic way to give it back.",
        },
        {
          id: "fc-small-2",
          prompt: "Why compare your live journal with your demo journal?",
          options: [
            "To see whether nerves are changing how you trade",
            "Brokers require it",
            "To copy demo trades to live",
            "It changes the spreads",
          ],
          correctIndex: 0,
          explanation:
            "If live results are much worse with the same plan, the difference is usually behaviour.",
        },
      ],
    },
    {
      id: "fc-mind",
      title: "Emotions with real money",
      summary: "Fear, greed and tilt, and the simple rules that keep them from steering.",
      where: "Anywhere",
      access: "everyone",
      steps: [
        {
          title: "The three that cost the most",
          body: "**Fear** closes winners early and skips good setups. **Greed** sizes up and holds past the target. **Tilt** is the angry state after losses, where you trade to feel better instead of to follow the plan.",
          visual: flow({
            layout: "grid",
            nodes: [
              { label: "Fear", note: "Closes winners early, skips good setups.", tone: "warn" },
              { label: "Greed", note: "Bigger size, holding past the target.", tone: "warn" },
              { label: "Tilt", note: "Trading to win losses back.", tone: "bear" },
              { label: "The fix", note: "Rules decided calmly, before the session.", tone: "bull" },
            ],
          }),
        },
        {
          title: "Rules beat willpower",
          body: "You won't out-think emotions in the moment. Instead, decide beforehand: the daily loss limit stops you after −2R, the card decides entries, the position size is the app's number. When feelings run high, you just follow what was decided calmly.",
        },
        {
          title: "Trading is not income yet",
          body: "Don't count on trading to pay bills, at least for the first year. Needing a win makes every decision worse. Treat it as a skill you are building, with a small budget for mistakes.",
        },
      ],
      checks: [
        {
          id: "fc-mind-1",
          prompt:
            "You've hit your 2R daily loss limit and feel sure the next trade will win. What do you do?",
          options: [
            "Stop for the day",
            "One more, smaller",
            "One more, bigger",
            "Switch to another symbol",
          ],
          correctIndex: 0,
          explanation: "The limit exists for exactly this moment.",
        },
        {
          id: "fc-mind-2",
          prompt: "What keeps emotions from steering your trades best?",
          options: [
            "Rules decided before the session",
            "Trying harder to stay calm",
            "More screen time",
            "Bigger targets",
          ],
          correctIndex: 0,
          explanation:
            "Decisions made calmly beforehand hold up better than willpower in the moment.",
        },
      ],
    },
    {
      id: "fc-step-back",
      title: "When to step back",
      summary: "Knowing when to return to demo, or to stop, is part of being a good trader.",
      where: "Journal › Stats",
      access: "everyone",
      steps: [
        {
          title: "Back to demo",
          visual: flow({
            layout: "grid",
            nodes: [
              { label: "Live much worse than demo", note: "After 30+ live trades.", tone: "warn" },
              { label: "Rules broken", note: "More than 1 trade in 10.", tone: "bear" },
              {
                label: "Deepest drawdown yet",
                note: "Deeper than anything on demo.",
                tone: "bear",
              },
              { label: "Then", note: "Two weeks on demo, compare journals.", tone: "bull" },
            ],
          }),
          body: "Go back to demo if live results are clearly worse than demo after 30+ live trades, if you break your rules more than 1 in 10 times, or after a losing stretch deeper than anything you saw on demo. It's not a failure; it's what professionals do when something is off.",
        },
        {
          title: "Re-checking the plan",
          body: "If after 100+ demo or live trades your average R is still at or below 0, the plan doesn't work for you as it is. Change one thing, measure again. If several honest attempts over months don't produce a positive average, it's fine to conclude trading isn't for you, or not right now.",
          visual: calc("expectancy"),
        },
        {
          title: "What you keep either way",
          body: "Risk thinking, patience, record-keeping and honesty about numbers are useful far beyond trading. And you'll have found out without losing much, which most people who try trading can't say.",
        },
      ],
      checks: [
        {
          id: "fc-step-back-1",
          prompt:
            "After 40 live trades your results are far worse than on demo with the same plan. What now?",
          options: [
            "Go back to demo and compare your journals",
            "Increase size to recover",
            "Drop the stop-loss",
            "Switch to a new setup on live",
          ],
          correctIndex: 0,
          explanation: "A big gap usually means behaviour changed under pressure. Find it on demo.",
        },
        {
          id: "fc-step-back-2",
          prompt: "Is deciding to stop trading after honest, measured attempts a failure?",
          options: [
            "No, it's a sound decision based on evidence",
            "Yes, always",
            "Only if you lost money",
            "Only on Fridays",
          ],
          correctIndex: 0,
          explanation: "Stopping on evidence protects your money; that's good judgement.",
        },
      ],
      task: "Write your own 'step back' rule in Notes now, while you're calm: for example, 'If I break my rules 3 times in a week, I go back to demo for two weeks.'",
    },
  ],
};
