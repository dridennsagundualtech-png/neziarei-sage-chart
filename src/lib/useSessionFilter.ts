import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_SESSION_FILTER,
  loadSessionFilter,
  saveSessionFilter,
  type SessionFilter,
  type SessionKey,
} from "./sessions";

/** Shared "only analyze during selected sessions" preference (per device). */
export function useSessionFilter() {
  const [filter, setFilterState] = useState<SessionFilter>(DEFAULT_SESSION_FILTER);

  // Read after hydration so SSR and the first client render match.
  useEffect(() => {
    setFilterState(loadSessionFilter());
  }, []);

  const setFilter = useCallback((next: SessionFilter) => {
    setFilterState(next);
    saveSessionFilter(next);
  }, []);

  const toggleSession = useCallback(
    (key: SessionKey) =>
      setFilterState((current) => {
        const sessions = current.sessions.includes(key)
          ? current.sessions.filter((item) => item !== key)
          : [...current.sessions, key];
        const next = { ...current, sessions };
        saveSessionFilter(next);
        return next;
      }),
    [],
  );

  return { filter, setFilter, toggleSession };
}

/** A Date that refreshes every `intervalMs`, for live countdowns. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
