import type { GuideModule } from "./types";

export const M10_TOOLS: GuideModule = {
  id: "tools",
  title: "Journal: Notes, Ask AI, Screenshots, Split",
  blurb:
    "Writing notes, asking the AI tutor and saving summaries, managing chart pictures and splitting profit.",
  lessons: [
    {
      id: "g-tl-notes",
      title: "Notes",
      summary: "Write, format, save and delete notes, and find your AI summaries.",
      where: "Journal › Notes",
      access: "signed-in",
      open: { to: "/journal", tab: "notes", label: "Open Notes" },
      steps: [
        {
          title: "My notes and AI QnA",
          body: "**Notes** has two views at the top. **My notes** is free writing for lessons, mistakes and ideas. **AI QnA** holds the summaries you save from Ask AI.",
          mock: {
            where: "Journal › Notes",
            parts: [
              {
                kind: "chips",
                label: "Which notes",
                items: ["My notes", "AI QnA"],
                on: [0],
                hl: true,
              },
              { kind: "button", label: "New note", tone: "primary" },
              {
                kind: "rows",
                rows: [
                  { left: "Why I keep chasing breakouts", right: "2d" },
                  { left: "London open checklist", right: "1w", tone: "muted" },
                ],
              },
            ],
          },
        },
        {
          title: "Write a note",
          body: "Tap **New note**, type a **Note title**, then write in the body. Select text to format it: bold, highlight, **Heading** (tap again for normal text), **Bullet list** or **Numbered list**.",
        },
        {
          title: "Save it",
          body: "The header says **Not saved yet** while you have changes. Tap **Save note** (“Note saved”). If you try to leave with changes, **Leave without saving?** asks first; **Discard changes** throws them away.",
          mock: {
            where: "Journal › Notes › Note",
            parts: [
              { kind: "field", label: "Note title", value: "London open checklist" },
              { kind: "note", text: "Not saved yet", tone: "warn" },
              { kind: "button", label: "Save note", tone: "primary", hl: true },
            ],
          },
        },
        {
          title: "Delete a note",
          body: "Open the note and tap **Delete this note**, then confirm. It is removed for good. **All notes** goes back to the list.",
          tip: "A good habit from the Books tab: write 3 bullets after each chapter you read.",
        },
      ],
      checks: [
        {
          id: "g-tl-notes-1",
          prompt: "The note header says “Not saved yet”. What does that mean?",
          options: [
            "You have changes that are not stored",
            "The note is shared",
            "The note is empty",
            "You are signed out",
          ],
          correctIndex: 0,
          explanation: "Tap Save note to store the changes.",
        },
        {
          id: "g-tl-notes-2",
          prompt: "Where do Ask AI summaries appear?",
          options: ["Notes › AI QnA", "History", "Screenshots", "Settings"],
          correctIndex: 0,
          explanation: "Summarize & save to notes stores them under AI QnA.",
        },
      ],
    },
    {
      id: "g-tl-ask",
      title: "Ask AI",
      summary: "A trading tutor chat with a summary you can save to Notes.",
      where: "Journal › Ask AI",
      access: "premium",
      open: { to: "/journal", tab: "ask", label: "Open Ask AI" },
      steps: [
        {
          title: "Ask a question",
          body: "**Ask AI** answers trading questions with the same AI models as Analyze. Pick a model under **AI model** (Automatic tries them in order), tap one of the starter questions or type your own in **Ask a trading question…**, and send.",
          mock: {
            where: "Journal › Ask AI",
            parts: [
              {
                kind: "chips",
                label: "AI model",
                items: ["Automatic", "Gemini 2.5 Flash-Lite", "Gemini 3.7 Flash", "Gemini 2.5 Pro"],
                on: [0],
              },
              {
                kind: "card",
                title: "Try one of these",
                lines: [
                  "What is a liquidity sweep, and how is it different from a breakout?",
                  "How do I size a EURUSD position with a $1,000 account, 1% risk and a 20-pip stop?",
                ],
              },
              { kind: "field", label: "Your question", value: "Ask a trading question…", hl: true },
            ],
          },
        },
        {
          title: "What the tutor will and won't do",
          body: "It explains and shows the maths with your numbers. It will not tell you to buy or sell, give a win probability or invent prices. It cannot see your charts or account unless you type the numbers in.",
          tip: "If an answer fails, tap **Try again**.",
        },
        {
          title: "Summarize & save to notes",
          body: "After at least one answer, tap **Summarize & save to notes**. The AI writes a short note: Summary, Key points, Terms, Ask next and the questions you asked. It lands in **Notes › AI QnA** (“Saved to Notes → AI QnA”); **Open AI QnA notes** takes you there.",
        },
        {
          title: "New chat",
          body: "The conversation is kept on this device only. **New chat** asks “Start a new chat?” and **Clear chat** empties it. Anything you saved to Notes stays.",
        },
      ],
      checks: [
        {
          id: "g-tl-ask-1",
          prompt: "You clear the chat. What happens to a summary you saved earlier?",
          options: [
            "It stays in Notes › AI QnA",
            "It is deleted too",
            "It moves to History",
            "It becomes a shared signal",
          ],
          correctIndex: 0,
          explanation: "Clearing only empties the conversation on this device.",
        },
        {
          id: "g-tl-ask-2",
          prompt: "You ask “Should I buy gold now?”. What will the tutor do?",
          options: [
            "Explain how to judge the trade instead of telling you to buy",
            "Tell you yes or no",
            "Give a win probability",
            "Place the order",
          ],
          correctIndex: 0,
          explanation:
            "It is educational only: bias, liquidity, structure, entry, invalidation and risk.",
        },
      ],
    },
    {
      id: "g-tl-shots",
      title: "Screenshots",
      summary: "Saved chart pictures: open, rename and delete.",
      where: "Journal › Screenshots",
      access: "signed-in",
      open: { to: "/journal", tab: "screenshots", label: "Open Screenshots" },
      steps: [
        {
          title: "Where they come from",
          body: "Pictures arrive from **Save screenshot to journal** on the Den screen and from **Screenshot to journal** or **Upload image** in Pro Charts. Empty? “Use Save screenshot to journal on a chart and it will show up here.”",
        },
        {
          title: "Open, rename, delete",
          body: "Tap a picture to open it full size. Edit **Screenshot name** and tap **Save name** to rename it. The delete button asks to confirm: it will be removed for good.",
          mock: {
            where: "Journal › Screenshots",
            parts: [
              { kind: "card", title: "XAUUSD 4H · 12 Oct", lines: ["[chart picture]"] },
              {
                kind: "field",
                label: "Screenshot name",
                value: "XAUUSD 4H sweep before NY",
                hl: true,
              },
              { kind: "button", label: "Save name", tone: "secondary" },
            ],
          },
        },
      ],
      checks: [
        {
          id: "g-tl-shots-1",
          prompt: "Which button on the Den screen sends a picture to Screenshots?",
          options: [
            "Save screenshot to journal",
            "Backtest this setup",
            "Analyze market data",
            "Save rulebook",
          ],
          correctIndex: 0,
          explanation: "Save screenshot to journal captures the chart and result.",
        },
        {
          id: "g-tl-shots-2",
          prompt: "How do you rename a saved screenshot?",
          options: [
            "Edit Screenshot name, then Save name",
            "Delete and upload again",
            "In Settings",
            "You cannot",
          ],
          correctIndex: 0,
          explanation: "Each picture has its own name field.",
        },
      ],
    },
    {
      id: "g-tl-split",
      title: "Split: sharing a trade's profit",
      summary: "Tax, members, payouts and saved calculations.",
      where: "Journal › Split",
      access: "everyone",
      open: { to: "/journal", tab: "split", label: "Open Split" },
      steps: [
        {
          title: "The trade",
          body: "**Profit split** works out who gets what from one trade. Enter **Total trade profit** and pick the **Currency**. Under **Tax** (taken out before the profit is shared), choose **By percentage** and enter the **Tax percentage**, or **Fixed amount**. Tax is capped at the profit. Everything updates as you type; there is no calculate button.",
          mock: {
            where: "Journal › Split",
            parts: [
              { kind: "field", label: "Total trade profit", value: "12,000" },
              {
                kind: "chips",
                label: "Tax",
                items: ["By percentage", "Fixed amount"],
                on: [0],
              },
              { kind: "field", label: "Tax percentage", value: "10 %" },
              {
                kind: "stats",
                items: [
                  ["Gross profit", "12,000"],
                  ["Tax taken out", "1,200"],
                  ["Left to share", "10,800"],
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Who put in what",
          body: "Under **Who put in what**, tap **Add a member**, type a name and the amount they **Put in**. Each person's share follows how much they put in. Payouts stay at zero until someone has an amount.",
        },
        {
          title: "Read the payouts",
          body: "**Payout for each member** lists everyone's share, with **Tax rate**, **Total put in**, **Paid out to the team** and **Left over from rounding**.",
        },
        {
          title: "Save and reload",
          body: "Type a **Trade name** and tap **Save to history**. **Saved trades** lists them; tap one to load it back (“Loaded into the calculator.”) or delete it. **Reset to the sample trade** clears the inputs but keeps saved trades.",
          tip: "Saved trades stay on this device only.",
        },
      ],
      checks: [
        {
          id: "g-tl-split-1",
          prompt: "Ana put in 3,000 and Ben 1,000. After tax, 8,000 is left. What does Ana get?",
          options: ["6,000", "4,000", "3,000", "8,000"],
          correctIndex: 0,
          explanation: "Ana put in 75% of the total, so she gets 75% of 8,000.",
        },
        {
          id: "g-tl-split-2",
          prompt: "Tax is set to a fixed 15,000 on a 12,000 profit. What is taken?",
          options: ["12,000: tax is capped at the profit", "15,000", "0", "3,000"],
          correctIndex: 0,
          explanation: "Tax can never be more than the trade made.",
        },
      ],
    },
  ],
};
