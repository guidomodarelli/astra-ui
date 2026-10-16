"use client"

import { cn } from "../lib/utils.js"
import { letFocusReachToastLayer } from "../lib/toast-layer.js"
import { useEffect, type ComponentProps } from "react"
import { Toaster as SonnerToaster } from "sonner"

/**
 * Renders Sonner's toaster unchanged in look, but keeps its toasts usable while a modal `Dialog` (also in `alert` mode) or
 * `Sheet` is open: the toast layer takes pointer input even though the modal disables pointer events on the page,
 * and Sonner's hotkey moves keyboard focus into the toasts past the modal's focus trap (focus returns to the modal
 * when the focused toast goes away). Accepts every Sonner prop, including `ref`, and keeps the consumer's `className`.
 * @param props - Sonner's toaster props.
 * @returns The toast layer.
 */
const Toaster = ({ className, ...props }: ComponentProps<typeof SonnerToaster>) => {
  useEffect(() => letFocusReachToastLayer(document), [])

  return <SonnerToaster className={cn("pointer-events-auto", className)} {...props} />
}

export { Toaster }
