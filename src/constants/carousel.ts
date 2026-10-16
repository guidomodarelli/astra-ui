/** Tuning of `Carousel`, adapted from Arc's carousel (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** Orientation of the slide track; vertical carousels move with the up and down arrows. */
export type CarouselOrientation = "horizontal" | "vertical"

/** Arrow keys that move to the previous and next slide along each axis. */
export const CAROUSEL_KEYS = {
  horizontal: { previous: "ArrowLeft", next: "ArrowRight" },
  vertical: { previous: "ArrowUp", next: "ArrowDown" },
} as const satisfies Record<CarouselOrientation, { previous: string; next: string }>

/** Keys that jump to the first and the last slide, as in Arc. */
export const CAROUSEL_EDGE_KEYS = { first: "Home", last: "End" } as const

/**
 * Focused elements, and composite widgets around them, that own their arrow, Home and End keys instead of moving the
 * carousel: text entry plus the ARIA widgets with their own keyboard navigation.
 */
export const CAROUSEL_OWN_KEYBOARD_SELECTOR = [
  "input",
  "textarea",
  "select",
  "[contenteditable]:not([contenteditable=false])",
  ...["combobox", "grid", "listbox", "menu", "menubar", "radiogroup", "slider", "spinbutton", "tablist", "toolbar", "tree", "treegrid"].map(
    (role) => `[role=${role}]`
  ),
].join(", ")

/** Length, in px, of a resting indicator dot and of the active pill it stretches into. */
export const CAROUSEL_INDICATOR_LENGTH_PX = { dot: 6, pill: 22 } as const

/** Default copy of the slide indicators. */
export const CAROUSEL_COPY = {
  indicatorsLabel: "Elegir una diapositiva",
  slideLabelPrefix: "Diapositiva",
  slideLabelSeparator: "de",
} as const

/** Root of a carousel; a nested carousel owns the keys pressed inside it. */
export const CAROUSEL_ROOT_SELECTOR = '[data-slot="carousel"]'
