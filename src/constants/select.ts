/** Placement defaults, motion and copy of Arc's Select. */
import type { AnimationOptions } from "motion/react"

import type { ArcFloatingMotion } from "../motion/arc-floating-slot.js"
import { ARC_DURATION, ARC_EASE } from "../motion/arc-tokens.js"

/** Minimum distance, in pixels, the option list keeps from the viewport edges. */
export const SELECT_COLLISION_PADDING_PX = 12

/** Default Spanish placeholder, shown while no option is chosen. Arc's English default is "Select an option". */
export const SELECT_DEFAULT_PLACEHOLDER = "Seleccioná una opción"

const SELECT_ENTER_TWEEN: AnimationOptions = { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] }
const SELECT_EXIT_TWEEN: AnimationOptions = { duration: ARC_DURATION.instant, ease: [...ARC_EASE.standard] }

/** Arc's option list: it grows 6px from the trigger edge at .97 and leaves halfway back at .98, both as tweens. */
export const SELECT_MOTION: ArcFloatingMotion = {
  enterFrom: { travel: 6, scale: 0.97, opacity: 0 },
  enter: { transform: SELECT_ENTER_TWEEN, opacity: SELECT_ENTER_TWEEN },
  exitTo: { travel: 3, scale: 0.98, opacity: 0 },
  exit: { transform: SELECT_EXIT_TWEEN, opacity: SELECT_EXIT_TWEEN },
}
