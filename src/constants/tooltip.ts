/** Timing and placement of Arc's Tooltip (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */
import type { AnimationOptions } from "motion/react"

import type { ArcFloatingMotion } from "../motion/arc-floating-slot.js"
import { ARC_DURATION, ARC_EASE } from "../motion/arc-tokens.js"

/** Milliseconds of hover or focus before the first tooltip opens. */
export const TOOLTIP_OPEN_DELAY_MS = 250

/** While a tooltip is open, and this many milliseconds after the last one closes, the next opens at once and only fades. */
export const TOOLTIP_SKIP_WINDOW_MS = 300

/** Gap, in px, between the bubble and its trigger. */
export const TOOLTIP_SIDE_OFFSET_PX = 8

/** Distance, in px, the bubble keeps from the viewport edges before it flips or shifts. */
export const TOOLTIP_COLLISION_PADDING_PX = 12

const enterTween: AnimationOptions = { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] }
const instantTween: AnimationOptions = { duration: ARC_DURATION.instant, ease: [...ARC_EASE.standard] }

/** The first tooltip rises 3px from its trigger while it scales up from .97. */
export const TOOLTIP_MOTION: ArcFloatingMotion = {
  enterFrom: { travel: 3, scale: 0.97, opacity: 0 },
  enter: { transform: enterTween, opacity: enterTween },
  exitTo: { travel: 0, scale: 0.98, opacity: 0 },
  exit: { transform: instantTween, opacity: instantTween },
}

/** Within the skip window the next tooltip only fades in, on the instant timing. */
export const TOOLTIP_INSTANT_MOTION: ArcFloatingMotion = {
  enterFrom: { travel: 0, scale: 1, opacity: 0 },
  enter: { transform: instantTween, opacity: instantTween },
  exitTo: TOOLTIP_MOTION.exitTo,
  exit: TOOLTIP_MOTION.exit,
}
