"use client"

/**
 * Internal renderer of Arc's data-driven menu items (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md):
 * turns `DropdownItem` objects into action, link, checkbox and radio rows of the dropdown menu primitive, with Arc's
 * separators and danger tone. Shared by the public closed `DropdownMenu` and by composite components, such as
 * `AccountMenu` and `DataTable`, that take extra items from their consumers.
 */
import type { AriaAttributes, HTMLAttributeAnchorTarget, ReactNode } from "react"

import { Link } from "../link.js"
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "./dropdown-menu.js"

/** Extra attributes for one item row: `data-*` attributes and ARIA attributes such as `aria-current`. */
export type DropdownItemAttributes = AriaAttributes & {
  [attribute: `data-${string}`]: string | number | boolean | undefined
}

/** One row of a dropdown menu. */
export type DropdownItem = {
  /** Stable key. Defaults to `label` when it is a string, so keep string labels unique. */
  id?: string
  /** Visible text of the row. */
  label: ReactNode
  /** Called when the row is chosen. Call `event.preventDefault()` to keep the menu open. */
  onSelect?: (event: Event) => void
  /** Skipped by the keyboard and dimmed. */
  disabled?: boolean
  /** Leading icon. */
  icon?: ReactNode
  /** Draws Arc's danger tone; say what the action destroys in the label. */
  destructive?: boolean
  /** Draws a separator before the row, to group the items around it. */
  separatorBefore?: boolean
  /** Renders the row as a link through the provider's `Link`, so routers can navigate client-side. */
  href?: string
  /** Target of a link row. */
  target?: HTMLAttributeAnchorTarget
  /** Relationship of a link row, such as `noreferrer` for external pages. */
  rel?: string
  /** Renders the row as a checkbox with this state and its check at the end. */
  checked?: boolean
  /** Content at the end of the row, such as a shortcut or a count. */
  trailing?: ReactNode
  /** Value of the row inside a menu with `selection`; the row becomes a radio item. */
  value?: string
  /** Class added to the row. */
  className?: string
  /** Extra `data-*` and ARIA attributes of the row. */
  itemProps?: DropdownItemAttributes
}

/** Single selection of a menu: rows with a `value` render as radio items. */
export type DropdownMenuSelection = {
  value: string
  onValueChange: (value: string) => void
}

/**
 * Picks the key of a row: its id, its string label, or its position as a last resort.
 * @param item - The row.
 * @param index - Position of the row in the list.
 * @returns The React key.
 */
function keyOf(item: DropdownItem, index: number): string {
  if (item.id !== undefined) return item.id
  return typeof item.label === "string" ? item.label : String(index)
}

/**
 * Renders the body shared by every kind of row: icon, label and trailing content.
 * @param item - The row.
 * @returns The row body.
 */
function ItemBody({ item }: { item: DropdownItem }) {
  return (
    <>
      {item.icon}
      <span className="min-w-0 truncate">{item.label}</span>
      {item.trailing === undefined ? null : <DropdownMenuShortcut>{item.trailing}</DropdownMenuShortcut>}
    </>
  )
}

/**
 * Renders one row as a radio, checkbox, link or action item, depending on its fields.
 * @param props - The row and whether the menu has a single selection.
 * @returns The row.
 */
function ItemRow({ item, hasSelection }: { item: DropdownItem; hasSelection: boolean }) {
  const shared = {
    ...item.itemProps,
    className: item.className,
    disabled: item.disabled,
    onSelect: item.onSelect,
  }
  const variant = item.destructive ? "destructive" : "default"
  if (hasSelection && item.value !== undefined) {
    return (
      <DropdownMenuRadioItem {...shared} variant={variant} value={item.value}>
        <ItemBody item={item} />
      </DropdownMenuRadioItem>
    )
  }
  if (item.checked !== undefined) {
    return (
      <DropdownMenuCheckboxItem {...shared} variant={variant} checked={item.checked}>
        <ItemBody item={item} />
      </DropdownMenuCheckboxItem>
    )
  }
  if (item.href !== undefined) {
    return (
      <DropdownMenuItem {...shared} variant={variant} asChild>
        <Link href={item.href} target={item.target} rel={item.rel}>
          <ItemBody item={item} />
        </Link>
      </DropdownMenuItem>
    )
  }
  return (
    <DropdownMenuItem {...shared} variant={variant}>
      <ItemBody item={item} />
    </DropdownMenuItem>
  )
}

/**
 * Renders a list of rows inside a dropdown menu content, with the separators they ask for. With a `selection`, the
 * rows live in one radio group and the rows that carry a `value` become its radio items.
 * @param props - The rows and the optional single selection.
 * @returns The rows.
 */
export function DropdownMenuItems({ items, selection }: { items: DropdownItem[]; selection?: DropdownMenuSelection }) {
  const rows = items.flatMap((item, index) => {
    const key = keyOf(item, index)
    const row = <ItemRow key={key} item={item} hasSelection={selection !== undefined} />
    return item.separatorBefore && index > 0 ? [<DropdownMenuSeparator key={`${key}-separator`} />, row] : [row]
  })
  if (!selection) return <>{rows}</>
  return (
    <DropdownMenuRadioGroup value={selection.value} onValueChange={selection.onValueChange}>
      {rows}
    </DropdownMenuRadioGroup>
  )
}
