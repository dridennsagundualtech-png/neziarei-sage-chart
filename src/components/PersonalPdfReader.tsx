/**
 * Personal PDF reader — open a file from THIS device only.
 * No upload to server, no sharing, no books bundled in the app.
 */
import { FileText, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function PersonalPdfReader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  const clear = () => {
    if (url) URL.revokeObjectURL(url);
    setUrl(null);
    setName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return;
    }
    if (url) URL.revokeObjectURL(url);
    const next = URL.createObjectURL(file);
    setUrl(next);
    setName(file.name);
  };

  return (
    <section className="card-soft space-y-3 p-4">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="font-display text-base font-semibold">My PDF (this device only)</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Open an ebook PDF you already own. It stays on your device — not uploaded, not shared
            with other users, not stored in ChartPilot’s servers.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="h-10 rounded-xl"
          onClick={() => inputRef.current?.click()}
        >
          Open PDF…
        </Button>
        {url && (
          <Button type="button" variant="secondary" className="h-10 rounded-xl" onClick={clear}>
            <Trash2 className="size-4" /> Close file
          </Button>
        )}
      </div>

      {name && (
        <p className="text-xs text-muted-foreground truncate">Reading: {name}</p>
      )}

      {url ? (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <iframe
            title={name ?? "PDF"}
            src={url}
            className="h-[70vh] w-full"
          />
          <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            Tip: on some phones the browser PDF controls are limited — landscape mode helps. Close
            the file when finished so memory is released.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/30"
        >
          <FileText className="size-8 opacity-50" />
          Tap to choose a PDF from your files
        </button>
      )}
    </section>
  );
}

/** Full-screen style reader entry used inside Books tab */
export function PersonalPdfReaderBlock() {
  return <PersonalPdfReader />;
}
