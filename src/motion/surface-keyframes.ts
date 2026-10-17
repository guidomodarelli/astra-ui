/** Resolves entry and exit playback of Arc's modal surfaces: dialogs, sheets and their scrims. */
import type { AnimationOptions, DOMKeyframesDefinition } from "motion/react";
import {
  MOTION_DIALOG_DISTANCE,
  MOTION_DIALOG_EXIT_DISTANCE,
  MOTION_EASE,
  MOTION_EASE_STANDARD,
  MOTION_EXIT_SCALE,
  MOTION_SURFACE_SCALE,
  MOTION_TIMING,
  SPRING_PANEL,
} from "./tokens.js";

/** Surface kinds whose presence is animated on mount and before removal. */
export type SurfaceKind = "dialog" | "sheet" | "overlay";

/** Fraction of Arc's drawer close after which the panel starts to fade. */
const SHEET_EXIT_FADE_START = 0.65;

/** Keyframes plus the transition that plays them. */
export interface MotionStep {
  keyframes: DOMKeyframesDefinition;
  transition: AnimationOptions;
}

type Side = "top" | "right" | "bottom" | "left";

const EASE_OUT: [number, number, number, number] = [...MOTION_EASE];
const EASE_STANDARD: [number, number, number, number] = [...MOTION_EASE_STANDARD];
const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];

/** Builds a transform with explicit identity parts, so Motion never reads a missing scale as zero. */
function transform(x: number | string, y: number | string, scale = 1): string {
  const unit = (value: number | string) =>
    typeof value === "number" ? `${value}px` : value;
  return `translate(${unit(x)}, ${unit(y)}) scale(${scale})`;
}

/**
 * Arc's dialog leave: a short tween on the standard curve, so it never lingers and a reopen
 * retargets from wherever the panel is.
 */
const DIALOG_LEAVE = { duration: MOTION_TIMING.fast, ease: EASE_STANDARD };

/** Edge-panel travel: fully off-screen on the side the sheet is attached to. */
function sheetOffset(element: Element) {
  const side = element.getAttribute("data-side");
  const resolved = SIDES.includes(side as Side) ? (side as Side) : "right";
  if (resolved === "left") return { x: "-100%", y: "0%" };
  if (resolved === "top") return { x: "0%", y: "-100%" };
  if (resolved === "bottom") return { x: "0%", y: "100%" };
  return { x: "100%", y: "0%" };
}

/** Entrance playback for each surface kind, on Arc's motion presets. */
export function surfaceEnter(element: Element, kind: SurfaceKind): MotionStep {
  if (kind === "overlay") {
    return {
      keyframes: { opacity: [0, 1] },
      transition: { duration: MOTION_TIMING.overlay, ease: EASE_OUT },
    };
  }
  if (kind === "sheet") {
    // Arc's drawer: the panel slides in from its edge on the smooth spring, at full opacity.
    const offset = sheetOffset(element);
    return {
      // Opacity is listed at rest so a reopen during the close fades back from where the close left it.
      keyframes: { transform: [transform(offset.x, offset.y), transform("0%", "0%")], opacity: [1, 1] },
      transition: SPRING_PANEL,
    };
  }
  // Arc's dialog: the panel rises and scales in on the smooth spring while it fades in quickly.
  return {
    keyframes: {
      opacity: [0, 1],
      transform: [transform(0, MOTION_DIALOG_DISTANCE, MOTION_SURFACE_SCALE), transform(0, 0)],
    },
    transition: {
      ...SPRING_PANEL,
      opacity: { duration: MOTION_TIMING.fast, ease: EASE_OUT },
    },
  };
}

/** Transform and opacity a surface rests at, which its caller may set through a class or style. */
export interface RestingStyle {
  transform: string;
  opacity: number;
}

/**
 * Composes surface playback with the surface's resting transform and opacity, so a caller-owned
 * tilt, offset or translucency holds through the whole entrance and exit instead of being
 * replaced by identity and full opacity, then snapping back once playback restores it.
 */
export function withRestingStyle(
  keyframes: DOMKeyframesDefinition,
  resting: RestingStyle,
): DOMKeyframesDefinition {
  const composed = { ...keyframes } as Record<string, unknown>;
  const { transform, opacity } = composed;
  if (Array.isArray(transform) && resting.transform && resting.transform !== "none") {
    composed.transform = transform.map((value) => `${String(value)} ${resting.transform}`);
  }
  if (Array.isArray(opacity) && Number.isFinite(resting.opacity) && resting.opacity !== 1) {
    composed.opacity = opacity.map((value) => Number(value) * resting.opacity);
  }
  return composed as DOMKeyframesDefinition;
}

/** Exit playback: brief and eased so dismissal never blocks the next interaction. */
export function surfaceExit(element: Element, kind: SurfaceKind): MotionStep {
  if (kind === "overlay") {
    return { keyframes: { opacity: [1, 0] }, transition: DIALOG_LEAVE };
  }
  if (kind === "sheet") {
    // Arc's drawer close: a tween on the standard curve that holds the panel opaque until it is mostly gone.
    const offset = sheetOffset(element);
    return {
      keyframes: {
        transform: [transform("0%", "0%"), transform(offset.x, offset.y)],
        opacity: [1, 1, 0],
      },
      transition: {
        duration: MOTION_TIMING.sheetExit,
        ease: EASE_STANDARD,
        opacity: { duration: MOTION_TIMING.sheetExit, times: [0, SHEET_EXIT_FADE_START, 1] },
      },
    };
  }
  return {
    keyframes: {
      opacity: [1, 0],
      transform: [transform(0, 0), transform(0, MOTION_DIALOG_EXIT_DISTANCE, MOTION_EXIT_SCALE)],
    },
    transition: DIALOG_LEAVE,
  };
}
