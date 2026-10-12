import type { GuideModule } from "./types";

export const M13_ADMIN: GuideModule = {
  id: "admin",
  title: "Admin tools",
  blurb: "Premium codes, managing member accounts, and Pro Charts.",
  lessons: [
    {
      id: "g-ad-codes",
      title: "Premium code generator",
      summary: "Create codes with a duration, a usage limit and an expiry.",
      where: "Settings › Admin tools › Premium code generator",
      access: "admin",
      open: { to: "/admin", label: "Open admin tools" },
      steps: [
        {
          title: "Fill in the form",
          body: "Open **Premium code generator** from Settings › Admin tools. The fields (defaults in brackets):",
          bullets: [
            "**Premium lasts (days)** (30): how long premium runs after someone redeems.",
            "**How many codes** (1): how many separate codes to make at once.",
            "**Uses per code** (1): how many accounts can redeem the same code.",
            "**Code itself expires in (days, 0 = never)** (0): after this the code stops working, even unused.",
            "**Code prefix** (CP) and **Note (optional)**: to recognise codes later.",
          ],
          mock: {
            where: "Admin › Premium code generator",
            parts: [
              { kind: "field", label: "Premium lasts (days)", value: "30" },
              { kind: "field", label: "Uses per code", value: "1" },
              { kind: "field", label: "Code itself expires in (days, 0 = never)", value: "14" },
              { kind: "button", label: "Generate codes", tone: "primary", hl: true },
            ],
          },
        },
        {
          title: "Existing codes",
          body: "Tap **Generate codes**. New codes appear under **Existing codes** with their uses, expiry and note. Tap the copy icon to copy one (“Code copied.”), or the delete icon to remove it.",
        },
      ],
      checks: [
        {
          id: "g-ad-codes-1",
          prompt: "You want one code that 5 friends can each redeem. What do you set?",
          options: [
            "How many codes 1, Uses per code 5",
            "How many codes 5, Uses per code 1",
            "Premium lasts 5 days",
            "Code prefix 5",
          ],
          correctIndex: 0,
          explanation: "Uses per code is how many accounts can redeem the same code.",
        },
        {
          id: "g-ad-codes-2",
          prompt: "What does “Code itself expires in 0 days” mean?",
          options: [
            "The code never expires",
            "It expires immediately",
            "Premium lasts 0 days",
            "It can be used 0 times",
          ],
          correctIndex: 0,
          explanation: "0 means the code has no expiry date of its own.",
        },
      ],
    },
    {
      id: "g-ad-accounts",
      title: "Managing member accounts",
      summary: "Extend premium, hide pages and switch on market data per account.",
      where: "Admin › Accounts",
      access: "admin",
      open: { to: "/admin", label: "Open admin tools" },
      steps: [
        {
          title: "Find an account",
          body: "Type part of an email in **Search by email** and search. Each account shows its email, premium status, last sign-in and the last code it used.",
        },
        {
          title: "Premium days",
          body: "Type a number and tap **Add days** to extend premium by that many days, or pick a date and tap **Set end date** to set an exact end. The card shows when premium ends.",
        },
        {
          title: "Pages and market data",
          body: "**Pages this account can see** has a button each for Analyze, Academy and Journal. Tap one to hide it for that account (it shows crossed out); tap again to bring it back. Admin accounts have no page buttons. **Market data: on / off** gives or removes Market data mode on Analyze and Check open trades.",
          mock: {
            where: "Admin › Accounts",
            parts: [
              {
                kind: "card",
                title: "member@example.com",
                lines: ["Premium until 12 Nov · last sign-in 11 Oct · last code CP-7QX2"],
              },
              {
                kind: "chips",
                label: "Pages this account can see",
                items: ["Analyze", "Academy", "Journal"],
                on: [0, 1, 2],
              },
              { kind: "button", label: "Market data: off", tone: "secondary", hl: true },
            ],
          },
          tip: "Settings can never be hidden, so a member can always reach their account and premium code box.",
        },
      ],
      checks: [
        {
          id: "g-ad-accounts-1",
          prompt: "A member asks why Analyze vanished from their bar. What is the likely cause?",
          options: [
            "Analyze is switched off under Pages this account can see",
            "Their phone is offline",
            "Strict mode is on",
            "They have no screenshots",
          ],
          correctIndex: 0,
          explanation: "Hidden pages are removed from the bar for that account.",
        },
        {
          id: "g-ad-accounts-2",
          prompt: "How do you give one member Market data mode?",
          options: [
            "Turn Market data on for their account",
            "Give them a premium code",
            "Share a signal",
            "Change your own Settings",
          ],
          correctIndex: 0,
          explanation: "Market data access is a per-account switch on the admin page.",
        },
      ],
    },
    {
      id: "g-ad-charts",
      title: "Pro Charts",
      summary: "The TradingView workspace, saving pictures to the journal, overview and heatmap.",
      where: "Home › Pro Charts, or Settings › Admin tools › Pro Charts",
      access: "admin",
      open: { to: "/charts", label: "Open Pro Charts" },
      steps: [
        {
          title: "The chart",
          body: "**Pro Charts** is a TradingView workspace with full drawing tools and multi-timeframe charting. Quick symbols include BTCUSDT, ETHUSDT, XAUUSD, EURUSD, NAS100 and SPX500.",
        },
        {
          title: "Save a picture to the journal",
          body: "**Screenshot to journal** captures the chart and saves it to **Journal › Screenshots**. If screen capture is not supported on your device, use **Upload image** to pick a picture instead.",
          mock: {
            where: "Pro Charts",
            parts: [
              {
                kind: "buttons",
                items: [
                  { label: "Screenshot to journal", tone: "primary" },
                  { label: "Upload image", tone: "secondary" },
                ],
                hl: true,
              },
              {
                kind: "card",
                title: "Market overview",
                lines: ["Mini charts for the main markets"],
              },
              {
                kind: "card",
                title: "Market heatmap",
                lines: ["Which markets are up or down today"],
              },
            ],
          },
        },
        {
          title: "Overview and heatmap",
          body: "Below the chart, **Market overview** shows mini charts of the main markets and **Market heatmap** shows which are up or down at a glance.",
        },
      ],
      checks: [
        {
          id: "g-ad-charts-1",
          prompt:
            "Screen capture isn't supported on your phone. How do you still save a chart picture?",
          options: ["Use Upload image", "Use Save rulebook", "Use Analyze setup", "You can't"],
          correctIndex: 0,
          explanation: "Upload image saves a picture you already have to Journal › Screenshots.",
        },
        {
          id: "g-ad-charts-2",
          prompt: "Where do Pro Charts pictures go?",
          options: ["Journal › Screenshots", "Journal › Notes", "History", "Books"],
          correctIndex: 0,
          explanation: "Both buttons save to the Screenshots tab.",
        },
      ],
    },
  ],
};
