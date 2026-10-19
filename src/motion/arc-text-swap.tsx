"use client"

/**
 * Text swap adapted from Arc (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli, MIT License.
 * The full license text ships in THIRD_PARTY_NOTICES.md. Internal: shared by the Arc-derived data displays (metric
 * card, usage meter, timeline, stepper and empty state) to roll changed copy in place.
 */
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import type { HTMLMotionProps, Variants } from "motion/react"

import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE } from "./arc-tokens.js"

/** Vertical travel, in em, of new copy rising in and old copy lifting out. */
export const ARC_TEXT_SWAP_OFFSET_EM = 0.3

/** Direction new copy enters from: `1` rises from below (a larger value), `-1` drops from above (a smaller one). */
export type ArcTextSwapDirection = 1 | -1

/** New copy rises out of a soft blur from the side it moved toward; the old copy leaves a little faster. */
const riseVariants: Variants = {
  hidden: (direction: ArcTextSwapDirection) => ({
    opacity: 0,
    y: `${ARC_TEXT_SWAP_OFFSET_EM * direction}em`,
    filter: `blur(${ARC_BLUR.soft}px)`,
  }),
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] },
  },
  gone: (direction: ArcTextSwapDirection) => ({
    opacity: 0,
    y: `${-ARC_TEXT_SWAP_OFFSET_EM * direction}em`,
    filter: `blur(${ARC_BLUR.subtle}px)`,
    transition: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] },
  }),
}

/** With reduced motion, copy only crossfades in place. */
const fadeVariants: Variants = {
  hidden: { opacity: 0, y: 0, filter: "blur(0px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: ARC_DURATION.instant } },
  gone: { opacity: 0, y: 0, filter: "blur(0px)", transition: { duration: ARC_DURATION.instant } },
}

/** Outgoing copies are hidden from assistive technology while they fade, so only the current copy is read. */
function SwapLine(props: HTMLMotionProps<"span">) {
  const isPresent = useIsPresent()
  return <motion.span {...props} aria-hidden={isPresent ? props["aria-hidden"] : true} />
}

export type ArcTextSwapProps = {
  /** Copy to show. A new value rolls in over the previous one; without copy the last one leaves. */
  text: string | undefined
  /** Whether the reduced-motion crossfade replaces the rise. */
  reduceMotion: boolean
  /** Side the new copy enters from. */
  direction?: ArcTextSwapDirection
  /** Classes of the positioned slot the outgoing copy pops out against. */
  className?: string
  /** Classes of each line of copy. */
  lineClassName?: string
}

/**
 * Rolls changed copy in place: the outgoing line pops out of flow so the slot never holds both widths.
 * @param props - Copy, motion preference, direction and classes.
 * @returns The swapping copy.
 */
export function ArcTextSwap({ text, reduceMotion, direction = 1, className, lineClassName }: ArcTextSwapProps) {
  return (
    <span className={cn("relative block max-w-full", className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        {text ? (
          <SwapLine
            key={text}
            className={cn("block", lineClassName)}
            custom={direction}
            variants={reduceMotion ? fadeVariants : riseVariants}
            initial="hidden"
            animate="shown"
            exit="gone"
          >
            {text}
          </SwapLine>
        ) : null}
      </AnimatePresence>
    </span>
  )
}
