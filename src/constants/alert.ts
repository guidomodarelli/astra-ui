/** Copy and options of Arc's Alert. */

/** Arc's semantic tones for an alert; `danger` interrupts as an alert, the rest are polite statuses. */
export type AlertTone = "info" | "success" | "warning" | "danger"

/** Default Spanish accessible name of the dismiss button, followed by the alert's title. */
export const ALERT_DISMISS_LABEL = "Descartar aviso"

/** Separator between the dismiss label and the title, as in "Descartar aviso: Nueva versión". */
export const ALERT_DISMISS_LABEL_SEPARATOR = ": "

/** Vertical travel, in em, of a new title or detail rising in and the old one lifting out. */
export const ALERT_TEXT_OFFSET_EM = 0.3

/** Live-region roles: only a danger alert interrupts; every other tone is announced politely. */
export const ALERT_TONE_ROLE = {
  info: "status",
  success: "status",
  warning: "status",
  danger: "alert",
} as const satisfies Record<AlertTone, "alert" | "status">
