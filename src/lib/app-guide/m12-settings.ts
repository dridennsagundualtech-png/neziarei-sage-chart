import type { GuideModule } from "./types";

export const M12_SETTINGS: GuideModule = {
  id: "settings",
  title: "Settings in depth",
  blurb:
    "Every analysis switch, the watchlist, Telegram and the glossary, with what each one changes.",
  lessons: [
    {
      id: "g-se-analysis",
      title: "The Analysis switches",
      summary: "Strict, volume, learning, beginner, the session nudge and the win-rate threshold.",
      where: "Settings › Analysis",
      access: "signed-in",
      open: { to: "/settings", label: "Open Settings" },
      steps: [
        {
          title: "Strict mode (on by default)",
          body: "“Refuse to guess. Ask for more screenshots when context is missing.” In Den, a directional call scoring under the strict-mode floor (7/16 by default) becomes Wait.",
          mock: {
            where: "Settings › Analysis",
            parts: [
              {
                kind: "toggle",
                label: "Strict mode",
                on: true,
                hint: "Refuse to guess.",
                hl: true,
              },
              { kind: "toggle", label: "Require volume confirmation", on: false },
              { kind: "toggle", label: "Learning mode", on: true },
              { kind: "toggle", label: "Beginner mode", on: true },
            ],
          },
        },
        {
          title: "Require volume confirmation (off)",
          body: "“Treat missing volume data as an unmet checklist component.” Turn it on only if your screenshots always show volume, or the Volume point will often be lost.",
        },
        {
          title: "Learning mode and Beginner mode (on)",
          body: "**Learning mode** adds guided walkthroughs, concept cards, the educational plan and Human vs AI to every analysis. **Beginner mode** uses simple words first; turn it off for technical explanations.",
        },
        {
          title: "Session and day quality nudge (off)",
          body: "When on, Den may add or remove up to 2 checklist points based on the UTC session (the London + New York overlap is preferred) and the weekday (mid-week preferred; Friday and the weekend softer). The checklist items stay the same; only the final score and grade can shift slightly.",
        },
        {
          title: "Minimum setups before showing a win rate (100)",
          body: "Below this many comparable finished setups, ChartPilot says there is not enough history instead of showing a misleading percentage. It also sets the Stats sample warning and the Edge board's “enough data” size.",
        },
      ],
      checks: [
        {
          id: "g-se-analysis-1",
          prompt:
            "Which switch can move Den's score by up to 2 points based on session and weekday?",
          options: [
            "Session and day quality nudge",
            "Strict mode",
            "Beginner mode",
            "Learning mode",
          ],
          correctIndex: 0,
          explanation: "The nudge adjusts only the final score; the checklist items do not change.",
        },
        {
          id: "g-se-analysis-2",
          prompt:
            "Your screenshots rarely show volume. What happens if you turn on Require volume confirmation?",
          options: [
            "Volume will usually count as unmet, lowering scores",
            "Volume is added automatically",
            "Nothing changes",
            "Analysis refuses to run",
          ],
          correctIndex: 0,
          explanation: "Missing volume is then treated as an unmet checklist component.",
        },
      ],
    },
    {
      id: "g-se-watchlist",
      title: "Watchlist, Telegram and the glossary",
      summary: "Your assets and timeframes, posting shares to Telegram, and every term explained.",
      where: "Settings › Watchlist, Telegram, Every word, explained simply",
      access: "signed-in",
      open: { to: "/settings", label: "Open Settings" },
      steps: [
        {
          title: "Watchlist",
          body: "**Watchlist assets** are the symbols you trade: type one (for example EURUSD) to add it, tap one to turn it on or off. **Timeframes** are the ones offered when you tag screenshots. Both are also used when the app scans for setups (scans check up to 12 assets).",
          mock: {
            where: "Settings › Watchlist",
            parts: [
              { kind: "field", label: "Watchlist assets", value: "Type a symbol, e.g. EURUSD" },
              {
                kind: "chips",
                items: ["BTCUSD", "ETHUSD", "XAUUSD", "EURUSD", "NVDA", "AMD"],
                on: [2, 3],
                hl: true,
              },
              {
                kind: "chips",
                label: "Timeframes",
                items: ["1D", "4H", "1H", "15M", "5M"],
                on: [0, 1, 2, 3, 4],
              },
            ],
          },
        },
        {
          title: "Telegram (optional)",
          body: "Turn on **Notify Telegram on share** to also post a short text to Telegram when a signal is shared in the app. Put one or more **Chat IDs** separated by commas. Message your bot first, then get the chat id (for example with @userinfobot); group and channel ids often start with -100.",
          tip: "It needs a bot token saved as TELEGRAM_BOT_TOKEN in the project's Lovable secrets. Sharing in the app works either way.",
        },
        {
          title: "Every word, explained simply",
          body: "At the bottom, **Show all N terms** opens the glossary. Search with **Search terms**; each entry has a simple version and more detail. **Hide the glossary** closes it.",
        },
      ],
      checks: [
        {
          id: "g-se-watchlist-1",
          prompt: "Where do the timeframes offered when you tag a screenshot come from?",
          options: [
            "Settings › Watchlist › Timeframes",
            "The AI picks them",
            "Your last backtest",
            "Pro Charts",
          ],
          correctIndex: 0,
          explanation: "The upload timeframe box offers your watchlist timeframes.",
        },
        {
          id: "g-se-watchlist-2",
          prompt: "Telegram sharing is off. Can members still see your shared signals in the app?",
          options: [
            "Yes, in-app sharing works either way",
            "No",
            "Only by email",
            "Only admins can see them",
          ],
          correctIndex: 0,
          explanation: "Telegram is an extra copy. In-app sharing does not depend on it.",
        },
      ],
    },
  ],
};
