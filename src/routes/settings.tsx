import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AccountPanel } from "@/components/AccountPanel";
import { AppShell } from "@/components/AppShell";
import { TermTooltip } from "@/components/TermTooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DISCLAIMER, GLOSSARY, SIMPLE_TERMS } from "@/lib/analysis-types";
import { DEFAULT_SETTINGS, useSaveSettings, useSettings, type SettingsRow } from "@/lib/data";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Risk & analysis settings — ChartPilot" },
      {
        name: "description",
        content:
          "Set your account size, risk per trade, minimum reward-to-risk and the sample size required before ChartPilot shows a historical win rate.",
      },
      { property: "og:title", content: "Risk & analysis settings — ChartPilot" },
      {
        property: "og:description",
        content: "Control risk defaults, strictness and statistical thresholds.",
      },
    ],
  }),
  component: SettingsPage,
});

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
  const [form, setForm] = useState<Omit<SettingsRow, "user_id">>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (settingsQuery.data) {
      const { user_id: _ignored, ...rest } = settingsQuery.data;
      setForm(rest);
    }
  }, [settingsQuery.data]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    if (form.risk_pct <= 0 || form.risk_pct > 10) {
      toast.error("Risk per trade should be between 0 and 10%.");
      return;
    }
    save.mutate(form, {
      onSuccess: () => toast.success("Settings saved."),
      onError: () => toast.error("Could not save your settings."),
    });
  };

  return (
    <div className="space-y-4">
      <header className="animate-float-in card-soft p-5">
        <h1 className="font-display text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in for premium chart analysis; your analyses and journal stay in this browser. These values drive risk sizing, unfavourable-R:R warnings and when a historical win rate is
          allowed to appear.
        </p>
      </header>

      <AccountPanel />

      <section className="animate-float-in card-soft space-y-4 p-4">
        <h2 className="font-display text-base font-semibold">Risk</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="balance">Account balance</Label>
            <Input
              id="balance"
              inputMode="decimal"
              className="h-11 rounded-xl"
              value={form.account_balance}
              onChange={(event) => set("account_balance", Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              className="h-11 rounded-xl"
              value={form.currency}
              onChange={(event) => set("currency", event.target.value.toUpperCase().slice(0, 4))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="risk">Risk per trade (%)</Label>
            <Input
              id="risk"
              inputMode="decimal"
              className="h-11 rounded-xl"
              value={form.risk_pct}
              onChange={(event) => set("risk_pct", Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minrr">
              Minimum <TermTooltip term="R:R" label="R:R" />
            </Label>
            <Input
              id="minrr"
              inputMode="decimal"
              className="h-11 rounded-xl"
              value={form.min_rr}
              onChange={(event) => set("min_rr", Number(event.target.value) || 0)}
            />
          </div>
        </div>
      </section>

      <section className="animate-float-in card-soft space-y-4 p-4">
        <h2 className="font-display text-base font-semibold">Statistical honesty</h2>
        <div className="space-y-1.5">
          <Label htmlFor="sample">Minimum comparable setups before showing a win rate</Label>
          <Input
            id="sample"
            inputMode="numeric"
            className="h-11 rounded-xl"
            value={form.min_sample_size}
            onChange={(event) => set("min_sample_size", Math.max(1, Number(event.target.value) || 1))}
          />
          <p className="text-xs text-muted-foreground">
            Below this count ChartPilot states that historical data is insufficient instead of showing
            a misleading percentage.
          </p>
        </div>
      </section>

      <section className="animate-float-in card-soft space-y-3 p-4">
        <h2 className="font-display text-base font-semibold">Analysis behaviour</h2>
        {(
          [
            {
              key: "strict_mode" as const,
              label: "Strict mode",
              hint: "Refuse to guess. Ask for more screenshots when context is missing.",
            },
            {
              key: "require_volume" as const,
              label: "Require volume confirmation",
              hint: "Treat missing volume data as an unmet checklist component.",
            },
            {
              key: "learning_mode" as const,
              label: "Learning mode",
              hint: "Teach instead of just answering: guided walkthroughs, concept cards and Human vs AI on every analysis.",
            },
            {
              key: "beginner_mode" as const,
              label: "Beginner mode",
              hint: "Simple words first, less jargon. Turn off for advanced, technical explanations.",
            },
          ]
        ).map((item) => (
          <div key={item.key} className="panel flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </div>
            <Switch
              checked={form[item.key]}
              onCheckedChange={(checked) => set(item.key, checked)}
              aria-label={item.label}
            />
          </div>
        ))}
      </section>

      <section className="animate-float-in card-soft space-y-3 p-4">
        <h2 className="font-display text-base font-semibold">Preferences</h2>
        <div className="space-y-1.5">
          <Label htmlFor="assets">Watchlist assets (comma separated)</Label>
          <Textarea
            id="assets"
            rows={2}
            className="rounded-xl"
            value={form.preferred_assets.join(", ")}
            onChange={(event) =>
              set(
                "preferred_assets",
                event.target.value
                  .split(",")
                  .map((value) => value.trim().toUpperCase())
                  .filter(Boolean),
              )
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timeframes">Timeframes offered when tagging screenshots</Label>
          <Textarea
            id="timeframes"
            rows={2}
            className="rounded-xl"
            value={form.preferred_timeframes.join(", ")}
            onChange={(event) =>
              set(
                "preferred_timeframes",
                event.target.value
                  .split(",")
                  .map((value) => value.trim().toUpperCase())
                  .filter(Boolean),
              )
            }
          />
        </div>
      </section>

      <Button className="h-12 w-full rounded-xl" onClick={submit} disabled={save.isPending}>
        <Save className="size-4" /> Save settings
      </Button>

      <section className="animate-float-in card-soft p-4">
        <h2 className="font-display text-base font-semibold">Every word, explained simply</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Tap any question mark in the app to see the same explanations there.
        </p>
        <dl className="mt-3 space-y-2">
          {Object.entries(GLOSSARY).map(([term, explanation]) => (
            <div key={term} className="panel p-3">
              <dt className="text-sm font-medium">{term}</dt>
              {SIMPLE_TERMS[term] && (
                <dd className="mt-0.5 text-xs text-foreground/90">{SIMPLE_TERMS[term]}</dd>
              )}
              <dd className="mt-1 text-xs text-muted-foreground">{explanation}</dd>
            </div>
          ))}
        </dl>
      </section>



      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground/70">{DISCLAIMER}</p>
    </div>
  );
}
