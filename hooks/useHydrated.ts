"use client";

import { useSyncExternalStore } from "react";

let hydrated = false;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  // Flip to hydrated only after React has mounted and subscribed.
  if (!hydrated) {
    hydrated = true;
    queueMicrotask(notify);
  }

  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => hydrated;
const getServerSnapshot = () => false;

export function useHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
