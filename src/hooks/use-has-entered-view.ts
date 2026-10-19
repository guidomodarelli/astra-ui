"use client";

/** Tells once whether an element has scrolled into view, for entrances that wait until people can see them. */
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { inView } from "motion/react";

/**
 * Reports whether the element has been at least `amount` visible at some point. Without `IntersectionObserver` (old
 * engines) it reports `true` after mounting, so content never stays in its pre-entrance state.
 * @param ref - Element to watch.
 * @param amount - Share of the element, from 0 to 1, that must be visible.
 * @returns `false` until the element first enters the viewport, then `true` for good.
 */
export function useHasEnteredView(ref: RefObject<Element | null>, amount: number): boolean {
  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (hasEntered || !element) return;
    if (typeof IntersectionObserver === "undefined") {
      setHasEntered(true);
      return;
    }
    return inView(element, () => setHasEntered(true), { amount });
  }, [amount, hasEntered, ref]);
  return hasEntered;
}
