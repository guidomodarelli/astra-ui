"use client";

/** Expands and collapses a region by animating its height, then releases overflow. */
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { MOTION_EASE, MOTION_EASE_STANDARD, MOTION_TIMING, SPRING_PANEL } from "../motion/tokens.js";

/** Arc's accordion: the height springs without overshoot while the content fades in. */
const COLLAPSE_TRANSITION = {
  height: SPRING_PANEL,
  opacity: { duration: MOTION_TIMING.panel, ease: MOTION_EASE },
} as const;
/** Arc's accordion closes on the same spring and fades out faster than it came in. */
const COLLAPSE_EXIT_TRANSITION = {
  height: SPRING_PANEL,
  opacity: { duration: MOTION_TIMING.fast, ease: MOTION_EASE_STANDARD },
} as const;
/** Reduced motion applies the height at once but keeps the short fade, so exits always settle. */
const REDUCED_MOTION_COLLAPSE_TRANSITION = {
  height: { duration: 0 },
  opacity: { duration: MOTION_TIMING.panel, ease: MOTION_EASE },
} as const;

export interface AnimatedCollapseProps {
  /** Whether the region is rendered and expanded. */
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
  /** Animate the very first render too; off by default so SSR output stays visible. */
  animateOnMount?: boolean;
}

interface AnimatedCollapseRegionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Clips overflow from the first frame when the region mounts with an entrance. */
  isEntering: boolean;
}

/**
 * The animated region. While it collapses out it turns inert and hidden from assistive
 * technology, so stale controls cannot be clicked, focused or announced during the fade.
 * @param props - Content, optional wrapper attributes and whether it mounts with an entrance.
 * @returns The animated region.
 */
function AnimatedCollapseRegion({ children, className, id, isEntering }: AnimatedCollapseRegionProps) {
  const [isSettled, setIsSettled] = useState(!isEntering);
  const isPresent = useIsPresent();
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      data-slot="animated-collapse"
      id={id}
      aria-hidden={isPresent ? undefined : true}
      inert={!isPresent || undefined}
      className={cn(isSettled ? "overflow-visible" : "overflow-hidden", className)}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{
        height: 0,
        opacity: 0,
        transition: shouldReduceMotion ? REDUCED_MOTION_COLLAPSE_TRANSITION : COLLAPSE_EXIT_TRANSITION,
      }}
      transition={shouldReduceMotion ? REDUCED_MOTION_COLLAPSE_TRANSITION : COLLAPSE_TRANSITION}
      onAnimationStart={() => setIsSettled(false)}
      onAnimationComplete={() => setIsSettled(true)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Renders `children` only while `isOpen`, animating height and opacity.
 * Keep padding inside `children`: the animated wrapper collapses to zero height.
 * Overflow is clipped only while animating, so focus rings and popovers are not cut once settled.
 * @param props - Open state, content and optional wrapper attributes.
 * @returns The animated region, or nothing when closed.
 */
export function AnimatedCollapse({ isOpen, children, className, id, animateOnMount = false }: AnimatedCollapseProps) {
  return (
    <AnimatePresence initial={animateOnMount}>
      {isOpen ? (
        <AnimatedCollapseRegion key="animated-collapse" className={className} id={id} isEntering={animateOnMount}>
          {children}
        </AnimatedCollapseRegion>
      ) : null}
    </AnimatePresence>
  );
}
