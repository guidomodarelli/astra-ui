/** Copy and tuning of Arc's Timeline, adapted from Arc (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** Status of a system event. Say the outcome in the title too, so it never rests on colour. */
export type TimelineTone = "neutral" | "success" | "danger"

/** Heading levels the day labels can take; Arc uses level 3. */
export type TimelineHeadingLevel = 2 | 3 | 4 | 5 | 6

/**
 * Every visible and announced string of a `Timeline`. The Spanish defaults can be replaced one by one through the
 * `messages` prop.
 */
export type TimelineMessages = {
  /** Day label of the reference day. */
  today: string
  /** Day label of the day before the reference day. */
  yesterday: string
  /** Noun after a day's update count: "1 actualización", "3 actualizaciones". */
  updates: (count: number) => string
  /** Short time of an event less than a minute old. */
  justNowShort: string
  /** Spoken time of an event less than a minute old. */
  justNowLong: string
  /** Short time of an event minutes old: "5 min". */
  minutesShort: (minutes: number) => string
  /** Spoken time of an event minutes old: "hace 5 minutos". */
  minutesLong: (minutes: number) => string
  /** Short time of an event hours old: "3 h". */
  hoursShort: (hours: number) => string
  /** Spoken time of an event hours old: "hace 3 horas". */
  hoursLong: (hours: number) => string
  /** Announcement of updates that arrive after the first render, with their actors and titles joined. */
  newUpdates: (summary: string) => string
}

/** Spanish copy of the timeline. */
export const TIMELINE_DEFAULT_MESSAGES = {
  today: "Hoy",
  yesterday: "Ayer",
  updates: (count) => (count === 1 ? "actualización" : "actualizaciones"),
  justNowShort: "Ahora",
  justNowLong: "recién",
  minutesShort: (minutes) => `${minutes} min`,
  minutesLong: (minutes) => `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`,
  hoursShort: (hours) => `${hours} h`,
  hoursLong: (hours) => `hace ${hours} ${hours === 1 ? "hora" : "horas"}`,
  newUpdates: (summary) => `Nueva actualización: ${summary}`,
} as const satisfies TimelineMessages

/** Locale of day labels and clock times when none is passed. */
export const TIMELINE_DEFAULT_LOCALE = "es-AR"

/** Time zone of day groups and clock times when none is passed; fixed so server and client agree. */
export const TIMELINE_DEFAULT_TIME_ZONE = "UTC"

/** Heading level of the day labels when none is passed. */
export const TIMELINE_DEFAULT_HEADING_LEVEL = 3 satisfies TimelineHeadingLevel

/** Today's events younger than this many hours show a relative time instead of a clock time. */
export const TIMELINE_RELATIVE_WINDOW_HOURS = 12

/** Seconds between rows revealed together, so the line reads as drawing downward. */
export const TIMELINE_REVEAL_STEP_S = 0.09

/** Longest wait, in seconds, a row can be queued behind others before it reveals. */
export const TIMELINE_REVEAL_QUEUE_LIMIT_S = 0.45

/** Extra delay, in seconds, before a row that arrived after the first render reveals its marker. */
export const TIMELINE_FRESH_ROW_DELAY_S = 0.12

/** Share of a row, from 0 to 1, that must be visible before it reveals. */
export const TIMELINE_REVEAL_AMOUNT = 0.2

/** Size, in pixels, of an event's avatar. */
export const TIMELINE_AVATAR_SIZE_PX = 28
