"use client";

/** The viewer's local date, kept out of server and hydration renders and refreshed at midnight. */
import { useEffect, useState } from "react";

import { useIsHydrated } from "./use-is-hydrated.js";

/**
 * Midnight that starts the viewer's current local day.
 * @returns Today at 00:00 in the viewer's time zone.
 */
function startOfLocalToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Milliseconds until the next local midnight, measured from now.
 * @param today - Start of the current local day.
 * @returns The delay before the day changes.
 */
function getDelayUntilNextDay(today: Date): number {
  const nextDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return Math.max(0, nextDay.getTime() - Date.now());
}

/**
 * Arc's `useToday`: the viewer's local date at midnight. It is `undefined` while rendering on the server and during
 * hydration, so markup never depends on the server clock, and it moves to the next day when the viewer's midnight
 * passes. The same `Date` instance is returned until the day changes.
 * @returns Today at 00:00 in the viewer's time zone, or `undefined` before hydration.
 */
export function useToday(): Date | undefined {
  const isHydrated = useIsHydrated();
  const [today, setToday] = useState(startOfLocalToday);

  useEffect(() => {
    const timeout = window.setTimeout(() => setToday(startOfLocalToday()), getDelayUntilNextDay(today));
    return () => window.clearTimeout(timeout);
  }, [today]);

  return isHydrated ? today : undefined;
}
