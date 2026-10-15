"use client";

/**
 * Entry and exit playback of Arc's floating layers (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md):
 * tooltips, popovers and hover cards start a few pixels toward their trigger, slightly scaled down, and settle in
 * place. Arc drives them with CSS transitions so a close that interrupts an open, or a reopen during a close, turns
 * around from where the layer is; this slot keeps that property with Motion: an interrupted playback continues from
 * the values it had reached instead of jumping to rest first. It animates the primitive's own node through a Slot,
 * without adding DOM wrappers, and holds the node for `AnimatePresence` until its exit finishes.
 */
import { useLayoutEffect, useRef, type ComponentProps, type ReactElement } from "react";
import { Slot } from "radix-ui";
import { animate, frame, usePresence, type AnimationOptions } from "motion/react";

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { MOTION_ENTERING_ATTRIBUTE } from "../constants/motion.js";
import { ARC_DURATION, ARC_EASE } from "./arc-tokens.js";
import { useAttachedElement } from "./use-attached-element.js";

/** A visual state of the floating layer, relative to its resting place. */
export interface ArcFloatingPose {
  /** Pixels the layer sits toward its trigger, along the side it was placed on. */
  travel: number;
  scale: number;
  opacity: number;
}

/** The two transitions of one playback: the transform may spring while the fade stays a short tween. */
export interface ArcFloatingTransitions {
  transform: AnimationOptions;
  opacity: AnimationOptions;
}

/** Entry and exit of a floating layer. The entry always ends at rest: no travel, full scale and full opacity. */
export interface ArcFloatingMotion {
  enterFrom: ArcFloatingPose;
  enter: ArcFloatingTransitions;
  exitTo: ArcFloatingPose;
  exit: ArcFloatingTransitions;
}

/** Style properties this slot animates; they are given back to the caller once the layer settles. */
type AnimatedProperty = "opacity" | "transform";
const ANIMATED_PROPERTIES: readonly AnimatedProperty[] = ["opacity", "transform"];

const REST_POSE: ArcFloatingPose = { travel: 0, scale: 1, opacity: 1 };

/** Reduced motion keeps the layer in place and only fades it, on Arc's instant timing. */
const REDUCED_TWEEN: AnimationOptions = { duration: ARC_DURATION.instant, ease: [...ARC_EASE.standard] };

/**
 * Builds the transform of a pose. Radix writes the placed side on `data-side`; the offset points toward the trigger,
 * so a layer flipped above its trigger still grows from the trigger edge.
 */
function poseTransform(element: HTMLElement, { travel, scale }: ArcFloatingPose): string {
  const side = element.dataset.side;
  const horizontalOffset = side === "left" ? travel : side === "right" ? -travel : 0;
  const verticalOffset = side === "top" ? travel : side === "bottom" ? -travel : 0;
  return `translate(${horizontalOffset}px, ${verticalOffset}px) scale(${scale})`;
}

/**
 * Animates the floating layer rendered as its only child.
 * @param props.motion - Returns the entry and exit of the layer. It is read once, when the layer mounts, so a layer
 *   revived mid-exit keeps the path it came in on.
 * @returns The child with the slot's ref composed into it.
 */
