"use client"

/**
 * Arc's Hover Card (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a read-only preview of a person or
 * link that opens after half a second of hover or on keyboard focus, grows from the trigger edge on a smooth spring
 * and closes fast on leave. While a card is open, and briefly after it closes, moving to another trigger opens its
 * card almost at once and only fades. It follows Arc's closed API, `<HoverCard content={...}>` around its trigger,
 * with Arc's `HoverCardProfile` preset and open state and placement extensions.
 */
import type { ReactElement, ReactNode } from "react"

import { cn } from "../lib/utils.js"
import {
  HoverCard as HoverCardRoot,
  HoverCardContent,
  HoverCardProfile,
  HoverCardTrigger,
  type HoverCardProfileProps,
  type HoverCardStat,
} from "./primitives/hover-card.js"

/** Side of the trigger a hover card prefers. */
export type HoverCardSide = "top" | "bottom" | "left" | "right"

/** Alignment of the card against its trigger. */
export type HoverCardAlign = "start" | "center" | "end"

export type HoverCardProps = {
  /** The trigger, such as a mention button or link. Rendered with `asChild`, so it must accept a ref and be focusable. */
  children: ReactElement
  /** The preview. `HoverCardProfile` covers people. Keep it read only: focus never moves into the card. */
  content: ReactNode
  /** Preferred side of the trigger. Defaults to `bottom`. */
  side?: HoverCardSide
  /** Alignment against the trigger. Defaults to `start`. */
  align?: HoverCardAlign
  /** Milliseconds of hover before the first card opens. Defaults to 500. */
  openDelay?: number
  /** Grace, in milliseconds, after the pointer leaves. Defaults to 140. */
  closeDelay?: number
  /** Class on the card surface. */
  className?: string
  /** Class on the card surface, merged after `className`. */
  contentClassName?: string
  /** Gap, in px, between the card and its trigger. Defaults to 8. */
  sideOffset?: number
  /** Distance, in px, the card keeps from the viewport edges. Defaults to 12. */
  collisionPadding?: number
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the card opens or closes, for example to load its data on open. */
  onOpenChange?: (open: boolean) => void
}

/**
 * A read-only preview that opens after a short hover or keyboard focus and stays open while the pointer travels into
 * it.
 * @param props - The trigger, the preview and optional timing, placement and open state.
 * @returns The trigger with its hover card.
 */
function HoverCard({
  children,
  content,
  side = "bottom",
  align = "start",
  openDelay,
  closeDelay,
  className,
  contentClassName,
  sideOffset,
  collisionPadding,
  open,
  defaultOpen,
  onOpenChange,
}: HoverCardProps) {
  return (
    <HoverCardRoot
      openDelay={openDelay}
      closeDelay={closeDelay}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(className, contentClassName)}
      >
        {content}
      </HoverCardContent>
    </HoverCardRoot>
  )
}

export { HoverCard, HoverCardProfile }
export type { HoverCardProfileProps, HoverCardStat }
