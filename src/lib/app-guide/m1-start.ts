import type { GuideModule } from "./types";

export const M1_START: GuideModule = {
  id: "start",
  title: "Getting started",
  blurb:
    "What the app does, who can use which part, where your data lives, and the five settings to fill in first.",
  lessons: [
    {
      id: "g-start-tour",
      title: "A tour of the five main screens",
      summary: "Where everything lives, and what the question marks do.",
      where: "Bottom bar (phone) or top bar (computer)",
      access: "everyone",
      open: { to: "/", label: "Open Home" },
      steps: [
        {
          title: "Five places, one job each",
          body: "ChartPilot has five main screens. On a phone they sit in the bar at the bottom; on a computer they sit along the top.",
          bullets: [
            "**Home**: which trading session is open, signals shared with you, and market news.",
            "**Analyze**: run your charts through the fixed 16-point checklist and get a conditional trade plan.",
            "**Academy**: lessons, books, quizzes, AI practice, and this App guide.",
            "**Journal**: every read you saved, how it ended, your statistics, notes, Ask AI, screenshots and the profit split calculator.",
            "**Settings**: your account, risk rules, how strict the analyzer is, your watchlist and the glossary.",
          ],
          mock: {
            where: "Bottom bar",
            parts: [
              {
                kind: "tabs",
                items: ["Home", "Analyze", "Academy", "Journal", "Settings"],
                active: 0,
                hl: true,
              },
            ],
          },
        },
        {
          title: "A red number on Home",
          body: "When an admin shares a signal with you, a small red number appears on the **Home** icon (and next to the ChartPilot logo on a phone). It counts unread shared signals and clears when you mark them read.",
          tip: "It checks for new signals about once a minute while the app is open.",
        },
        {
          title: "Question marks explain words",
          body: "Most terms on screen have a small question mark next to them. Tap it to see **In simple words** and **A bit more detail**. The same explanations are collected in Settings under **Every word, explained simply**, where you can search them.",
          mock: {
            where: "Any screen",
            parts: [
              { kind: "title", text: "Checklist score  ⓘ" },
              {
                kind: "card",
                title: "In simple words",
                lines: ["How many checklist items the chart actually shows."],
                hl: true,
              },
              {
                kind: "card",
                title: "A bit more detail",
                lines: ["Each component has a maximum; the total is out of 16."],
              },
            ],
          },
        },
        {
          title: "What the app will never do",
          body: "ChartPilot is an educational analysis tool. Every plan is conditional, a score is not a win probability, and nothing in the app places orders. The line **Analysis tool, not advice** in the top bar and the footer on every page say the same thing.",
        },
      ],
      checks: [
        {
          id: "g-start-tour-1",
          prompt: "Where do you record how a saved read ended?",
          options: ["Journal", "Home", "Academy", "Settings"],
          correctIndex: 0,
          explanation:
            "Every saved read lives in Journal › History, where you set its outcome and result in R.",
        },
        {
          id: "g-start-tour-2",
          prompt: "What does the red number on the Home icon count?",
          options: [
            "Unread signals an admin shared with you",
            "Open trades in your journal",
            "Lessons left in the Academy",
            "News headlines since yesterday",
          ],
          correctIndex: 0,
          explanation:
            "The badge counts unread shared signals. Mark them read on Home and it clears.",
        },
      ],
    },
    {
      id: "g-start-access",
      title: "Accounts, premium and access levels",
      summary: "Free, premium, market data and admin: what each one opens.",
      where: "Settings › Account",
      access: "everyone",
      open: { to: "/settings", label: "Open Settings" },
      steps: [
        {
          title: "Sign in or create an account",
          body: "Tap **Sign in or create an account** in Settings (or any sign-in prompt). Enter your email and a password of at least 6 characters, or use **Continue with Google**. Switch between **Sign in** and **Create account** with the link under the button.",
          mock: {
            where: "Sign in",
            parts: [
              {
                kind: "title",
                text: "Sign in",
                sub: "Sign in to save your analyses, journal, and premium access across devices.",
              },
              { kind: "field", label: "Email", value: "you@example.com" },
              { kind: "field", label: "Password", value: "••••••" },
              { kind: "button", label: "Sign in", tone: "primary", hl: true },
              { kind: "button", label: "Continue with Google", tone: "secondary" },
            ],
          },
        },
        {
          title: "The four access levels",
          body: "What you can open depends on your account:",
          bullets: [
            "**Signed out**: you can look around, but the Academy, Journal, notes and statistics ask you to sign in.",
            "**Free account**: Academy lessons, books and quizzes, History, Stats, Notes, Screenshots and Split.",
            "**Premium**: adds AI chart analysis on Analyze, AI practice in the Academy and Ask AI in the Journal.",
            "**Market data access**: an admin switches this on per account. It unlocks **Market data** mode on Analyze and **Check open trades** in History.",
            "**Admin**: premium is always on, plus the Den Analyzer screen, Backtest, Pro Charts, Batch Den sharing and the admin tools.",
          ],
        },
        {
          title: "Redeem a premium code",
          body: "In Settings, the account card shows your status: **Free account: premium not active**, **Premium active until …** or **Admin: premium always on**. Type your code in **Premium code** and confirm. Redeeming while premium is still active adds the extra days on top of what you have.",
          mock: {
            where: "Settings › Account",
            parts: [
              { kind: "note", text: "Free account: premium not active", tone: "info" },
              { kind: "field", label: "Premium code", value: "CP-XXXX-XXXX", hl: true },
              { kind: "button", label: "Sign out", tone: "ghost" },
            ],
          },
        },
        {
          title: "When a page is hidden",
          body: "An admin can hide Analyze, Academy or Journal for an account. A hidden page disappears from the bar, and if you open it directly you see: “An admin has hidden this page for your account.” Settings can never be hidden, so you can always reach your account.",
        },
      ],
      checks: [
        {
          id: "g-start-access-1",
          prompt: "You redeem a 30-day code while 10 days of premium remain. What happens?",
          options: [
            "The 30 days are added on top, so about 40 days remain",
            "Premium resets to 30 days",
            "The code is rejected until premium ends",
            "Only the code with the longer duration counts",
          ],
          correctIndex: 0,
          explanation:
            "Redeeming while premium is active adds the new days on top of the time you already have.",
        },
        {
          id: "g-start-access-2",
          prompt: "What does “Market data access” unlock for a member?",
          options: [
            "Market data mode on Analyze and Check open trades in History",
            "The admin code generator",
            "Ask AI in the Journal",
            "The Breakthrough lesson",
          ],
          correctIndex: 0,
          explanation:
            "An admin turns market data on per account. It opens analysis from stored candles and the open-trade checker.",
        },
      ],
    },
    {
      id: "g-start-data",
      title: "Where your data is saved",
      summary: "What follows your account to every device, and what stays on one phone.",
      where: "Whole app",
      access: "signed-in",
      steps: [
        {
          title: "Saved to your account",
          body: "These are stored online with your account, so you see them on the web app and the Android app alike:",
          bullets: [
            "Every analysis you run, with its screenshots, outcome and result in R.",
            "Your settings, including the Den Analyzer rulebook and saved rulebook presets.",
            "Notes, including AI QnA summaries.",
            "Academy progress: finished lessons, quiz results, topic strength and this guide's progress.",
            "Saved journal screenshots and saved backtest runs.",
          ],
        },
        {
          title: "Saved on this device only",
          body: "A few conveniences live only in the browser or phone you used:",
          bullets: [
            "The Ask AI conversation (the summary you save to Notes is synced).",
            "Split calculator saved trades.",
            "Your own candle presets on the Den Analyzer screen.",
            "The trading-session filter on Home.",
          ],
          tip: "Clearing the app's storage or reinstalling removes these. Save anything important to Notes.",
        },
        {
          title: "If saving fails",
          body: "When an analysis finishes but cannot be stored you see “Analysis finished but saving to your journal failed.” The result stays on screen, so copy the plan with **Copy plan & alerts** before leaving, then check your connection and that you are signed in.",
        },
      ],
      checks: [
        {
          id: "g-start-data-1",
          prompt:
            "You switch from the web app to the Android app. Which of these will you NOT find there?",
          options: [
            "Your current Ask AI conversation",
            "Your saved notes",
            "Your analyses and their outcomes",
            "Your Den Analyzer rulebook",
          ],
          correctIndex: 0,
          explanation:
            "The Ask AI chat stays on the device. Summarize & save it to Notes to keep it everywhere.",
        },
        {
          id: "g-start-data-2",
          prompt: "Where are Split calculator saved trades kept?",
          options: ["On this device only", "In your account", "In Notes", "In History"],
          correctIndex: 0,
          explanation:
            "The Split screen says it: saved trades stay on this device after you refresh.",
        },
      ],
    },
    {
      id: "g-start-setup",
      title: "First setup: fill these in before your first analysis",
      summary: "Balance, risk, minimum R:R, daily loss limit and break-even, then Save.",
      where: "Settings › Risk",
      access: "signed-in",
      open: { to: "/settings", label: "Open Settings" },
      steps: [
        {
          title: "Account balance and currency",
          body: "Enter your **Account balance**, then type its currency code in the small box next to it (USD, PHP, EUR…). Position size on every plan is calculated from these two, so a wrong currency gives a wrong size. You can also change the balance from the **Account balance** card on Analyze.",
          mock: {
            where: "Settings › Risk",
            parts: [
              {
                kind: "title",
                text: "Risk",
                sub: "How much you put on the line, and when to stop.",
              },
              { kind: "field", label: "Account balance", value: "1,000  USD", hl: true },
              {
                kind: "field",
                label: "Risk per trade",
                value: "1 %",
                hint: "Most people keep this at 1% or less.",
              },
              { kind: "field", label: "Minimum R:R", value: "2" },
            ],
          },
        },
        {
          title: "Risk per trade and minimum R:R",
          body: "**Risk per trade** is the percent of your balance you are willing to lose if the stop is hit. It must be above 0 and at most 10. **Minimum R:R** (default 2) is the reward-to-risk a plan needs; plans below it get an unfavourable R:R warning and score lower on the Risk / Reward item.",
        },
        {
          title: "Daily loss limit and break-even reminder",
          body: "**Daily loss limit** (default 3R) pauses Analyze and the Den screen once your journal shows that many R lost today. **Move stop to break-even at** (default 1R) adds a reminder to every plan to consider moving the stop to entry once price is that far in profit. Set either to 0 to turn it off.",
        },
        {
          title: "Save your changes",
          body: "As soon as you change something, an **Unsaved changes** bar appears at the bottom with **Discard** and **Save**. Nothing is stored until you tap **Save** and see “Settings saved.”",
          mock: {
            where: "Settings",
            parts: [
              { kind: "note", text: "Unsaved changes", tone: "warn" },
              {
                kind: "buttons",
                items: [
                  { label: "Discard", tone: "ghost" },
                  { label: "Save", tone: "primary" },
                ],
                hl: true,
              },
            ],
          },
          tip: "Leaving Settings without saving throws the changes away.",
        },
      ],
      checks: [
        {
          id: "g-start-setup-1",
          prompt: "You set Daily loss limit to 0. What happens?",
          options: [
            "The daily loss pause is turned off",
            "You can never analyze",
            "The app uses the default 3R",
            "Every loss pauses the app",
          ],
          correctIndex: 0,
          explanation:
            "0 turns the daily loss limit off. Any positive number is the R loss that triggers the pause.",
        },
        {
          id: "g-start-setup-2",
          prompt:
            "You changed Risk per trade and left Settings without tapping Save. What is stored?",
          options: ["The old value", "The new value", "Zero", "The default 1%"],
          correctIndex: 0,
          explanation: "Settings are only stored when you tap Save on the Unsaved changes bar.",
        },
      ],
    },
  ],
};
