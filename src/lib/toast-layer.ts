/**
 * Keeps toasts usable while a modal overlay is open. Toasts sit above every overlay, but a modal `Dialog` or `Sheet`
 * treats a press on them as a press outside and closes, so a toast's action or close button would dismiss the form
 * that raised it instead of running.
 */
import { TOAST_LAYER_SELECTOR } from "../constants/toast.js"

/**
 * Tells whether an event target belongs to the toast layer.
 * @param target - Target of the outside interaction.
 * @returns `true` when the target is a toast or one of its controls.
 */
export function isToastLayerTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(TOAST_LAYER_SELECTOR) !== null
}

/**
 * Lets keyboard focus enter the toast layer while a modal traps focus. Radix's focus trap listens for `focusin` and
 * `focusout` on the document and pulls focus back into the modal whenever it lands outside, so Sonner's hotkey could
 * never move focus to a toast's controls. Focus changes that land on a toast stop at the body, after React has run
 * its own handlers and before the document-level trap sees them; every other focus change still reaches the trap.
 * Because the trap never sees focus leave, it cannot pull it back either: when the focused toast control is removed
 * (an action or close button dismisses its toast), focus returns to the element it came from instead of the body.
 * @param ownerDocument - Document whose body hosts the app and the modal portals.
 * @returns Removes the listeners.
 */
export function letFocusReachToastLayer(ownerDocument: Document): () => void {
  const { body } = ownerDocument
  let focusOrigin: HTMLElement | null = null
  let focusedToastElement: Element | null = null
  const restoreFocusAfterRemoval = new MutationObserver(() => {
    if (focusedToastElement?.isConnected !== false) return
    const activeElement = ownerDocument.activeElement
    if (activeElement === null || activeElement === body) focusOrigin?.focus({ preventScroll: true })
    stopTrackingToastFocus()
  })
  const stopTrackingToastFocus = () => {
    restoreFocusAfterRemoval.disconnect()
    focusOrigin = null
    focusedToastElement = null
  }
  const stopFocusIntoToast = (event: FocusEvent) => {
    const focusedElement = event.type === "focusin" ? event.target : event.relatedTarget
    if (!isToastLayerTarget(focusedElement)) {
      if (event.type === "focusin") stopTrackingToastFocus()
      return
    }
    event.stopPropagation()
    if (event.type !== "focusin") return
    if (focusedToastElement === null) {
      focusOrigin = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null
      restoreFocusAfterRemoval.observe(body, { childList: true, subtree: true })
    }
    focusedToastElement = focusedElement as Element
  }
  body.addEventListener("focusin", stopFocusIntoToast)
  body.addEventListener("focusout", stopFocusIntoToast)
  return () => {
    stopTrackingToastFocus()
    body.removeEventListener("focusin", stopFocusIntoToast)
    body.removeEventListener("focusout", stopFocusIntoToast)
  }
}

/**
 * Wraps a modal's `onInteractOutside` so presses on toasts never dismiss it. The consumer's handler still runs first
 * and can keep preventing dismissal for its own reasons.
 * @param handler - The consumer's `onInteractOutside`, if any.
 * @returns The handler to give the Radix content.
 */
export function keepOpenOnToastInteraction<OutsideEvent extends Event>(
  handler?: (event: OutsideEvent) => void,
): (event: OutsideEvent) => void {
  return (event) => {
    handler?.(event)
    if (isToastLayerTarget(event.target)) event.preventDefault()
  }
}
