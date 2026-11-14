# Project context

Read this first. It says what the app is, how it is built and the decisions that
must not be undone by accident. Last full review: 2026-11-14.

Related files: `FEATURE_MAP.md` (what exists and where), `DEVELOPMENT_LOG.md`
(what happened and why), `TASK_TRACKER.md` (what is next), `TESTING_GUIDE.md`
(how to check your work), `AGENTS.md` (rules every agent must follow),
`PRODUCT.md` (who it is for and how it speaks), `DESIGN.md` (how it looks).

## What the app is

ChartPilot is a trading chart assistant and journal. A trader uploads chart
screenshots, or the owner runs the rule-based "Den Analyzer" on stored MT5
candles. The app scores the setup on a fixed checklist, gives a conditional
trade plan with position size, shows the real odds of the plan's levels, and
keeps a journal so results are measured instead of guessed.

It is a strict second opinion, not a signal seller and not a trading bot. It
places no orders. It is expected to say Wait and No trade.

- Owner (admin): one account, set by email in `src/lib/premium.server.ts`.
- Members: sign in, redeem a premium code, use Analyze, Academy and Journal.
- Live app: https://neziarei-sage-chart.lovable.app

## Technology

| Part                     | What is used                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Language                 | TypeScript, React 19                                                               |
| Framework                | TanStack Start (pages plus server functions), TanStack Router and Query            |
| Styling                  | Tailwind CSS v4, shadcn/ui components in `src/components/ui`                       |
| Database, sign-in, files | Supabase project `dwapccabuqitigtevbay` ("Trading chart pilot main")               |
| AI                       | Lovable AI gateway, with OpenRouter as a fallback (`src/lib/ai-gateway.server.ts`) |
| Hosting                  | Lovable (Cloudflare, built by nitro). Pushes to `main` sync to Lovable             |
| Android                  | Capacitor wrapper around a static build; it calls the live app for server work     |
| Package manager          | bun (`bun.lock`)                                                                   |
| Email, Telegram          | Resend for alert emails, a Telegram bot for shared signals (both optional)         |

## How the code is organised

- `src/routes/` one file per page. `api/` holds two server routes (cron scan, news).
- `src/components/` screens and parts. `pages/` holds the big sections, `ui/` is shadcn.
- `src/lib/` the logic. Naming matters:
  - `*.functions.ts` server functions the browser may call. They check sign-in.
  - `*.server.ts` server only. Never import these into a component.
  - everything else is plain logic shared by browser and server.
- `src/integrations/supabase/` generated Supabase clients and types. `client.ts`
  and `client.server.ts` are generated; do not hand-edit them.
- `supabase/migrations/` every database change, as SQL.
- `scripts/` checks and research scripts. `docs/research/` the written-up studies.
- `android/` the Capacitor Android project.

## Who can do what

- Sign-in: email and password, or Google, through Supabase.
- `user_roles` holds the admin role. The owner's email is promoted on sign-in.
- `premium_access` holds each member's premium end date, market-data access and
  hidden pages. `premium_codes` are created by the owner on `/admin`.
- Server functions use the service-role client and check access themselves
  (`resolveAccess`, `requireAdmin`, `requirePremiumAccess` in `premium.server.ts`).
- Tables holding market data, codes and the test log refuse all browser access.

## Secrets the server needs (names only, values live in the host's settings)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`,
`OPENROUTER_API_KEY`, `LOVABLE_CRON_SECRET`, `TELEGRAM_BOT_TOKEN`,
`RESEND_API_KEY`, `ALERT_EMAIL_FROM`. The public Supabase URL and anon key are
in `.env` and are safe to commit. Never commit a secret.

## Decisions that must be kept

1. **Honesty about edge.** The trading core rules are in `AGENTS.md`. Nothing is
   called an edge without costs and without its tests counted. Checklist score,
   visual evidence and historical win rate are three separate things.
2. **Research is planned before it runs.** A study's rules and pass mark are
   committed before its data is looked at, then run once and written up in
   `docs/research/`. Results so far are in `DEVELOPMENT_LOG.md`.
3. **"Require a proven edge" switch** (2026-11-14). The owner may turn off the
   rule that a Den result needs a measured edge to show Ready. It changes a
   label only; see `AGENTS.md`.
4. **Supabase moved** to the owner's own project on 2026-11-08. Database changes
   are applied with the Supabase tools and saved as a file in
   `supabase/migrations/`.
5. **Never rewrite pushed git history.** The repo is connected to Lovable;
   force-pushing or rebasing pushed commits can lose the project history there.
6. **Stored candle time is the bar's open time** (MT5). A bar only counts after
   it has closed (`src/lib/freshness.ts`).
7. **The app's trade signals have no proven edge, and that is a tested fact,
   not a gap.** The October 2026 report card (linked in `DEVELOPMENT_LOG.md`)
   replayed 361,164 trades across 43 candidates and none passed. The app is
   useful for sizing, planning, checking a stop, knowing the real odds and
   keeping a journal. Do not present a signal as a reason to trade, and do not
   start a new edge search without reading that report and planning the test
   first.
8. **The candle table is capped.** A database trigger keeps the newest 2,000
   candles per symbol and timeframe. Long tests were run from MT5 files, not
   from this table.

## Working conventions

- Work in small milestones. Each one: plan, change, check, update these files,
  commit. See `TESTING_GUIDE.md` for the checks.
- Agents work on a branch and the owner decides when it goes to `main`.
- Reuse what exists before adding something new. No new dependency without
  saying why and getting a yes.
- Wording follows `PRODUCT.md`: plain English, calm, never hype. Looks follow
  `DESIGN.md`. `AGENTS.md` mentions an `antislop.md` file that is not in the
  repo; until the owner supplies it, use `DESIGN.md` and `PRODUCT.md`.
- Format changed files with Prettier. Do not mass-reformat old files: about
  1,000 older formatting warnings exist and fixing them all in one go would bury
  real changes.
- Explain things to the owner in plain language. The owner is not a programmer.
