"use client"

/**
 * Internal primitive of Arc's Dropdown menu (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): Arc's raised
 * panel, item rows, danger tone, separators, placement defaults and staggered item entrance on its tokens, with
 * beez-ui's reveal from the trigger edge and the highlight that glides between items with the keyboard. Internal: the
 * Radix composition behind the public closed `DropdownMenu` and beez-ui's composite components; the package does not
 * export it.
 */
import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import {
  DROPDOWN_MENU_COLLISION_PADDING_PX,
  DROPDOWN_MENU_SIDE_OFFSET_PX,
} from "../../constants/dropdown-menu.js"
import { GlideSlot } from "../../motion/glide-slot.js"
import { MotionSlot } from "../../motion/motion-slot.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../../motion/presence.js"
import { cn } from "../../lib/utils.js"
import { CheckIcon } from "lucide-react"

/**
 * Arc's menu panel on its tokens. It also sets the direction its items rise in from (`--menu-item-offset-*`, toward
 * the trigger).
 */
const menuSurfaceClassName =
  "relative z-50 overflow-x-hidden overflow-y-auto rounded-(--radius-panel) border border-border bg-surface-raised p-[5px] text-foreground shadow-(--shadow-floating) data-[state=closed]:pointer-events-none data-[state=closed]:overflow-hidden [--menu-item-offset-x:0px] [--menu-item-offset-y:-2px] data-[side=top]:[--menu-item-offset-y:2px] data-[side=left]:[--menu-item-offset-x:2px] data-[side=left]:[--menu-item-offset-y:0px] data-[side=right]:[--menu-item-offset-x:-2px] data-[side=right]:[--menu-item-offset-y:0px]"

/**
 * Arc's item row: 36px tall, a muted fill when highlighted and a muted icon (icons with their own `text-*` color keep
 * it). Items fade and rise in once when the menu opens, staggered by 35ms up to the fifth row; reduced motion shows
 * them at once. Only color, opacity and translate transition, so the highlight fill paints instantly and the
 * keyboard glide owns its movement.
 */
const menuItemClassName =
  "relative flex min-h-9 cursor-pointer items-center gap-2.5 rounded-[calc(var(--radius-panel)-6px)] px-[11px] text-sm text-foreground outline-hidden select-none [transition:color_var(--duration-fast)_var(--ease-standard),opacity_var(--duration-standard)_var(--ease-enter)_var(--menu-item-delay,0ms),translate_var(--duration-standard)_var(--ease-enter)_var(--menu-item-delay,0ms)] starting:opacity-0 starting:[translate:var(--menu-item-offset-x,0px)_var(--menu-item-offset-y,0px)] nth-2:[--menu-item-delay:35ms] nth-3:[--menu-item-delay:70ms] nth-4:[--menu-item-delay:105ms] nth-[n+5]:[--menu-item-delay:140ms] motion-reduce:transition-none data-highlighted:bg-surface-muted data-inset:pl-[38px] data-disabled:pointer-events-none data-disabled:cursor-default data-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[svg:not([class*='text-'])]:text-text-secondary"

/** Room at the end of checkbox and radio rows for their check, as in Arc's select options. */
const menuSelectableItemClassName = "pr-[34px]"

/**
 * Arc's danger tone of a `destructive` row of any kind: danger text and icon over a faint danger fill when highlighted.
 */
const menuItemDestructiveClassName =
  "data-[variant=destructive]:text-danger data-[variant=destructive]:*:[svg:not([class*='text-'])]:text-danger data-[variant=destructive]:data-highlighted:bg-[color-mix(in_oklab,var(--danger)_8%,var(--surface))]"

/** Position and color of the check of checkbox and radio rows. */
const menuItemIndicatorClassName =
  "pointer-events-none absolute right-2.5 flex items-center justify-center text-foreground"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)

  return <MotionOpenProvider scope="dropdown-menu" open={motionOpen}><DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} open={motionOpen} onOpenChange={setMotionOpen} /></MotionOpenProvider>
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

/**
 * Arc's menu panel. It sizes action menus by their content, at least 12rem unless the viewport is narrower, instead
 * of narrowing them to an icon trigger.
 * @param props - Primitive properties. Arc's defaults: `align="start"`, a 6px `sideOffset`, a 12px
 *   `collisionPadding` and `loop`, so arrow keys wrap from the last item to the first.
 * @returns The portaled menu, animated in and out with its open state.
 */
function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = DROPDOWN_MENU_SIDE_OFFSET_PX,
  collisionPadding = DROPDOWN_MENU_COLLISION_PADDING_PX,
  loop = true,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal forceMount><MotionPresence scope="dropdown-menu" forceMount={props.forceMount}>
      <MotionSlot kind="surface"><GlideSlot preset="menu"><DropdownMenuPrimitive.Content forceMount
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        loop={loop}
        className={cn(
          menuSurfaceClassName,
          "max-h-(--radix-dropdown-menu-content-available-height) min-w-[min(12rem,var(--radix-dropdown-menu-content-available-width))] max-w-(--radix-dropdown-menu-content-available-width) origin-(--radix-dropdown-menu-content-transform-origin)",
          className
        )}
        {...props}
      /></GlideSlot></MotionSlot>
    </MotionPresence></DropdownMenuPrimitive.Portal>
  )
}

/**
 * Renders an action row. `destructive` draws Arc's danger tone: danger text and icon over a faint danger fill when
 * highlighted.
 * @param props - Primitive properties, `inset` to align with rows that carry an icon, and the `variant`.
 * @returns The styled primitive with its original interaction contract.
 */
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item",
        menuItemClassName,
        menuItemDestructiveClassName,
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders a selectable checkbox action with its check at the end of the row. `destructive` draws Arc's danger tone.
 * @param props - Primitive properties, `inset` to align with rows that carry an icon, and the `variant`.
 * @returns The styled primitive with its original interaction contract.
 */
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(menuItemClassName, menuSelectableItemClassName, menuItemDestructiveClassName, className)}
      checked={checked}
      {...props}
    >
      <span
        className={menuItemIndicatorClassName}
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MotionSlot kind="item-check"><DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon strokeWidth={1.75} />
        </DropdownMenuPrimitive.ItemIndicator></MotionSlot>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

/**
 * Renders a mutually exclusive action with its check at the end of the row. `destructive` draws Arc's danger tone.
 * @param props - Primitive properties, `inset` to align with rows that carry an icon, and the `variant`.
 * @returns The styled primitive with its original interaction contract.
 */
function DropdownMenuRadioItem({
  className,
  children,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(menuItemClassName, menuSelectableItemClassName, menuItemDestructiveClassName, className)}
      {...props}
    >
      <span
        className={menuItemIndicatorClassName}
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MotionSlot kind="item-check"><DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon strokeWidth={1.75} />
        </DropdownMenuPrimitive.ItemIndicator></MotionSlot>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

/**
 * Renders a muted group label aligned with the item text.
 * @param props - Primitive properties and `inset` to align with rows that carry an icon.
 * @returns The styled primitive with its original interaction contract.
 */
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-[11px] py-1.5 text-xs font-medium text-text-muted data-inset:pl-[38px]",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border-subtle", className)}
      {...props}
    />
  )
}

/**
 * Renders trailing content at the end of a row, such as a shortcut or a count, muted until the row is highlighted.
 * @param props - Span properties.
 * @returns The trailing slot.
 */
function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto flex items-center text-xs text-text-muted group-data-highlighted/dropdown-menu-item:text-text-secondary",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
}
