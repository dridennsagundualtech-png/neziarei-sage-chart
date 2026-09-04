/**
 * Editable rulebook for the Den Analyzer (the non-AI, rule-based engine).
 * Each row states the rule in plain English and exposes the number it uses.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CHECKLIST_BY_KEY } from "@/lib/analysis-types";
import {
  deleteDenPreset,
  listDenPresets,
  saveDenPreset,
} from "@/lib/den-presets.functions";
import {
  DEFAULT_DEN_RULES,
  DEN_COMPONENT_KEYS,
  DEN_COMPONENT_NOTES,
  DEN_PRESETS,
  DEN_RULE_GROUPS,
  componentsFromPreset,
  normalizeDenRules,
  presetOf,
  type DenComponents,
  type DenRules,
} from "@/lib/den-rules";

interface Props {
  value: Partial<DenRules>;
  onChange: (next: Partial<DenRules>) => void;
}


export function DenRulesEditor({ value, onChange }: Props) {
  const effective = normalizeDenRules(value);
  const activePreset = presetOf(effective.components);
  const activeMax = DEN_COMPONENT_KEYS.filter((key) => effective.components[key]).reduce(
    (sum, key) => sum + CHECKLIST_BY_KEY[key].max,
    0,
  );

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

      <div className="panel space-y-3 p-3">
        <div>
          <h3 className="text-sm font-medium">Active components</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Only the components switched on are calculated, scored and allowed to vote on the final
            direction. The checklist total adapts to whatever you leave on.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "simple" as const, label: "Simple mode" },
              { id: "full" as const, label: "Full SMC mode" },
            ]
          ).map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={activePreset === preset.id ? "default" : "outline"}
              className="rounded-xl"
              onClick={() =>
                onChange({ ...value, components: componentsFromPreset(DEN_PRESETS[preset.id]) })
              }
            >
              {preset.label}
            </Button>
          ))}
          <span className="self-center text-xs text-muted-foreground">
            {activePreset === "custom" ? "Custom selection" : "Preset applied"}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEN_COMPONENT_KEYS.map((key) => (
            <div key={key} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium">
                  {CHECKLIST_BY_KEY[key].label}
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({CHECKLIST_BY_KEY[key].max} pt{CHECKLIST_BY_KEY[key].max > 1 ? "s" : ""})
                  </span>
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {DEN_COMPONENT_NOTES[key]}
                </p>
              </div>
              <Switch
                checked={effective.components[key]}
                aria-label={CHECKLIST_BY_KEY[key].label}
                onCheckedChange={(checked) =>
                  onChange({
                    ...value,
                    components: { ...effective.components, [key]: checked },
                  })
                }
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Active checklist total: {activeMax} points.
        </p>
      </div>

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
