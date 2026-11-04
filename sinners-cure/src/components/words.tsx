import { Fragment, useEffect, useMemo, useRef, type MouseEvent } from "react";
import { seekReading, useReadPos } from "@/lib/read-along";

/**
 * A piece of a reading drawn word by word. While reading `rid` plays, the word being said is
 * lit (or the whole sentence, when only that is known) and kept in view; tapping a word jumps
 * the voice there. `base` is where this piece starts in the reading text (makeReading).
 * Without `rid` it is plain text.
 */
export function Words({
  text,
  rid,
  base: baseIn,
  className,
}: {
  text: string;
  rid?: string | undefined;
  base?: number | undefined;
  className?: string;
}) {
  const base = baseIn ?? 0;
  const live = useReadPos(rid, base, base + text.length);
  const tokens = useMemo(() => [...text.matchAll(/\S+|\s+/g)], [text]);
  const activeRef = useRef<HTMLSpanElement>(null);
  const [at = -1, s = -1, e = -1] = live ? live.split("|").map(Number) : [];

  // Keep the word being read on screen, without fighting small scrolls.
  useEffect(() => {
    const el = activeRef.current;
    if (!el || at < 0) return;
    const r = el.getBoundingClientRect();
    const top = 72;
    const bottom = window.innerHeight - 150;
    if (r.top < top || r.bottom > bottom)
      el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [at]);

  if (!rid) return <span className={className}>{text}</span>;

  const onClick = (ev: MouseEvent) => {
    const w = (ev.target as HTMLElement).closest<HTMLElement>("[data-o]");
    if (!w) return;
    if (seekReading(rid, Number(w.dataset["o"]))) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  };

  return (
    <span className={className} onClick={onClick}>
      {tokens.map((m) => {
        const i = m.index ?? 0;
        const w = m[0];
        const sentence = at < 0 && live !== "" && i >= s && i < e;
        if (/^\s/.test(w))
          return sentence && i > s ? (
            <span key={i} className="read-sentence">
              {w}
            </span>
          ) : (
            <Fragment key={i}>{w}</Fragment>
          );
        const word = at >= 0 && i <= at && at < i + w.length;
        return (
          <span
            key={i}
            data-o={base + i}
            ref={word ? activeRef : undefined}
            className={word ? "read-word" : sentence ? "read-sentence" : undefined}
          >
            {w}
          </span>
        );
      })}
    </span>
  );
}
