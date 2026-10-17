/**
 * Defines the timing, curves and physics shared by Motion animations. Every value is one of Arc's motion presets
 * (https://uiarc.dev, `components/arc/lib/motion-tokens.ts`): `snappy` for presses and small indicators, `smooth` for
 * panels and anything that reports state, `morph` for shared highlights. Motion explains cause and effect; it does not
 * decorate. Public: consumers animate their own product surfaces with these tokens so they move like the library.
 */
import {
  ARC_DURATION,
  ARC_EASE,
  ARC_SPRING_MORPH,
  ARC_SPRING_SMOOTH,
  ARC_SPRING_SNAPPY,
  ARC_STAGGER,
} from "./arc-tokens.js";

export const MOTION_TIMING = {
  /** Arc `duration.instant`: color answers and fades that must feel immediate. */
  instant: ARC_DURATION.instant,
  /** Arc `duration.fast`: small fades, the opacity of a spring entrance, and dialog exits. */
  fast: ARC_DURATION.fast,
  /** Arc `duration.standard`: entrance tweens. */
  enter: ARC_DURATION.standard,
  /** Arc `duration.standard`: tween length for a deliberate on-screen change. */
  standard: ARC_DURATION.standard,
  /** Arc `duration.considered`: the slowest tween, for large layout changes. */
  considered: ARC_DURATION.considered,
  /** Arc `duration.standard`: opacity of panels whose size moves on a spring. */
  panel: ARC_DURATION.standard,
  /** Arc `duration.standard`: scrims fading in behind dialogs and sheets. */
  overlay: ARC_DURATION.standard,
  /** Arc `duration.exit`: leaving is faster than arriving. */
  exit: ARC_DURATION.exit,
  /** Arc `duration.standard`: a check mark drawing its stroke. */
  checkDraw: ARC_DURATION.standard,
  /** Arc `stagger.item`. */
  listStagger: ARC_STAGGER.item,
  /** Arc `duration.standard`: edge panels leaving the viewport. */
  sheetExit: ARC_DURATION.standard,
  /** Blink period of the typing cursor, the one loop that shows live status. */
  cursorBlink: 1,
} as const;

/** Arc staggers at most the first four items of a list; the rest share the last delay, so long lists never lag. */
export const MOTION_LIST_STAGGER_LIMIT = 4;

/** Arc `ease.enter`: strong ease-out for entrances; weak defaults such as `ease-out` feel sluggish. */
export const MOTION_EASE = ARC_EASE.enter;
/** Arc `ease.exit`: accelerates away, for elements leaving the screen. */
export const MOTION_EASE_EXIT = ARC_EASE.exit;
/** Arc `ease.standard`: color and opacity changes, and quick exits that must not linger. */
export const MOTION_EASE_STANDARD = ARC_EASE.standard;
/** Arc `ease.inOut`: elements that move while already on screen, and looping effects. */
export const MOTION_EASE_IN_OUT = ARC_EASE.inOut;

/** Arc `spring.snappy`: press feedback on buttons and other tappable surfaces. */
export const SPRING_PRESS = ARC_SPRING_SNAPPY;

/** Arc `spring.smooth`: panels, heights and overlay entrances; never overshoots. */
export const SPRING_PANEL = ARC_SPRING_SMOOTH;

/** Arc `spring.morph`: shared-layout glides, indicators and highlights moving between items. */
export const SPRING_LAYOUT = ARC_SPRING_MORPH;

/** Arc `spring.snappy`: disclosure chevrons turning toward their new state. */
export const SPRING_CHEVRON = ARC_SPRING_SNAPPY;

/** Arc `spring.snappy`: small, confident pops for counters, badges and swapped icons. */
export const SPRING_POP = ARC_SPRING_SNAPPY;

/** Arc's press: about 0.97, so every pressable reads as the same push. */
export const MOTION_PRESS_SCALE = 0.97;
/** Arc's calendar title slides just enough to show the direction of navigation. */
export const MOTION_MONTH_DISTANCE = 12;

/** Arc's dialog panel scale on entrance. */
export const MOTION_SURFACE_SCALE = 0.96;
/** Scale a dialog shrinks to while it leaves (Arc). */
export const MOTION_EXIT_SCALE = 0.98;
/** Arc's dialog rise on entrance, in pixels. */
export const MOTION_DIALOG_DISTANCE = 8;
/** Arc's dialog drop while it leaves, in pixels. */
export const MOTION_DIALOG_EXIT_DISTANCE = 4;

/** Time after an item loses its active state during which a new active item still glides from it. */
export const GLIDE_CONTINUITY_MS = 300;

export type MotionKind =
  | "rotate"
  | "item-check"
  | "icon-swap"
  | "message"
  | "reveal"
  | "dialog"
  | "sheet"
  | "overlay";
