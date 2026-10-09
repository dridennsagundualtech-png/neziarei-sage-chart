import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AccountPanel } from "@/components/AccountPanel";
import { AppShell } from "@/components/AppShell";
import {
  ChipToggleGroup,
  FieldRow,
  NumberField,
  Section,
  TagInput,
  ToggleRow,
} from "@/components/settings/parts";
import { TermTooltip } from "@/components/TermTooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GLOSSARY, SIMPLE_TERMS } from "@/lib/analysis-types";
import { DEFAULT_SETTINGS, useSaveSettings, useSettings, type SettingsRow } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Risk & analysis settings: ChartPilot" },
      {
        name: "description",
        content:
          "Set your account size, risk per trade, minimum reward-to-risk and the sample size required before ChartPilot shows a historical win rate.",
      },
      { property: "og:title", content: "Risk & analysis settings: ChartPilot" },
      {
        property: "og:description",
        content: "Control risk defaults, strictness and statistical thresholds.",
      },
    ],
  }),
  component: SettingsPage,
});

type Form = Omit<SettingsRow, "user_id">;

/** Timeframes offered as toggles. Anything already saved but not listed here still shows. */
const TIMEFRAME_OPTIONS = ["1D", "4H", "1H", "30M", "15M", "5M", "1M"];

