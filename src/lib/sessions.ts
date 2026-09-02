/**
 * Trading session detector.
 *
 * All ranges are expressed in UTC hours; the browser clock is converted to UTC
 * so the read is correct wherever the user is.
 */
export type SessionKey = "asian" | "london" | "newyork" | "overlap";

export interface SessionDef {
  key: SessionKey;
  label: string;
  /** Inclusive start hour (UTC). */
  start: number;
  /** Exclusive end hour (UTC). */
  end: number;
  /** Tailwind classes for the badge. */
  tone: string;
}

export const SESSIONS: SessionDef[] = [
  { key: "asian", label: "Asian", start: 0, end: 9, tone: "bg-primary/15 text-primary" },
  { key: "london", label: "London", start: 8, end: 17, tone: "bg-bull/15 text-bull" },
  { key: "newyork", label: "New York", start: 13, end: 22, tone: "bg-warn/15 text-warn" },
  { key: "overlap", label: "London + NY overlap", start: 13, end: 17, tone: "bg-bear/15 text-bear" },
];

function minutesOfDay(date: Date) {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function startMin(session: SessionDef) {
  return session.start * 60;
}

function endMin(session: SessionDef) {
  return session.end * 60;
}

export function activeSessions(now: Date): SessionDef[] {
  const m = minutesOfDay(now);
  return SESSIONS.filter((session) => m >= startMin(session) && m < endMin(session));
}

/**
 * The single session we headline. The overlap wins when it is running, then the
 * session that ends last (most relevant right now).
 */
export function primarySession(now: Date): SessionDef | null {
  const active = activeSessions(now);
  if (active.length === 0) return null;
  const overlap = active.find((session) => session.key === "overlap");
  if (overlap) return overlap;
  return active.reduce((best, session) => (endMin(session) > endMin(best) ? session : best));
}

/** Minutes until the given session ends (same UTC day). */
export function minutesUntilEnd(now: Date, session: SessionDef): number {
  return endMin(session) - minutesOfDay(now);
}

/** Next session to start, wrapping to the next UTC day when needed. */
export function nextSession(now: Date): { session: SessionDef; minutes: number } | null {
  const m = minutesOfDay(now);
  let best: { session: SessionDef; minutes: number } | null = null;
  for (const session of SESSIONS) {
    const raw = startMin(session) - m;
    const minutes = raw > 0 ? raw : raw + 24 * 60;
    if (!best || minutes < best.minutes) best = { session, minutes };
  }
  return best;
}

export function formatCountdown(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function sessionRangeLabel(session: SessionDef): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(session.start)}:00 – ${pad(session.end)}:00 UTC`;
}

/** True when the current time falls inside at least one of the chosen sessions. */
export function inSelectedSessions(now: Date, selected: SessionKey[]): boolean {
  if (selected.length === 0) return true;
  const active = new Set(activeSessions(now).map((session) => session.key));
  return selected.some((key) => active.has(key));
}

export interface SessionFilter {
  enabled: boolean;
  sessions: SessionKey[];
}

export const DEFAULT_SESSION_FILTER: SessionFilter = { enabled: false, sessions: [] };

const STORAGE_KEY = "chartpilot.session-filter.v1";

export function loadSessionFilter(): SessionFilter {
  if (typeof window === "undefined") return DEFAULT_SESSION_FILTER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SESSION_FILTER;
    const parsed = JSON.parse(raw) as Partial<SessionFilter>;
    const keys = new Set(SESSIONS.map((session) => session.key));
    return {
      enabled: Boolean(parsed.enabled),
      sessions: (parsed.sessions ?? []).filter((key): key is SessionKey => keys.has(key as SessionKey)),
    };
  } catch {
    return DEFAULT_SESSION_FILTER;
  }
}

export function saveSessionFilter(filter: SessionFilter) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  } catch {
    /* storage unavailable — the filter just won't persist */
  }
}

/** "Taken 5 minutes ago" style relative time. */
export function relativeTime(iso: string | Date, now: Date = new Date()): string {
  const then = typeof iso === "string" ? new Date(iso) : iso;
  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
