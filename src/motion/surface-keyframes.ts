/** Resolves entry and exit playback for floating and modal surfaces from their rendered placement. */
import type { AnimationOptions, DOMKeyframesDefinition } from "motion/react";
import {
  MOTION_CENTER_MORPH_FOLDED_PERCENT,
  MOTION_DIALOG_DISTANCE,
  MOTION_EASE,
  MOTION_EASE_DRAWER,
  MOTION_EASE_UNFOLD,
  MOTION_SURFACE_CLIP_BLEED_PX,
  MOTION_SURFACE_CLIP_PERCENT,
  MOTION_SURFACE_SCALE,
  MOTION_TIMING,
  MOTION_TOOLTIP_DISTANCE,
  SPRING_PANEL,
  SPRING_TOOLTIP,
} from "./tokens.js";

/** Surface kinds whose presence is animated on mount and before removal. */
export type SurfaceKind = "tooltip" | "surface" | "dialog" | "center-morph" | "sheet" | "overlay";

/** Keyframes plus the transition that plays them. */
export interface MotionStep {
  keyframes: DOMKeyframesDefinition;
  transition: AnimationOptions;
}

type Side = "top" | "right" | "bottom" | "left";
type Align = "start" | "center" | "end";

const EASE_OUT: [number, number, number, number] = [...MOTION_EASE];
const EASE_DRAWER: [number, number, number, number] = [...MOTION_EASE_DRAWER];
const EASE_UNFOLD: [number, number, number, number] = [...MOTION_EASE_UNFOLD];
const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];
const ALIGNS: readonly Align[] = ["start", "center", "end"];

/** Reads Radix placement attributes, tolerating primitives that do not position with a popper. */
function readPlacement(element: Element): { side?: Side; align: Align } {
  const side = element.getAttribute("data-side");
  const align = element.getAttribute("data-align");
  return {
    side: SIDES.includes(side as Side) ? (side as Side) : undefined,
    align: ALIGNS.includes(align as Align) ? (align as Align) : "center",
  };
}

/** Builds a transform with explicit identity parts, so Motion never reads a missing scale as zero. */
function transform(x: number | string, y: number | string, scale = 1): string {
  const unit = (value: number | string) =>
    typeof value === "number" ? `${value}px` : value;
  return `translate(${unit(x)}, ${unit(y)}) scale(${scale})`;
}

/** Offset pointing away from the trigger, so content appears to emerge from it. */
function offsetAwayFromTrigger(side: Side | undefined, distance: number) {
  if (side === "top") return { x: 0, y: distance };
  if (side === "left") return { x: distance, y: 0 };
  if (side === "right") return { x: -distance, y: 0 };
  if (side === "bottom") return { x: 0, y: -distance };
  return { x: 0, y: 0 };
}

/**
 * Open edges extend the clip past the box, so the ring and drop shadow drawn outside it
 * (Tailwind rings are box-shadows) are never cut while the surface reveals or settles.
 */
const OPEN_EDGE = `-${MOTION_SURFACE_CLIP_BLEED_PX}px`;
/** Fully revealed clip: nothing of the surface, its outline or its shadow is hidden. */
const REVEALED_CLIP = `inset(${OPEN_EDGE} ${OPEN_EDGE} ${OPEN_EDGE} ${OPEN_EDGE})`;

/** Collapsed clip anchored at the corner or edge closest to the trigger. */
function collapsedClip(side: Side | undefined, align: Align): string {
  const hidden = `${MOTION_SURFACE_CLIP_PERCENT}%`;
  const half = `${MOTION_SURFACE_CLIP_PERCENT / 2}%`;
  /** Maps an alignment to the inset kept on the leading and trailing edges of the cross axis. */
  const crossAxis = (value: Align): [string, string] =>
    value === "start" ? [OPEN_EDGE, hidden] : value === "end" ? [hidden, OPEN_EDGE] : [half, half];
  if (side === "bottom" || side === "top") {
    const [left, right] = crossAxis(align);
    return side === "bottom"
      ? `inset(${OPEN_EDGE} ${right} ${hidden} ${left})`
      : `inset(${hidden} ${right} ${OPEN_EDGE} ${left})`;
  }
  const [top, bottom] = crossAxis(align);
  return side === "right"
    ? `inset(${top} ${hidden} ${bottom} ${OPEN_EDGE})`
    : `inset(${top} ${OPEN_EDGE} ${bottom} ${hidden})`;
}

/** Computed radius of each corner, clockwise from the top left, as border-radius serializes it. */
const CORNER_RADIUS_PROPERTIES = [
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
] as const;

/**
 * Builds the `round` part of an inset clip that repeats the surface's own corners, each grown by
 * the bleed so the clip edge stays parallel to the border. A corner serializes as one radius or
 * as a horizontal and vertical pair (elliptical), in pixels or percentages of the box.
 */
function bleedingCornerRadii(element: Element): string {
  const computed = getComputedStyle(element);
  const grow = (radius: string) => `calc(${radius} + ${MOTION_SURFACE_CLIP_BLEED_PX}px)`;
  const corners = CORNER_RADIUS_PROPERTIES.map((property) => {
    const [horizontal = "0px", vertical = horizontal] = computed[property].trim().split(/\s+/);
    return { horizontal: grow(horizontal), vertical: grow(vertical) };
  });
  const horizontals = corners.map((corner) => corner.horizontal).join(" ");
  const verticals = corners.map((corner) => corner.vertical).join(" ");
  return `round ${horizontals} / ${verticals}`;
}

