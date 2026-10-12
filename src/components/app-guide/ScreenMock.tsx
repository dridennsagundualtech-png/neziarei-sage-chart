/**
 * A simplified drawing of an app screen for the App guide. It uses the real
 * labels and highlights the control the step is about, so people can find it
 * on the real screen. It is a sketch, not a screenshot: nothing is clickable.
 */
import { Fragment, type ReactNode } from "react";

import type { MockPart, ScreenMock as Mock } from "@/lib/app-guide/types";
import { cn } from "@/lib/utils";

/** Renders **double asterisks** as bold on-screen labels. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

const TONE: Record<"bull" | "bear" | "muted", string> = {
  bull: "text-bull",
  bear: "text-bear",
  muted: "text-muted-foreground",
};

function buttonClass(tone: "primary" | "secondary" | "ghost" = "secondary") {
  return cn(
    "flex h-8 min-w-0 flex-1 items-center justify-center truncate rounded-lg px-2 text-[11px] font-semibold",
    tone === "primary" && "bg-primary text-primary-foreground",
    tone === "secondary" && "border border-border bg-secondary text-secondary-foreground",
    tone === "ghost" && "text-muted-foreground",
  );
}

function PartBody({ part }: { part: MockPart }): ReactNode {
  switch (part.kind) {
    case "title":
      return (
        <div>
          <p className="font-display text-base font-bold leading-tight">{part.text}</p>
          {part.sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{part.sub}</p>}
        </div>
      );
    case "tabs":
      return (
        <div className="flex gap-3 overflow-hidden border-b border-border/70 text-[11px] font-semibold">
          {part.items.map((item, i) => (
            <span
              key={item}
              className={cn(
                "shrink-0 whitespace-nowrap pb-1.5",
                i === part.active
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item}
            </span>
          ))}
        </div>
      );
    case "chips":
      return (
        <div>
          {part.label && <p className="mb-1 text-[11px] font-medium">{part.label}</p>}
          <div className="flex flex-wrap gap-1.5">
            {part.items.map((item, i) => {
              const on = part.on?.includes(i);
              return (
                <span
                  key={item}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px]",
                    on
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-elevated text-muted-foreground",
                  )}
                >
                  {item}
                </span>
              );
            })}
          </div>
        </div>
      );
    case "button":
      return <span className={buttonClass(part.tone)}>{part.label}</span>;
    case "buttons":
      return (
        <div className="flex gap-2">
          {part.items.map((item) => (
            <span key={item.label} className={buttonClass(item.tone)}>
              {item.label}
            </span>
          ))}
        </div>
      );
    case "field":
      return (
        <div>
          <p className="mb-1 text-[11px] font-medium">{part.label}</p>
          <div className="flex h-8 items-center truncate rounded-lg border border-border bg-secondary px-2 text-[11px] text-muted-foreground">
            {part.value}
          </div>
          {part.hint && <p className="mt-1 text-[10px] text-muted-foreground">{part.hint}</p>}
        </div>
      );
    case "toggle":
      return (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium">{part.label}</p>
            {part.hint && <p className="text-[10px] text-muted-foreground">{part.hint}</p>}
          </div>
          <span
            aria-hidden
            className={cn(
              "relative mt-0.5 h-4 w-7 shrink-0 rounded-full",
              part.on ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-3 rounded-full bg-background",
                part.on ? "right-0.5" : "left-0.5",
              )}
            />
          </span>
          <span className="sr-only">{part.on ? "on" : "off"}</span>
        </div>
      );
    case "slider":
      return (
        <div>
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="font-medium">{part.label}</span>
            <span className="font-semibold text-primary">{part.value}</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${part.pct}%` }} />
            <span
              aria-hidden
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background"
              style={{ left: `${part.pct}%` }}
            />
          </div>
        </div>
      );
    case "card":
      return (
        <div className="rounded-lg border border-border bg-elevated p-2">
          <p className="text-[11px] font-semibold">{part.title}</p>
          {part.lines.map((line) => (
            <p key={line} className="mt-0.5 text-[11px] text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
      );
    case "stats":
      return (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {part.items.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-elevated px-2 py-1.5">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="text-[12px] font-semibold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      );
    case "rows":
      return (
        <div className="divide-y divide-border/60 rounded-lg border border-border">
          {part.rows.map((row) => (
            <div
              key={row.left}
              className="flex items-center justify-between gap-3 px-2 py-1.5 text-[11px]"
            >
              <span className={cn("min-w-0 truncate", row.tone === "muted" && TONE.muted)}>
                {row.left}
              </span>
              {row.right !== undefined && (
                <span className={cn("shrink-0 tabular-nums", row.tone && TONE[row.tone])}>
                  {row.right}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    case "note":
      return (
        <p
          className={cn(
            "rounded-lg px-2 py-1.5 text-[11px]",
            part.tone === "warn" ? "bg-warn/10 text-warn" : "bg-muted/60 text-muted-foreground",
          )}
        >
          {part.text}
        </p>
      );
  }
}

export function ScreenMock({ mock }: { mock: Mock }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card">
      <figcaption className="flex items-center gap-2 border-b border-border bg-elevated px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
        <span aria-hidden className="flex gap-1">
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
          <span className="size-1.5 rounded-full bg-muted-foreground/50" />
        </span>
        <span className="min-w-0 truncate">Sketch · {mock.where}</span>
      </figcaption>
      <div className="space-y-2.5 p-3">
        {mock.parts.map((part, i) => (
          <div
            key={i}
            className={cn(
              "relative",
              part.hl && "rounded-xl p-1.5 outline outline-2 outline-offset-2 outline-primary",
            )}
          >
            {part.hl && (
              <span className="absolute -top-2.5 right-2 rounded-full bg-primary px-1.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                Here
              </span>
            )}
            <PartBody part={part} />
          </div>
        ))}
      </div>
    </figure>
  );
}
