import { ArrowDown, ArrowUp, ImagePlus, Layers, RotateCcw, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Layout = "vertical" | "horizontal" | "grid";

interface CompilerImage {
  id: string;
  name: string;
  dataUrl: string;
}

const MAX_IMAGES = 5;
const MAX_WIDTH = 1200;
const GAP = 8;

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: "vertical", label: "Stacked (vertical)" },
  { value: "horizontal", label: "Side by side" },
  { value: "grid", label: "Grid (2 columns)" },
];

function readFile(file: File) {
  return new Promise<CompilerImage>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        dataUrl: String(reader.result),
      });
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load that image."));
    img.src = src;
  });
}

async function compile(images: CompilerImage[], layout: Layout): Promise<string> {
  const loaded = await Promise.all(images.map((image) => loadImage(image.dataUrl)));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available on this device.");

  const draw = (
    boxes: { img: HTMLImageElement; x: number; y: number; w: number; h: number }[],
    width: number,
    height: number,
  ) => {
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const box of boxes) ctx.drawImage(box.img, box.x, box.y, box.w, box.h);
  };

  if (layout === "vertical") {
    const width = Math.min(MAX_WIDTH, Math.max(...loaded.map((img) => img.naturalWidth)));
    let y = 0;
    const boxes = loaded.map((img) => {
      const scale = width / img.naturalWidth;
      const h = img.naturalHeight * scale;
      const box = { img, x: 0, y, w: width, h };
      y += h + GAP;
      return box;
    });
    draw(boxes, width, y - GAP);
  } else if (layout === "horizontal") {
    const height = Math.max(...loaded.map((img) => img.naturalHeight));
    let x = 0;
    const boxes = loaded.map((img) => {
      const scale = height / img.naturalHeight;
      const w = img.naturalWidth * scale;
      const box = { img, x, y: 0, w, h: height };
      x += w + GAP;
      return box;
    });
    const totalWidth = x - GAP;
    const cap = Math.min(1, MAX_WIDTH * loaded.length / Math.max(totalWidth, 1));
    draw(
      boxes.map((box) => ({ ...box, x: box.x * cap, w: box.w * cap, h: box.h * cap })),
      totalWidth * cap,
      height * cap,
    );
  } else {
    const columns = Math.min(2, loaded.length);
    const cellWidth = Math.min(MAX_WIDTH / columns, 600);
    const rows = Math.ceil(loaded.length / columns);
    const rowHeights: number[] = [];
    for (let r = 0; r < rows; r += 1) {
      const rowImages = loaded.slice(r * columns, r * columns + columns);
      rowHeights[r] = Math.max(
        ...rowImages.map((img) => (cellWidth / img.naturalWidth) * img.naturalHeight),
      );
    }
    const boxes = loaded.map((img, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      const scale = cellWidth / img.naturalWidth;
      return {
        img,
        x: col * (cellWidth + GAP),
        y: rowHeights.slice(0, row).reduce((sum, h) => sum + h + GAP, 0),
        w: cellWidth,
        h: img.naturalHeight * scale,
      };
    });
    draw(
      boxes,
      columns * cellWidth + (columns - 1) * GAP,
      rowHeights.reduce((sum, h) => sum + h + GAP, 0) - GAP,
    );
  }

  return canvas.toDataURL("image/jpeg", 0.85);
}

async function dataUrlToFile(dataUrl: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], `compiled-chart-${Date.now()}.jpg`, { type: "image/jpeg" });
}

interface ScreenshotCompilerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (file: File) => void | Promise<void>;
}

