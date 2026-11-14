import { Link } from "@tanstack/react-router";
import { BookOpen, ClipboardList, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GlanceCard } from "@/components/GlanceCard";
import { ToggleRow } from "@/components/settings/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveOwnTrade, type AnalysisRow, type SettingsRow } from "@/lib/data";
import { distanceText, instrumentOf, levelText } from "@/lib/instruments";
import { parsePrice, type OwnTrade } from "@/lib/own-trade";
import { useOwnTradeCheck } from "@/lib/useOwnTradeCheck";
import { cn } from "@/lib/utils";

const FIELDS = [
  { key: "entry", label: "Entry", hint: "The price you would get in at." },
  { key: "stop", label: "Stop", hint: "Where the idea is wrong." },
  { key: "target", label: "Target", hint: "Where you would take profit." },
] as const;

type Prices = Record<(typeof FIELDS)[number]["key"], string>;
type Checked = ReturnType<typeof useOwnTradeCheck>;

/**
 * A typed trade and what the check says about it: side and symbol, the levels,
 * a one-line headline and the checked lines. Shown right after "Check this
 * trade", and again when the saved trade is opened in the Journal.
 */
export function OwnTradeSummary({ trade, check }: { trade: OwnTrade; check: Checked }) {
  const { result, typical, contextLoading } = check;
  if (!result) return null;
  return (
    <section className="animate-float-in space-y-4" aria-live="polite">
      <div>
        <h2
          className={cn(
            "flex items-center gap-2 text-4xl font-bold leading-none",
            trade.long ? "text-bull" : "text-bear",
          )}
        >
          {trade.long ? (
            <TrendingUp className="size-7" aria-hidden />
          ) : (
            <TrendingDown className="size-7" aria-hidden />
          )}
          {trade.long ? "Long" : "Short"} {trade.symbol}
        </h2>
        <p className="mt-2 text-sm font-semibold tabular-nums">
          Entry {levelText(trade.symbol, trade.entry)}
          <span className="font-normal text-muted-foreground">
            {` · Stop ${levelText(trade.symbol, trade.stop)} · Target ${levelText(trade.symbol, trade.target)}`}
          </span>
        </p>
        <p className="mt-2 text-base font-semibold">{result.headline}</p>
      </div>

      <GlanceCard rows={result.rows} title="Your trade, checked" />

      {typical && result.plan.ok && (
        <p className="text-sm leading-snug text-muted-foreground">
          Your target is {distanceText(trade.symbol, Math.abs(trade.target - trade.entry))} from the
          entry. A typical day for {trade.symbol} covers about{" "}
          {distanceText(trade.symbol, typical.median)} from high to low.
        </p>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">
        {contextLoading
          ? "Looking up this symbol's daily data…"
          : "This checks the plan, not the idea. Whether price goes your way is your call: no test found a way to predict it, so the odds above are the ones chance gives."}
      </p>
    </section>
  );
}

/**
 * "Check my trade": the trader types their own idea and the app checks the
 * plan, the stop, the size and the odds (src/lib/own-trade.ts). It has no view
 * on direction and says so. A valid trade can be saved to the journal, marked
 * as placed or as an idea only.
 */
export function OwnTradeCheck({
  settings,
  journal,
}: {
  settings: SettingsRow;
  journal: AnalysisRow[];
}) {
  const [symbol, setSymbol] = useState("");
  const [long, setLong] = useState<boolean | null>(null);
  const [prices, setPrices] = useState<Prices>({ entry: "", stop: "", target: "" });
  const [problem, setProblem] = useState<string | null>(null);
  // The trade as it was when "Check" was pressed, so the answer matches what was asked.
  const [trade, setTrade] = useState<OwnTrade | null>(null);
  const [placed, setPlaced] = useState(false);
  // The trade that was last saved, so the same one isn't saved twice by a second tap.
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const check = useOwnTradeCheck(trade, settings, journal);
  const save = useSaveOwnTrade();
  const plan = check.result?.plan;
  const saved = trade !== null && savedKey === JSON.stringify(trade);

  const submit = () => {
    const name = symbol.trim().toUpperCase();
    const entry = parsePrice(prices.entry);
    const stop = parsePrice(prices.stop);
    const target = parsePrice(prices.target);
    if (name.length < 3)
      return setProblem("Type the symbol you want to trade, for example EURUSD.");
    if (long === null) return setProblem("Choose Long or Short.");
    if (entry === null || stop === null || target === null) {
      return setProblem("Enter the entry, the stop and the target as prices.");
    }
    setProblem(null);
    setTrade({ symbol: name, long, entry, stop, target });
  };

  const saveToJournal = () => {
    if (!trade || !plan?.ok || plan.rr === null) return;
    save.mutate(
      {
        ...trade,
        riskReward: plan.rr,
        marketType: instrumentOf(trade.symbol).kind,
        placed,
      },
      {
        onSuccess: () => {
          setSavedKey(JSON.stringify(trade));
          toast.success(
            placed ? "Saved as a placed trade." : "Saved as an idea. Nothing is closed for you.",
          );
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not save the trade."),
      },
    );
  };

  return (
    <div className="space-y-4">
      <section className="card-soft">
        <h2 className="card-band">
          <ClipboardList className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          Your trade
        </h2>
        <form
          className="space-y-4 p-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <p className="text-sm text-muted-foreground">
            You bring the idea. The app checks the plan, the stop, the size and the odds. It has no
            view on which way price goes.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="own-symbol">Symbol</Label>
            <Input
              id="own-symbol"
              list="own-symbols"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="EURUSD, XAUUSD…"
              className="h-11 rounded-xl uppercase"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase().slice(0, 24))}
            />
            <datalist id="own-symbols">
              {settings.preferred_assets.map((asset) => (
                <option key={asset} value={asset} />
              ))}
            </datalist>
          </div>

          <div role="group" aria-label="Direction" className="grid grid-cols-2 gap-2">
            {[
              { label: "Long (buy)", value: true },
              { label: "Short (sell)", value: false },
            ].map((side) => (
              <Button
                key={side.label}
                type="button"
                aria-pressed={long === side.value}
                variant={long === side.value ? "selected" : "secondary"}
                className="h-11 rounded-xl"
                onClick={() => setLong(side.value)}
              >
                {side.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`own-${field.key}`}>{field.label}</Label>
                <Input
                  id={`own-${field.key}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-describedby={`own-${field.key}-hint`}
                  className="h-11 rounded-xl tabular-nums"
                  value={prices[field.key]}
                  onChange={(event) =>
                    setPrices((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                />
                <p id={`own-${field.key}-hint`} className="text-xs text-muted-foreground">
                  {field.hint}
                </p>
              </div>
            ))}
          </div>

          {problem && (
            <p role="alert" className="text-sm font-medium text-warn">
              {problem}
            </p>
          )}

          <Button type="submit" className="h-12 w-full rounded-xl text-base">
            Check this trade
          </Button>
        </form>
      </section>

      {trade && <OwnTradeSummary trade={trade} check={check} />}

      {trade && plan?.ok && plan.rr !== null && (
        <section className="card-soft">
          <h2 className="card-band">
            <BookOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            Keep it in your journal
          </h2>
          <div className="px-4 pb-4">
            <ToggleRow
              id="own-placed"
              label="I placed this trade"
              hint="On: it counts as a trade you really took. Where the app has market data for it, the result is recorded for you when the stop or target is hit. Off: it is saved as an idea and nothing is closed for you."
              checked={placed}
              onCheckedChange={setPlaced}
            />
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full rounded-xl"
              onClick={saveToJournal}
              disabled={save.isPending || saved}
            >
              {saved ? "Saved to your journal" : save.isPending ? "Saving…" : "Save to journal"}
            </Button>
            {saved && (
              <p className="mt-3 text-sm text-muted-foreground">
                It is under{" "}
                <Link to="/journal" className="font-semibold text-foreground underline">
                  Journal › History
                </Link>
                , where you can record or correct the result.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
