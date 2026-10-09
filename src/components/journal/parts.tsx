/**
 * Building blocks for the Journal page (all six tabs).
 *
 * Same rules as the Settings page:
 *  - Sections are plain headings separated by whitespace and hairlines, never boxed cards.
 *  - Text is at least 13px, body text is 15-16px, every tap target is at least 44px.
 *  - The page's one main action is amber (the default Button). Everything else is quiet.
 *  - Status is shown with an icon and a word, never with colour alone.
 */
import { AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------- formatting */

const missing = (value: number | null | undefined): value is null | undefined =>
  value === null || value === undefined || Number.isNaN(value);

/** "55.0%" (value is already 0-100). */
export function fmtPct(value: number | null | undefined, digits = 1): string {
  return missing(value) ? "–" : `${value.toFixed(digits)}%`;
}

/** "+0.42R" / "-1.00R" */
export function fmtR(value: number | null | undefined, digits = 2): string {
  return missing(value) ? "–" : `${value >= 0 ? "+" : ""}${value.toFixed(digits)}R`;
}

/** Plain number such as profit factor: "1.80" */
export function fmtNum(value: number | null | undefined, digits = 2): string {
  return missing(value) ? "–" : value.toFixed(digits);
}

/** Text colour for a signed number. The +/- sign is always printed too, so colour is only a hint. */
export function signTone(value: number | null | undefined): string {
  if (missing(value) || value === 0) return "";
  return value > 0 ? "text-bull" : "text-bear";
}

/* ----------------------------------------------------------------- layout */

/**
 * A heading with optional one-line hint and a trailing action. No box around the content.
 * The first section on a tab passes `className="pt-6"`.
 */
export function JSection({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("pt-9", className)}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          {hint && <p className="mt-1 text-[15px] leading-snug text-muted-foreground">{hint}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children !== undefined && <div className="mt-4">{children}</div>}
    </section>
  );
}

/** Rows separated by hairlines: the flat replacement for a stack of cards. */
export function RowList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn("divide-y divide-border/60 border-y border-border/60", className)}>
      {children}
    </ul>
  );
}

/** Nothing to show yet. Flat, centred, with one honest sentence and an optional action. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-2 py-14 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      {children && (
        <p className="mt-1 max-w-sm text-[15px] leading-snug text-muted-foreground">{children}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** A short note that something needs care. Icon + words, so it does not rely on colour. */
export function Notice({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "ok" }) {
  const Icon = tone === "ok" ? CheckCircle2 : AlertTriangle;
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 text-[15px] leading-snug",
        tone === "ok" ? "text-foreground" : "text-warn",
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/* --------------------------------------------------------------- controls */

export interface Choice<T extends string> {
  value: T;
  label: string;
  /** Small count shown after the label, e.g. number of rows in that view. */
  count?: number;
}

/**
 * One-of-many picker shown as chips. The picked chip is inverted (white on dark).
 * Replaces the small drop-downs and 11px pill buttons the Journal used before.
 * With `scroll` the chips sit in one row you can swipe, instead of wrapping.
 */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  scroll = false,
}: {
  label: string;
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex gap-2",
        scroll
          ? "-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex-wrap",
      )}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "bg-foreground text-background" : "bg-elevated text-foreground hover:bg-border",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "ml-2 text-[13px] font-medium",
                  on ? "opacity-70" : "text-muted-foreground",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * In-app replacement for window.confirm. Delete sits on top (easy to reach with a thumb),
 * Cancel underneath; on a wide screen they sit side by side.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-2xl sm:max-w-md sm:rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-snug">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 h-12 rounded-xl text-base">Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="h-12 rounded-xl text-base font-semibold text-background"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Small helper for the common "ask first, then do it" pattern:
 *   const del = useConfirm<string>();  ...  del.ask(id)  ...  <ConfirmDialog open={del.open} .../>
 */
export function useConfirm<T>() {
  const [target, setTarget] = useState<T | null>(null);
  return {
    target,
    open: target !== null,
    ask: (value: T) => setTarget(value),
    close: () => setTarget(null),
  };
}

/* ----------------------------------------------------------------- numbers */

/**
 * The few numbers that matter most, large, in a hairline-divided grid (no tiles).
 * Items are laid out two per row.
 */
