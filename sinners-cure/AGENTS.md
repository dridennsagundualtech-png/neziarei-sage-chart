
# Sinner's Cure

This folder is a standalone offline app, disconnected from Lovable. It has nothing to do with the ChartPilot app in the rest of this repo.

## Architecture
- Fully offline, browser-only: no server functions/routes, no backend, no external URLs (app must run without internet later).
- All content lives in `src/data/` (format documented in `src/data/README.md`) so the owner can swap in full data files.
- All persistence goes through `src/lib/storage.ts` (`useLocal`, keys prefixed `sc.`) so components stay in sync.
- `getToday(date)` in `src/lib/today.ts` is the single pure source for Today content (reused by a future widget).
- Bead prayers are step lists (`src/lib/steps.ts`) rendered by `BeadPrayer` + `BeadRing`; bead index map is documented there.
- Fonts are bundled via @fontsource imports in `src/styles.css`; never add remote font links.
- Daily path/streak: steps call `markPath(item)` (`src/lib/streak.ts`); the streak day is recorded only when the user's goal is met.
- Audio uses the device's speechSynthesis via `src/lib/speech.ts` (offline, no audio files or APIs).
- Android app: Capacitor (`android/`), built by `.github/workflows/sinners-cure-apk.yml` at the repo root. Phone-only features (notifications, widget data, share, read-aloud, haptics) live in `src/lib/native.ts` and must no-op in a browser.
- Home-screen widget: `android/app/src/main/java/app/sinnerscure/bible/TodayWidget.java` reads `widget.days` (Capacitor Preferences) written from `getToday()`.
- Routing uses hash history (`#/rosary`) so the app works from local files.
- Mass reading verses use Bible verse keys (BOOK.ch.v) so highlights/notes are shared with the Bible reader.
