import type { GuideModule } from "./types";

export const M8_HISTORY: GuideModule = {
  id: "history",
  title: "Journal: History",
  blurb:
    "Every saved read: finding it, recording how it ended, checking open trades against real candles, and cleaning up.",
  lessons: [
    {
      id: "g-hi-tour",
      title: "What History holds",
      summary: "Your reads, the admin's reads, and saved backtest runs.",
      where: "Journal › History",
      access: "signed-in",
      open: { to: "/journal", tab: "history", label: "Open History" },
      steps: [
        {
          title: "Everything you analyze lands here",
          body: "**History** is the first Journal tab. Every analysis from Analyze is saved here automatically with its screenshots, newest first. The line at the top tells you how many reads you have and reminds you to add how each one ended.",
        },
        {
          title: "Sources (admin)",
          body: "Admins see source chips at the top:",
          bullets: [
            "**My reads**: analyses from Analyze.",
            "**Admin reads**: saved reads from the admin Den Analyzer and Den live checks.",
            "**Backtest runs**: saved backtests (covered in the Backtest module).",
          ],
          mock: {
            where: "Journal › History",
            parts: [
              {
                kind: "tabs",
                items: [
                  "History",
                  "Stats",
                  "Backtest stats",
                  "Notes",
                  "Ask AI",
                  "Screenshots",
                  "Split",
                ],
                active: 0,
              },
              {
                kind: "chips",
                items: ["My reads 32", "Admin reads 14", "Backtest runs"],
                on: [0],
                hl: true,
              },
            ],
          },
          tip: "Members only see their own reads, so the chips are hidden for them.",
        },
        {
          title: "Each row at a glance",
          body: "A row shows the asset, direction, main timeframe, score (for example Score 11/16), when it was saved, and how it ended: an icon, a word (Open, Win, Loss…) and the result in R. The ending never relies on colour alone.",
        },
      ],
      checks: [
        {
          id: "g-hi-tour-1",
          prompt: "Do you need to save an analysis to History yourself?",
          options: [
            "No, it is saved automatically",
            "Yes, tap Save in Settings",
            "Yes, copy it to Notes",
            "Only premium users can save",
          ],
          correctIndex: 0,
          explanation: "Every finished analysis is stored in History with its screenshots.",
        },
        {
          id: "g-hi-tour-2",
          prompt: "Which History source holds saved backtests?",
          options: ["Backtest runs", "My reads", "Admin reads", "Screenshots"],
          correctIndex: 0,
          explanation:
            "Backtest runs lists saved backtests; reads are under My reads and Admin reads.",
        },
      ],
    },
    {
      id: "g-hi-find",
      title: "Searching and filtering",
      summary: "Find any read by asset, direction, timeframe or how it ended.",
      where: "Journal › History",
      access: "signed-in",
      open: { to: "/journal", tab: "history", label: "Open History" },
      steps: [
        {
          title: "Search",
          body: "Type in **Search asset, direction…** to narrow the list, for example “XAU”, “short” or “15M”. The counter changes to “12 of 32 reads”.",
        },
        {
          title: "Filter by how it ended",
          body: "The chips under the search filter by outcome: **All**, **Open**, **Win**, **Loss**, **Breakeven**, **Invalidated**, **Missed** and **No trade**. Tap **Open** to see every read you still need to close out.",
          mock: {
            where: "Journal › History",
            parts: [
              { kind: "field", label: "Search", value: "XAU" },
              {
                kind: "chips",
                items: [
                  "All",
                  "Open",
                  "Win",
                  "Loss",
                  "Breakeven",
                  "Invalidated",
                  "Missed",
                  "No trade",
                ],
                on: [1],
                hl: true,
              },
              { kind: "note", text: "4 of 32 reads", tone: "info" },
            ],
          },
        },
        {
          title: "Open a read",
          body: "Tap a row to expand it. You get the full result again (verdict, plan, checklist, sizing), its screenshots (tap one to open it full size) and the form to record how it ended.",
        },
      ],
      checks: [
        {
          id: "g-hi-find-1",
          prompt: "Which filter shows the reads you still need to record?",
          options: ["Open", "Win", "No trade", "All"],
          correctIndex: 0,
          explanation: "Open means no ending has been recorded yet.",
        },
        {
          id: "g-hi-find-2",
          prompt: "What appears when you tap a History row?",
          options: [
            "The full result, its screenshots and the record-a-result form",
            "A new analysis starts",
            "The row is deleted",
            "It is shared with members",
          ],
          correctIndex: 0,
          explanation: "Rows expand in place to show everything that was saved.",
        },
      ],
    },
    {
      id: "g-hi-record",
      title: "Recording how a trade ended",
      summary: "The single most important habit in the app.",
      where: "Journal › History › (open a read) › Journal this setup",
      access: "signed-in",
      open: { to: "/journal", tab: "history", label: "Open History" },
      steps: [
        {
          title: "Why it matters",
          body: "Stats, the Edge board, historical edge on new analyses and the daily loss limit all come from the endings you record. A journal full of Open reads gives no statistics; a journal where only wins are recorded gives lying ones.",
        },
        {
          title: "Fill in Journal this setup",
          body: "Open a read and scroll to **Journal this setup**. Choose an **Outcome**, type the **Result in R**, add **Notes** if you like, and tap **Save result** (“Journal updated: statistics recalculated.”).",
          mock: {
            where: "Journal this setup",
            parts: [
              {
                kind: "chips",
                label: "Outcome",
                items: ["Open", "Win", "Loss", "Breakeven", "Invalidated", "Missed", "No trade"],
                on: [1],
              },
              { kind: "field", label: "Result in R", value: "+2.1", hint: "+2.8 / -1 / 0" },
              { kind: "field", label: "Notes", value: "Took partials at TP1" },
              { kind: "button", label: "Save result", tone: "primary", hl: true },
            ],
          },
        },
        {
          title: "Which outcome to pick",
          body: "Use the one that matches what really happened:",
          bullets: [
            "**Win / Loss / Breakeven**: you took the trade and it closed. These need a result in R and are the only ones counted in statistics.",
            "**Invalidated**: the idea died before entry. A **Reason for invalidation** box appears.",
            "**Missed**: the entry never filled, or you were not there.",
            "**No trade**: you decided not to take it.",
            "**Open**: still running or undecided.",
          ],
        },
        {
          title: "Working out R",
          body: "R is the result divided by what you risked. Risk 10 dollars and make 21: +2.1R. Hit the full stop: -1R. Out at entry: 0. Costs can make a full loss slightly worse than -1R; type what really happened.",
          tip: "The field only accepts a number, like 2.8 or -1.",
        },
      ],
      checks: [
        {
          id: "g-hi-record-1",
          prompt: "You risked 20 dollars and the trade made 30. What do you type in Result in R?",
          options: ["1.5", "30", "0.67", "2"],
          correctIndex: 0,
          explanation: "30 ÷ 20 = 1.5R.",
        },
        {
          id: "g-hi-record-2",
          prompt: "Which outcomes count in your statistics?",
          options: [
            "Win, Loss and Breakeven with a result in R",
            "Every outcome",
            "Only Win",
            "Missed and Invalidated",
          ],
          correctIndex: 0,
          explanation:
            "Only closed trades with an R result are counted; others are kept for your records.",
        },
      ],
    },
    {
      id: "g-hi-check",
      title: "Check open trades",
      summary:
        "Let your stored candles tell you whether each open trade won, lost or never filled.",
      where: "Journal › History › Check open trades",
      access: "market-data",
      open: { to: "/journal", tab: "history", label: "Open History" },
      steps: [
        {
          title: "What it does",
          body: "**Check open trades** reads your stored market data from the moment each open trade was saved: did the entry fill, and did the stop or TP1 come first. It uses the same rules as the backtest. “Nothing changes until you apply it.”",
        },
        {
          title: "Run it",
          body: "Tap **Check N open trades** (“Reading the market data…”). Each trade comes back as a proposal: Win, Loss, Missed (the entry did not fill within 24 hours) or **Still open**.",
          mock: {
            where: "History › Check open trades",
            parts: [
              { kind: "button", label: "Check 5 open trades", tone: "secondary" },
              {
                kind: "rows",
                rows: [
                  { left: "XAUUSD long · Win", right: "+1.9R", tone: "bull" },
                  { left: "EURUSD short · Missed", right: "–", tone: "muted" },
                  { left: "GBPUSD long · Still open", right: "", tone: "muted" },
                ],
              },
              { kind: "button", label: "Apply all 2 results", tone: "primary", hl: true },
            ],
          },
        },
        {
          title: "Apply the proposals",
          body: "Tap **Apply** on one row, or **Apply all N results**. Wins and losses are recorded with their R; Missed is recorded without R. Look over each one first: if you closed a trade early by hand, record that result yourself instead.",
          tip: "Needs market data access, and the symbol must be in your market-data table.",
        },
      ],
      checks: [
        {
          id: "g-hi-check-1",
          prompt:
            "Check open trades proposes Win for a trade you actually closed early at +0.5R. What should you do?",
          options: [
            "Skip that proposal and record +0.5R yourself",
            "Apply it anyway",
            "Delete the read",
            "Run the check again",
          ],
          correctIndex: 0,
          explanation:
            "The check follows the plan. Your journal should record what you really did.",
        },
        {
          id: "g-hi-check-2",
          prompt: "Does the check change your journal by itself?",
          options: [
            "No, nothing changes until you apply",
            "Yes, instantly",
            "Only losses are written",
            "Only after midnight",
          ],
          correctIndex: 0,
          explanation: "It only proposes results. You choose what to apply.",
        },
      ],
    },
    {
      id: "g-hi-delete",
      title: "Selecting and deleting reads",
      summary: "Remove one read, or many at once.",
      where: "Journal › History",
      access: "signed-in",
      open: { to: "/journal", tab: "history", label: "Open History" },
      steps: [
        {
          title: "Delete one",
          body: "Open a read and tap **Delete this read**. Confirm in the dialog: “Its screenshots and result are removed too. This cannot be undone.”",
        },
        {
          title: "Delete several",
          body: "Tap **Select** above the list. Tick the reads you want (or **Select all** for everything matching your current search and filter; **Clear** unticks), then tap **Delete** and confirm. **Done** leaves selection mode.",
          mock: {
            where: "Journal › History",
            parts: [
              {
                kind: "buttons",
                items: [
                  { label: "Select all", tone: "ghost" },
                  { label: "Done", tone: "secondary" },
                ],
                hl: true,
              },
              {
                kind: "rows",
                rows: [
                  { left: "☑ EURUSD · Wait", right: "Open" },
                  { left: "☑ BTCUSD · No trade", right: "No trade" },
                  { left: "☐ XAUUSD · Long", right: "Win" },
                ],
              },
            ],
          },
          tip: "Filter first (for example No trade), then Select all, to clean up only that group.",
        },
        {
          title: "Think before deleting losses",
          body: "Deleting losing reads makes your statistics look better than reality. Delete duplicates and test runs, not bad trades.",
        },
      ],
      checks: [
        {
          id: "g-hi-delete-1",
          prompt: "You search “BTC” and tap Select all. What gets selected?",
          options: [
            "Only the reads matching your search and filter",
            "Every read in your journal",
            "Only open reads",
            "Nothing",
          ],
          correctIndex: 0,
          explanation: "Select all works on the list you are looking at.",
        },
        {
          id: "g-hi-delete-2",
          prompt: "Can a deleted read be restored?",
          options: [
            "No, it cannot be undone",
            "Yes, from Settings",
            "Yes, within 30 days",
            "Only by an admin",
          ],
          correctIndex: 0,
          explanation: "Deleting removes the read and its screenshots for good.",
        },
      ],
    },
  ],
};
