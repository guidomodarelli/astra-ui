"use client"

/**
 * Internal primitive of Arc's Select (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): Arc's trigger, whose
 * hover, press and open states answer in color only so the anchored list never shifts, and its raised list with
 * option rows and an end check, on Arc's tokens and Arc's motion: the list grows from the trigger edge, the check
 * of the chosen option sharpens in, and the chevron turns on the CSS spring.
 * Internal: the Radix composition behind the public closed `Select`; the package does not export it.
 */
import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { SELECT_COLLISION_PADDING_PX, SELECT_MOTION } from "../../constants/select.js"
import { ArcFloatingSlot } from "../../motion/arc-floating-slot.js"
import { MotionSlot } from "../../motion/motion-slot.js"
import { MotionOpenProvider, useMotionOpen, useMotionOpenState } from "../../motion/presence.js"
import { cn } from "../../lib/utils.js"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

/** Arc's option list always enters and leaves the same way. */
const resolveSelectMotion = () => SELECT_MOTION

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)

  return <MotionOpenProvider scope="select" open={motionOpen}><SelectPrimitive.Root data-slot="select" {...props} open={motionOpen} onOpenChange={setMotionOpen} /></MotionOpenProvider>
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

/**
 * Renders Arc's selection control: `default` matches the height of `Input` and `Button`, `sm` their small size.
 * Hover only answers on fine pointers, keyboard focus draws the shared outline, and `aria-invalid` turns the border
 * to the danger color.
 * @param props - Primitive properties, the `size` and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit cursor-pointer items-center justify-between gap-3 rounded-(--radius-control) border border-border bg-surface px-3 text-left text-sm whitespace-nowrap text-foreground outline-none select-none transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none hover-fine:not-disabled:not-aria-invalid:border-border-strong hover-fine:not-disabled:bg-surface-muted active:not-disabled:not-aria-invalid:border-border-strong active:not-disabled:bg-surface-muted data-[state=open]:not-aria-invalid:border-border-strong data-[state=open]:bg-surface-muted focus-visible:not-aria-invalid:border-border-strong disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger data-placeholder:text-text-muted data-[size=default]:min-h-(--control-height-md) data-[size=sm]:min-h-(--control-height-sm) data-[state=open]:*:data-[slot=select-icon]:rotate-180 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon data-slot="select-icon" strokeWidth={1.75} className="pointer-events-none size-4 text-text-muted transition-[rotate] duration-(--duration-spring) ease-(--ease-spring) motion-reduce:transition-none" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/**
 * Renders Arc's raised option list, at least twelve rem wide so options stay readable. With `position="popper"` it
 * grows from the trigger edge, matches the trigger width up to min(24rem, 100vw minus 20px), keeps 12px from the
 * viewport edges and caps its height at 20rem.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  collisionPadding = SELECT_COLLISION_PADDING_PX,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const open = useMotionOpen("select")
  /*
   * Radix keeps the closed list mounted in a detached fragment, so the selected option still fills `SelectValue`;
   * `MotionPresence` would unmount it and empty the trigger. Each opening gets a fresh slot instead, so it plays its
   * entrance again rather than resuming the finished one at rest. Radix drops the list's node as soon as it closes,
   * so, as in Arc, there is no exit to play.
   */
  return (
    <SelectPrimitive.Portal><ArcFloatingSlot key={open ? "open" : "closed"} motion={resolveSelectMotion}>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          "relative z-50 max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-48 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[calc(var(--radius-control)+2px)] border border-border bg-surface-raised p-1.5 text-foreground shadow-(--shadow-floating)",
          position === "popper" &&
            "w-(--radix-select-trigger-width) max-w-[min(24rem,calc(100vw-20px))] data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        collisionPadding={collisionPadding}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className="py-0.5 data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full"
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </ArcFloatingSlot></SelectPrimitive.Portal>
  )
}

/**
 * Renders Arc's option row: 36px tall, a muted fill when highlighted and the check of the chosen option at the end,
 * while retaining selection and disabled semantics.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-9 w-full cursor-default items-center gap-1.5 rounded-[calc(var(--radius-control)-4px)] py-1 pr-[34px] pl-[11px] text-sm text-foreground outline-hidden select-none transition-colors duration-(--duration-instant) ease-(--ease-standard) motion-reduce:transition-none data-highlighted:bg-surface-muted data-disabled:pointer-events-none data-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2.5 flex size-4 items-center justify-center text-foreground">
        <MotionSlot kind="item-check"><SelectPrimitive.ItemIndicator>
          <CheckIcon strokeWidth={1.75} className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator></MotionSlot>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex h-7 cursor-default items-center justify-center bg-surface-raised text-text-muted [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon strokeWidth={1.75} />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex h-7 cursor-default items-center justify-center bg-surface-raised text-text-muted [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon strokeWidth={1.75} />
    </SelectPrimitive.ScrollDownButton>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