export function Headline({
  items,
}: {
  items: { label: ReactNode; value: string; tone?: string; hint?: string }[];
}) {
  return (
    <dl className="grid grid-cols-2 border-y border-border/60">
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "min-w-0 py-4",
            index % 2 === 0 ? "border-r border-border/60 pr-4" : "pl-4",
            index >= 2 && "border-t border-border/60",
          )}
        >
          <dt className="text-[15px] text-muted-foreground">{item.label}</dt>
          <dd
            className={cn(
              "mt-1 font-display text-3xl font-semibold tabular-nums leading-none",
              item.tone,
            )}
          >
            {item.value}
          </dd>
          {item.hint && (
            <p className="mt-1.5 text-[13px] leading-[18px] text-muted-foreground">{item.hint}</p>
          )}
        </div>
      ))}
    </dl>
  );
}

/** Label on the left, value on the right, one per row. */
export function StatRows({
  rows,
}: {
  rows: { label: ReactNode; value: ReactNode; tone?: string; hint?: string }[];
}) {
  return (
    <dl className="divide-y divide-border/60 border-y border-border/60">
      {rows.map((row, index) => (
        <div key={index} className="flex min-h-[52px] items-center justify-between gap-4 py-2.5">
          <div className="min-w-0">
            <dt className="text-base">{row.label}</dt>
            {row.hint && (
              <p className="text-[13px] leading-[18px] text-muted-foreground">{row.hint}</p>
            )}
          </div>
          <dd className={cn("shrink-0 text-base font-semibold tabular-nums", row.tone)}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------ tables */

export interface Column {
  label: ReactNode;
  align?: "left" | "right";
}

/** Plain hairline table. 14px text, 44px rows, scrolls sideways instead of squeezing. */
export function DataTable({
  columns,
  rows,
  label,
}: {
  columns: Column[];
  rows: { key: string; cells: ReactNode[] }[];
  label: string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table aria-label={label} className="w-full min-w-[320px] text-left text-[14px]">
        <thead>
          <tr className="border-b border-border/60 text-[13px] text-muted-foreground">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={cn(
                  "whitespace-nowrap py-2.5 font-medium",
                  index === 0 ? "pr-3" : "pl-3",
                  column.align === "right" && "text-right",
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td
                  key={index}
                  className={cn(
                    "py-3 align-top tabular-nums",
                    index === 0 ? "pr-3" : "pl-3",
                    columns[index]?.align === "right" && "text-right",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface BreakdownRow {
  label: string;
  total: number;
  winRate: number | null;
  avgR: number | null;
  /** Second line under the label, e.g. "Small sample". */
  note?: string | undefined;
  noteTone?: "warn" | "ok" | undefined;
}

export interface BreakdownGroup {
  key: string;
  label: string;
  rows: BreakdownRow[];
}

/**
 * "By asset / direction / timeframe / ..." as ONE table with chips to switch,
 * instead of four or six tables stacked down the page.
 */
export function Breakdown({
  groups,
  label,
  empty,
}: {
  groups: BreakdownGroup[];
  label: string;
  empty?: string;
}) {
  const usable = groups.filter((group) => group.rows.length > 0);
  const [picked, setPicked] = useState<string>(usable[0]?.key ?? "");
  const active = usable.find((group) => group.key === picked) ?? usable[0];

  if (!active) {
    return <p className="text-[15px] text-muted-foreground">{empty ?? "Nothing to group yet."}</p>;
  }

  return (
    <div className="space-y-4">
      {usable.length > 1 && (
        <ChoiceChips
          scroll
          label={`${label}: group by`}
          options={usable.map((group) => ({ value: group.key, label: group.label }))}
          value={active.key}
          onChange={setPicked}
        />
      )}
      <DataTable
        label={`${label} ${active.label}`}
        columns={[
          {
            label:
              usable.length > 1
                ? active.label.replace(/^By /, "").replace(/^./, (c) => c.toUpperCase())
                : "Group",
          },
          { label: "Trades", align: "right" },
          { label: "Win rate", align: "right" },
          { label: "Avg R", align: "right" },
        ]}
        rows={active.rows.map((row) => ({
          key: row.label,
          cells: [
            <span key="l">
              <span className="font-semibold">{row.label}</span>
              {row.note && (
                <span
                  className={cn(
                    "mt-0.5 flex items-start gap-1 text-[13px] leading-[18px]",
                    row.noteTone === "warn" ? "text-warn" : "text-muted-foreground",
                  )}
                >
                  {row.noteTone === "warn" && (
                    <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
                  )}
                  {row.noteTone === "ok" && (
                    <CheckCircle2 className="mt-px size-3.5 shrink-0" aria-hidden />
                  )}
                  {row.note}
                </span>
              )}
            </span>,
            row.total,
            fmtPct(row.winRate, 0),
            <span key="r" className={cn("font-semibold", signTone(row.avgR))}>
              {fmtR(row.avgR)}
            </span>,
          ],
        }))}
      />
    </div>
  );
}