export function ArcFloatingSlot({
  children,
  motion,
  ref,
  ...props
}: Omit<ComponentProps<typeof Slot.Root>, "children"> & {
  children: ReactElement;
  motion: () => ArcFloatingMotion;
}) {
  const [element, attach] = useAttachedElement<HTMLElement>(ref);
  const reduceMotion = usePrefersReducedMotion();
  const [isPresent, safeToRemove] = usePresence();
  // AnimatePresence hands out a new `safeToRemove` on every render; a ref keeps a re-render from restarting an exit.
  const safeToRemoveRef = useRef(safeToRemove);
  const resolveMotionRef = useRef(motion);
  useLayoutEffect(() => {
    safeToRemoveRef.current = safeToRemove;
    resolveMotionRef.current = motion;
  });
  /** The motion chosen when this node mounted. */
  const plannedRef = useRef<ArcFloatingMotion | null>(null);
  /** Values an interrupted playback had reached, so the next one continues from them. */
  const interruptedRef = useRef<Partial<Record<AnimatedProperty, string>> | null>(null);

  useLayoutEffect(() => {
    let active = true;
    // Some primitives keep children mounted in a detached portal while closed; they must not hold an exit open.
    if (!element || !element.isConnected) {
      if (!isPresent)
        queueMicrotask(() => {
          if (active) safeToRemoveRef.current?.();
        });
      return () => {
        active = false;
      };
    }
    const isFirstEntry = plannedRef.current === null;
    plannedRef.current ??= resolveMotionRef.current();
    const planned = plannedRef.current;
    const original: Record<AnimatedProperty, string> = {
      opacity: element.style.opacity,
      transform: element.style.transform,
    };
    const restore = () => {
      ANIMATED_PROPERTIES.forEach((property) => {
        element.style[property] = original[property];
      });
      element.removeAttribute(MOTION_ENTERING_ATTRIBUTE);
    };

    const interrupted = interruptedRef.current;
    interruptedRef.current = null;
    const startsFromEntryPose = isPresent && isFirstEntry && !interrupted;
    const from = {
      opacity: startsFromEntryPose
        ? planned.enterFrom.opacity
        : interrupted?.opacity
          ? Number.parseFloat(interrupted.opacity)
          : REST_POSE.opacity,
      transform: startsFromEntryPose
        ? reduceMotion
          ? "none"
          : poseTransform(element, planned.enterFrom)
        : (interrupted?.transform ?? "none"),
    };
    const targetPose = isPresent ? REST_POSE : planned.exitTo;
    const to = {
      opacity: targetPose.opacity,
      transform: reduceMotion ? "none" : poseTransform(element, targetPose),
    };
    const transitions: ArcFloatingTransitions = reduceMotion
      ? { transform: REDUCED_TWEEN, opacity: REDUCED_TWEEN }
      : isPresent
        ? planned.enter
        : planned.exit;

    // Motion starts on its next frame; painting the first keyframe now keeps that frame from flashing the rest state.
    element.style.opacity = String(from.opacity);
    element.style.transform = from.transform;
    // A transform makes the layer the containing block of fixed descendants, so they stay hidden until it settles.
    if (isPresent) element.setAttribute(MOTION_ENTERING_ATTRIBUTE, "");
    const animations = [
      animate(element, { opacity: [from.opacity, to.opacity] }, transitions.opacity),
      ...(from.transform === to.transform
        ? []
        : [animate(element, { transform: [from.transform, to.transform] }, transitions.transform)]),
    ];
    void Promise.all(animations).then(() => {
      if (!active) return;
      if (!isPresent) {
        safeToRemoveRef.current?.();
        return;
      }
      // Motion commits the final keyframe inline; giving the caller's styles back leaves no compositing layer.
      frame.postRender(() => {
        if (active) restore();
      });
    });

    return () => {
      active = false;
      const computed = getComputedStyle(element);
      const isMidPlayback = element.hasAttribute(MOTION_ENTERING_ATTRIBUTE) || !isPresent;
      // A settled entrance needs no snapshot: the next playback starts from rest.
      interruptedRef.current = isMidPlayback
        ? { opacity: computed.opacity, transform: computed.transform }
        : null;
      animations.forEach((animation) => animation.cancel());
      restore();
    };
  }, [element, isPresent, reduceMotion]);

  return (
    <Slot.Root
      ref={attach}
      {...props}
      // A leaving layer can be neither clicked, focused nor announced while it fades out.
      {...(isPresent ? {} : { inert: true, "aria-hidden": true })}
    >
      {children}
    </Slot.Root>
  );
}
