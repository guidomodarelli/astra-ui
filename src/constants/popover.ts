/** Timing and placement of Arc's Popover (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */
import type { AnimationOptions } from "motion/react"

import type { ArcFloatingMotion } from "../motion/arc-floating-slot.js"
import { ARC_DURATION, ARC_EASE } from "../motion/arc-tokens.js"

/** Gap, in px, between the panel and its trigger. */
export const POPOVER_SIDE_OFFSET_PX = 6

/** Distance, in px, the panel keeps from the viewport edges before it flips or shifts. */
export const POPOVER_COLLISION_PADDING_PX = 10

/** Arc's CSS spring (`--ease-spring`, bounce .15) as a Motion spring: the panel settles with a gentle overshoot. */
const POPOVER_SETTLE_SPRING = { type: "spring", visualDuration: 0.34, bounce: 0.15 } as const

const exitTween: AnimationOptions = { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] }

/** The panel starts 5px toward its trigger at .97, settles on a spring, and leaves faster than it arrives. */
export const POPOVER_MOTION: ArcFloatingMotion = {
  enterFrom: { travel: 5, scale: 0.97, opacity: 0 },
  enter: {
    transform: POPOVER_SETTLE_SPRING,
    opacity: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
  },
  exitTo: { travel: 2.5, scale: 0.98, opacity: 0 },
  exit: { transform: exitTween, opacity: exitTween },
}
