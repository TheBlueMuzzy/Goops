/**
 * Tutorial v3 — Centralized Timeout/Interval Manager
 *
 * All timeouts and intervals are registered with names.
 * On step change, `clearAll()` guarantees cleanup — no leaked timers.
 * Replaces the 20+ individual refs from v2.
 *
 * Usage:
 *   const pool = useTimeoutPool();
 *   pool.set('message-delay', callback, 2000);
 *   pool.setInterval('position-poll', callback, 200);
 *   pool.clear('message-delay');
 *   pool.clearAll();  // On step change
 */

import { useCallback, useRef } from 'react';

interface TimeoutEntry {
  id: ReturnType<typeof setTimeout>;
  type: 'timeout';
}

interface IntervalEntry {
  id: ReturnType<typeof setInterval>;
  type: 'interval';
}

type PoolEntry = TimeoutEntry | IntervalEntry;

export interface TimeoutPool {
  /** Set a named timeout. If a timeout with this name already exists, it's cleared first. */
  set: (name: string, callback: () => void, delayMs: number) => void;
  /** Set a named interval. If an interval with this name already exists, it's cleared first. */
  setInterval: (name: string, callback: () => void, intervalMs: number) => void;
  /** Clear a specific named timeout or interval. */
  clear: (name: string) => void;
  /** Clear ALL timeouts and intervals. Called on every step change. */
  clearAll: () => void;
  /** Check if a named timeout/interval exists. */
  has: (name: string) => boolean;
}

/**
 * Hook that provides a centralized timeout/interval pool.
 *
 * All timers are tracked by name. `clearAll()` is called on step change
 * to guarantee no leaked timers from the previous step.
 */
export function useTimeoutPool(): TimeoutPool {
  const poolRef = useRef<Map<string, PoolEntry>>(new Map());

  const clear = useCallback((name: string) => {
    const entry = poolRef.current.get(name);
    if (!entry) return;

    if (entry.type === 'timeout') {
      clearTimeout(entry.id);
    } else {
      clearInterval(entry.id);
    }
    poolRef.current.delete(name);
  }, []);

  const set = useCallback((name: string, callback: () => void, delayMs: number) => {
    // Clear existing timer with same name
    const existing = poolRef.current.get(name);
    if (existing) {
      if (existing.type === 'timeout') clearTimeout(existing.id);
      else clearInterval(existing.id);
    }

    const id = setTimeout(() => {
      poolRef.current.delete(name);
      callback();
    }, delayMs);

    poolRef.current.set(name, { id, type: 'timeout' });
  }, []);

  const setIntervalFn = useCallback((name: string, callback: () => void, intervalMs: number) => {
    // Clear existing timer with same name
    const existing = poolRef.current.get(name);
    if (existing) {
      if (existing.type === 'timeout') clearTimeout(existing.id);
      else clearInterval(existing.id);
    }

    const id = globalThis.setInterval(callback, intervalMs);

    poolRef.current.set(name, { id, type: 'interval' });
  }, []);

  const clearAll = useCallback(() => {
    poolRef.current.forEach((entry) => {
      if (entry.type === 'timeout') {
        clearTimeout(entry.id);
      } else {
        clearInterval(entry.id);
      }
    });
    poolRef.current.clear();
  }, []);

  const has = useCallback((name: string) => {
    return poolRef.current.has(name);
  }, []);

  return {
    set,
    setInterval: setIntervalFn,
    clear,
    clearAll,
    has,
  };
}