export function ScreenshotCompiler({ open, onOpenChange, onUse }: ScreenshotCompilerProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<CompilerImage[]>([]);
  const [layout, setLayout] = useState<Layout>("vertical");
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    const files = [...list].filter((file) => file.type.startsWith("image/"));
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can combine up to ${MAX_IMAGES} screenshots.`);
      return;
    }
    const next = await Promise.all(files.slice(0, room).map(readFile));
    setImages((current) => [...current, ...next]);
    setOutput(null);
  };

  const move = (id: string, direction: -1 | 1) => {
    setImages((current) => {
      const index = current.findIndex((image) => image.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item!);
      return copy;
    });
    setOutput(null);
  };

  const reset = () => {
    setImages([]);
    setOutput(null);
  };

  const runCompile = async () => {
    if (images.length < 2) {
      toast.error("Add at least two screenshots to compile.");
      return;
    }
    setBusy(true);
    try {
      setOutput(await compile(images, layout));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not compile those images.");
    } finally {
      setBusy(false);
    }
  };

  const useInAnalyzer = async () => {
    if (!output) return;
    setBusy(true);
    try {
      await onUse(await dataUrlToFile(output));
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not hand that over.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Layers className="size-4 text-primary" /> Screenshot compiler
          </DialogTitle>
          <DialogDescription>
            Merge up to {MAX_IMAGES} chart screenshots into one image. No AI here — this is plain
            image stitching done on your device.
          </DialogDescription>
        </DialogHeader>

        {!output && (
          <div className="space-y-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void addFiles(event.dataTransfer.files);
              }}
              onClick={() => fileInput.current?.click()}
              className={cn(
                "cursor-pointer rounded-2xl border-2 border-dashed border-border bg-elevated/60 px-5 py-6 text-center transition-all",
                dragging && "border-primary bg-primary/10",
              )}
            >
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                <UploadCloud className="size-6" />
              </span>
              <p className="mt-2 font-display text-sm font-semibold">
                Drop screenshots ({images.length}/{MAX_IMAGES})
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                They are combined in the order shown below.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full rounded-xl"
              onClick={() => fileInput.current?.click()}
            >
              <ImagePlus className="size-4" /> Choose images
            </Button>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                void addFiles(event.target.files);
                event.target.value = "";
              }}
            />

            {images.length > 0 && (
              <ul className="space-y-2">
                {images.map((image, index) => (
                  <li key={image.id} className="panel flex items-center gap-3 p-2">
                    <img
                      src={image.dataUrl}
                      alt={`Screenshot ${index + 1} to compile`}
                      className="size-14 shrink-0 rounded-lg border border-border object-cover"
                    />
                    <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      #{index + 1} · {image.name}
                    </p>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg"
                      disabled={index === 0}
                      onClick={() => move(image.id, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg"
                      disabled={index === images.length - 1}
                      onClick={() => move(image.id, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg text-bear"
                      onClick={() => {
                        setImages((current) => current.filter((item) => item.id !== image.id));
                        setOutput(null);
                      }}
                      aria-label="Remove"
                    >
                      <X className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Layout
              </p>
              <div className="grid gap-2">
                {LAYOUTS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={layout === option.value ? "default" : "secondary"}
                    className="h-10 justify-start rounded-xl text-sm"
                    onClick={() => {
                      setLayout(option.value);
                      setOutput(null);
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-xl"
                onClick={reset}
                disabled={images.length === 0 || busy}
              >
                <RotateCcw className="size-4" /> Start over
              </Button>
              <Button
                type="button"
                className="h-11 rounded-xl"
                onClick={runCompile}
                disabled={busy || images.length < 2}
              >
                <Layers className="size-4" /> Compile
              </Button>
            </div>
          </div>
        )}

        {output && (
          <div className="space-y-4">
            <div className="max-h-[45vh] overflow-y-auto rounded-2xl border border-border bg-elevated/60 p-2">
              <img src={output} alt="Compiled chart preview" className="w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-11 rounded-xl"
                onClick={reset}
                disabled={busy}
              >
                <RotateCcw className="size-4" /> Start over
              </Button>
              <Button
                type="button"
                className="h-11 rounded-xl"
                onClick={useInAnalyzer}
                disabled={busy}
              >
                Use in Analyzer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
