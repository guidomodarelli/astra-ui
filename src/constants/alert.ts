/** Copy and options of Arc's Alert. */

/** Arc's semantic tones for an alert; `danger` interrupts as an alert, the rest are polite statuses. */
export type AlertTone = "info" | "success" | "warning" | "danger"

/** Default Spanish accessible name of the dismiss button. */
export const ALERT_DISMISS_LABEL = "Descartar aviso"

/** Live-region roles: only a danger alert interrupts; every other tone is announced politely. */
export const ALERT_TONE_ROLE = {
  info: "status",
  success: "status",
  warning: "status",
  danger: "alert",
} as const satisfies Record<AlertTone, "alert" | "status">
