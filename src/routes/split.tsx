import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CURRENCIES,
  SAMPLE_STATE,
  SPLIT_HISTORY_KEY,
  SPLIT_STORAGE_KEY,
  computeSplit,
  formatMoney,
  formatPercent,
  newId,
  type CurrencyCode,
  type SavedTrade,
  type SplitState,
} from "@/lib/split";

export const Route = createFileRoute("/split")({
  head: () => ({
    meta: [
      { title: "Trade Profit Split Calculator — ChartPilot" },
      {
        name: "description",
        content:
          "Split trade profits across your team instantly: enter total profit, tax by percentage or fixed amount, and each member's cut to see exact payouts.",
      },
      { property: "og:title", content: "Trade Profit Split Calculator" },
      {
        property: "og:description",
        content:
          "Calculate tax, distributable profit and every team member's payout instantly, with saved trade history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SplitPage,
});

function SplitPage() {
  return (
    <AppShell>
      <SplitCalculator />
    </AppShell>
  );
}

function SplitCalculator() {
  const [state, setState] = useState<SplitState>(SAMPLE_STATE);
  const [history, setHistory] = useState<SavedTrade[]>([]);
  const [label, setLabel] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SPLIT_STORAGE_KEY);
      if (raw) setState({ ...SAMPLE_STATE, ...(JSON.parse(raw) as SplitState) });
      const rawHistory = localStorage.getItem(SPLIT_HISTORY_KEY);
      if (rawHistory) setHistory(JSON.parse(rawHistory) as SavedTrade[]);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SPLIT_HISTORY_KEY, JSON.stringify(history));
  }, [history, hydrated]);

  const result = useMemo(() => computeSplit(state), [state]);
  const money = (value: number) => formatMoney(value, state.currency);

  const patch = (next: Partial<SplitState>) => setState((current) => ({ ...current, ...next }));

  const updateMember = (id: string, next: Partial<{ name: string; contribution: string }>) =>
    setState((current) => ({
      ...current,
      members: current.members.map((member) =>
        member.id === id ? { ...member, ...next } : member,
      ),
    }));

  const addMember = () =>
    setState((current) => ({
      ...current,
      members: [
        ...current.members,
        { id: newId(), name: `Member ${current.members.length + 1}`, contribution: "0" },
      ],
    }));

  const removeMember = (id: string) =>
    setState((current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== id),
    }));

  const reset = () => {
    if (!window.confirm("Reset the calculator back to the sample trade? Current inputs are lost."))
      return;
    setState(SAMPLE_STATE);
    setLabel("");
    toast.success("Calculator reset.");
  };

  const save = () => {
    const trimmed = label.trim() || `Trade ${new Date().toLocaleDateString()}`;
    const entry: SavedTrade = {
      id: newId(),
      label: trimmed,
      savedAt: new Date().toISOString(),
      state,
    };
    setHistory((current) => [entry, ...current].slice(0, 50));
    setLabel("");
    toast.success(`Saved “${trimmed}” to trade history.`);
  };

  const cutTone = result.hasContributions
    ? "text-bull border-bull/40 bg-bull/10"
    : "text-warn border-warn/40 bg-warn/10";

  return (
    <div className="space-y-5">
      <section className="animate-float-in card-soft p-5">
        <h1 className="font-display text-2xl font-semibold leading-tight">
          Trade Profit Split Calculator
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the trade profit, the tax taken out, and how much each member contributed. Shares
          and payouts recalculate instantly — no calculate button needed.
        </p>
      </section>

      {/* Trade information */}
      <section className="card-soft space-y-4 p-5">
        <h2 className="font-display text-base font-semibold">Trade information</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profit">Total trade profit</Label>
            <Input
              id="profit"
              inputMode="decimal"
              className="h-11 rounded-xl"
              value={state.profit}
              min={0}
              onChange={(event) => patch({ profit: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={state.currency}
              onValueChange={(value) => patch({ currency: value as CurrencyCode })}
            >
              <SelectTrigger id="currency" className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Tax settings */}
      <section className="card-soft space-y-4 p-5">
        <h2 className="font-display text-base font-semibold">Tax settings</h2>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={state.taxMode === "percent" ? "default" : "secondary"}
            className="h-11 rounded-xl"
            onClick={() => patch({ taxMode: "percent" })}
          >
            Tax by percentage
          </Button>
          <Button
            variant={state.taxMode === "fixed" ? "default" : "secondary"}
            className="h-11 rounded-xl"
            onClick={() => patch({ taxMode: "fixed" })}
          >
            Tax by fixed amount
          </Button>
        </div>
        {state.taxMode === "percent" ? (
          <div className="space-y-1.5">
            <Label htmlFor="taxPercent">Tax percentage (0–100, optional)</Label>
            <Input
              id="taxPercent"
              inputMode="decimal"
              className="h-11 rounded-xl"
              value={state.taxPercent}
              onChange={(event) => patch({ taxPercent: event.target.value })}
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="taxFixed">Fixed tax amount</Label>
            <Input
              id="taxFixed"
              inputMode="decimal"
              className="h-11 rounded-xl"
              value={state.taxFixed}
              onChange={(event) => patch({ taxFixed: event.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              Capped at the total profit — tax can never exceed the trade profit.
            </p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Gross profit" value={money(result.gross)} />
          <Stat label="Tax deducted" value={money(result.taxAmount)} tone="bear" />
          <Stat label="Distributable" value={money(result.net)} tone="bull" />
        </div>
      </section>

      {/* Team members */}
      <section className="card-soft space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <Users className="size-4 text-primary" /> Team members
          </h2>
          <Button variant="secondary" className="h-9 rounded-xl" onClick={addMember}>
            <Plus className="size-4" /> Add member
          </Button>
        </div>

        <div className="space-y-2">
          {result.members.map((member) => (
            <div key={member.id} className="panel space-y-2 p-3">
              <div className="flex gap-2">
                <Input
                  aria-label="Member name"
                  className="h-10 flex-1 rounded-xl"
                  value={member.name}
                  onChange={(event) => updateMember(member.id, { name: event.target.value })}
                />
                <Input
                  aria-label={`${member.name} contribution amount`}
                  inputMode="decimal"
                  placeholder="Contributed"
                  className="h-10 w-28 rounded-xl text-right"
                  value={member.contribution}
                  onChange={(event) => updateMember(member.id, { contribution: event.target.value })}
                />
                <Button
                  variant="ghost"
                  className="h-10 rounded-xl px-3 text-bear"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => removeMember(member.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Contributed {money(member.contributionValue)} ·{" "}
                  {formatPercent(member.cutValue)} of {money(result.net)}
                </span>
                <span className="font-display text-lg font-semibold text-bull">
                  {money(member.payout)}
                </span>
              </div>
            </div>
          ))}
          {result.members.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No members yet — add someone to split the profit.
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
            cutTone,
          )}
        >
          {result.hasContributions ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          {result.hasContributions
            ? `Total contributed: ${money(result.totalContribution)} — shares add up to 100%.`
            : "Add at least one contribution amount to split the profit."}
        </div>
      </section>

      {/* Summary */}
      <section className="card-soft space-y-3 p-5">
        <h2 className="font-display text-base font-semibold">Profit summary</h2>
        {result.cutStatus === "over" && (
          <p className="rounded-xl border border-bear/40 bg-bear/10 px-3 py-2 text-xs text-bear">
            This split is invalid — the numbers below are shown for reference only.
          </p>
        )}
        <dl className="grid gap-2 sm:grid-cols-2">
          <Row label="Total trade profit" value={money(result.gross)} />
          <Row label="Tax rate" value={formatPercent(result.taxRate)} />
          <Row label="Tax amount" value={money(result.taxAmount)} />
          <Row label="Profit after tax" value={money(result.net)} />
          <Row label="Total team cut" value={formatPercent(result.totalCut)} />
          <Row label="Distributed to team" value={money(result.distributed)} />
          <Row
            label="Undistributed"
            value={`${formatPercent(Math.max(result.remainderPercent, 0))} — ${money(Math.max(result.remainder, 0))}`}
          />
        </dl>
      </section>

      {/* Breakdown */}
      <section className="card-soft space-y-3 p-5">
        <h2 className="font-display text-base font-semibold">Individual payout breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2">Team member</th>
                <th className="pb-2 text-right">Cut</th>
                <th className="pb-2 text-right">Payout</th>
              </tr>
            </thead>
            <tbody>
              {result.members.map((member) => (
                <tr key={member.id} className="border-t border-border/60">
                  <td className="py-2.5">{member.name || "Unnamed"}</td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {formatPercent(member.cutValue)}
                  </td>
                  <td className="py-2.5 text-right font-display text-lg font-semibold text-bull">
                    {money(member.payout)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Save + reset */}
      <section className="card-soft space-y-3 p-5">
        <h2 className="font-display text-base font-semibold">Save this trade</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label="Trade name"
            placeholder="Trade name (e.g. BTC long — Aug 25)"
            className="h-11 rounded-xl"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <Button className="h-11 rounded-xl" onClick={save}>
            <Save className="size-4" /> Save to history
          </Button>
          <Button variant="secondary" className="h-11 rounded-xl" onClick={reset}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>
      </section>

      {/* History */}
      <section className="card-soft space-y-3 p-5">
        <h2 className="font-display text-base font-semibold">Trade history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Saved calculations appear here and stay on this device after refreshing.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((entry) => {
              const entryResult = computeSplit(entry.state);
              const open = viewing === entry.id;
              return (
                <div key={entry.id} className="panel space-y-2 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{entry.label}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(entry.savedAt).toLocaleString()} ·{" "}
                        {formatMoney(entryResult.net, entry.state.currency)} distributable
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        className="h-9 rounded-xl px-3"
                        onClick={() => setViewing(open ? null : entry.id)}
                      >
                        <Eye className="size-4" /> {open ? "Hide" : "View"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 rounded-xl px-3"
                        onClick={() => {
                          setState({
                            ...entry.state,
                            members: entry.state.members.map((member) => ({
                              ...member,
                              id: newId(),
                            })),
                          });
                          setLabel(`${entry.label} (copy)`);
                          toast.success("Loaded into the calculator.");
                        }}
                      >
                        <Copy className="size-4" /> Reuse
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 rounded-xl px-3 text-bear"
                        onClick={() =>
                          setHistory((current) => current.filter((item) => item.id !== entry.id))
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {open && (
                    <div className="space-y-1 border-t border-border/60 pt-2 text-xs">
                      <p className="text-muted-foreground">
                        Profit {formatMoney(entryResult.gross, entry.state.currency)} · Tax{" "}
                        {formatMoney(entryResult.taxAmount, entry.state.currency)} (
                        {formatPercent(entryResult.taxRate)})
                      </p>
                      {entryResult.members.map((member) => (
                        <p key={member.id} className="flex justify-between">
                          <span>
                            {member.name} ({formatPercent(member.cutValue)})
                          </span>
                          <span className="font-medium text-bull">
                            {formatMoney(member.payout, entry.state.currency)}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "bull" | "bear";
}) {
  return (
    <div className="panel p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-sm font-semibold",
          tone === "bull" && "text-bull",
          tone === "bear" && "text-bear",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between rounded-xl bg-elevated px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-display text-sm font-semibold">{value}</dd>
    </div>
  );
}
