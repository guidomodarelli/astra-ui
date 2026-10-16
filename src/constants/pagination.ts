/** Default Spanish copy and window of Arc's Pagination. */

/** Default Spanish copy of Pagination; the landmark and arrow copy can be overridden through props. */
export const PAGINATION_DEFAULT_COPY = {
  /** Accessible name of the navigation landmark (Arc's "Pagination"). */
  navigationLabel: "Paginación",
  /** Visible label of the previous arrow. */
  previousText: "Anterior",
  /** Visible label of the next arrow. */
  nextText: "Siguiente",
  /** Accessible name of the previous arrow while it keeps its default label (Arc's "Previous page"). */
  previousLabel: "Ir a la página anterior",
  /** Accessible name of the next arrow while it keeps its default label (Arc's "Next page"). */
  nextLabel: "Ir a la página siguiente",
  /** Word before the number in the accessible name of each page (Arc's "Page 3"). */
  pageLabelPrefix: "Página",
} as const

/** Pages shown at once: Arc's five page window, so the control keeps one width on any screen. */
export const PAGINATION_WINDOW_SIZE = 5

/** First page number: pages are 1-based. */
export const PAGINATION_FIRST_PAGE = 1
