/**
 * Editable rulebook for the Den Analyzer (the non-AI, rule-based engine).
 * Each row states the rule in plain English and exposes the number it uses.
 */
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_DEN_RULES,
  DEN_RULE_GROUPS,
  normalizeDenRules,
  type DenRules,
} from "@/lib/den-rules";

interface Props {
  value: Partial<DenRules>;
  onChange: (next: Partial<DenRules>) => void;
}

export function DenRulesEditor({ value, onChange }: Props) {
  const effective = normalizeDenRules(value);

  return (
    <section className="animate-float-in card-soft space-y-4 p-4">
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-base font-semibold">Den Analyzer rulebook</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onChange({})}
          >
            <RotateCcw className="size-3.5" /> Reset
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Den Analyzer is not an AI. It reads the stored candles and applies the fixed rules below,
          scoring the same 16-point checklist. Edit a number and the maths changes on your next
          Den Analyzer run — the AI models ignore these values. Most distances are measured in ATR
          (average candle range), so they adapt to each market automatically.
        </p>
      </header>

      {DEN_RULE_GROUPS.map((group) => (
        <div key={group.title} className="panel space-y-3 p-3">
          <div>
            <h3 className="text-sm font-medium">{group.title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{group.intro}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={`den-${field.key}`} className="text-xs">
                  {field.label}
                  {field.unit ? (
                    <span className="ml-1 font-normal text-muted-foreground">({field.unit})</span>
                  ) : null}
                </Label>
                <Input
                  id={`den-${field.key}`}
                  type="number"
                  inputMode="decimal"
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  className="h-10 rounded-xl"
                  value={String(effective[field.key])}
                  onChange={(event) => {
                    const raw = Number(event.target.value);
                    onChange({
                      ...value,
                      [field.key]: Number.isFinite(raw) ? raw : DEFAULT_DEN_RULES[field.key],
                    });
                  }}
                />
                <p className="text-[11px] leading-relaxed text-muted-foreground">{field.rule}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
