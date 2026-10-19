/** Defaults and tuning of Arc's MetricCard, adapted from Arc (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** Locale that formats the number when none is passed. */
export const METRIC_CARD_DEFAULT_LOCALE = "es-AR"

/** Share of the number, from 0 to 1, that must be visible before its digits roll up from zero. */
export const METRIC_CARD_REVEAL_AMOUNT = 0.6

/** Scale the change chip grows from and shrinks back to. */
export const METRIC_CARD_CHANGE_ENTER_SCALE = 0.96

/** Signs that mark a change as a rise or a fall, read from the start of the `change` copy. */
export const METRIC_CARD_TREND_PATTERN = { up: /^\+/, down: /^[-−]/ } as const
