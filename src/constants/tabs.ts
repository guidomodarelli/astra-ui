/** Tuning of Arc's Tabs: directional panel motion, height morph and active-tab reveal. */

/** Sign of the travel between two tabs: forward when the new tab sits after the previous one. */
export const TABS_DIRECTION = {
  forward: 1,
  backward: -1,
} as const

/** Distance, in px, an entering panel slides in from and a leaving panel slides out to. */
export const TABS_PANEL_OFFSET_PX = {
  enter: 8,
  exit: 6,
} as const

/** Fade-out, in seconds, of a leaving panel when motion is reduced. */
export const TABS_PANEL_REDUCED_EXIT_DURATION_S = 0.1

/** Height differences up to this many px between panels jump instead of morphing. */
export const TABS_PANEL_HEIGHT_TOLERANCE_PX = 1

/** Space, in px, kept between a revealed tab and the scrolled list edge: the list padding. */
export const TABS_REVEAL_MARGIN_PX = 4
