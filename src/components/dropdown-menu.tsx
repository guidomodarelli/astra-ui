"use client"

/**
 * Arc's Dropdown menu (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a labelled trigger that opens a
 * focused list of actions on Arc's raised panel, with item rows, danger tone, separators, a staggered item entrance
 * and a highlight that glides between items with the keyboard. It follows Arc's closed API: items are data, not
 * children. beez-ui adds a custom trigger, link, checkbox and radio rows, trailing content, and placement and open
 * state of the menu.
 */
import type { ReactElement, ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../lib/utils.js"
import { Button } from "./button.js"
import {
  DropdownMenu as DropdownMenuRoot,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./primitives/dropdown-menu.js"
import {
  DropdownMenuItems,
  type DropdownItem,
  type DropdownItemAttributes,
  type DropdownMenuSelection,
} from "./primitives/dropdown-menu-items.js"

/** Side of the trigger the menu prefers. */
export type DropdownMenuSide = "top" | "right" | "bottom" | "left"

/** Alignment of the menu against its trigger. */
export type DropdownMenuAlign = "start" | "center" | "end"

export type DropdownMenuProps = {
  /**
   * Text of the trigger Arc draws, and the accessible name of the menu. With a custom `trigger`, it only names the
   * menu.
   */
  label: string
  /** Rows of the menu, in order. */
  items: DropdownItem[]
  /** Leading icon of the trigger Arc draws. */
  icon?: ReactNode
  /**
   * Your own trigger, rendered with `asChild` instead of Arc's labelled button, such as an icon button with its own
   * `aria-label`. It must accept a ref and be focusable.
   */
  trigger?: ReactElement
  /** Single selection: rows with a `value` render as radio items checked against `selection.value`. */
  selection?: DropdownMenuSelection
  /** Preferred side of the trigger. Defaults to `bottom`. */
  side?: DropdownMenuSide
  /** Alignment against the trigger. Defaults to `start`. */
  align?: DropdownMenuAlign
  /** Class added to the menu panel. */
  contentClassName?: string
  /** Accessible name of the menu when it should differ from `label`. */
  contentLabel?: string
  /** Class added to the trigger Arc draws. */
  className?: string
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Blocks outside interaction and hides the rest of the page from assistive technology while open. Defaults to `true`. */
  modal?: boolean
}

/**
 * A focused list of actions anchored to a trigger.
 * @param props - The label, the items and optional trigger, selection, placement and open state.
 * @returns The trigger with its menu.
 */
function DropdownMenu({
  label,
  items,
  icon,
  trigger,
  selection,
  side,
  align,
  contentClassName,
  contentLabel,
  className,
  open,
  defaultOpen,
  onOpenChange,
  modal,
}: DropdownMenuProps) {
  return (
    <DropdownMenuRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} modal={modal}>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" className={cn("max-w-full", className)}>
            {icon}
            <span className="min-w-0 truncate">{label}</span>
            <ChevronDownIcon aria-hidden="true" strokeWidth={1.75} className="text-text-muted" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        className={contentClassName}
        aria-label={contentLabel ?? label}
        // The menu takes its name from `label`, not from whatever the trigger is called.
        aria-labelledby={undefined}
      >
        <DropdownMenuItems items={items} selection={selection} />
      </DropdownMenuContent>
    </DropdownMenuRoot>
  )
}

export { DropdownMenu }
export type { DropdownItem, DropdownItemAttributes, DropdownMenuSelection }
