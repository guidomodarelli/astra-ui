"use client";

/**
 * Animates the original primitive node with Motion, without adding DOM wrappers. Every kind plays Arc's motion
 * (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md) for the component it serves.
 */
import {
  useLayoutEffect,
  useRef,
  type ReactElement,
  type ComponentProps,
} from "react";
import { Slot } from "radix-ui";
import {
  animate,
  usePresence,
  frame,
  type AnimationOptions,
  type AnimationPlaybackControlsWithThen,
  type DOMKeyframesDefinition,
} from "motion/react";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { MOTION_ENTERING_ATTRIBUTE } from "../constants/motion.js";
import { ARC_BLUR, ARC_DURATION, ARC_EASE } from "./arc-tokens.js";
import {
  SPRING_CHEVRON,
  SPRING_POP,
  type MotionKind,
} from "./tokens.js";
import {
  surfaceEnter,
  surfaceExit,
  withRestingStyle,
  type SurfaceKind,
} from "./surface-keyframes.js";
import { useAttachedElement } from "./use-attached-element.js";

const EASE_ENTER: [number, number, number, number] = [...ARC_EASE.enter];
const SURFACE_KINDS: readonly MotionKind[] = ["dialog", "sheet", "overlay"];
/** Inline style properties Motion playback may write; they are restored after playback. */
const ANIMATED_PROPERTIES = ["opacity", "transform", "filter"] as const;
type AnimatedProperty = (typeof ANIMATED_PROPERTIES)[number];

/** Arc's theme switch grows the incoming icon from .7. */
const THEME_ICON_ENTER_SCALE = 0.7;
/** Arc's chosen-option check sharpens in just after its row: scale .6 and a subtle blur. */
const ITEM_CHECK_ENTER_SCALE = 0.6;
const ITEM_CHECK_DELAY_S = 0.04;
/** Arc's helper and error rows rise into place by a third of a line while they sharpen. */
const MESSAGE_RISE = "0.35em";

/** Reads a computed `matrix()` or `matrix3d()` transform as its 2D components. */
function matrixOf(transform: string): { a: number; b: number } {
  const values = /^matrix(3d)?\(([^)]+)\)$/.exec(transform);
  if (!values) return { a: 1, b: 0 };
  const parts = values[2]!.split(",").map(parseFloat);
  return { a: parts[0] ?? 1, b: parts[1] ?? 0 };
}

/** Extracts the rotation, in degrees, of a computed transform. */
function rotationOf(transform: string): number {
  const { a, b } = matrixOf(transform);
  return (Math.atan2(b, a) * 180) / Math.PI;
}

