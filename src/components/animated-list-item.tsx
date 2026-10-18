"use client";

/** List item that enters, leaves and reflows smoothly inside an `AnimatePresence`. */
import type { HTMLAttributes, ReactNode } from "react";
import { motion, useIsPresent } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { ARC_BLUR } from "../motion/arc-tokens.js";
import { MOTION_EASE, MOTION_EASE_STANDARD, MOTION_TIMING, SPRING_PANEL } from "../motion/tokens.js";

/** Arc's rows settle 4px into place out of a subtle blur. */
const LIST_ITEM_RISE_PX = 4;
const LIST_ITEM_BLUR = `blur(${ARC_BLUR.subtle}px)`;

const ANIMATED_LIST_ITEM_ELEMENTS = {
  li: motion.li,
  div: motion.div,
  article: motion.article,
} as const;

/** Arc's rows enter on the standard tween and reorder on the smooth spring, without overshoot. */
const LIST_ITEM_TRANSITION = { duration: MOTION_TIMING.standard, ease: MOTION_EASE, layout: SPRING_PANEL } as const;
const LIST_ITEM_EXIT_TRANSITION = { duration: MOTION_TIMING.exit, ease: MOTION_EASE_STANDARD } as const;

/** Native handlers whose names collide with Motion's animation and drag callbacks. */
type MotionConflictingHandlers =
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd";

export type AnimatedListItemProps = Omit<HTMLAttributes<HTMLElement>, MotionConflictingHandlers> & {
  children: ReactNode;
  as?: keyof typeof ANIMATED_LIST_ITEM_ELEMENTS;
  /** Reflow siblings with a spring when items are added, removed or reordered. */
  layout?: boolean;
};

/**
 * Wrap the list in `<AnimatePresence initial={false}>` so only items added after the
 * first render animate in, and removed items animate out before leaving the DOM.
 * A leaving item turns inert and hidden from assistive technology, so it can no
 * longer be focused, clicked or announced during its exit.
 * @param props - Native attributes, element type and content.
 * @returns The animated item.
 */
export function AnimatedListItem({ children, as = "li", layout = true, className, ...elementProps }: AnimatedListItemProps) {
  const MotionElement = ANIMATED_LIST_ITEM_ELEMENTS[as];
  const isPresent = useIsPresent();
  const shouldReduceMotion = usePrefersReducedMotion();
  /** Reduced motion keeps a short fade but drops travel, blur and layout reflow. */
  const distance = shouldReduceMotion ? 0 : LIST_ITEM_RISE_PX;
  const blur = shouldReduceMotion ? "blur(0px)" : LIST_ITEM_BLUR;

  return (
    <MotionElement
      data-slot="animated-list-item"
      {...elementProps}
      aria-hidden={isPresent ? elementProps["aria-hidden"] : true}
      inert={!isPresent || undefined}
      className={cn("min-w-0", className)}
      layout={layout && !shouldReduceMotion ? "position" : false}
      initial={{ opacity: 0, y: distance, filter: blur }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{
        opacity: 0,
        transition: LIST_ITEM_EXIT_TRANSITION,
      }}
      transition={LIST_ITEM_TRANSITION}
    >
      {children}
    </MotionElement>
  );
}
