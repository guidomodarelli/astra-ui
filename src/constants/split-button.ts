/** Variants of `SplitButton` and the `Button` size each one uses. */
import type { ButtonSize } from "../components/button.js"

/** `primary` for the main action of a surface, `secondary` for a quieter, smaller one. */
export type SplitButtonVariant = "primary" | "secondary"

/** Height of both halves for each variant: the secondary split button is compact, as in Arc. */
export const SPLIT_BUTTON_SIZE_BY_VARIANT = {
  primary: "md",
  secondary: "sm",
} as const satisfies Record<SplitButtonVariant, ButtonSize>
