/**
 * Building blocks for the Settings page.
 *
 * Design rules (kept on purpose):
 *  - Sections are plain headings on the page, separated by whitespace and hairlines, never boxed cards.
 *  - Text is at least 13px; labels are 16px. Every tap target is at least 44px tall.
 *  - Amber (primary) is only used for the one action that matters on screen.
 */
import { Link, type LinkProps } from "@tanstack/react-router";
import { ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- layout */

export function Section({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("pt-9", className)}>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-[15px] leading-snug text-muted-foreground">{hint}</p>}
      <div className="mt-3 divide-y divide-border/60 border-y border-border/60">{children}</div>
    </section>
  );
}

const labelClass = "text-base font-semibold leading-snug";
const hintClass = "mt-0.5 text-[13px] leading-[18px] text-muted-foreground";

/** A label on the left (with optional hint) and one control on the right. */
export function FieldRow({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className={labelClass}>
          {label}
        </Label>
        {hint && (
          <p id={`${id}-hint`} className={hintClass}>
            {hint}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-1 text-[13px] font-medium leading-[18px] text-bear">
            {error}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** The whole row is the tap target, not just the small switch. */
export function ToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-[68px] cursor-pointer items-center justify-between gap-4 py-3"
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block", labelClass)}>{label}</span>
        {hint && <span className={cn("block", hintClass)}>{hint}</span>}
      </span>
      <Switch id={id} size="lg" checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

/** A row that opens another page. */
export function LinkRow({
  to,
  icon,
  label,
  hint,
}: {
  to: NonNullable<LinkProps["to"]>;
  icon: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <Link to={to} className="flex min-h-[60px] items-center justify-between gap-4 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className="text-muted-foreground [&_svg]:size-5">{icon}</span>
        <span className="min-w-0">
          <span className={cn("block", labelClass)}>{label}</span>
          {hint && <span className={cn("block", hintClass)}>{hint}</span>}
        </span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

/* ---------------------------------------------------------------- fields */

/**
 * Numeric input that lets you type "0.5" or "1.5".
 *
 * The old fields converted every keystroke to a number, so "1." became 1 and the dot
 * vanished. This keeps what you typed as text and only sends a number up when it parses.
 */
export function NumberField({
  id,
  value,
  onValue,
  min = 0,
  integer = false,
  suffix,
  invalid,
  className,
  ...aria
}: {
  id: string;
  value: number;
  onValue: (value: number) => void;
  min?: number;
  integer?: boolean;
  suffix?: string;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const [text, setText] = useState(String(value));
  const committed = useRef(value);

  // Pick up outside changes (Discard, first load) without fighting what is being typed.
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setText(String(value));
    }
  }, [value]);

  const pattern = integer ? /^\d*$/ : /^\d*\.?\d*$/;

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        autoComplete="off"
        value={text}
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-hint`}
        className={cn(
          "h-11 w-28 rounded-xl text-right text-base tabular-nums md:text-base",
          className,
        )}
        onChange={(event) => {
          const raw = event.target.value.replace(",", ".");
          if (!pattern.test(raw)) return;
          setText(raw);
          if (raw === "" || raw === ".") return;
          const parsed = Number(raw);
          if (!Number.isFinite(parsed)) return;
          const next = Math.max(min, integer ? Math.floor(parsed) : parsed);
          committed.current = next;
          onValue(next);
        }}
        onBlur={() => setText(String(committed.current))}
        {...aria}
      />
      {suffix && <span className="w-4 text-base text-muted-foreground">{suffix}</span>}
    </div>
  );
}

/**
 * A list of short codes (assets) you add by typing and remove by tapping.
 * Typing a comma, a space or pressing Enter adds the code. Pasting "EURUSD, GBPUSD" adds both.
 */
export function TagInput({
  id,
  label,
  values,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(/[\s,;]+/)
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean);
    setDraft("");
    if (!parts.length) return;
    const next = [...values];
    for (const part of parts) if (!next.includes(part)) next.push(part);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={label}>
          {values.map((value) => (
            <li key={value}>
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-elevated pl-4 pr-3 text-[15px] font-semibold transition-colors hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {value}
                <X className="size-4 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] leading-[18px] text-muted-foreground">Nothing here yet.</p>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder={placeholder}
          className="h-11 flex-1 rounded-xl text-base md:text-base"
          onChange={(event) => {
            const next = event.target.value;
            if (/[\s,;]/.test(next)) commit(next);
            else setDraft(next.toUpperCase());
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
            }
          }}
          onBlur={() => commit(draft)}
        />
        <Button
          type="button"
          variant="secondary"
          className="h-11 rounded-xl px-5 text-[15px]"
          disabled={!draft.trim()}
          onClick={() => commit(draft)}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

/** Tap to turn timeframes on or off. Keeps the order of `options` so 1D always comes before 5M. */
export function ChipToggleGroup({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  // Anything already saved but not in the standard list stays visible instead of silently vanishing.
  const all = [...options, ...values.filter((value) => !options.includes(value))];
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {all.map((option) => {
        const on = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(all.filter((item) => (item === option ? !on : values.includes(item))))
            }
            className={cn(
              "inline-flex h-11 min-w-14 items-center justify-center rounded-full px-4 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              on ? "bg-foreground text-background" : "bg-elevated text-foreground hover:bg-border",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
