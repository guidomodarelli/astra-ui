"use client"

/**
 * Arc's Popover (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a raised panel with Arc's panel radius
 * and floating shadow that starts a few pixels toward its trigger and settles on a spring, leaving faster than it
 * arrives. It follows Arc's composition: `Popover`, `PopoverTrigger`, `PopoverContent` and `PopoverClose`.
 */
import type { ComponentProps } from "react"

import {
  Popover,
  PopoverClose,
  PopoverContent as PopoverContentPrimitive,
  PopoverTrigger,
} from "./primitives/popover.js"

export type PopoverContentProps = ComponentProps<typeof PopoverContentPrimitive>

/**
 * Renders the portaled panel anchored to the trigger, kept inside the viewport; content taller than the room left
 * scrolls inside the panel.
 * @param props - Radix content properties. Arc's defaults: `align="start"`, a 6px `sideOffset` and a 10px
 *   `collisionPadding`.
 * @returns The panel.
 */
function PopoverContent({ align = "start", ...props }: PopoverContentProps) {
  return <PopoverContentPrimitive align={align} {...props} />
}

export { Popover, PopoverClose, PopoverContent, PopoverTrigger }
