/** Defaults and tuning of Arc's Skeleton placeholder. */

/** Default Spanish label announced while the composed placeholder is busy. */
export const SKELETON_DEFAULT_LABEL = "Cargando contenido"

/** Text lines the composed placeholder draws when `lines` is not set. */
export const SKELETON_DEFAULT_LINES = 3

/** Bounds of `lines`, so a placeholder never collapses or turns into a wall of bars. */
export const SKELETON_LINE_LIMITS = {
  min: 1,
  max: 6,
} as const

/**
 * After loading flips, resizes inside this window spring to the new height; later resizes (a font swap, a parent
 * reflow) follow at once.
 */
export const SKELETON_MORPH_WINDOW_MS = 120

/** Vertical travel, in pixels, of revealed content rising into place. */
export const SKELETON_REVEAL_OFFSET_PX = 4
