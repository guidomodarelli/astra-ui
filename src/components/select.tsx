"use client"

/**
 * Arc's Select (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md) as beez-ui's composable Radix select:
 * Arc's trigger, whose hover, press and open states answer in color only so the anchored list never shifts, and its
 * raised list with option rows and an end check, on Arc's tokens. It keeps every subcomponent, prop and `data-slot`
 * of the previous API and beez-ui's option entrance, check pop and chevron rotation.
 */
import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { SELECT_COLLISION_PADDING_PX } from "../constants/select.js"
import { GlideSlot } from "../motion/glide-slot.js"
import { MotionSlot } from "../motion/motion-slot.js"
import { cn } from "../lib/utils.js"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1.5", className)}
      {...props}
    />
  )
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
    <MotionSlot kind="field"><SelectPrimitive.Trigger
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
        <MotionSlot kind="rotate"><ChevronDownIcon data-slot="select-icon" strokeWidth={1.75} className="pointer-events-none size-4 text-text-muted" /></MotionSlot>
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger></MotionSlot>
  )
}

/**
 * Renders Arc's raised option list, at least twelve rem wide so options stay readable. With `position="popper"` it
 * grows from the trigger edge, matches the trigger width, keeps 12px from the viewport edges and caps its height at
 * 20rem.
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
  return (
    <SelectPrimitive.Portal><MotionSlot kind="surface"><GlideSlot preset="menu">
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          "relative z-50 max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-48 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[calc(var(--radius-control)+2px)] border border-border bg-surface-raised p-1.5 text-foreground shadow-(--shadow-floating)",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
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
          className="py-0.5 data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)"
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </GlideSlot></MotionSlot></SelectPrimitive.Portal>
  )
}

/**
 * Renders a muted option group label aligned with the option text.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-[11px] py-1.5 text-xs font-medium text-text-muted", className)}
      {...props}
    />
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
    <MotionSlot kind="list-item"><SelectPrimitive.Item
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
    </SelectPrimitive.Item></MotionSlot>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1.5 my-1 h-px bg-border-subtle", className)}
      {...props}
    />
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

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
