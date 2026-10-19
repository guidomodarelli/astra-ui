"use client"

/**
 * Arc's Tooltip (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a short dark bubble on Arc's tokens that
 * waits a moment, then rises a few pixels from its trigger. While a tooltip is open, and briefly after it closes, the
 * next one opens at once and only fades, without any app-level provider: the skip window is shared by every tooltip
 * on the page. It follows Arc's closed API, `<Tooltip content="...">` around its trigger, plus placement and open
 * state extensions.
 */
import type { ReactElement, ReactNode } from "react"

import { Tooltip as TooltipRoot, TooltipContent, TooltipTrigger } from "./primitives/tooltip.js"

/** Side of the trigger a tooltip prefers. Arc offers `top` and `bottom`; @golfo/ui adds `left` and `right`. */
export type TooltipSide = "top" | "bottom" | "left" | "right"

/** Alignment of the bubble against its trigger. */
export type TooltipAlign = "start" | "center" | "end"

export type TooltipProps = {
  /** Supplemental text of the bubble. Icon-only triggers still need their own `aria-label`. */
  content: ReactNode
  /** The trigger. Rendered with `asChild`, so it must accept a ref and be focusable. */
  children: ReactElement
  /** Preferred side of the trigger. Defaults to `top`. */
  side?: TooltipSide
  /** Alignment against the trigger. Defaults to `center`. */
  align?: TooltipAlign
  /** Gap, in px, between the bubble and its trigger. Defaults to 8. */
  sideOffset?: number
  /** Distance, in px, the bubble keeps from the viewport edges. Defaults to 12. */
  collisionPadding?: number
  /** Class added to the bubble. */
  contentClassName?: string
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the tooltip opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Milliseconds of hover or focus before the first tooltip opens. Defaults to Arc's 250. */
  delayDuration?: number
}

/**
 * A short label on hover or focus that opens without delay when moving between tooltips.
 * @param props - The bubble content, the trigger and optional placement and open state.
 * @returns The trigger with its tooltip.
 */
function Tooltip({
  content,
  children,
  side,
  align,
  sideOffset,
  collisionPadding,
  contentClassName,
  open,
  defaultOpen,
  onOpenChange,
  delayDuration,
}: TooltipProps) {
  return (
    <TooltipRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={contentClassName}
      >
        {content}
      </TooltipContent>
    </TooltipRoot>
  )
}

export { Tooltip }
