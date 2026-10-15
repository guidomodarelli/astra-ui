/** Tuning of the internal labelled field shared by `Input` and `Textarea`. */

/** Vertical offsets, in em, of changed message words rising in and lifting out. */
export const FIELD_MESSAGE_WORD_OFFSET_EM = {
  enter: 0.35,
  exit: -0.35,
} as const

/** Vertical travel, in em, of a digit rolling in or out of a count in the message. */
export const FIELD_MESSAGE_DIGIT_OFFSET_EM = 0.6

/** A message word that rolls its digits instead of rising in: counts, decimals, ratios, times and percentages. */
export const FIELD_MESSAGE_NUMBER_PATTERN = /^\d[\d.,/:]*%?$/

/** Thousands separators removed before comparing two counts to pick the roll direction. */
export const FIELD_MESSAGE_THOUSANDS_SEPARATOR_PATTERN = /,/g

/** Suffixes of the ids that tie the helper and error rows to the control through `aria-describedby`. */
export const FIELD_MESSAGE_ID_SUFFIX = {
  description: "description",
  error: "error",
} as const