/**
 * Folded and unfolded clips of a center-morph surface. Both share the surface's own corners,
 * so the shape matches the panel once unfolded and the clip never spends its last frames
 * rounding corners.
 */
function centerMorphClips(element: Element) {
  const round = bleedingCornerRadii(element);
  const folded = `${MOTION_CENTER_MORPH_FOLDED_PERCENT}%`;
  return {
    folded: `inset(${folded} ${folded} ${folded} ${folded} ${round})`,
    unfolded: `inset(${OPEN_EDGE} ${OPEN_EDGE} ${OPEN_EDGE} ${OPEN_EDGE} ${round})`,
  };
}

/** Edge-panel travel: fully off-screen on the side the sheet is attached to. */
function sheetOffset(element: Element) {
  const side = readPlacement(element).side ?? "right";
  if (side === "left") return { x: "-100%", y: "0%" };
  if (side === "top") return { x: "0%", y: "-100%" };
  if (side === "bottom") return { x: "0%", y: "100%" };
  return { x: "100%", y: "0%" };
}

/** Entrance playback matching the beui surface family for each kind. */
export function surfaceEnter(element: Element, kind: SurfaceKind): MotionStep {
  const { side, align } = readPlacement(element);
  if (kind === "overlay") {
    return {
      keyframes: { opacity: [0, 1] },
      transition: { duration: MOTION_TIMING.overlay, ease: EASE_OUT },
    };
  }
  if (kind === "tooltip") {
    const offset = offsetAwayFromTrigger(side, MOTION_TOOLTIP_DISTANCE);
    return {
      keyframes: {
        opacity: [0, 1],
        transform: [transform(offset.x, offset.y, 0.9), transform(0, 0)],
        filter: ["blur(5px)", "blur(0px)"],
      },
      transition: {
        ...SPRING_TOOLTIP,
        opacity: { duration: MOTION_TIMING.fast, ease: EASE_OUT },
        filter: { duration: MOTION_TIMING.enter, ease: EASE_OUT },
      },
    };
  }
  if (kind === "dialog") {
    return {
      keyframes: {
        opacity: [0, 1],
        transform: [transform(0, MOTION_DIALOG_DISTANCE, 0.97), transform(0, 0)],
      },
      transition: SPRING_PANEL,
    };
  }
  if (kind === "center-morph") {
    const { folded, unfolded } = centerMorphClips(element);
    return {
      keyframes: { clipPath: [folded, unfolded] },
      transition: { duration: MOTION_TIMING.centerMorph, ease: EASE_UNFOLD },
    };
  }
  if (kind === "sheet") {
    const offset = sheetOffset(element);
    return {
      keyframes: { transform: [transform(offset.x, offset.y), transform("0%", "0%")] },
      transition: SPRING_PANEL,
    };
  }
  const keyframes: DOMKeyframesDefinition = {
    opacity: [0, 1],
    transform: [transform(0, 0, MOTION_SURFACE_SCALE), transform(0, 0)],
  };
  // Primitives aligned over their trigger (Select item-aligned) have no side to reveal from.
  if (side) {
    keyframes.clipPath = [collapsedClip(side, align), REVEALED_CLIP];
  }
  return {
    keyframes,
    transition: {
      ...SPRING_PANEL,
      opacity: { duration: MOTION_TIMING.enter, ease: EASE_OUT },
      clipPath: { duration: MOTION_TIMING.surfaceClip, ease: EASE_OUT },
    },
  };
}

/** Exit playback: brief and eased so dismissal never blocks the next interaction. */
export function surfaceExit(element: Element, kind: SurfaceKind): MotionStep {
  const exitTween = { duration: MOTION_TIMING.exit, ease: EASE_OUT };
  if (kind === "overlay") {
    return { keyframes: { opacity: [1, 0] }, transition: exitTween };
  }
  if (kind === "tooltip") {
    const offset = offsetAwayFromTrigger(
      readPlacement(element).side,
      MOTION_TOOLTIP_DISTANCE * 0.6,
    );
    return {
      keyframes: {
        opacity: [1, 0],
        transform: [transform(0, 0), transform(offset.x, offset.y, 0.94)],
        filter: ["blur(0px)", "blur(3px)"],
      },
      transition: exitTween,
    };
  }
  if (kind === "dialog") {
    return {
      keyframes: {
        opacity: [1, 0],
        transform: [transform(0, 0), transform(0, MOTION_DIALOG_DISTANCE, 0.98)],
      },
      transition: { duration: MOTION_TIMING.enter, ease: EASE_OUT },
    };
  }
  if (kind === "center-morph") {
    const { folded, unfolded } = centerMorphClips(element);
    return {
      keyframes: { clipPath: [unfolded, folded] },
      transition: { duration: MOTION_TIMING.centerMorphFold, ease: EASE_UNFOLD },
    };
  }
  if (kind === "sheet") {
    const offset = sheetOffset(element);
    // A spring would linger at the edge; the drawer curve accelerates the panel away.
    return {
      keyframes: { transform: [transform("0%", "0%"), transform(offset.x, offset.y)] },
      transition: { duration: MOTION_TIMING.sheetExit, ease: EASE_DRAWER },
    };
  }
  return {
    keyframes: {
      opacity: [1, 0],
      transform: [transform(0, 0), transform(0, 0, MOTION_SURFACE_SCALE)],
    },
    transition: exitTween,
  };
}
