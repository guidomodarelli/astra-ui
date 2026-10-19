"use client"

/**
 * Internal primitive of Arc's Tooltip (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a short dark
 * bubble on Arc's tokens that waits a moment, then rises a few pixels from its trigger. While a tooltip is open, and
 * briefly after it closes, the next one opens at once and only fades. Internal: the Radix composition (`Tooltip`,
 * `TooltipTrigger`, `TooltipContent`, `TooltipProvider`) behind the public closed `Tooltip` and @astra-kit/ui's composite
 * components; the package does not export it.
 */
import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { ArcFloatingSlot } from "../../motion/arc-floating-slot.js"
import { createOverlayWarmth, useOpenedWhileWarm } from "../../motion/overlay-warmth.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../../motion/presence.js"
import { cn } from "../../lib/utils.js"
import {
  TOOLTIP_COLLISION_PADDING_PX,
  TOOLTIP_INSTANT_MOTION,
  TOOLTIP_MOTION,
  TOOLTIP_OPEN_DELAY_MS,
  TOOLTIP_SIDE_OFFSET_PX,
  TOOLTIP_SKIP_WINDOW_MS,
} from "../../constants/tooltip.js"

/** Every tooltip on the page shares one skip window, whichever provider it belongs to. */
const tooltipWarmth = createOverlayWarmth(TOOLTIP_SKIP_WINDOW_MS)

/** Whether the page was already warm when the surrounding layer opened, so its entrance only fades. */
const TooltipOpenedWhileWarmContext = React.createContext(false)

/** Tells a `Tooltip` whether a `TooltipProvider` already wraps it. */
const TooltipProviderPresenceContext = React.createContext(false)

/**
 * Shares the open delay among the tooltips it wraps.
 * @param props - Radix provider properties. `delayDuration` defaults to Arc's 250ms.
 * @returns The provider.
 */
function TooltipProvider({
  delayDuration = TOOLTIP_OPEN_DELAY_MS,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipProviderPresenceContext.Provider value>
      <TooltipPrimitive.Provider
        data-slot="tooltip-provider"
        delayDuration={delayDuration}
        {...props}
      />
    </TooltipProviderPresenceContext.Provider>
  )
}

/**
 * Owns the open state of one tooltip. It works with or without a `TooltipProvider`: without one it brings its own,
 * as Arc's Tooltip does. Within the shared skip window it opens without delay.
 * @param props - Radix root properties.
 * @returns The tooltip root.
 */
function Tooltip({ delayDuration, ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)
  const isWarm = React.useSyncExternalStore(
    tooltipWarmth.subscribe,
    tooltipWarmth.isWarm,
    tooltipWarmth.isWarmOnServer
  )
  const openedWhileWarm = useOpenedWhileWarm(motionOpen, isWarm)
  const hasProvider = React.useContext(TooltipProviderPresenceContext)

  React.useEffect(() => {
    if (!motionOpen) return
    return tooltipWarmth.open()
  }, [motionOpen])

  const root = (
    <MotionOpenProvider scope="tooltip" open={motionOpen}>
      <TooltipOpenedWhileWarmContext.Provider value={openedWhileWarm}>
        <TooltipPrimitive.Root
          data-slot="tooltip"
          {...props}
          delayDuration={isWarm ? 0 : delayDuration}
          open={motionOpen}
          onOpenChange={setMotionOpen}
        />
      </TooltipOpenedWhileWarmContext.Provider>
    </MotionOpenProvider>
  )
  return hasProvider ? root : <TooltipProvider>{root}</TooltipProvider>
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * Renders Arc's bubble: inverted colors, a hairline border, the raised shadow and 15rem of maximum width.
 * @param props - Radix content properties. `sideOffset` defaults to 8px and `collisionPadding` to 12px.
 * @returns The portaled bubble.
 */
function TooltipContent({
  className,
  sideOffset = TOOLTIP_SIDE_OFFSET_PX,
  collisionPadding = TOOLTIP_COLLISION_PADDING_PX,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  // Within the skip window the layer opens in place and only fades.
  const openedWhileWarm = React.useContext(TooltipOpenedWhileWarmContext)
  return (
    <TooltipPrimitive.Portal forceMount>
      <MotionPresence scope="tooltip" forceMount={props.forceMount}>
        <ArcFloatingSlot motion={() => (openedWhileWarm ? TOOLTIP_INSTANT_MOTION : TOOLTIP_MOTION)}>
          <TooltipPrimitive.Content
            forceMount
            data-slot="tooltip-content"
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            className={cn(
              "z-50 inline-flex w-fit max-w-60 origin-(--radix-tooltip-content-transform-origin) items-center gap-1.5 rounded-(--radius-control) border border-[color-mix(in_oklab,var(--background)_14%,var(--foreground))] bg-foreground px-(--space-4) py-(--space-3) font-sans text-sm leading-(--leading-body) font-normal tracking-(--tracking-body) text-background shadow-(--shadow-raised) has-data-[slot=kbd]:pr-(--space-3) **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm",
              className
            )}
            {...props}
          >
            {children}
          </TooltipPrimitive.Content>
        </ArcFloatingSlot>
      </MotionPresence>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
