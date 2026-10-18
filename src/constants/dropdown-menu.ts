/** Placement defaults and motion of the dropdown menu content, taken from Arc's Dropdown menu. */
import type { AnimationOptions } from "motion/react"

import type { ArcFloatingMotion } from "../motion/arc-floating-slot.js"
import { ARC_DURATION, ARC_EASE, ARC_SPRING_CSS } from "../motion/arc-tokens.js"

/** Gap, in pixels, between the trigger and the menu. */
export const DROPDOWN_MENU_SIDE_OFFSET_PX = 6

/** Minimum distance, in pixels, a menu keeps from the viewport edges. */
export const DROPDOWN_MENU_COLLISION_PADDING_PX = 12

/** Arc closes the menu in 130ms on the standard curve. */
const DROPDOWN_MENU_EXIT_TWEEN: AnimationOptions = { duration: 0.13, ease: [...ARC_EASE.standard] }

/**
 * Arc's menu: it starts 5px toward its trigger at .97, settles on the CSS spring while it fades in quickly, and
 * leaves halfway back toward the trigger at .985.
 */
export const DROPDOWN_MENU_MOTION: ArcFloatingMotion = {
  enterFrom: { travel: 5, scale: 0.97, opacity: 0 },
  enter: {
    transform: ARC_SPRING_CSS,
    opacity: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
  },
  exitTo: { travel: 2.5, scale: 0.985, opacity: 0 },
  exit: { transform: DROPDOWN_MENU_EXIT_TWEEN, opacity: DROPDOWN_MENU_EXIT_TWEEN },
}
