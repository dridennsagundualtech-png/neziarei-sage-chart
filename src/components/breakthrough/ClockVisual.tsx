import { useEffect, useId, useState } from "react";

import type { ClockBand, ClockSpec } from "@/lib/breakthrough/types";
import { cn } from "@/lib/utils";
import { TONE } from "./tone";

const pad = (v: number) => String(v).padStart(2, "0");
const hhmm = (h: number) => {
  const total = ((Math.round(h * 60) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

/** Converts a band to UTC segments [start, end) inside 0..24. */
function segments(band: ClockBand, nyOffset: number): [number, number][] {
  const shift = band.tz === "ny" ? nyOffset : 0;
  const s = (((band.start + shift) % 24) + 24) % 24;
  const len = (((band.end - band.start) % 24) + 24) % 24 || 24;
  const e = s + len;
  return e <= 24
    ? [[s, e]]
    : [
        [s, 24],
        [0, e - 24],
      ];
}

function isUsSummerTime(date: Date) {
  try {
    const name = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      timeZoneName: "short",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value;
    return name === "EDT";
  } catch {
    return false;
  }
}

/** 24-hour session map with an hour picker and conversions to New York and the viewer's clock. */
export function ClockVisual({ spec }: { spec: ClockSpec }) {
  const id = useId();
  const [hour, setHour] = useState(13);
  const [summer, setSummer] = useState(false);
  const [localOffset, setLocalOffset] = useState<number | null>(null);
  const usesNy = spec.bands.some((b) => b.tz === "ny");

  useEffect(() => {
    const now = new Date();
    setHour(now.getUTCHours());
    setSummer(isUsSummerTime(now));
    setLocalOffset(-now.getTimezoneOffset() / 60);
  }, []);

  const nyOffset = summer ? 4 : 5; // New York is UTC−5 in winter, UTC−4 in summer
  const active = spec.bands.filter((b) =>
    segments(b, nyOffset).some(([s, e]) => hour >= s && hour < e),
  );

  return (
    <div className="space-y-3">
      {usesNy && (
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="US daylight saving">
          {[
            { v: false, label: "US winter (EST)" },
            { v: true, label: "US summer (EDT)" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={summer === o.v}
              onClick={() => setSummer(o.v)}
              className={cn(
                "h-11 rounded-xl border text-[14px] font-medium",
                summer === o.v
                  ? "border-foreground bg-foreground text-background"
                  : "border-border",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {spec.bands.map((band) => {
          const on = active.includes(band);
          return (
            <div key={band.label}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className={on ? "font-semibold text-foreground" : "text-muted-foreground"}>
                  {band.label}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {segments(band, nyOffset)
                    .map(([s, e]) => `${hhmm(s)}–${hhmm(e)}`)
                    .join(", ")}{" "}
                  UTC
                </span>
              </div>
              <div className="relative mt-1 h-3 rounded-full bg-muted">
                {segments(band, nyOffset).map(([s, e]) => (
                  <div
                    key={s}
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      left: `${(s / 24) * 100}%`,
                      width: `${((e - s) / 24) * 100}%`,
                      background: TONE[band.tone],
                      opacity: on ? 1 : 0.45,
                    }}
                  />
                ))}
                <div
                  className="absolute inset-y-[-3px] w-0.5 bg-foreground"
                  style={{ left: `${((hour + 0.5) / 24) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
        <div
          className="flex justify-between font-mono text-[13px] text-muted-foreground"
          aria-hidden
        >
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
      </div>

      <div>
        <label htmlFor={id} className="text-[14px] text-muted-foreground">
          Pick an hour (UTC)
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={23}
          step={1}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="h-11 w-full cursor-pointer accent-[var(--color-primary)]"
        />
      </div>

      <p aria-live="polite" className="border-l-2 border-border pl-3 text-[15px] leading-relaxed">
        <span className="font-mono tabular-nums">UTC {hhmm(hour)}</span> ·{" "}
        <span className="font-mono tabular-nums">New York {hhmm(hour - nyOffset)}</span>
        {localOffset !== null && (
          <>
            {" "}
            · <span className="font-mono tabular-nums">your clock {hhmm(hour + localOffset)}</span>
          </>
        )}
        <br />
        {active.length
          ? `Active: ${active.map((b) => b.label).join(", ")}.`
          : "Nothing in this list is active."}
      </p>
      {spec.caption && (
        <p className="text-[14px] leading-relaxed text-muted-foreground">{spec.caption}</p>
      )}
    </div>
  );
}