/** Composes refs through Radix Slot and delegates entry, exit and state playback to Motion. */
export function MotionSlot({
  children,
  kind,
  ref,
  ...props
}: Omit<ComponentProps<typeof Slot.Root>, "children"> & {
  children: ReactElement;
  kind: MotionKind;
}) {
  const [element, attach] = useAttachedElement<HTMLElement>(ref);
  const reduceMotion = usePrefersReducedMotion();
  const [isPresent, safeToRemove] = usePresence();
  // AnimatePresence hands out a new `safeToRemove` on every render; reading it through a ref
  // keeps a re-render during an exit from restarting the exit playback.
  const safeToRemoveRef = useRef(safeToRemove);
  useLayoutEffect(() => {
    safeToRemoveRef.current = safeToRemove;
  });
  /**
   * Values interrupted playback had reached on its element, so the opposite direction (an exit
   * after a cut entrance, or a reopen during an exit) continues from them.
   */
  const interruptedRef = useRef<{
    element: HTMLElement;
    values: Partial<Record<AnimatedProperty, string>>;
  } | null>(null);

  useLayoutEffect(() => {
    let active = true;
    const safeToRemove = () => safeToRemoveRef.current?.();
    // Some primitives keep React children mounted in a detached portal while closed.
    // They must not hold an ancestor's exit open when there is no element to animate.
    if (!element || !element.isConnected) {
      if (!isPresent)
        queueMicrotask(() => {
          if (active) safeToRemove();
        });
      return () => {
        active = false;
      };
    }
    /** Running animations with the style properties each one drives. */
    const animations = new Map<AnimationPlaybackControlsWithThen, readonly AnimatedProperty[]>();
    const cleanups: Array<() => void> = [];
    const original: Record<AnimatedProperty, string> = {
      opacity: element.style.opacity,
      transform: element.style.transform,
      filter: element.style.filter,
    };

    /**
     * Restores caller-owned styles after playback so transforms do not leave compositing
     * layers behind. Only the given properties are restored, so concurrent playback of other
     * properties keeps its current value.
     */
    function restore(properties: readonly AnimatedProperty[] = ANIMATED_PROPERTIES) {
      properties.forEach((property) => {
        element!.style[property] = original[property];
      });
    }

    /** Cancels running animations that drive any of the given properties. */
    function cancel(properties: readonly AnimatedProperty[] = ANIMATED_PROPERTIES) {
      animations.forEach((driven, animation) => {
        if (!driven.some((property) => properties.includes(property))) return;
        animation.cancel();
        animations.delete(animation);
      });
    }

    /** Releases only animations and listeners created for this primitive instance. */
    function dispose() {
      active = false;
      // Remembers where running playback was, in case this teardown is the start of an exit.
      if (animations.size) {
        const computed = getComputedStyle(element!);
        const snapshot: Partial<Record<AnimatedProperty, string>> = {};
        new Set([...animations.values()].flat()).forEach((property) => {
          const value = computed[property];
          // Motion cannot animate from "none", and needs opacity as a number like its target.
          if (value && value !== "none") snapshot[property] = value;
        });
        interruptedRef.current = { element: element!, values: snapshot };
      }
      cleanups.forEach((cleanup) => cleanup());
      cancel();
      restore();
      element!.removeAttribute(MOTION_ENTERING_ATTRIBUTE);
    }

    // Consumed by this run only, even when it plays nothing, so it never resurfaces later.
    const interrupted = interruptedRef.current;
    interruptedRef.current = null;

    if (reduceMotion) {
      if (!isPresent)
        queueMicrotask(() => {
          if (active) safeToRemove();
        });
      return dispose;
    }

    /**
     * Runs non-layout keyframes, retaining the node only for exit playback. It interrupts only
     * the animations that drive the same properties, so independent effects never cut each other.
     */
    function play(
      keyframes: DOMKeyframesDefinition,
      transition: AnimationOptions,
      { remove = false, onSettled }: { remove?: boolean; onSettled?: () => void } = {},
    ) {
      const properties = ANIMATED_PROPERTIES.filter((property) => property in keyframes);
      // Idle properties hold the caller's current inline value (React may have changed it
      // since mount), which is what playback must give back when it finishes.
      const busy = new Set([...animations.values()].flat());
      properties.forEach((property) => {
        if (!busy.has(property)) original[property] = element!.style[property];
      });
      cancel(properties);
      // Motion starts playback on its next frame; painting the first keyframe now keeps that
      // frame from flashing the final state (a mounted dialog at full size, a thumb at its end).
      const frames = keyframes as Record<string, unknown>;
      properties.forEach((property) => {
        const values = frames[property];
        if (Array.isArray(values) && values.length > 1) {
          element!.style[property] = String(values[0]);
        }
      });
      const animation = animate(element!, keyframes, transition);
      animations.set(animation, properties);
      void animation.then(() => {
        if (!animations.delete(animation) || !active) return;
        if (remove) {
          safeToRemove();
          return;
        }
        // Motion re-renders every value it has stored when an animation commits, including
        // properties finished earlier, so every idle property is restored, not just this one's.
        frame.postRender(() => {
          if (!active) return;
          const busy = new Set([...animations.values()].flat());
          restore(ANIMATED_PROPERTIES.filter((property) => !busy.has(property)));
          onSettled?.();
        });
      });
    }

    const tween = (duration: number) => ({ duration, ease: EASE_ENTER });

    if (SURFACE_KINDS.includes(kind)) {
      const step = isPresent
        ? surfaceEnter(element, kind as SurfaceKind)
        : surfaceExit(element, kind as SurfaceKind);
      // Read while no playback writes inline styles: the previous run's teardown restored them.
      const computed = getComputedStyle(element);
      const keyframes = withRestingStyle(step.keyframes, {
        transform: computed.transform,
        opacity: Number.parseFloat(computed.opacity),
      }) as Record<string, unknown>;
      // Closing mid-entrance, or reopening mid-exit, turns around from the reached values
      // instead of jumping to rest or to the start of the entrance first.
      if (interrupted?.element === element) {
        Object.entries(interrupted.values).forEach(([property, value]) => {
          const frames = keyframes[property];
          if (!Array.isArray(frames) || !value) return;
          const start = property === "opacity" ? Number.parseFloat(value) : value;
          keyframes[property] = [start, ...frames.slice(1)];
        });
      }
      // The mark outlives the animation until its styles are restored: even a settled
      // transform left inline would still trap fixed descendants inside the surface.
      if (isPresent) element.setAttribute(MOTION_ENTERING_ATTRIBUTE, "");
      play(keyframes as DOMKeyframesDefinition, step.transition, {
        remove: !isPresent,
        onSettled: () => element.removeAttribute(MOTION_ENTERING_ATTRIBUTE),
      });
      return dispose;
    }
    if (!isPresent) {
      queueMicrotask(() => {
        if (active) safeToRemove();
      });
      return dispose;
    }

    if (kind === "icon-swap") {
      // Arc's theme switch: the keyed icon grows from .7 out of a subtle blur on the snappy spring.
      play(
        {
          opacity: [0, 1],
          transform: [`scale(${THEME_ICON_ENTER_SCALE})`, "scale(1)"],
          filter: [`blur(${ARC_BLUR.subtle}px)`, "blur(0px)"],
        },
        { ...SPRING_POP, opacity: tween(ARC_DURATION.fast), filter: tween(ARC_DURATION.fast) },
      );
    } else if (kind === "item-check") {
      // Arc's Select indicator: the check of the chosen option sharpens in just after its row.
      play(
        {
          opacity: [0, 1],
          transform: [`scale(${ITEM_CHECK_ENTER_SCALE})`, "scale(1)"],
          filter: [`blur(${ARC_BLUR.subtle}px)`, "blur(0px)"],
        },
        { ...tween(ARC_DURATION.standard), delay: ITEM_CHECK_DELAY_S },
      );
    } else if (kind === "message") {
      // Arc's helper and error rows: the message rises a third of a line while it sharpens.
      play(
        {
          opacity: [0, 1],
          transform: [`translateY(${MESSAGE_RISE})`, "translateY(0px)"],
          filter: [`blur(${ARC_BLUR.soft}px)`, "blur(0px)"],
        },
        tween(ARC_DURATION.standard),
      );
    }

    if (kind === "rotate") {
      // CSS owns the resting angle (for example `rotate-180` while open); Motion only animates
      // the turn between angles, so reduced motion and SSR keep the correct orientation.
      const restingAngle = () => parseFloat(getComputedStyle(element).rotate) || 0;
      let previousAngle = restingAngle();
      const turn = () => {
        const inFlight = rotationOf(getComputedStyle(element).transform);
        cancel(["transform"]);
        restore(["transform"]);
        const nextAngle = restingAngle();
        const delta = previousAngle + inFlight - nextAngle;
        previousAngle = nextAngle;
        if (Math.abs(delta) >= 1)
          play({ transform: [`rotate(${delta}deg)`, "rotate(0deg)"] }, SPRING_CHEVRON);
      };
      const observer = new MutationObserver(turn);
      observer.observe(element, { attributes: true, attributeFilter: ["class"] });
      if (element.parentElement) {
        observer.observe(element.parentElement, {
          attributes: true,
          attributeFilter: ["aria-expanded", "data-state", "class"],
        });
      }
      cleanups.push(() => observer.disconnect());
    }
    if (kind === "reveal") {
      // Arc's avatar: a freshly loaded image sharpens out of a soft blur while it fades in.
      // Already-loaded images (cached or server-rendered) are left untouched on mount.
      const isLoading = () => element.hasAttribute("data-loading");
      let wasLoading = isLoading();
      const observer = new MutationObserver(() => {
        const loading = isLoading();
        const loaded = wasLoading && !loading && !element.hasAttribute("data-error");
        wasLoading = loading;
        if (!loaded) return;
        play(
          { opacity: [0, 1], filter: [`blur(${ARC_BLUR.soft}px)`, "blur(0px)"] },
          tween(ARC_DURATION.standard),
        );
      });
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["data-loading", "data-error"],
      });
      cleanups.push(() => observer.disconnect());
    }
    return dispose;
  }, [element, kind, reduceMotion, isPresent]);

  return (
    <Slot.Root
      {...props}
      ref={attach}
      {...(isPresent ? {} : { inert: true, "aria-hidden": true })}
    >
      {children}
    </Slot.Root>
  );
}
