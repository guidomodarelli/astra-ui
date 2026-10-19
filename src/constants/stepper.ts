/** Copy and tuning of Arc's Stepper, adapted from Arc (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** Layout direction of a stepper. */
export type StepperOrientation = "horizontal" | "vertical"

/** State of one step: done, in progress, not reached yet, or failed. */
export type StepperStatus = "complete" | "current" | "upcoming" | "error"

/** Which descriptions show: every step's, or only the active step's. Errors always show. */
export type StepperDetails = "all" | "current"

/**
 * Screen-reader copy of a `Stepper`. The Spanish defaults can be replaced one by one through the `messages` prop; the
 * accessible name and the completion copy keep their own props, `label` and `completeLabel`.
 */
export type StepperMessages = {
  /** Appended to a completed step's label. */
  completed: string
  /** Appended to a step not reached yet. */
  notStarted: string
  /** Appended to a failed step. */
  error: string
  /** Announced when the current step changes. */
  stepAnnouncement: (values: { position: number; count: number; label: string }) => string
}

/** Spanish screen-reader copy of the stepper. */
export const STEPPER_DEFAULT_MESSAGES = {
  completed: "Completado",
  notStarted: "Sin empezar",
  error: "Error",
  stepAnnouncement: ({ position, count, label }) => `Paso ${position} de ${count}: ${label}`,
} as const satisfies StepperMessages

/** Accessible name of the stepper when none is passed. */
export const STEPPER_DEFAULT_LABEL = "Progreso"

/** Copy announced, and shown in the compact caption, once every step is complete, when none is passed. */
export const STEPPER_DEFAULT_COMPLETE_LABEL = "Todos los pasos completados"

/** Delay, in seconds, before the ring grows around the new current step, after its connector fills. */
export const STEPPER_RING_DELAY_S = 0.12

/** Extra delay, in seconds, between a glyph popping in and its stroke starting to draw. */
export const STEPPER_GLYPH_DRAW_DELAY_S = 0.04

/** Extra delay, in seconds, before the dot of the alert glyph pops in. */
export const STEPPER_ALERT_DOT_DELAY_S = 0.16

/** Scale a glyph pops from and shrinks back to. */
export const STEPPER_GLYPH_ENTER_SCALE = 0.5

/** Scale the current step's ring grows from. */
export const STEPPER_RING_ENTER_SCALE = 0.6

/** Window, in milliseconds, after new copy arrives in which its slot springs to the new height. */
export const STEPPER_TEXT_MORPH_WINDOW_MS = 700
