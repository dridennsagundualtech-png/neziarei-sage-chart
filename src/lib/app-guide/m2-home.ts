import type { GuideModule } from "./types";

export const M2_HOME: GuideModule = {
  id: "home",
  title: "Home",
  blurb:
    "Trading sessions and the session filter, shared signals, news, and the admin tools that sit on Home.",
  lessons: [
    {
      id: "g-home-sessions",
      title: "Trading sessions and the session filter",
      summary: "Read the session card, and stop yourself analysing outside your hours.",
      where: "Home › Trading session",
      access: "everyone",
      open: { to: "/", label: "Open Home" },
      steps: [
        {
          title: "What the card shows",
          body: "The **Trading session** card shows the session open right now, the time in UTC, how long until it ends and when the next one starts. Between sessions it says **No session is currently open**.",
          mock: {
            where: "Home",
            parts: [
              { kind: "title", text: "Trading session", sub: "19:43 UTC" },
              { kind: "chips", items: ["New York session"], on: [0], hl: true },
              {
                kind: "rows",
                rows: [
                  {
                    left: "New York ends in 2h 17m",
                    right: "Asian starts in 4h 17m",
                    tone: "muted",
                  },
                ],
              },
            ],
          },
        },
        {
          title: "Session hours (UTC)",
          body: "The app uses these fixed UTC hours. In Philippine time (UTC+8) add eight hours.",
          bullets: [
            "**Asian**: 00:00–09:00 UTC (08:00–17:00 PH time).",
            "**London**: 08:00–17:00 UTC (16:00–01:00 PH time).",
            "**New York**: 13:00–22:00 UTC (21:00–06:00 PH time).",
            "**London + NY overlap**: 13:00–17:00 UTC (21:00–01:00 PH time).",
          ],
        },
        {
          title: "Only analyze during selected sessions",
          body: "Turn on **Only analyze during selected sessions**, then tap the sessions you trade. Outside them, Analyze and the Den screen refuse to run and show “Outside your selected trading sessions: analysis is paused.”",
          mock: {
            where: "Home › Trading session",
            parts: [
              {
                kind: "toggle",
                label: "Only analyze during selected sessions",
                on: true,
                hl: true,
              },
              {
                kind: "chips",
                items: ["Asian", "London", "New York", "London + NY overlap"],
                on: [1, 2],
              },
            ],
          },
          tip: "Pick at least one session. With none picked, the filter lets everything through. The filter is saved on this device only.",
        },
      ],
      checks: [
        {
          id: "g-home-sessions-1",
          prompt:
            "The filter is on with only London picked. It is 20:00 UTC. What happens when you tap Analyze setup?",
          options: [
            "It refuses: you are outside your selected sessions",
            "It runs normally",
            "It runs but marks the result Wait",
            "It switches the filter off",
          ],
          correctIndex: 0,
          explanation:
            "London ends at 17:00 UTC. Outside your picked sessions, analysis is paused.",
        },
        {
          id: "g-home-sessions-2",
          prompt: "The filter is on but no session is picked. What does it do?",
          options: [
            "Lets every time through",
            "Blocks all analysis",
            "Uses London by default",
            "Turns itself off and on again",
          ],
          correctIndex: 0,
          explanation:
            "With nothing picked, the filter cannot block anything, so every time passes.",
        },
      ],
    },
    {
      id: "g-home-signals",
      title: "Shared signals",
      summary: "Read what the admin shared with you, and keep the badge clear.",
      where: "Home › Shared signals",
      access: "signed-in",
      open: { to: "/", label: "Open Home" },
      steps: [
        {
          title: "Where shared signals appear",
          body: "Below the session card, **Shared signals** lists the Den analyses the admin shared with members, newest first. Sharing is in-app only (no email). Each row shows the symbol, direction, grade and when it was shared.",
          mock: {
            where: "Home › Shared signals",
            parts: [
              {
                kind: "title",
                text: "Shared signals",
                sub: "Analyses the admin shared with you (in-app only)",
              },
              {
                kind: "rows",
                rows: [
                  { left: "XAUUSD · POTENTIAL LONG · B", right: "2h ago" },
                  { left: "EURUSD · WAIT", right: "yesterday", tone: "muted" },
                ],
              },
              {
                kind: "buttons",
                items: [
                  { label: "Full view", tone: "secondary" },
                  { label: "Mark read", tone: "secondary" },
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Open the full view",
          body: "Tap **Full view** to read the share without leaving Home. It shows **Review first** (what to check before anything else), the **Trade plan**, **What to watch / quality notes** and the **Setup checklist**. **Hide full view** folds it away again.",
        },
        {
          title: "Mark them read",
          body: "**Mark read** clears one signal from the badge; **Mark all read** clears every one. Opening **Full view** also marks that signal read. Reading a signal is not the same as acting on it: every plan is conditional, so check it against the live chart first.",
          tip: "Open full re-runs the Den Analyzer on that symbol. That screen is admin-only, so members should use Full view.",
        },
      ],
      checks: [
        {
          id: "g-home-signals-1",
          prompt: "What does Mark all read change?",
          options: [
            "It clears the unread badge for every shared signal",
            "It deletes the signals",
            "It copies the plans to your journal",
            "It shares them with other members",
          ],
          correctIndex: 0,
          explanation: "Marking read only clears the unread count. The signals stay in the list.",
        },
        {
          id: "g-home-signals-2",
          prompt: "Which part of a shared signal tells you what to check before anything else?",
          options: ["Review first", "Setup checklist", "Market news", "Trading session"],
          correctIndex: 0,
          explanation:
            "Review first lists the conditions to confirm on the live chart before the plan means anything.",
        },
      ],
    },
    {
      id: "g-home-admin",
      title: "News, Pro Charts and Batch Den on Home",
      summary: "The news ticker for everyone, plus the admin buttons that live on Home.",
      where: "Home",
      access: "admin",
      open: { to: "/", label: "Open Home" },
      steps: [
        {
          title: "Market news",
          body: "The **Market news** strip scrolls the latest headlines. Hover over it or focus it to pause the scroll. If headlines cannot be loaded it says news is temporarily unavailable; the rest of the app keeps working.",
        },
        {
          title: "Admin buttons on Home",
          body: "Admins see two extra buttons under the news:",
          bullets: [
            "**Pro Charts: TradingView workspace** / **Hide Pro Charts**: opens the TradingView chart right on Home (it starts open).",
            "**Admin feature: market analysis** / **Hide admin market analysis**: opens the full Den Analyzer screen inside Home. The same screen is at its own page, Market.",
          ],
          mock: {
            where: "Home (admin)",
            parts: [
              { kind: "button", label: "Hide Pro Charts", tone: "secondary" },
              {
                kind: "button",
                label: "Admin feature: market analysis",
                tone: "secondary",
                hl: true,
              },
            ],
          },
        },
        {
          title: "Batch Den: analyze every symbol and share",
          body: "For admins the Shared signals card becomes **Analyze all symbols**. Pick a scan preset (Balanced, Scalper, Day Trader, Swing Trader or Maximum), tap **Analyze all symbols**, and Den runs on every symbol you store. Each result row has **Share in-app**, which sends it to members' Shared signals; **Open full** opens that symbol on the Den screen. **Shared with members** lists what you have already shared.",
          tip: "Only you see the batch scan. Members only see what you share. If Telegram is switched on in Settings, a share also posts a short text there.",
        },
      ],
      checks: [
        {
          id: "g-home-admin-1",
          prompt: "As admin, how do members receive a Batch Den result?",
          options: [
            "Tap Share in-app on that result row",
            "They see every batch result automatically",
            "Save it to your journal",
            "Copy the plan and email it",
          ],
          correctIndex: 0,
          explanation: "Members only see results you share with Share in-app.",
        },
        {
          id: "g-home-admin-2",
          prompt: "Where else can admins open the Den Analyzer besides Home?",
          options: [
            "The Market page",
            "Journal › Split",
            "Academy › Books",
            "Settings › Watchlist",
          ],
          correctIndex: 0,
          explanation:
            "The admin market analysis on Home and the Market page show the same Den screen.",
        },
      ],
    },
  ],
};
