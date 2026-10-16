"use client"

/**
 * Internal primitive of Arc's Popover (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a raised panel with
 * Arc's panel radius and floating shadow that starts a few pixels toward its trigger and settles on a spring, leaving
 * faster than it arrives. Internal: the Radix composition, including `PopoverAnchor`, behind the public `Popover` and
 * beez-ui's composite components; the package does not export it.
 */
import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { ArcFloatingSlot } from "../../motion/arc-floating-slot.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../../motion/presence.js"
import { cn } from "../../lib/utils.js"
import { POPOVER_COLLISION_PADDING_PX, POPOVER_MOTION, POPOVER_SIDE_OFFSET_PX } from "../../constants/popover.js"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)

  return <MotionOpenProvider scope="popover" open={motionOpen}><PopoverPrimitive.Root data-slot="popover" {...props} open={motionOpen} onOpenChange={setMotionOpen} /></MotionOpenProvider>
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

/** Closes the popover that contains it, such as a "Listo" or "Cancelar" button inside the panel. */
function PopoverClose({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />
}

/** Every popover enters and leaves on the same path. */
function resolvePopoverMotion() {
  return POPOVER_MOTION
}

/**
 * Renders Arc's panel: raised surface, hairline border, panel radius and floating shadow, kept inside the viewport.
 * Content taller than the room left on the placed side scrolls inside the panel instead of running off screen.
 * @param props - Radix content properties. `align` defaults to `center`, `sideOffset` to 6px and `collisionPadding`
 *   to 10px.
 * @returns The portaled panel.
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = POPOVER_SIDE_OFFSET_PX,
  collisionPadding = POPOVER_COLLISION_PADDING_PX,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal forceMount>
      <MotionPresence scope="popover" forceMount={props.forceMount}>
        <ArcFloatingSlot motion={resolvePopoverMotion}>
          <PopoverPrimitive.Content
            forceMount
            data-slot="popover-content"
            align={align}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            className={cn(
              "z-50 flex max-h-(--radix-popover-content-available-height) w-72 max-w-[calc(100vw-20px)] origin-(--radix-popover-content-transform-origin) flex-col gap-2.5 overflow-y-auto overscroll-contain *:shrink-0 rounded-(--radius-panel) border border-border bg-surface-raised p-(--space-4) text-sm leading-(--leading-body) text-foreground shadow-(--shadow-floating) outline-hidden",
              className
            )}
            {...props}
          />
        </ArcFloatingSlot>
      </MotionPresence>
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverTrigger }
