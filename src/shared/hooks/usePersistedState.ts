"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

type Listener = () => void;

interface PersistedStore<T> {
  value: T;
  hydrated: boolean;
  listeners: Set<Listener>;
  revive?: (raw: string) => T | undefined;
}

// One store per storage key, shared by every component that reads it.
const registry = new Map<string, PersistedStore<unknown>>();

function ensureStore<T>(
  key: string,
  fallback: T,
  revive?: (raw: string) => T | undefined
): PersistedStore<T> {
  let store = registry.get(key) as PersistedStore<T> | undefined;

  if (!store) {
    store = { value: fallback, hydrated: false, listeners: new Set(), revive };
    registry.set(key, store as PersistedStore<unknown>);
  }

  if (!store.hydrated) {
    store.hydrated = true;
    // Storage is a browser-only system: SSR and the hydration pass use the
    // fallback, then React re-renders with what was actually saved.
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = revive ? revive(raw) : (JSON.parse(raw) as T);
        if (parsed !== undefined) store.value = parsed;
      }
    } catch {
      // Blocked or corrupt storage keeps the fallback.
    }
  }

  return store;
}

/**
 * State that survives a reload.
 *
 * Behaves like `useState`, but the value lives in `localStorage` behind a
 * `useSyncExternalStore` subscription instead of being restored from an effect.
 * That avoids the cascading render (and the first-frame flash of the default)
 * that `setState` in an effect causes, and keeps every reader of the same key in
 * sync across tabs.
 */
export function usePersistedState<T>(
  key: string,
  fallback: T,
  revive?: (raw: string) => T | undefined
): [T, (value: T | ((prev: T) => T)) => void] {
  // The fallback is only consulted for the server snapshot and the first client
  // read, so it must not become a dependency of the setters below.
  const fallbackRef = useRef(fallback);
  const reviveRef = useRef(revive);

  const subscribe = useCallback(
    (onChange: Listener) => {
      const store = ensureStore(key, fallbackRef.current, reviveRef.current);

      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;
        try {
          const parsed =
            event.newValue === null
              ? fallbackRef.current
              : reviveRef.current
                ? reviveRef.current(event.newValue)
                : (JSON.parse(event.newValue) as T);
          if (parsed === undefined) return;
          store.value = parsed;
        } catch {
          return;
        }
        Array.from(store.listeners).forEach((notify) => notify());
      };

      store.listeners.add(onChange);
      window.addEventListener("storage", onStorage);

      return () => {
        store.listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key]
  );

  const getSnapshot = useCallback(
    () => ensureStore(key, fallbackRef.current, reviveRef.current).value,
    [key]
  );

  const getServerSnapshot = useCallback(() => fallbackRef.current, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const store = ensureStore(key, fallbackRef.current, reviveRef.current);
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(store.value) : next;
      if (Object.is(resolved, store.value)) return;

      store.value = resolved;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage can be full or blocked; the in-memory value still applies.
      }
      Array.from(store.listeners).forEach((notify) => notify());
    },
    [key]
  );

  return [value, setValue];
}
