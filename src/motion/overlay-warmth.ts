/**
 * Arc's skip window for hover-driven layers (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): while any
 * layer of a family is open, and briefly after the last one closes, the page is warm and the next layer opens
 * without waiting and only fades. Each family (tooltips, hover cards) keeps its own store.
 */
import { useState } from "react";

/** A subscribable warm flag shared by every instance of one layer family. */
export interface OverlayWarmth {
  subscribe: (listener: () => void) => () => void;
  /** Whether a layer of the family is open, or closed less than the skip window ago. */
  isWarm: () => boolean;
  /** Server snapshot: nothing is open while rendering on the server. */
  isWarmOnServer: () => boolean;
  /** Marks one more layer as open and returns the call that marks it closed again. */
  open: () => () => void;
}

/**
 * Creates the warm flag of one layer family.
 * @param skipWindowMs - Milliseconds the page stays warm after the last layer closes.
 * @returns The store, meant for `useSyncExternalStore`.
 */
export function createOverlayWarmth(skipWindowMs: number): OverlayWarmth {
  let warm = false;
  let openCount = 0;
  let coolTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const setWarm = (next: boolean) => {
    if (warm === next) return;
    warm = next;
    listeners.forEach((listener) => listener());
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    isWarm: () => warm,
    isWarmOnServer: () => false,
    open() {
      openCount += 1;
      clearTimeout(coolTimer);
      setWarm(true);
      let closed = false;
      return () => {
        if (closed) return;
        closed = true;
        openCount = Math.max(0, openCount - 1);
        if (openCount) return;
        clearTimeout(coolTimer);
        coolTimer = setTimeout(() => setWarm(false), skipWindowMs);
      };
    },
  };
}

/**
 * Remembers whether the page was already warm when a layer opened, so its entrance picks the instant path. It is
 * captured while rendering the open change, before the layer marks the page warm itself.
 * @param open - Whether the layer is open.
 * @param isWarm - The family's current warm flag, read through `useSyncExternalStore`.
 * @returns Whether the current (or last) opening happened while warm.
 */
export function useOpenedWhileWarm(open: boolean, isWarm: boolean): boolean {
  const [wasOpen, setWasOpen] = useState(open);
  const [openedWhileWarm, setOpenedWhileWarm] = useState(open && isWarm);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOpenedWhileWarm(isWarm);
  }
  return openedWhileWarm;
}
