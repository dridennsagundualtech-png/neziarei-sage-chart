/**
 * BiasFirst: anti-anchoring gate.
 *
 * Forces the user to state their own bias BEFORE the AI/Den result is shown.
 * This reduces blind following of the app.
 */
import { Brain, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type BiasDirection = "LONG" | "SHORT" | "WAIT" | "NO TRADE";

export interface UserBias {
  direction: BiasDirection;
  reason: string;
  lockedAt: string;
}

const OPTIONS: { value: BiasDirection; label: string; hint: string }[] = [
  { value: "LONG", label: "Long", hint: "I expect price to go up" },
  { value: "SHORT", label: "Short", hint: "I expect price to go down" },
  { value: "WAIT", label: "Wait", hint: "Setup is forming, not ready" },
  { value: "NO TRADE", label: "No trade", hint: "I see no valid setup" },
];

export function BiasFirst({
  value,
  onLock,
  disabled,
}: {
  value: UserBias | null;
  onLock: (bias: UserBias) => void;
  disabled?: boolean;
}) {
  const [direction, setDirection] = useState<BiasDirection | null>(value?.direction ?? null);
  const [reason, setReason] = useState(value?.reason ?? "");

  if (value) {
    return (
      <section className="card-soft border-primary/30 p-4">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-semibold">Your bias is locked in</p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">{value.direction}</span>
              {value.reason ? (
                <span className="text-muted-foreground">: {value.reason}</span>
              ) : null}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              ChartPilot will show its analysis next. Compare, don’t copy.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="card-soft p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <Brain className="size-4" />
        </span>
        <div>
          <p className="font-display text-base font-semibold">Your bias first</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Before ChartPilot analyses the chart, write what <em>you</em> think. This stops you from
            blindly following the app. Be honest: “I don’t know” is a valid answer (use Wait / No
            trade).
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => setDirection(opt.value)}
            className={cn(
              "rounded-xl border px-3 py-3 text-left transition-colors",
              direction === opt.value
                ? "border-primary bg-primary/12"
                : "border-border bg-card hover:bg-muted/40",
            )}
          >
            <p className="font-display text-sm font-semibold">{opt.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{opt.hint}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-1.5">
        <Label htmlFor="bias-reason">Why? (1–2 sentences)</Label>
        <Textarea
          id="bias-reason"
          disabled={disabled}
          placeholder="e.g. HTF is bullish and I see a sweep of equal lows on M5…"
          className="min-h-[80px] rounded-xl"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <Button
        className="mt-3 h-11 w-full rounded-xl"
        disabled={disabled || !direction}
        onClick={() => {
          if (!direction) return;
          onLock({
            direction,
            reason: reason.trim(),
            lockedAt: new Date().toISOString(),
          });
        }}
      >
        Lock in my bias
      </Button>
    </section>
  );
}
