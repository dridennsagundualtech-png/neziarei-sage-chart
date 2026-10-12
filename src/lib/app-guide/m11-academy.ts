import type { GuideModule } from "./types";

export const M11_ACADEMY: GuideModule = {
  id: "academy",
  title: "Academy",
  blurb:
    "How the learning path unlocks, the placement check, Breakthrough, quizzes, AI practice and books.",
  lessons: [
    {
      id: "g-ac-path",
      title: "The learning path and lessons",
      summary: "Units 0–7, unlocking, lesson checks, XP and topic strength.",
      where: "Academy › Lessons",
      access: "signed-in",
      open: { to: "/learn", tab: "lessons", label: "Open Lessons" },
      steps: [
        {
          title: "Eight units in order",
          body: "**Learning path** runs from Unit 0 to Unit 7: Platform & account basics, Foundations, Liquidity, Structure, Price delivery, AMD, Trade management and Complete setups. A unit opens once you finish at least 60% of the one before it.",
          mock: {
            where: "Academy › Lessons",
            parts: [
              {
                kind: "tabs",
                items: ["App guide", "Lessons", "Books", "Quizzes", "Practice (AI)"],
                active: 1,
              },
              {
                kind: "rows",
                rows: [
                  { left: "Unit 0 · Platform & account basics", right: "7/7", tone: "bull" },
                  { left: "Unit 1 · Foundations", right: "3/5" },
                  { left: "Unit 2 · Liquidity", right: "🔒", tone: "muted" },
                ],
                hl: true,
              },
            ],
          },
        },
        {
          title: "Inside a lesson",
          body: "A lesson moves one step at a time with **Continue** and **Back**, often with a chart or an interactive picture. It ends with a **Common beginner mistake**, then **Check yourself**: two questions. **Finish check** shows your score, and **Mark complete · +10 XP** finishes the lesson.",
        },
        {
          title: "Topic strength and review",
          body: "Check answers, quizzes and practice feed **Topic strength**, a percentage per topic (shown after 3 or more answers). Topics you keep missing appear under **Review suggested**, and **Suggested next** points you to the next lesson.",
        },
        {
          title: "Concept library",
          body: "**Concept library** holds quick reference cards: the same ideas as the path, in library form, for when you just need a reminder.",
        },
      ],
      checks: [
        {
          id: "g-ac-path-1",
          prompt: "Unit 2 is locked. What opens it?",
          options: [
            "Finishing 60% of Unit 1, or passing the placement check",
            "Buying premium",
            "Waiting a week",
            "Finishing every quiz",
          ],
          correctIndex: 0,
          explanation:
            "Each unit needs 60% of the previous one, unless the placement check is passed.",
        },
        {
          id: "g-ac-path-2",
          prompt: "How many check questions end each lesson?",
          options: ["Two", "Ten", "None", "Five"],
          correctIndex: 0,
          explanation:
            "Check yourself asks two questions, and the answers count towards topic strength.",
        },
      ],
    },
    {
      id: "g-ac-placement",
      title: "Placement check and Breakthrough",
      summary: "Skip ahead if you already trade, and open the deep-dive lesson.",
      where: "Academy › Lessons",
      access: "signed-in",
      open: { to: "/learn", tab: "lessons", label: "Open Lessons" },
      steps: [
        {
          title: "Already trading?",
          body: "Tap **Already trading? Take the placement check**. It has 12 questions and you need 10 right (80%). Pass, and every unit and Breakthrough opens. Miss, and the path stays in order; nothing is lost and you can learn unit by unit.",
          mock: {
            where: "Academy › Placement check",
            parts: [
              { kind: "title", text: "Placement check", sub: "12 questions · 10 to pass" },
              {
                kind: "note",
                text: "Passed. Every unit and Breakthrough is open. Start with the units you missed questions from.",
                tone: "info",
                hl: true,
              },
            ],
          },
        },
        {
          title: "Breakthrough",
          body: "**Breakthrough** is the deep lesson after the path: 15 chapters and well over 100 terms from TradingView, SMC and classic trading, each with a picture or an interactive chart. It opens when Unit 7 is at least 60% done or the placement check is passed. Then every chapter is open at once.",
        },
        {
          title: "Read these first",
          body: "Two chapters are marked to read first: risk maths and psychology. Each chapter ends with its own 5-question check.",
        },
      ],
      checks: [
        {
          id: "g-ac-placement-1",
          prompt: "How many correct answers pass the placement check?",
          options: ["10 of 12", "6 of 12", "12 of 12", "3 of 12"],
          correctIndex: 0,
          explanation: "The pass mark is 80%, which is 10 of the 12 questions.",
        },
        {
          id: "g-ac-placement-2",
          prompt: "Breakthrough is open. Which chapters are marked to read first?",
          options: [
            "Risk maths and psychology",
            "Candlesticks and volume",
            "Order blocks and FVGs",
            "None",
          ],
          correctIndex: 0,
          explanation: "Those two protect the account, so they come before the rest.",
        },
      ],
    },
    {
      id: "g-ac-quiz",
      title: "Quizzes, practice and books",
      summary: "Offline quizzes, AI practice on your own charts, and the reading list.",
      where: "Academy › Quizzes, Practice (AI), Books",
      access: "signed-in",
      open: { to: "/learn", tab: "quizzes", label: "Open Quizzes" },
      steps: [
        {
          title: "Quizzes",
          body: "The **Quizzes** tab has fixed questions with instant answers, with no AI and no limits. **Knowledge quizzes** go by topic, **Unit quizzes** gather every lesson check from one unit, and **Breakthrough quizzes** have one set per chapter (they open with Breakthrough). Finished sets count towards topic strength. **Retry batch** repeats a set; **All batches** goes back.",
        },
        {
          title: "Practice (AI)",
          body: "**Practice (AI)** needs premium. Upload a chart (up to 4 screenshots), then choose a mode. You always answer before ChartPilot shows its reading:",
          bullets: [
            "**Quiz**: answer questions about your chart, then see the reading and why you were right or wrong.",
            "**Identify-it**: tap where a concept appears; your tap is checked against a tolerance zone.",
            "**Guided**: ten steps through your chart, asking you before explaining.",
          ],
          mock: {
            where: "Academy › Practice (AI)",
            parts: [
              { kind: "chips", items: ["Quiz", "Identify-it", "Guided"], on: [1], hl: true },
              { kind: "note", text: "Tap where you see: a liquidity sweep", tone: "info" },
              { kind: "button", label: "Check my answer", tone: "primary" },
            ],
          },
        },
        {
          title: "Books",
          body: "**Books** is a reading list with a suggested path, why each book helps you and study takeaways. Full books are not hosted (copyright): use **Find the book**, then **Mark as read**. **My library** holds PDFs the admin shared with you.",
          tip: "Admins upload a PDF they own the rights to under **Upload a book (admin)** and choose who can read it.",
        },
      ],
      checks: [
        {
          id: "g-ac-quiz-1",
          prompt: "Which Academy tab works with no AI at all?",
          options: ["Quizzes", "Practice (AI)", "Ask AI", "Teach me this chart"],
          correctIndex: 0,
          explanation: "Quizzes are fixed questions with instant answers.",
        },
        {
          id: "g-ac-quiz-2",
          prompt: "In Identify-it, how is your tap judged?",
          options: [
            "Against a tolerance zone around the real area",
            "To the exact pixel",
            "By the AI's mood",
            "It is not judged",
          ],
          correctIndex: 0,
          explanation: "A zone, not a single pixel, so a fair tap counts.",
        },
      ],
    },
  ],
};
