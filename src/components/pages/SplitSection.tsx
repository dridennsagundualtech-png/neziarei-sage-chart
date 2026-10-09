import { Copy, Eye, EyeOff, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  ChoiceChips,
  ConfirmDialog,
  DataTable,
  JSection,
  Notice,
  RowList,
  StatRows,
  useConfirm,
} from "@/components/journal/parts";
import { FieldRow } from "@/components/settings/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/** A group of form rows between hairlines, like the Settings page. */
function Rows({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-border/60 border-y border-border/60">{children}</div>;
}

const numberInput = "h-11 w-36 rounded-xl text-right text-base tabular-nums md:text-base";

function SplitCalculator() {
  const [state, setState] = useState<SplitState>(SAMPLE_STATE);
  const [history, setHistory] = useState<SavedTrade[]>([]);
  const [label, setLabel] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const resetAsk = useConfirm<true>();
  const deleteAsk = useConfirm<SavedTrade>();

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
    try {
      localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the calculator still works, it just will not remember */
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SPLIT_HISTORY_KEY, JSON.stringify(history));
    } catch {
      /* same as above */
    }
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
    setState(SAMPLE_STATE);
    setLabel("");
    resetAsk.close();
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

  return (
    <div>
      <JSection
        className="pt-6"
        title="Profit split"
        hint="Enter the trade profit, the tax taken out and what each person put in. Everything updates as you type, so there is no calculate button."
      />

      <JSection title="The trade" className="pt-7">
        <Rows>
          <FieldRow id="profit" label="Total trade profit">
            <Input
              id="profit"
              inputMode="decimal"
              autoComplete="off"
              className={numberInput}
              value={state.profit}
              onChange={(event) => patch({ profit: event.target.value })}
            />
          </FieldRow>
          <FieldRow id="currency" label="Currency">
            <Select
              value={state.currency}
              onValueChange={(value) => patch({ currency: value as CurrencyCode })}
            >
              <SelectTrigger id="currency" className="h-11 w-36 rounded-xl text-base">
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
          </FieldRow>
        </Rows>
      </JSection>

      <JSection title="Tax" hint="Taken out before the profit is shared.">
        <div className="space-y-4">
          <ChoiceChips<SplitState["taxMode"]>
            label="How tax is worked out"
            value={state.taxMode}
            onChange={(taxMode) => patch({ taxMode })}
            options={[
              { value: "percent", label: "By percentage" },
              { value: "fixed", label: "Fixed amount" },
            ]}
          />
          <Rows>
            {state.taxMode === "percent" ? (
              <FieldRow id="taxPercent" label="Tax percentage" hint="0 to 100. Optional.">
                <Input
                  id="taxPercent"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-describedby="taxPercent-hint"
                  className={numberInput}
                  value={state.taxPercent}
                  onChange={(event) => patch({ taxPercent: event.target.value })}
                />
              </FieldRow>
            ) : (
              <FieldRow
                id="taxFixed"
                label="Fixed tax amount"
                hint="Capped at the profit: tax can never be more than the trade made."
              >
                <Input
                  id="taxFixed"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-describedby="taxFixed-hint"
                  className={numberInput}
                  value={state.taxFixed}
                  onChange={(event) => patch({ taxFixed: event.target.value })}
                />
              </FieldRow>
            )}
          </Rows>
          <StatRows
            rows={[
              { label: "Gross profit", value: money(result.gross) },
              { label: "Tax taken out", value: money(result.taxAmount) },
              { label: "Left to share", value: money(result.net) },
            ]}
          />
        </div>
      </JSection>

      <JSection
        title="Who put in what"
        hint="Each person's share of the profit follows how much they put in."
      >
        <div className="flex gap-2 pb-2 text-[13px] text-muted-foreground" aria-hidden>
          <span className="flex-1">Name</span>
          <span className="w-28 pr-3 text-right">Put in</span>
          <span className="w-11" />
        </div>
        <RowList>
          {result.members.map((member) => (
            <li key={member.id} className="space-y-2 py-3">
              <div className="flex gap-2">
                <Input
                  aria-label="Member name"
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 rounded-xl text-base md:text-base"
                  value={member.name}
                  onChange={(event) => updateMember(member.id, { name: event.target.value })}
                />
                <Input
                  aria-label={`${member.name} amount put in`}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  className="h-11 w-28 rounded-xl text-right text-base tabular-nums md:text-base"
                  value={member.contribution}
                  onChange={(event) =>
                    updateMember(member.id, { contribution: event.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="size-11 shrink-0 rounded-xl p-0 text-bear hover:text-bear"
                  aria-label={`Remove ${member.name}`}
                  onClick={() => removeMember(member.id)}
                >
                  <Trash2 className="size-5" />
                </Button>
              </div>
              <p className="flex items-baseline justify-between gap-3 text-[14px] text-muted-foreground">
                <span>
                  {formatPercent(member.cutValue)} of {money(result.net)}
                </span>
                <span className="font-display text-lg font-semibold tabular-nums text-foreground">
                  {money(member.payout)}
                </span>
              </p>
            </li>
          ))}
        </RowList>
        {result.members.length === 0 && (
          <p className="py-4 text-[15px] text-muted-foreground">
            No members yet. Add someone to split the profit.
          </p>
        )}
        <Button
          type="button"
          variant="secondary"
          className="mt-4 h-12 w-full rounded-xl text-base"
          onClick={addMember}
        >
          <Plus className="size-5" /> Add a member
        </Button>
        <div className="mt-4">
          {result.hasContributions ? (
            <Notice tone="ok">
              {money(result.totalContribution)} put in altogether. Shares add up to 100%.
            </Notice>
          ) : (
            <Notice>
              Add at least one amount under “Put in” to split the profit. Payouts stay at zero until
              someone puts something in.
            </Notice>
          )}
        </div>
      </JSection>

      <JSection title="Payouts">
        <DataTable
          label="Payout for each member"
          columns={[
            { label: "Member" },
            { label: "Put in", align: "right" },
            { label: "Share", align: "right" },
            { label: "Payout", align: "right" },
          ]}
          rows={result.members.map((member) => ({
            key: member.id,
            cells: [
              member.name || "Unnamed",
              <span key="c" className="text-muted-foreground">
                {money(member.contributionValue)}
              </span>,
              formatPercent(member.cutValue),
              <span key="p" className="font-semibold">
                {money(member.payout)}
              </span>,
            ],
          }))}
        />
        <div className="mt-5">
          <StatRows
            rows={[
              { label: "Tax rate", value: formatPercent(result.taxRate) },
              { label: "Total put in", value: money(result.totalContribution) },
              { label: "Paid out to the team", value: money(result.distributed) },
              { label: "Left over from rounding", value: money(Math.max(result.remainder, 0)) },
            ]}
          />
        </div>
      </JSection>

      <JSection title="Save this trade" hint="Saved trades stay on this device after you refresh.">
        <div className="space-y-3">
          <Input
            aria-label="Trade name"
            autoComplete="off"
            placeholder="Trade name, e.g. BTC long, Aug 25"
            className="h-11 rounded-xl text-base md:text-base"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
          <Button
            type="button"
            className="h-12 w-full rounded-xl text-base font-semibold"
            onClick={save}
          >
            <Save className="size-5" /> Save to history
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 w-full justify-start rounded-xl text-base"
            onClick={() => resetAsk.ask(true)}
          >
            <RotateCcw className="size-5" /> Reset to the sample trade
          </Button>
        </div>
      </JSection>

      <JSection title="Saved trades">
        {history.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">
            Nothing saved yet. Saved calculations appear here.
          </p>
        ) : (
          <RowList>
            {history.map((entry) => {
              const entryResult = computeSplit(entry.state);
              const open = viewing === entry.id;
              return (
                <li key={entry.id} className="py-4">
                  <p className="text-base font-semibold">{entry.label}</p>
                  <p className="mt-0.5 text-[14px] text-muted-foreground">
                    {new Date(entry.savedAt).toLocaleString()} ·{" "}
                    {formatMoney(entryResult.net, entry.state.currency)} to share
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 flex-1 rounded-xl text-[15px]"
                      aria-expanded={open}
                      onClick={() => setViewing(open ? null : entry.id)}
                    >
                      {open ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      {open ? "Hide" : "View"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-11 flex-1 rounded-xl text-[15px]"
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
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Copy className="size-4" /> Reuse
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="size-11 shrink-0 rounded-xl p-0 text-bear hover:text-bear"
                      aria-label={`Delete ${entry.label}`}
                      onClick={() => deleteAsk.ask(entry)}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                  {open && (
                    <div className="mt-4 space-y-2 text-[15px]">
                      <p className="text-muted-foreground">
                        Profit {formatMoney(entryResult.gross, entry.state.currency)} · Tax{" "}
                        {formatMoney(entryResult.taxAmount, entry.state.currency)} (
                        {formatPercent(entryResult.taxRate)})
                      </p>
                      {entryResult.members.map((member) => (
                        <p key={member.id} className="flex justify-between gap-3">
                          <span>
                            {member.name}{" "}
                            <span className="text-muted-foreground">
                              ({formatPercent(member.cutValue)})
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatMoney(member.payout, entry.state.currency)}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </RowList>
        )}
      </JSection>

      <ConfirmDialog
        open={resetAsk.open}
        onOpenChange={(open) => !open && resetAsk.close()}
        title="Reset the calculator?"
        description="The inputs go back to the sample trade. Your saved trades are not touched."
        confirmLabel="Reset"
        onConfirm={reset}
      />
      <ConfirmDialog
        open={deleteAsk.open}
        onOpenChange={(open) => !open && deleteAsk.close()}
        title="Delete this saved trade?"
        description={
          deleteAsk.target ? `“${deleteAsk.target.label}” will be removed from this device.` : ""
        }
        confirmLabel="Delete"
        onConfirm={() => {
          const target = deleteAsk.target;
          if (target) setHistory((current) => current.filter((item) => item.id !== target.id));
          deleteAsk.close();
        }}
      />
    </div>
  );
}

export function SplitSection() {
  return <SplitCalculator />;
}
