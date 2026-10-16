/** Tuning and default copy shared by the Arc surfaces of `Dialog` and its `alert` mode. */

/** Vertical offsets, in em, of a changed title or description rising in and lifting out while the dialog is open. */
export const DIALOG_TEXT_SWAP_OFFSET_EM = {
  enter: 0.3,
  exit: -0.3,
} as const

/** Default Spanish copy of Dialog; the close button name can be overridden with `closeLabel`. */
export const DIALOG_DEFAULT_COPY = {
  /** Accessible name of the built-in close button (Arc's "Close dialog"). */
  closeLabel: "Cerrar diálogo",
} as const
