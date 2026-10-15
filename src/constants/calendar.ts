/** Tuning of `Calendar`, adapted from Arc's calendar (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** Spring of a month sliding in: Arc's month strip, critically damped so it never overshoots or queues. */
export const CALENDAR_MONTH_SPRING = { type: "spring", visualDuration: 0.36, bounce: 0, restDelta: 0.002 } as const

/** Opacity a month starts from while it slides in, matching Arc's neighbouring pane one step off the strip. */
export const CALENDAR_MONTH_ENTER_OPACITY = 0.4

/** Scale the selected disc grows from when the selection enters a month. */
export const CALENDAR_SELECTION_ENTER_SCALE = 0.6

/** Duration, in seconds, of the selected disc fading out when the selection leaves a month. */
export const CALENDAR_SELECTION_EXIT_DURATION_S = 0.14

/** Day button that holds a single selection, the only one the gliding disc follows. */
export const CALENDAR_SELECTED_DAY_SELECTOR = '[data-selected-single="true"]'

/** Attribute the month sets while its disc paints the selection, so the selected day drops its own fill. */
export const CALENDAR_SELECTION_DISC_ATTRIBUTE = "data-selection-disc"

/** Default copy of the optional Today button. */
export const CALENDAR_COPY = {
  today: "Hoy",
} as const

/** Extra wait, in milliseconds, after local midnight before reading the new date, so the clock has turned over. */
export const CALENDAR_TODAY_REFRESH_DELAY_MS = 1000
