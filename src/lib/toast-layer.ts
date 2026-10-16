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
