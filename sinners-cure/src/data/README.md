# Sinner's Cure content files

All content ships inside the app; nothing is fetched from the internet.

| File | What | Format |
| --- | --- | --- |
| `books.ts` | 73 books, Catholic order | `{ id, name, testament: "OT" \| "NT", chapters }` |
| `../../public/bible/<drc\|cpdv>/<BOOK>.json` | Scripture text | `[[verse 1, verse 2, ...], ...]`, chapter N at index N-1. Hebrew psalm numbers (as at Mass) |
| `bible.ts` | Loads the text above, search, passages | `usePassage([[BOOK, fromCh, fromV, toCh, toV]])` |
| `general-calendar.json` | Saints and feasts of the General Roman Calendar | `[month, day, name, type]`, type: Solemnity, Feast-Lord, Feast, Mem-Mary, Mem, OpMem |
| `lectionary.json` | Reading citations by day code | `{ dayID: [[type, citation, spans]] }`, type 0 procession, 1 first reading, 2 psalm, 3 second reading, 4 sequence, 6 Gospel; decimals are alternatives |
| `celebrations.ts` | What each Mass is about | by day code or celebration name; season fallbacks |
| `verses.ts` | Daily verse rotation | `{ ref, key, text, apply }` |
| `prayers.ts` | Prayer texts | `{ id, title, text, listed?, group? }`, `\n` line break, `\n\n` paragraph, `V.`/`R.` and `(directions)` show in red |
| `rosary.ts` | Mysteries | 4 sets × 5 `{ title, scripture, quote, fruit, meditation }` |
| `practices.ts` | Plan of life and the "Living the faith" guides | see the types in the file |
| `confession.ts` | Examination of conscience | sections of `{ id, text }` (keep ids stable: ticks are saved by id) |
| `plans.ts` | Reading plans | `days: [[{ book, chapter }]]` |

Liturgical colors: `"green" | "violet" | "white" | "red" | "rose"` (white shows as gold).
