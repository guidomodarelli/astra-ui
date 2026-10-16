/**
 * Defines the timing, curves and physics shared by Motion animations, aligned with Arc's motion presets
 * (https://uiarc.dev, `components/arc/lib/motion-tokens.ts`): `snappy` for presses and small indicators, `smooth` for
 * panels and anything that reports state, `morph` for shared highlights. Motion explains cause and effect; it does not
 * decorate. Public: consumers animate their own product surfaces with these tokens so they move like the library.
 * Names are stable API; values follow Arc.
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
  /** Arc `duration.standard`: inline messages that appear next to the content they describe. */
  message: ARC_DURATION.standard,
  /** Arc `duration.standard`: opacity of panels whose size moves on a spring. */
  panel: ARC_DURATION.standard,
  /** Arc `duration.standard`: scrims fading in behind dialogs and sheets. */
  overlay: ARC_DURATION.standard,
  /** Arc `duration.exit`: leaving is faster than arriving. */
  exit: ARC_DURATION.exit,
  surfaceClip: 0.32,
  /**
   * @deprecated Invalid fields no longer shake: the error is told by color and message. Kept for consumers that
   * animate their own fields.
   */
  shake: 0.45,
  checkDraw: 0.3,
  checkDrawDelay: 0.04,
  /** Arc `duration.fast`: the fade of an icon swapped in place; its scale rides `SPRING_POP`. */
  iconSwap: ARC_DURATION.fast,
  /** Arc `duration.fast`: options fading in with their list. */
  listItem: ARC_DURATION.fast,
  listDelay: 0.05,
  /** Arc `stagger.item`. */
  listStagger: ARC_STAGGER.item,
  closeEnter: 0.2,
  closeDelay: 0.16,
  /** Arc `duration.standard`: edge panels leaving the viewport. */
  sheetExit: ARC_DURATION.standard,
  /**
   * @deprecated Dialogs no longer unfold from their center; they rise and scale in on `SPRING_PANEL`. Kept for
   * consumers that animate their own surfaces with it.
   */
  centerMorph: 0.43,
  /**
   * @deprecated Dialogs no longer fold back to their center; they leave in `MOTION_TIMING.fast`. Kept for consumers
   * that animate their own surfaces with it.
   */
  centerMorphFold: 0.24,
  reveal: 0.4,
  /** Heart and badge pops that confirm a toggle. */
  pop: 0.32,
  /** Height of expanding and collapsing regions. */
  collapse: 0.26,
  /** Arc `duration.standard`. */
  monthSwap: ARC_DURATION.standard,
  cursorBlink: 1,
  skeleton: 1.8,
} as const;

/** Items beyond this position share the last stagger delay, so long lists never lag behind. */
export const MOTION_LIST_STAGGER_LIMIT = 10;

/** Arc `ease.enter`: strong ease-out for entrances; weak defaults such as `ease-out` feel sluggish. */
export const MOTION_EASE = ARC_EASE.enter;
/** Arc `ease.exit`: accelerates away, for elements leaving the screen. */
export const MOTION_EASE_EXIT = ARC_EASE.exit;
/** Arc `ease.standard`: color and opacity changes, and quick exits that must not linger. */
export const MOTION_EASE_STANDARD = ARC_EASE.standard;
/** Arc `ease.inOut`: elements that move while already on screen, and looping effects. */
export const MOTION_EASE_IN_OUT = ARC_EASE.inOut;
/** Drawer curve for edge panels leaving the viewport. */
export const MOTION_EASE_DRAWER = [0.32, 0.72, 0, 1] as const;
/**
 * Near-linear curve for the center morph: a spring or strong ease-out would resolve the clip
 * early and spend the last frames barely moving, so the whole duration reads as unfolding.
 * @deprecated Dialogs no longer unfold from their center. Kept for consumers that animate their own surfaces with it.
 */
export const MOTION_EASE_UNFOLD = [0.2, 0, 0.2, 1] as const;

/** Arc `spring.snappy`: press feedback on buttons and other tappable surfaces. */
export const SPRING_PRESS = ARC_SPRING_SNAPPY;

/** Arc `spring.smooth`: overlay panel entrances (dialogs, sheets and floating surfaces); never overshoots. */
export const SPRING_PANEL = ARC_SPRING_SMOOTH;

/** Arc `spring.morph`: shared-layout glides, indicators and highlights moving between items. */
export const SPRING_LAYOUT = ARC_SPRING_MORPH;

/** Arc `spring.snappy`: keyboard highlight in menus and lists, quick enough to keep up with a held arrow key. */
export const SPRING_HIGHLIGHT = ARC_SPRING_SNAPPY;

/** Arc `spring.morph`: the tab indicator gliding between tabs. */
export const SPRING_TABS = ARC_SPRING_MORPH;

