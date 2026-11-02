
# Sinner's Cure

This folder is a standalone offline app, disconnected from Lovable. It has nothing to do with the ChartPilot app in the rest of this repo.

## Architecture
- Fully offline: no server, no backend, no external URLs. Everything ships inside the APK.
- All content lives in `src/data/` and `public/bible/` (formats in `src/data/README.md`). Generated files come from `scripts/`; edit the scripts, not the output.
- All persistence goes through `src/lib/storage.ts` (`useLocal`, keys prefixed `sc.`) so components stay in sync.
- `getToday(date)` in `src/lib/today.ts` is the single pure source for Today content; the widget and the daily notifications use it too.
- The Church calendar (`src/lib/calendar.ts`) and the Mass of the day (`src/lib/mass-day.ts`) are computed offline for any year. `bun run test` checks every day of 2026-2028 has readings; keep that passing.
- Bead prayers are step lists (`src/lib/steps.ts`) rendered by `BeadPrayer` + `BeadRing`; bead index map is documented there.
- Fonts are bundled via @fontsource imports in `src/styles.css`; never add remote font links.
- Plan of life: practices are in `src/data/practices.ts`; screens call `markPath(id)` when a prayer is finished (`src/lib/streak.ts`); a day of prayer is recorded only when the goal in Settings is met.
- Read-aloud (`src/lib/speech.ts`): English in the Android app uses bundled neural voices (Bella = Kokoro, Alan = Piper) through `NaturalVoicePlugin.java` (sherpa-onnx). The AAR and voice models are downloaded by `scripts/fetch-voices.sh` in CI and are not in git. Tagalog, or the "Phone's voice" setting, uses Android text-to-speech (`fil-PH` for Tagalog); a browser uses speechSynthesis. No online APIs.
- Language: English or Tagalog (`src/lib/lang.ts`). The language is read once at startup; Settings saves it and reloads the app. Use `t(english, tagalog)` for UI text; Tagalog content lives in `src/data/*.tl.ts` keyed like the English files. Scripture (Bible, Mass readings, Rosary verses) stays English; data keys compared in code (rankLabel, season, prayer groups, day codes) stay English and are translated only for display (`rankText`, `seasonName`). `src/test/tagalog.test.ts` checks every day of 2026-2028 gets a Tagalog name.
- Android app: Capacitor (`android/`), built by `.github/workflows/sinners-cure-apk.yml` at the repo root. Phone-only features (notifications, widget data, share, read-aloud, haptics) live in `src/lib/native.ts` and must no-op in a browser.
- Home-screen widget: `android/app/src/main/java/app/sinnerscure/bible/TodayWidget.java` reads `widget.days` (Capacitor Preferences) written from `getToday()`.
- Routing uses hash history (`#/rosary`) so the app works from local files.
- Mass reading verses use Bible verse keys (BOOK.ch.v) so highlights/notes are shared with the Bible reader.
- Design: a pocket missal. Parchment (light) and candlelight (dark); `rubric` (red small caps) names parts of the liturgy; the accent is the day's liturgical color; the ribbon on Today is the signature. No eyebrow labels, gradients or glows.
