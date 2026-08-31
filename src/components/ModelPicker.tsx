import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUTO_MODEL, DEN_MODEL, SELECTABLE_MODELS, type ModelStatus } from "@/lib/ai-models";
import { checkModelAvailability } from "@/lib/models.functions";

interface ModelPickerProps {
  value: string;
  onChange: (model: string) => void;
}

const DOT: Record<ModelStatus["health"], string> = {
  ok: "bg-emerald-500",
  rate_limited: "bg-warn",
  no_credits: "bg-destructive",
  blocked: "bg-destructive",
  unavailable: "bg-muted-foreground",
};

/** Lets the user trade AI credit cost against analysis depth. */
export function ModelPicker({ value, onChange }: ModelPickerProps) {
  const selected = SELECTABLE_MODELS.find((model) => model.id === value);
  const checkFn = useServerFn(checkModelAvailability);

  const check = useMutation({
    mutationFn: () => checkFn({}) as Promise<ModelStatus[]>,
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not check model availability."),
  });

  const statusFor = (id: string) => check.data?.find((row) => row.id === id);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="analysis-model">Model</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 rounded-lg px-2 text-[11px]"
          onClick={() => check.mutate()}
          disabled={check.isPending}
        >
          {check.isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <RefreshCw className="size-3" />
          )}
          {check.isPending ? "Checking…" : "Check availability"}
        </Button>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="analysis-model" className="h-11 rounded-xl">
          <SelectValue placeholder="Pick a model" />
        </SelectTrigger>
        <SelectContent>
          {SELECTABLE_MODELS.map((model) => {
            const noAi = model.id === AUTO_MODEL || model.id === DEN_MODEL;
            const status = noAi ? undefined : statusFor(model.id);
            return (
              <SelectItem key={model.id} value={model.id}>
                <span className="flex items-center gap-2">
                  {noAi ? (
                    <Wand2 className="size-3 text-primary" />
                  ) : (
                    status && (
                      <span className={`size-2 shrink-0 rounded-full ${DOT[status.health]}`} />
                    )
                  )}
                  {model.label}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {selected && <p className="text-[11px] text-muted-foreground">{selected.note}</p>}
      {value !== AUTO_MODEL && value !== DEN_MODEL && statusFor(value) && (
        <p className="text-[11px] text-muted-foreground">
          Status: {statusFor(value)!.detail}
          {statusFor(value)!.health !== "ok" && " — automatic mode can route around this."}
        </p>
      )}
      {check.data && (
        <ul className="space-y-0.5 pt-1">
          {check.data
            .filter((row) => row.health !== "ok")
            .map((row) => (
              <li key={row.id} className="text-[11px] text-muted-foreground">
                <span className={`mr-1.5 inline-block size-2 rounded-full ${DOT[row.health]}`} />
                {SELECTABLE_MODELS.find((m) => m.id === row.id)?.label ?? row.id}: {row.detail}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
