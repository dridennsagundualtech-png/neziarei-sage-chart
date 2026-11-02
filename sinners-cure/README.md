# Sinner's Cure

A Catholic Bible and prayer app for Android that works fully offline.

- **Today**: what today's Mass is about, its readings, the verse of the day with a way to live it, today's Rosary mysteries, and your plan of life.
- **Mass**: every day's readings from the General Roman Calendar (Sundays, weekdays, feasts and saints), with the full text from the bundled Bible. Browse other days.
- **Rosary**: bead by bead, with the mysteries of the day, a Scripture verse and fruit for each mystery, optional Litany and Prayer to Saint Michael, guided read-aloud.
- **Bible**: all 73 books in two public-domain Catholic translations (Douay-Rheims, Catholic Public Domain Version), search, highlights, bookmarks, notes, reading plans.
- **Prayers**: Divine Mercy Chaplet on the beads, a Confession guide with an examination of conscience, a night examination, common prayers, and guides on the plan of life, holiness in work, mortal and venial sin, the precepts, fasting, the sacraments, holy days and the works of mercy.
- **Phone**: home-screen widget (today's celebration, verse and mysteries) and a daily reminder notification, both offline.

## Get the APK

GitHub Actions builds it from this folder (`.github/workflows/sinners-cure-apk.yml` at the repo root) on every push that changes `sinners-cure/`. The APK is on the run page; a commit message containing `[release]` also puts it on a GitHub Release page.

## Develop

```bash
bun install
```

```bash
bun run dev
```

```bash
bun run test
```

Android: `bun run android:sync`, then open `android/` in Android Studio.

## Data

| Folder / file | Source |
| --- | --- |
| `public/bible/drc`, `public/bible/cpdv` | [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (public domain texts), converted with `scripts/build-bible.mjs` |
| `src/data/lectionary.json`, `src/data/general-calendar.json` | [jayarathina/Tamil-Catholic-Lectionary](https://github.com/jayarathina/Tamil-Catholic-Lectionary) (Unlicense): reading citations and calendar only, converted to English with `scripts/build-lectionary.py` |
| `src/lib/calendar.ts` | Port of RomanCalendar 3.0 from the same project |
| `src/data/verses.ts` | `scripts/build-verses.py`, text from the bundled Douay-Rheims |

See `src/data/README.md` for the file formats.
