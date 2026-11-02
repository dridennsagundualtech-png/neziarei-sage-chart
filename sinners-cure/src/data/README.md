# Sinner's Cure content files

All app content lives here. Replace these files with full data; keep the shapes.

| File | What | Format |
| --- | --- | --- |
| `books.ts` | 73 books, Catholic order | `{ id, name, testament: "OT"|"NT", chapters }` |
| `bible-text.json` | Scripture text | `{ "GEN": { "1": ["verse 1", "verse 2", ...] } }` — verse N at index N-1, keys are book ids from `books.ts` |
| `readings.ts` | Mass of the day | `READINGS["YYYY-MM-DD"] = { celebration, color?, summary, readings: [{ label, citation }], verse?: { text, ref }, deeper?: string }` |
| `mass-texts.json` | Full text of Mass readings | `{ "YYYY-MM-DD": [[{ book, ch, v, text }]] }` — one array per reading, same order as `readings.ts`; `[]` = not available |
| `verses.ts` | Daily verse rotation | `[{ text, ref }]` |
| `prayers.ts` | Prayer texts | `{ id, title, text, listed?, group? }`, `\n` line break, `\n\n` paragraph |
| `rosary.ts` | Mysteries | 4 sets × 5 `{ title, scripture, fruit, meditation }` |
| `confession.ts` | Examination of conscience | sections of `{ id, text }` questions (keep ids stable — checkmarks are saved by id) |
| `plans.ts` | Reading plans | `days: [[{ book, chapter }]]` |

Colors: `"green" | "violet" | "white" | "red" | "rose"`.
Sample Scripture is the Douay-Rheims (public domain).
