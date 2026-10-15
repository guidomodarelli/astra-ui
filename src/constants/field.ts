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

/**
 * Grouping separators removed before comparing two counts to pick the roll direction: a dot or comma followed by
 * exactly three digits, so both `1.000` (es) and `1,000` (en) read as a thousand while `1,5` stays a decimal.
 */
export const FIELD_MESSAGE_GROUP_SEPARATOR_PATTERN = /[.,](?=\d{3}(?!\d))/g

/** Separators between the components of a time (`0:09`) or a ratio (`3/10`), compared one by one. */
export const FIELD_MESSAGE_COMPONENT_SEPARATOR_PATTERN = /[:/]/

/** Decimal comma of locales such as Spanish, read as a decimal point once the grouping separators are gone. */
export const FIELD_MESSAGE_DECIMAL_COMMA = ","

/** Suffixes of the ids that tie the helper and error rows to the control through `aria-describedby`. */
export const FIELD_MESSAGE_ID_SUFFIX = {
  description: "description",
  error: "error",
} as const
