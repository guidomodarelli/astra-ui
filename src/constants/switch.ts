/** Tuning of Arc's Switch thumb, adapted from Arc (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/**
 * Thumb geometry on Arc's 42 by 24 track, in pixels: its resting width and how far it travels, which is the track's
 * inner width minus the thumb. Keep in sync with the track and thumb sizes in `switch.tsx`.
 */
export const SWITCH_THUMB_GEOMETRY_PX = { size: 18, travel: 18 } as const satisfies { size: number; travel: number }

/** How far, in pixels, the thumb widens toward the other side while it is held down. */
export const SWITCH_PRESS_STRETCH_PX = 5

/** Critically damped glide: the thumb lands on its end without overshooting the state it reports. */
export const SWITCH_THUMB_GLIDE_SPRING = { type: "spring", visualDuration: 0.3, bounce: 0 } as const

/**
 * Brief horizontal stretch played when the state changes without a press (a controlled update or a label click), so
 * the thumb reads as moving mass rather than a sliding dot.
 */
export const SWITCH_CHANGE_STRETCH = {
  scaleX: [1, 1.16, 1],
  duration: 0.34,
  times: [0, 0.4, 1],
  ease: ["easeOut", "easeInOut"],
} as const

/** Window, in milliseconds, after a pointer or Space release in which a state change counts as caused by that press. */
export const SWITCH_PRESS_RELEASE_WINDOW_MS = 250

/** Key that toggles a focused switch and stretches its thumb while held. */
export const SWITCH_TOGGLE_KEY = " "

/** Mouse button that presses the switch: the primary one. */
export const SWITCH_PRIMARY_POINTER_BUTTON = 0
