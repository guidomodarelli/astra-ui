/** Tuning of Arc's Checkbox mark, adapted from Arc (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/**
 * The check and the dash share three points, so the mark morphs from one into the other instead of swapping. Both
 * are drawn in the 18 by 18 view box of `CHECKBOX_MARK_VIEW_BOX`.
 */
export const CHECKBOX_MARK_PATH = {
  check: "M4.25 9.25 L7.25 12.25 L13.75 5.75",
  dash: "M4.75 9 L9 9 L13.25 9",
} as const

/** View box of the mark, matching the 18px square it is drawn on. */
export const CHECKBOX_MARK_VIEW_BOX = "0 0 18 18"

/** Stroke width of the mark, in view box units. */
export const CHECKBOX_MARK_STROKE_WIDTH = 1.75

/** Scale the fill starts from when the box is checked and shrinks back to when it is cleared. */
export const CHECKBOX_FILL_HIDDEN_SCALE = 0.6

/** Suffix of the id that ties the helper copy to the control through `aria-describedby`. */
export const CHECKBOX_DESCRIPTION_ID_SUFFIX = "description"
