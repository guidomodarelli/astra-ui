/** Interaction states shared by `Button` and the internal `ControlButton`. */
import type { MouseEvent } from "react"

/** Swallows activation while loading, keeping the button focusable instead of disabling it. */
function preventActivation(event: MouseEvent<HTMLElement>) {
  event.preventDefault()
}

/**
 * While loading, these handlers are dropped: Radix triggers open their layer from pointer and key handlers they
 * inject through `asChild`, so swallowing only the click would leave a busy trigger able to open it. Keyboard focus
 * stays, since nothing here touches focusability.
 */
export const LOADING_INERT_HANDLERS = {
  onClick: preventActivation,
  onPointerDown: undefined,
  onKeyDown: undefined,
} as const

/**
 * Applied while a parent `AnimatePresence` removes the button, so a stale control can be neither clicked, focused
 * nor announced during the exit animation.
 */
export const LEAVING_ATTRIBUTES = { inert: true, "aria-hidden": true } as const
