"use client";

/** Cross-fades between states of the same region, such as idle, loading and result. */
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { ARC_BLUR } from "../motion/arc-tokens.js";
import { MOTION_EASE, MOTION_EASE_STANDARD, MOTION_TIMING } from "../motion/tokens.js";

/** Arc's swap: new content rises a third of a line out of a soft blur; old content leaves upward. */
const SWAP_RISE = "0.3em";
const SWAP_ENTER_BLUR = `blur(${ARC_BLUR.soft}px)`;
const SWAP_EXIT_BLUR = `blur(${ARC_BLUR.subtle}px)`;

const PRESENCE_SWAP_ELEMENTS = {
  div: motion.div,
  span: motion.span,
} as const;

export interface PresenceSwapProps {
  /** Changing the key plays the exit of the previous content and the entry of the new one. */
  presenceKey: string;
  children: ReactNode;
  as?: keyof typeof PRESENCE_SWAP_ELEMENTS;
  className?: string;
  /** `wait` swaps sequentially; `popLayout` overlaps them for inline content. */
  mode?: "wait" | "popLayout";
}

interface PresenceSwapItemProps {
  as: keyof typeof PRESENCE_SWAP_ELEMENTS;
  className: string;
  children: ReactNode;
}

/**
 * One keyed state of the swap. While it animates out it turns inert and hidden
 * from assistive technology, so stale controls cannot be clicked or announced.
 * @param props - Element type, class name and content.
 * @returns The animated state.
 */
function PresenceSwapItem({ as, className, children }: PresenceSwapItemProps) {
  const MotionElement = PRESENCE_SWAP_ELEMENTS[as];
  const isPresent = useIsPresent();
  /**
   * A key change that lands in the same render as a finished exit mounts the pending state
   * already exiting. Motion reports that exit before `AnimatePresence` tracks it and never
   * repeats it, so a `wait` swap would stall. That state was never shown: skipping the motion
   * element lets `AnimatePresence` remove it once it is tracked.
   */
  const [isMountedExiting] = useState(!isPresent);
  const shouldReduceMotion = usePrefersReducedMotion();
  /** Reduced motion drops the travel and the blur but keeps the short fade. */
  const rise = shouldReduceMotion ? 0 : SWAP_RISE;
  const enterBlur = shouldReduceMotion ? "blur(0px)" : SWAP_ENTER_BLUR;
  const exitBlur = shouldReduceMotion ? "blur(0px)" : SWAP_EXIT_BLUR;

  if (isMountedExiting) return null;

  return (
    <MotionElement
      data-slot="presence-swap"
      aria-hidden={isPresent ? undefined : true}
      inert={!isPresent || undefined}
      className={className}
      initial={{ opacity: 0, y: rise, filter: enterBlur }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: MOTION_TIMING.enter, ease: MOTION_EASE },
      }}
      exit={{
        opacity: 0,
        y: shouldReduceMotion ? 0 : `-${SWAP_RISE}`,
        filter: exitBlur,
        transition: { duration: MOTION_TIMING.fast, ease: MOTION_EASE_STANDARD },
      }}
    >
      {children}
    </MotionElement>
  );
}

interface PresenceSwapGeneration {
  presenceKey: string;
  generation: number;
}

/**
 * Gives every key change its own presence key. Motion keeps the exit bookkeeping of a key that
 * already left, so a reused key (loading → error → loading) mounted already exiting would have
 * its removal ignored and stall a `wait` swap forever.
 * @param presenceKey - Key identifying the current state.
 * @returns A key that is never reused within this swap.
 */
function usePresenceSwapKey(presenceKey: string): string {
  const [current, setCurrent] = useState<PresenceSwapGeneration>({ presenceKey, generation: 0 });
  if (current.presenceKey !== presenceKey) {
    const next = { presenceKey, generation: current.generation + 1 };
    setCurrent(next);
    return `${next.generation}:${presenceKey}`;
  }
  return `${current.generation}:${presenceKey}`;
}

/**
 * Swaps keyed content with Arc's swap (a short rise out of a blur); the first render is not animated.
 * @param props - Key identifying the current state and its content.
 * @returns The animated content.
 */
export function PresenceSwap({ presenceKey, children, as = "div", className, mode = "wait" }: PresenceSwapProps) {
  const itemKey = usePresenceSwapKey(presenceKey);

  return (
    <AnimatePresence mode={mode} initial={false}>
      <PresenceSwapItem
        key={itemKey}
        as={as}
        className={cn("min-w-0", as === "span" && "inline-flex items-center", className)}
      >
        {children}
      </PresenceSwapItem>
    </AnimatePresence>
  );
}