function money(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function SettingsPage() {
  return (
    <AppShell>
      <SettingsForm />
    </AppShell>
  );
}

function SettingsForm() {
  const settingsQuery = useSettings();
  const save = useSaveSettings();
  const [form, setForm] = useState<Form>(DEFAULT_SETTINGS);
  // The query result the form was last filled from. Stops the "unsaved" bar flashing on first load.
  const [syncedFrom, setSyncedFrom] = useState<unknown>(null);

  const baseline = useMemo<Form | null>(() => {
    if (!settingsQuery.data) return null;
    const { user_id: _ignored, ...rest } = settingsQuery.data;
    return rest;
  }, [settingsQuery.data]);

  useEffect(() => {
    if (baseline) {
      setForm(baseline);
      setSyncedFrom(settingsQuery.data);
    }
  }, [baseline, settingsQuery.data]);

  const dirty =
    baseline !== null &&
    syncedFrom === settingsQuery.data &&
    JSON.stringify(form) !== JSON.stringify(baseline);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const riskInvalid = form.risk_pct <= 0 || form.risk_pct > 10;

  const submit = () => {
    if (riskInvalid) {
      toast.error("Risk per trade should be between 0 and 10%.");
      return;
    }
    save.mutate(form, {
      onSuccess: () => toast.success("Settings saved."),
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Could not save your settings."),
    });
  };

  const riskAmount = (form.account_balance * form.risk_pct) / 100;

  return (
    <div className="pb-4">
      <header className="pt-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-[15px] leading-snug text-muted-foreground">
          Your risk rules and how the analyzer behaves. They drive position sizing, low
          reward-to-risk warnings and when a historical win rate is allowed to appear.
        </p>
      </header>

      <AccountPanel />

      <Section title="Risk" hint="How much you put on the line, and when to stop.">
        <FieldRow id="balance" label="Account balance">
          <div className="flex items-center gap-2">
            <NumberField
              id="balance"
              className="w-28"
              value={form.account_balance}
              onValue={(value) => set("account_balance", value)}
            />
            <Input
              aria-label="Currency"
              autoComplete="off"
              autoCapitalize="characters"
              className="h-11 w-[4.5rem] rounded-xl px-2 text-center text-base uppercase md:text-base"
              value={form.currency}
              onChange={(event) => set("currency", event.target.value.toUpperCase().slice(0, 4))}
            />
          </div>
        </FieldRow>
        <FieldRow
          id="risk"
          label="Risk per trade"
          hint="Most people keep this at 1% or less."
          error={riskInvalid ? "Choose a number above 0 and up to 10." : null}
        >
          <NumberField
            id="risk"
            suffix="%"
            invalid={riskInvalid}
            value={form.risk_pct}
            onValue={(value) => set("risk_pct", value)}
          />
        </FieldRow>
        <FieldRow
          id="minrr"
          label={
            <>
              Minimum <TermTooltip term="R:R" label="R:R" />
            </>
          }
          hint="Trade plans below this get an unfavourable R:R warning."
        >
          <NumberField id="minrr" value={form.min_rr} onValue={(value) => set("min_rr", value)} />
        </FieldRow>
        <FieldRow
          id="dailyLoss"
          label="Daily loss limit"
          hint="0 turns it off. After you are down this many R in a day, stop taking new trades."
        >
          <NumberField
            id="dailyLoss"
            suffix="R"
            value={form.daily_loss_limit_r}
            onValue={(value) => set("daily_loss_limit_r", value)}
          />
        </FieldRow>
        <FieldRow
          id="moveBe"
          label="Move stop to break-even at"
          hint="0 turns it off. Shown on every trade plan: once price is this many R in profit, consider moving your stop to entry."
        >
          <NumberField
            id="moveBe"
            suffix="R"
            value={form.move_to_be_at_r}
            onValue={(value) => set("move_to_be_at_r", value)}
          />
        </FieldRow>
        <p className="py-4 text-[15px] leading-snug text-muted-foreground" aria-live="polite">
          {form.account_balance > 0 && !riskInvalid ? (
            <>
              At {form.risk_pct}% of {money(form.account_balance)} {form.currency}, you risk{" "}
              <span className="font-semibold text-foreground">
                {money(riskAmount)} {form.currency}
              </span>{" "}
              per trade.
              {form.daily_loss_limit_r > 0 && (
                <>
                  {" "}
                  Your {form.daily_loss_limit_r}R daily limit stops you after about{" "}
                  <span className="font-semibold text-foreground">
                    {money(riskAmount * form.daily_loss_limit_r)} {form.currency}
                  </span>{" "}
                  of losses.
                </>
              )}
            </>
          ) : (
            "Enter your account balance to see your risk in money."
          )}
        </p>
      </Section>

      <Section title="Analysis" hint="How strict the analyzer is, and how it explains itself.">
        <ToggleRow
          id="strict_mode"
          label="Strict mode"
          hint="Refuse to guess. Ask for more screenshots when context is missing."
          checked={form.strict_mode}
          onCheckedChange={(checked) => set("strict_mode", checked)}
        />
        <ToggleRow
          id="require_volume"
          label="Require volume confirmation"
          hint="Treat missing volume data as an unmet checklist component."
          checked={form.require_volume}
          onCheckedChange={(checked) => set("require_volume", checked)}
        />
        <ToggleRow
          id="learning_mode"
          label="Learning mode"
          hint="Teach instead of just answering: guided walkthroughs, concept cards and Human vs AI on every analysis."
          checked={form.learning_mode}
          onCheckedChange={(checked) => set("learning_mode", checked)}
        />
        <ToggleRow
          id="beginner_mode"
          label="Beginner mode"
          hint="Simple words first, less jargon. Turn off for advanced, technical explanations."
          checked={form.beginner_mode}
          onCheckedChange={(checked) => set("beginner_mode", checked)}
        />
        <ToggleRow
          id="context_weights_enabled"
          label="Session and day quality nudge"
          hint="Den may add or remove up to 2 checklist points based on the UTC session (overlap preferred) and weekday (mid-week preferred, Friday and weekend softer). The checklist stays the same; only the final score and grade can shift slightly."
          checked={form.context_weights_enabled}
          onCheckedChange={(checked) => set("context_weights_enabled", checked)}
        />
        <FieldRow
          id="sample"
          label="Minimum setups before showing a win rate"
          hint="Below this count ChartPilot says there is not enough history, instead of showing a misleading percentage."
        >
          <NumberField
            id="sample"
            integer
            min={1}
            value={form.min_sample_size}
            onValue={(value) => set("min_sample_size", value)}
          />
        </FieldRow>
      </Section>

      <Section
        title="Watchlist"
        hint="Used when you tag screenshots and when the app scans for setups. Scans check up to 12 assets."
      >
        <div className="space-y-3 py-4">
          <Label htmlFor="assets" className="text-base font-semibold leading-snug">
            Assets
          </Label>
          <TagInput
            id="assets"
            label="Watchlist assets"
            placeholder="Type a symbol, e.g. EURUSD"
            values={form.preferred_assets}
            onChange={(values) => set("preferred_assets", values)}
          />
        </div>
        <div className="space-y-3 py-4">
          <div>
            <p className="text-base font-semibold leading-snug">Timeframes</p>
            <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">
              Offered when you tag screenshots. Tap to turn one on or off.
            </p>
          </div>
          <ChipToggleGroup
            label="Timeframes"
            options={TIMEFRAME_OPTIONS}
            values={form.preferred_timeframes}
            onChange={(values) => set("preferred_timeframes", values)}
          />
        </div>
      </Section>

      <Section
        title="Telegram"
        hint="Optional. When you share a signal in the app, also send a short text to Telegram."
      >
        <ToggleRow
          id="telegram_notify_enabled"
          label="Notify Telegram on share"
          hint="Off by default. Sharing in the app works either way."
          checked={form.telegram_notify_enabled}
          onCheckedChange={(checked) => set("telegram_notify_enabled", checked)}
        />
        {form.telegram_notify_enabled && (
          <div className="space-y-2 py-4">
            <Label htmlFor="tgChats" className="text-base font-semibold leading-snug">
              Chat IDs
            </Label>
            <Input
              id="tgChats"
              autoComplete="off"
              className="h-11 rounded-xl font-mono text-base md:text-base"
              placeholder="123456789, -1001234567890"
              value={form.telegram_chat_ids}
              onChange={(event) => set("telegram_chat_ids", event.target.value)}
            />
            <p className="text-[13px] leading-[18px] text-muted-foreground">
              Separate with commas. Message your bot first, then get your chat id (for example with
              @userinfobot). Group and channel ids often start with -100.
            </p>
            <p className="text-[13px] leading-[18px] text-muted-foreground">
              Needs a bot token saved as <span className="font-mono">TELEGRAM_BOT_TOKEN</span> in
              your Lovable secrets (not VITE_).
            </p>
          </div>
        )}
      </Section>

      <GlossarySection />

      {dirty && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="sticky bottom-20 z-20 -mx-4 mt-8 border-t border-border bg-background px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 text-[15px] text-muted-foreground">Unsaved changes</p>
            <Button
              variant="ghost"
              className="h-12 rounded-xl px-4 text-base"
              onClick={() => baseline && setForm(baseline)}
              disabled={save.isPending}
            >
              Discard
            </Button>
            <Button
              className="h-12 rounded-xl px-7 text-base font-semibold"
              onClick={submit}
              disabled={save.isPending}
            >
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function GlossarySection() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return Object.entries(GLOSSARY).filter(([term, explanation]) => {
      if (!needle) return true;
      return `${term} ${SIMPLE_TERMS[term] ?? ""} ${explanation}`.toLowerCase().includes(needle);
    });
  }, [query]);

  const total = Object.keys(GLOSSARY).length;

  return (
    <Section
      title="Every word, explained simply"
      hint="Tap any question mark in the app to see the same explanations there."
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="glossary-list"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[60px] w-full items-center justify-between gap-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-base font-semibold">
          {open ? "Hide the glossary" : `Show all ${total} terms`}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div id="glossary-list" className="py-4">
          <Input
            type="search"
            aria-label="Search terms"
            placeholder="Search terms"
            autoComplete="off"
            className="h-11 rounded-xl text-base md:text-base"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {entries.length === 0 ? (
            <p className="pt-4 text-[15px] text-muted-foreground">No term matches “{query}”.</p>
          ) : (
            <dl className="mt-2 divide-y divide-border/60">
              {entries.map(([term, explanation]) => (
                <div key={term} className="py-3.5">
                  <dt className="text-base font-semibold">{term}</dt>
                  {SIMPLE_TERMS[term] && (
                    <dd className="mt-1 text-[15px] leading-snug">{SIMPLE_TERMS[term]}</dd>
                  )}
                  <dd className="mt-1 text-[13px] leading-5 text-muted-foreground">
                    {explanation}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </Section>
  );
}
