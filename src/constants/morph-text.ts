/** Tuning of the internal letter-by-letter label morph shared by `ActionButton` and `SplitButton`. */

/** Longest entrance delay a single letter gets, so long labels still finish their morph quickly. */
export const MORPH_TEXT_MAX_GLYPH_DELAY_S = 0.1

/**
 * Shared leading or trailing runs shorter than this are replaced instead of kept, so a one-letter coincidence does
 * not leave a lonely letter standing while the rest of the label morphs.
 */
export const MORPH_TEXT_MIN_SHARED_RUN = 2

/** Vertical offsets, in pixels, of letters rising in and lifting out of the label. */
export const MORPH_TEXT_GLYPH_OFFSET_PX = {
  enter: 5,
  exit: -4,
} as const
