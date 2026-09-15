/**
 * Compact account balance editor.
 * Saves to settings so position sizing in ResultView / journal uses the latest balance.
 */
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_SETTINGS, useSaveSettings, useSettings } from "@/lib/data";

export function BalanceQuickEdit() {
  const settingsQuery = useSettings();
  const save = useSaveSettings();
  const settings = settingsQuery.data;

  const [balance, setBalance] = useState<string>("");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (settings) {
      setBalance(String(settings.account_balance ?? 0));
      setCurrency(settings.currency || "USD");
    }
  }, [settings]);

  const current = settings?.account_balance ?? DEFAULT_SETTINGS.account_balance;
  const dirty = Number(balance) !== Number(current) || currency !== (settings?.currency || "USD");

  const submit = () => {
    const n = Number(balance);
    if (!Number.isFinite(n) || n < 0) {
      toast.error("Enter a valid account balance.");
      return;
    }
    save.mutate(
      { account_balance: n, currency: currency.toUpperCase().slice(0, 4) || "USD" },
      {
        onSuccess: () => toast.success("Balance updated — journal risk sizing will use this."),
        onError: () => toast.error("Could not save balance."),
      },
    );
  };

  return (
    <section className="card-soft flex flex-wrap items-end gap-2 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wallet className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">Account balance</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <Input
          inputMode="decimal"
          className="h-9 w-28 rounded-lg"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0"
        />
        <Input
          className="h-9 w-16 rounded-lg"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="USD"
        />
        <Button
          size="sm"
          className="h-9 rounded-lg"
          disabled={!dirty || save.isPending}
          onClick={submit}
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="w-full text-[11px] text-muted-foreground">
        Used for position size on every analysis. Change anytime — it updates your journal risk
        calculations.
      </p>
    </section>
  );
}
