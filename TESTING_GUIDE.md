# Testing guide

How to run the app and check a change before saying it works. Report results in
three groups: verified, implemented but not fully tested, and known issues.
Never report a check you did not run. Last updated: 2026-11-14.

## Set up

```bash
bun install
```

If that fails with "ProxyConnectFailed … pkg.dev", the sandbox cannot reach the
package cache named in `bun.lock`. Install the same packages from the public
registry and put the lockfile back untouched (the checksums in the lockfile
still verify every package):

```bash
cp bun.lock /tmp/bun.lock.orig
sed -i -E 's#https://europe-west[0-9]-npm\.pkg\.dev/lovable-core-prod/sandbox-npm-cache/#https://registry.npmjs.org/#g' bun.lock
bun install --frozen-lockfile
git checkout bun.lock
```

Never commit a changed `bun.lock` from that workaround.

## Checks to run after every change

| Check                          | Command                                    | Passing looks like                          |
| ------------------------------ | ------------------------------------------ | ------------------------------------------- |
| Types                          | `npx tsc --noEmit`                         | no output                                   |
| Trading core                   | `bun scripts/trading-check.ts`             | `trading-check: ok (288 Den plans checked)` |
| Result screen                  | `bun scripts/result-view-check.tsx`        | `result-view-check: ok`                     |
| Lint, changed files only       | `npx eslint <files you changed>`           | no new errors                               |
| Formatting, changed files only | `npx prettier --check <files you changed>` | all files pass                              |
| Production build               | `npx vite build`                           | ends with "You can deploy this build"       |

Notes:

- `trading-check.ts` is required by `AGENTS.md` after touching the Den engine,
  backtests, sizing or stats.
- Do not run lint or Prettier across the whole repo and commit the result.
  About 1,045 older formatting errors exist (`src/lib/data.ts` alone has 6).
  Compare against the file before your change instead.
- There is no unit-test framework. The two scripts above are the automated
  tests; add cases to them when you change what they cover.

## Running the app

```bash
bun run dev
```

In a sandbox without IPv6 that fails with `EAFNOSUPPORT`; use
`npx vite dev --host 127.0.0.1 --port 5199` instead.

Signed out, every page loads (checked 2026-11-14 in a phone-sized browser:
Home, Settings, Analyze, Academy, Journal, with no console errors and no
sideways scroll). Anything that needs the server (sign-in checks, analysis, the
Den, backtests, admin) needs the secrets listed in `PROJECT_CONTEXT.md`, which
are not in the repo. An agent sandbox normally has none of them and no account
to sign in with. So:

- Agents can verify logic, rendering, the signed-out pages and the build, not
  signed-in flows.
- Say so plainly: "implemented, not tested signed in".
- The owner checks signed-in flows on the Lovable preview or the live app.
- Owner-only controls (EA check, "Require a proven edge") must not appear when
  signed out. That is a quick check an agent can do.

## Looking at a screen without signing in

`scripts/result-view-check.tsx` only sees the first paint. To see a screen in a
real browser, add a temporary route that renders the component with made-up
data (for example `src/routes/zz-preview.tsx` rendering `ResultView` inside
`AppShell`), open it with the dev server and Playwright, then delete the route
and run `npx vite build` so `src/routeTree.gen.ts` is regenerated. Check
`git status` shows no trace of it before committing.

## What to click through before a release (owner, signed in)

1. Sign in with email and with Google. Sign out.
2. Home: session clock, news and shared signals load.
3. Analyze › Screenshot: upload a chart, get a result, the verdict strip shows.
4. Analyze › Market data (owner): run the Den on a symbol; the result and the
   track record cards appear.
5. Result screen: the At a glance card shows under the verdict, and its
   figures match the trade plan below (R:R, size, odds). "Show all details"
   opens the score boxes, price map, chances, checklist and sizing; "Show less"
   folds them; the choice is still there after a reload.
6. Analyze › My trade: type EURUSD, Long, entry 1.0850, stop 1.0840, target
   1.0870 and press Check this trade. The Stop line should say Too tight and
   give the closest stop that passes, and Size should give lots in your
   currency. With a wider stop (1.0820, target 1.0910) the headline should say
   it checks out.
7. Journal: open a saved read, record Win or Loss with R, Stats update.
8. Settings: change a value, Save, reload, the value stayed. As owner, toggle
   "Require a proven edge" and confirm a Den result with no edge switches
   between Wait (on) and Ready with the "no edge is proven" line (off).
9. Backtest (owner): run one, save it, delete it.
10. Admin (owner): create a premium code; a member account can redeem it.
11. Academy: open a lesson, a quiz and a book.
12. Phone width: the bottom navigation works and nothing scrolls sideways.

## Database changes

1. Write the SQL as a new file in `supabase/migrations/` (timestamp prefix).
2. Apply it to the Supabase project `dwapccabuqitigtevbay`.
3. Verify with a query that the change is there and existing rows are intact.
4. If the app reads the new column, apply the migration before the code is
   merged: saving Settings sends every column, so a missing column breaks Save.
5. Only add. Ask the owner before dropping or changing a column or table.

## Releasing

- The owner's live app follows `main`. Agents work on a branch; nothing reaches
  the live app until the branch is merged into `main` and published in Lovable.
- Android: push to the `apk` branch or an `apk-*` tag; GitHub builds the APK
  (`.github/workflows/android-apk.yml`).
- After a release, repeat steps 1 to 8 above on the live app.
