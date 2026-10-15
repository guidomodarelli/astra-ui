/**
 * Swap presets adapted from Arc (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli, MIT License.
 * The full license text ships in THIRD_PARTY_NOTICES.md. Internal: shared by the Arc-derived buttons to swap icons
 * and labels in place.
 */
import type { TargetAndTransition, Transition } from "motion/react"

import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_SNAPPY } from "./arc-tokens.js"

/** Resting pose every swapped element settles into. */
export const ARC_SWAP_REST: TargetAndTransition = { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }

/** Outgoing elements leave faster than incoming ones arrive. */
export const ARC_SWAP_EXIT_TRANSITION: Transition = { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] }

/** An incoming icon grows out of a slight blur. */
export const ARC_ICON_ENTER: TargetAndTransition = { opacity: 0, scale: 0.6, filter: `blur(${ARC_BLUR.subtle}px)` }

/** An outgoing icon shrinks back into the same blur. */
export const ARC_ICON_EXIT: TargetAndTransition = { ...ARC_ICON_ENTER, transition: ARC_SWAP_EXIT_TRANSITION }

/** Scale rides the spring; opacity and blur tween so blur never overshoots below zero. */
export const ARC_ICON_TRANSITION: Transition = {
  ...ARC_SPRING_SNAPPY,
  opacity: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
  filter: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
}

/** With reduced motion, every swap is an instant fade. */
export const ARC_REDUCED_TRANSITION: Transition = { duration: ARC_DURATION.instant }

/** Reduced-motion entrance: the resting pose, only faded out. */
export const ARC_REDUCED_ENTER: TargetAndTransition = { ...ARC_SWAP_REST, opacity: 0 }

/** Reduced-motion exit: an instant fade. */
export const ARC_REDUCED_EXIT: TargetAndTransition = { opacity: 0, transition: ARC_REDUCED_TRANSITION }
