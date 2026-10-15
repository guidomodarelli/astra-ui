/** Tuning of `ActionButton`: its async states, reset delay and the icon that follows each state. */

/** Phases an action goes through: ready to run, running, and finished successfully. */
export type ActionButtonState = "idle" | "pending" | "success"

/** Value of each phase, exposed on the button as `data-state`. */
export const ACTION_BUTTON_STATE = {
  idle: "idle",
  pending: "pending",
  success: "success",
} as const satisfies Record<ActionButtonState, ActionButtonState>

/** Time the success state stays on the button before it returns to idle on its own. */
export const ACTION_BUTTON_DEFAULT_RESET_AFTER_MS = 2400

/** Side, in pixels, of the slot that swaps the arrow, the spinner and the check. */
export const ACTION_BUTTON_ICON_SIZE_PX = 17

/** Horizontal offsets, in pixels, of the arrow returning from behind and leaving forward. */
export const ACTION_BUTTON_ARROW_OFFSET_PX = {
  enter: -6,
  exit: 8,
} as const

/** Delay, in seconds, before the success check starts drawing itself. */
export const ACTION_BUTTON_CHECK_DRAW_DELAY_S = 0.05
