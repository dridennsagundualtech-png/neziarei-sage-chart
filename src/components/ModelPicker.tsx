import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ANALYSIS_MODELS } from "@/lib/ai-models";

interface ModelPickerProps {
  value: string;
  onChange: (model: string) => void;
}

/** Lets the user trade AI credit cost against analysis depth. */
export function ModelPicker({ value, onChange }: ModelPickerProps) {
  const selected = ANALYSIS_MODELS.find((model) => model.id === value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="analysis-model">Model</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="analysis-model" className="h-11 rounded-xl">
          <SelectValue placeholder="Pick a model" />
        </SelectTrigger>
        <SelectContent>
          {ANALYSIS_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && <p className="text-[11px] text-muted-foreground">{selected.note}</p>}
    </div>
  );
}
