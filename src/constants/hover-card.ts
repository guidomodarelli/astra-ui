/** Timing and placement of Arc's Hover Card (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */
import type { AnimationOptions } from "motion/react"

import type { ArcFloatingMotion } from "../motion/arc-floating-slot.js"
import { ARC_DURATION, ARC_EASE, ARC_SPRING_SMOOTH } from "../motion/arc-tokens.js"

/** Milliseconds of hover before the first card opens. */
export const HOVER_CARD_OPEN_DELAY_MS = 500

/** Milliseconds of grace after the pointer leaves, so it can travel into the card. */
export const HOVER_CARD_CLOSE_DELAY_MS = 140

/** Moving to another trigger within this many milliseconds of a card closing opens the next one almost at once. */
export const HOVER_CARD_SKIP_WINDOW_MS = 300

/**
 * Even warm, a trigger waits this many milliseconds, so a pointer crossing it on the way into an open card does not
 * steal the card.
 */
export const HOVER_CARD_WARM_OPEN_DELAY_MS = 80

/** Gap, in px, between the card and its trigger. */
export const HOVER_CARD_SIDE_OFFSET_PX = 8

/** Distance, in px, the card keeps from the viewport edges before it flips or shifts. */
export const HOVER_CARD_COLLISION_PADDING_PX = 12

/** Delay, in seconds, before the first row of `HoverCardProfile` settles in. */
export const HOVER_CARD_PROFILE_SETTLE_DELAY_S = 0.04

/** Stagger, in seconds, between the rows of `HoverCardProfile`. */
export const HOVER_CARD_PROFILE_STAGGER_S = 0.035

/** Distance, in px, each row of `HoverCardProfile` rises while it settles in. */
export const HOVER_CARD_PROFILE_SETTLE_DISTANCE_PX = 4

/** Rows of `HoverCardProfile`, in the order they settle in. */
export const HOVER_CARD_PROFILE_ROW_ORDER = {
  head: 0,
  bio: 1,
  stats: 2,
  meta: 3,
} as const

/** Initials shown in place of a missing portrait: the first letter of up to this many words of the name. */
export const HOVER_CARD_PROFILE_INITIALS_LENGTH = 2

/** Side, in px, of the square portrait of `HoverCardProfile`. */
export const HOVER_CARD_PROFILE_PORTRAIT_SIZE_PX = 48

const exitTween: AnimationOptions = { duration: 0.12, ease: [...ARC_EASE.standard] }

/** The card grows from the trigger edge: 4px of travel and a .96 scale on one smooth spring, with a leading fade. */
export const HOVER_CARD_MOTION: ArcFloatingMotion = {
  enterFrom: { travel: 4, scale: 0.96, opacity: 0 },
  enter: {
    transform: ARC_SPRING_SMOOTH,
    opacity: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
  },
  exitTo: { travel: 4, scale: 0.96, opacity: 0 },
  exit: { transform: exitTween, opacity: exitTween },
}

/** Within the skip window the next card opens in place and only fades. */
export const HOVER_CARD_INSTANT_MOTION: ArcFloatingMotion = {
  enterFrom: { travel: 0, scale: 1, opacity: 0 },
  enter: {
    transform: { duration: 0.14, ease: [...ARC_EASE.enter] },
    opacity: { duration: 0.09, ease: [...ARC_EASE.enter] },
  },
  exitTo: { travel: 0, scale: 1, opacity: 0 },
  exit: HOVER_CARD_MOTION.exit,
}
