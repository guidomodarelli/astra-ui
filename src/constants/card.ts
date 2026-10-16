/** Copy and tuning of Arc's Card and its quick look, adapted from Arc (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** Heading levels a card title can take; Arc renders an `h3`. */
export type CardHeadingLevel = 2 | 3 | 4

/** Heading level of the card title when none is passed. */
export const CARD_DEFAULT_HEADING_LEVEL = 3 satisfies CardHeadingLevel

/** Default Spanish accessible name of the quick look's close button. */
export const CARD_CLOSE_LABEL = "Cerrar vista rápida"

/** Visual duration, in seconds, of the spring that grows the card into the quick look. */
export const CARD_GROW_DURATION_S = 0.3

/** Visual duration, in seconds, of the slightly quicker spring that settles the quick look back into the card. */
export const CARD_SETTLE_DURATION_S = 0.26

/** Time, in milliseconds, the closing quick look travels above the page before the card takes over again. */
export const CARD_RETURN_MS = 300

/** Delay, in seconds, between the words of a new status rising in one after another. */
export const CARD_STATUS_WORD_STAGGER_S = 0.03

/** Vertical travel, in em, of a status line rising in and the old one lifting away. */
export const CARD_STATUS_OFFSET_EM = 0.3

/** Vertical travel, in pixels, of the quick look details settling in under the copy. */
export const CARD_DETAILS_OFFSET_PX = 6

/** Scale the quick look's close button grows from. */
export const CARD_CLOSE_HIDDEN_SCALE = 0.9

/** Scale the close button dips to while pressed. */
export const CARD_CLOSE_PRESS_SCALE = 0.94