/** Arc `spring.snappy`: small tooltip surfaces. */
export const SPRING_TOOLTIP = ARC_SPRING_SNAPPY;

/** Arc `spring.snappy`: disclosure chevrons turning toward their new state. */
export const SPRING_CHEVRON = ARC_SPRING_SNAPPY;

/** Arc `spring.smooth`: the switch thumb reports state, so it lands without overshoot. */
export const SPRING_THUMB = ARC_SPRING_SMOOTH;

/** Arc `spring.snappy`: small, confident pops for counters, badges and swapped icons. */
export const SPRING_POP = ARC_SPRING_SNAPPY;

/** Arc's press: about 0.97, so every pressable reads as the same push. */
export const MOTION_PRESS_SCALE = 0.97;
export const MOTION_SUBTLE_PRESS_SCALE = 0.98;
export const MOTION_TOGGLE_PRESS_SCALE = 0.92;
export const MOTION_HOVER_SCALE = 1.02;
export const MOTION_THUMB_SQUISH_SCALE = 0.9;
export const MOTION_ITEM_CHECK_SCALE = 0.75;
/** Arc's icon swap: the incoming icon grows from 0.6 on `SPRING_POP`. */
export const MOTION_ICON_SWAP_SCALE = 0.6;
export const MOTION_CLOSE_BUTTON_SCALE = 0.8;
export const MOTION_LIST_ITEM_DISTANCE = 6;
/** Scale a freshly inserted list item, option or inline message starts from, and a leaving one shrinks to. */
export const MOTION_ITEM_ENTER_SCALE = 0.98;
/** Loaded images settle from a slight zoom, so they develop in place instead of popping in. */
export const MOTION_REVEAL_SCALE = 1.06;
export const MOTION_REVEAL_BLUR_PX = 6;
/** Calendar months slide just enough to show the direction of navigation. */
export const MOTION_MONTH_DISTANCE = 12;
/** Skeleton shine travels from fully before the box to fully past it, as a `translate` value. */
export const MOTION_SHIMMER_TRANSLATE = ["-100% 0", "100% 0"] as const;

/** Hovered interactive cards gain a soft drop shadow; the rest value has the same shape, invisible. */
export const MOTION_CARD_SHADOW_LIFT = "0px 4px 16px 0px rgba(0, 0, 0, 0.08)";
export const MOTION_CARD_SHADOW_REST = "0px 0px 0px 0px rgba(0, 0, 0, 0)";

/** Arc's dialog panel scale on entrance; floating surfaces start from it too. */
export const MOTION_SURFACE_SCALE = 0.96;
/** Scale a dialog or tooltip shrinks to while it leaves (Arc). */
export const MOTION_EXIT_SCALE = 0.98;
/** Fraction of the surface kept hidden by the clip at the start of its reveal, in percent. */
export const MOTION_SURFACE_CLIP_PERCENT = 92;
/** Room left outside a revealing surface for its ring and drop shadow (`shadow-lg` spans ~22px). */
export const MOTION_SURFACE_CLIP_BLEED_PX = 24;
/** Arc's tooltip rise from its trigger, in pixels. */
export const MOTION_TOOLTIP_DISTANCE = 3;
/** Arc's tooltip scale on entrance. */
export const MOTION_TOOLTIP_SCALE = 0.97;
/** Arc's dialog rise on entrance, in pixels. */
export const MOTION_DIALOG_DISTANCE = 8;
/** Arc's dialog drop while it leaves, in pixels. */
export const MOTION_DIALOG_EXIT_DISTANCE = 4;
/**
 * Inset kept on every side of a center-morph dialog while folded, in percent: a sliver at its center.
 * @deprecated Dialogs no longer unfold from their center. Kept for consumers that animate their own surfaces with it.
 */
export const MOTION_CENTER_MORPH_FOLDED_PERCENT = 48;
export const MOTION_CONTENT_DISTANCE = 4;
/**
 * @deprecated Invalid fields no longer shake: the error is told by color and message. Kept for consumers that
 * animate their own fields.
 */
export const MOTION_INVALID_SHAKE_PX = [0, -6, 6, -4, 4, -2, 0] as const;

/** Time after an item loses its active state during which a new active item still glides from it. */
export const GLIDE_CONTINUITY_MS = 300;

export type MotionKind =
  | "press"
  | "subtle-press"
  | "toggle"
  | "fade"
  | "content"
  | "message"
  | "card"
  | "row"
  | "field"
  | "thumb"
  | "check"
  | "selection"
  | "item-check"
  | "rotate"
  | "list-item"
  | "icon-swap"
  | "delayed-pop"
  | "skeleton"
  | "reveal"
  | "link"
  | "icon"
  | "tooltip"
  | "surface"
  | "dialog"
  /** @deprecated Library dialogs use `dialog`. */
  | "center-morph"
  | "sheet"
  | "overlay";
