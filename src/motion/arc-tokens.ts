/**
 * Motion presets adapted from Arc (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli, MIT License.
 * The full license text ships in THIRD_PARTY_NOTICES.md. Internal: only Arc-derived components use these.
 */

/** Durations in seconds, from an instant color answer to a considered layout change. */
export const ARC_DURATION = {
  instant: 0.12,
  fast: 0.16,
  exit: 0.18,
  standard: 0.24,
} as const;

/** Cubic-bezier curves for entrances and color or opacity tweens. */
export const ARC_EASE = {
  enter: [0.16, 1, 0.3, 1],
  standard: [0.22, 1, 0.36, 1],
} as const;

/** Presses, toggles and small indicators: settles fast with a hint of life. */
export const ARC_SPRING_SNAPPY = { type: "spring", visualDuration: 0.26, bounce: 0.12 } as const;

/** Panels, height changes and layout shifts: critically damped, never overshoots. */
export const ARC_SPRING_SMOOTH = { type: "spring", visualDuration: 0.4, bounce: 0 } as const;

/** Shape morphs and width changes that follow new content. */
export const ARC_SPRING_MORPH = { type: "spring", visualDuration: 0.42, bounce: 0.16 } as const;

/** Stagger steps in seconds; keep a whole staggered entrance under roughly 0.4s. */
export const ARC_STAGGER = {
  char: 0.016,
} as const;

/** Blur radii in pixels for brief content crossfades. */
export const ARC_BLUR = {
  subtle: 2,
  soft: 4,
} as const;
