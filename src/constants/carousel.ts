/** Tuning of `Carousel`, adapted from Arc's carousel (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** Arrow keys that move to the previous and next slide. */
export const CAROUSEL_KEYS = { previous: "ArrowLeft", next: "ArrowRight" } as const

/** Keys that jump to the first and the last slide, as in Arc. */
export const CAROUSEL_EDGE_KEYS = { first: "Home", last: "End" } as const

/**
 * Focused elements, and composite widgets around them, that own their arrow, Home and End keys instead of moving the
 * carousel: text entry plus the ARIA widgets with their own keyboard navigation. The carousel's own indicator tab
 * list is excluded through {@link CAROUSEL_INDICATORS_SELECTOR}.
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

/** Width of one slide when the consumer does not pick one, as in Arc: a share of the carousel, capped. */
export const CAROUSEL_DEFAULT_SLIDE_SIZE = "min(80cqw, 340px)"

/** CSS custom property the slides and the control row read the slide width from. */
export const CAROUSEL_SLIDE_SIZE_PROPERTY = "--carousel-slide"

/** Default copy of the carousel, in Spanish. */
export const CAROUSEL_COPY = {
  /** Spoken role of the carousel root, in place of the English "carousel". */
  roleDescription: "carrusel",
  /** Spoken role of each slide, in place of the English "slide". */
  slideRoleDescription: "diapositiva",
  /** Accessible name of the draggable slide area. */
  viewportLabel: "Diapositivas",
  /** Accessible name of the indicator tab list. */
  indicatorsLabel: "Elegir una diapositiva",
  /** Accessible name of the previous arrow. */
  previous: "Diapositiva anterior",
  /** Accessible name of the next arrow. */
  next: "Diapositiva siguiente",
  /** Accessible name of the rotation control while slides rotate. */
  pauseRotation: "Pausar la rotación de diapositivas",
  /** Accessible name of the rotation control while rotation is paused. */
  startRotation: "Iniciar la rotación de diapositivas",
  slideLabelPrefix: "Diapositiva",
  slideLabelSeparator: "de",
} as const

/** Root of a carousel; a nested carousel owns the keys pressed inside it. */
export const CAROUSEL_ROOT_SELECTOR = '[data-slot="carousel"]'

/** The carousel's own indicator tab list, whose arrow, Home and End keys move the carousel. */
export const CAROUSEL_INDICATORS_SELECTOR = '[data-slot="carousel-indicators"]'

/** Size, in px, of the play and pause icons of the rotation control. */
export const CAROUSEL_ROTATION_ICON_SIZE_PX = 15

/** Scale the rotation icon grows from when it swaps between play and pause. */
export const CAROUSEL_ROTATION_ICON_ENTER_SCALE = 0.6
