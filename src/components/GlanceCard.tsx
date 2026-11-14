import { Check, ClipboardCheck, Minus, X } from "lucide-react";

import type { GlanceRow } from "@/lib/glance";

function Mark({ ok }: { ok: boolean | null }) {
  if (ok === true) {
    return <Check className="mt-0.5 size-4 shrink-0 text-bull" aria-label="Passes" />;
  }
  if (ok === false) {
    return <X className="mt-0.5 size-4 shrink-0 text-warn" aria-label="Fails" />;
  }
  return (
    <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="For information" />
  );
}

/**
 * A read or a typed trade in a few lines (src/lib/glance.ts): name left, figure
 * right, one plain sentence under it. The card works nothing out itself; on an
 * analysis result every figure is repeated from the sections below it.
 */
export function GlanceCard({ rows, title = "At a glance" }: { rows: GlanceRow[]; title?: string }) {
  return (
    <section className="card-soft" aria-labelledby="glance-title">
      <h2 id="glance-title" className="card-band">
        <ClipboardCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {title}
      </h2>
      <ul className="divide-y divide-border px-4">
        {rows.map((row) => (
          <li key={row.key} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 py-3">
            <Mark ok={row.ok} />
            <p className="text-sm font-semibold">{row.label}</p>
            <p className="max-w-[11rem] text-right text-sm font-semibold tabular-nums">
              {row.value}
            </p>
            {row.note && (
              <p className="col-span-2 col-start-2 mt-0.5 text-sm leading-snug text-muted-foreground">
                {row.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
