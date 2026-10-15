"use client"

/**
 * The viewer's local date, adapted from Arc's `useToday` (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md).
 * Undefined on the server and during hydration, so markup never depends on the server clock or time zone; afterwards
 * it follows the real date across midnight, and returning to the tab or focusing the window reads it again.
 */
import { useMemo, useSyncExternalStore } from "react"

import { CALENDAR_TODAY_REFRESH_DELAY_MS } from "../constants/calendar.js"

/** Serializes a local date as `YYYY-MM-DD`, a stable snapshot for `useSyncExternalStore`. */
function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

/** Parses a key written by {@link toDateKey} back into a local date at midnight. */
function fromDateKey(key: string): Date {
  const [year = 1970, month = 1, day = 1] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** Notifies at the next local midnight, when the page becomes visible again and when the window regains focus. */
function subscribeToToday(notify: () => void): () => void {
  let timer = 0
  const scheduleMidnight = () => {
    const now = new Date()
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    timer = window.setTimeout(() => {
      notify()
      scheduleMidnight()
    }, nextMidnight.getTime() - now.getTime() + CALENDAR_TODAY_REFRESH_DELAY_MS)
  }
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") notify()
  }
  scheduleMidnight()
  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("focus", notify)
  return () => {
    window.clearTimeout(timer)
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("focus", notify)
  }
}

/** Reads today's key on the client. */
function readTodayKey(): string {
  return toDateKey(new Date())
}

/** Keeps today unknown on the server, so hydration never mismatches. */
function readServerTodayKey(): string {
  return ""
}

/**
 * Returns the viewer's local date at midnight.
 * @returns Today, or `undefined` on the server and during hydration.
 */
export function useToday(): Date | undefined {
  const key = useSyncExternalStore(subscribeToToday, readTodayKey, readServerTodayKey)
  return useMemo(() => (key ? fromDateKey(key) : undefined), [key])
}
