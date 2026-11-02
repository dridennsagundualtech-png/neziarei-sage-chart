import { useCallback, useRef, useSyncExternalStore } from "react";

/** Tiny localStorage store shared across components. All keys start with "sc.". */
const cache = new Map<string, { raw: string | null; val: unknown }>();
const listeners = new Set<() => void>();

export function readLocal<T>(key: string, init: T): T {
  if (typeof window === "undefined") return init;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return init;
  }
  const c = cache.get(key);
  if (c && c.raw === raw) return c.val as T;
  let val: T = init;
  if (raw !== null) {
    try {
      val = JSON.parse(raw) as T;
    } catch {
      val = init;
    }
  }
  cache.set(key, { raw, val });
  return val;
}

export function writeLocal<T>(key: string, val: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* storage full or blocked */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useLocal<T>(key: string, init: T) {
  const initRef = useRef(init);
  const value = useSyncExternalStore(
    subscribe,
    () => readLocal(key, initRef.current),
    () => initRef.current,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readLocal(key, initRef.current);
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeLocal(key, v);
    },
    [key],
  );
  return [value, set] as const;
}
