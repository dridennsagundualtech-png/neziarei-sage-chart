import { ArrowLeft, ArrowRight, Camera, ImagePlus, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface PendingImage {
  id: string;
  file: File;
  preview: string;
  dataUrl: string;
  timeframe: string | null;
}

export async function toPendingImage(file: File): Promise<PendingImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
  return {
    id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    preview: dataUrl,
    dataUrl,
    timeframe: null,
  };
}

interface ChartUploaderProps {
  images: PendingImage[];
  timeframes: string[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onTimeframe: (id: string, timeframe: string | null) => void;
  compact?: boolean;
  hideDropzone?: boolean;
}

export function ChartUploader({
  images,
  timeframes,
  onAdd,
  onRemove,
  onMove,
  onTimeframe,
  compact,
  hideDropzone,
}: ChartUploaderProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    onAdd([...list].filter((file) => file.type.startsWith("image/")));
  };

  return (
    <div className="space-y-4">
      {!hideDropzone && (
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => fileInput.current?.click()}
        className={cn(
          "cursor-pointer rounded-3xl border-2 border-dashed border-border bg-elevated/60 px-5 text-center transition-all",
          compact ? "py-6" : "py-10",
          dragging && "border-primary bg-primary/10",
        )}
      >
        <span
          className={cn(
            "mx-auto grid place-items-center rounded-3xl bg-primary/15 text-primary",
            compact ? "size-12" : "size-16 animate-breathe",
          )}
        >
          <UploadCloud className={compact ? "size-6" : "size-8"} />
        </span>
        <p className="mt-3 font-display text-base font-semibold">
          {compact ? "Add another screenshot" : "Drop your chart screenshots here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG or JPG · multiple timeframes welcome (1D → 4H → 1H → 15M → 5M)
        </p>
      </div>
      )}

      {!hideDropzone && (
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-xl"
          onClick={() => fileInput.current?.click()}
        >
          <ImagePlus className="size-4" /> Choose images
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-xl"
          onClick={() => cameraInput.current?.click()}
        >
          <Camera className="size-4" /> Camera
        </Button>
      </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {images.length > 0 && (
        <ul className="space-y-3">
          {images.map((image, index) => (
            <li key={image.id} className="animate-pop panel flex gap-3 p-3">
              <img
                src={image.preview}
                alt={`Uploaded chart ${index + 1}`}
                className="size-20 shrink-0 rounded-xl border border-border object-cover"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-muted-foreground">
                    #{index + 1} · {image.file.name}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg"
                      disabled={index === 0}
                      onClick={() => onMove(image.id, -1)}
                      aria-label="Move earlier"
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg"
                      disabled={index === images.length - 1}
                      onClick={() => onMove(image.id, 1)}
                      aria-label="Move later"
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg text-bear"
                      onClick={() => onRemove(image.id)}
                      aria-label="Remove screenshot"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                <Select
                  value={image.timeframe ?? "auto"}
                  onValueChange={(value) => onTimeframe(image.id, value === "auto" ? null : value)}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Let ChartPilot read the timeframe</SelectItem>
                    {timeframes.map((tf) => (
                      <SelectItem key={tf} value={tf}>
                        {tf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
