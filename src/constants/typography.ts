/** Arc's type scale and the defaults the typography components draw from it. */

/** Heading levels of the HTML outline. */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/** Steps of Arc's type scale available to headings: `--text-sm` (14px) to `--text-5xl` (72px). */
export type HeadingSize = "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"

/** Steps of Arc's type scale available to running text: `--text-xs` (12px) to `--text-lg` (18px). */
export type TextSize = "xs" | "sm" | "base" | "lg"

/** Arc's text colour roles: `--foreground`, `--text-secondary` and `--text-muted`. */
export type TextTone = "default" | "secondary" | "muted"

/** Markers of an unordered list: Arc's muted disc, or none for a plain stack. */
export type ListMarker = "disc" | "none"

/** Visual size of each heading level when `size` is not given: a product page scale, from 36px down to 14px. */
export const HEADING_DEFAULT_SIZE = {
  1: "3xl",
  2: "2xl",
  3: "xl",
  4: "lg",
  5: "base",
  6: "sm",
} as const satisfies Record<HeadingLevel, HeadingSize>

/** Sizes that Arc sets in Geist with display tracking and leading (30px and up); smaller headings stay in Inter. */
export const HEADING_DISPLAY_SIZES = ["3xl", "4xl", "5xl"] as const satisfies readonly HeadingSize[]

/** Default size of running text: `--text-base` (16px). */
export const TEXT_DEFAULT_SIZE = "base" satisfies TextSize

/** Default colour role of running text. */
export const TEXT_DEFAULT_TONE = "default" satisfies TextTone

/** Arc's key cap heights: 26px (`md`) and 22px (`sm`), as in its shortcut recorder. */
export type KbdSize = "sm" | "md"

/** Default key cap height. */
export const KBD_DEFAULT_SIZE = "md" satisfies KbdSize
