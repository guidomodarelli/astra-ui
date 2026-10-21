/**
 * Lists on Arc's type rules (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): Inter with body tracking and
 * leading, items 8px apart on Arc's 4px grid, and markers in the muted colour so the content leads. Ordered markers
 * use tabular figures so the numbers align.
 * Free of client hooks, so it also renders in Server Components.
 */
import type { ComponentProps } from "react"

import {
  ORDERED_LIST_DEFAULT_TYPE,
  ORDERED_LIST_MARKER_CLASS_NAMES,
  type ListMarker,
} from "../constants/typography.js"
import { cn } from "../lib/utils.js"

export type { ListMarker }

/** Inter at 16px with Arc's body tracking and leading. */
const listTextClassName =
  "m-0 font-(family-name:--font-body) text-(length:--text-base) leading-(--leading-body) tracking-(--tracking-body) text-foreground"

/** Vertical rhythm between items and the muted marker shared by both list kinds. */
const listLayoutClassName = "flex flex-col gap-(--space-2) marker:text-text-muted"

export type ListProps = ComponentProps<"ul"> & {
  /** `disc` (default) shows Arc's muted bullet; `none` keeps the list semantics with no marker or indent. */
  marker?: ListMarker
}

/**
 * An unordered list.
 * @param props - Marker style and native `ul` attributes.
 * @returns The list.
 */
function List({ marker = "disc", className, ...props }: ListProps) {
  return (
    <ul
      data-slot="list"
      data-marker={marker}
      className={cn(
        listTextClassName,
        listLayoutClassName,
        marker === "disc" ? "list-disc ps-(--space-5)" : "list-none ps-0",
        className
      )}
      {...props}
    />
  )
}

export type OrderedListProps = ComponentProps<"ol">

/**
 * An ordered list, with decimal markers by default. Supports the native `start`, `reversed` and `type` attributes;
 * `type` also picks the marker style (`a`, `A`, `i` or `I`).
 * @param props - Native `ol` attributes.
 * @returns The list.
 */
function OrderedList({ type, className, ...props }: OrderedListProps) {
  return (
    <ol
      data-slot="ordered-list"
      type={type}
      className={cn(
        listTextClassName,
        listLayoutClassName,
        ORDERED_LIST_MARKER_CLASS_NAMES[type ?? ORDERED_LIST_DEFAULT_TYPE],
        "ps-(--space-6) marker:tabular-nums",
        className
      )}
      {...props}
    />
  )
}

export type ListItemProps = ComponentProps<"li">

/**
 * An item of `List` or `OrderedList`. Nested lists sit 8px below the item's text.
 * @param props - Native `li` attributes.
 * @returns The list item.
 */
function ListItem({ className, ...props }: ListItemProps) {
  return (
    <li
      data-slot="list-item"
      className={cn("ps-(--space-1) text-pretty [&>ol]:mt-(--space-2) [&>ul]:mt-(--space-2)", className)}
      {...props}
    />
  )
}

export type DescriptionListProps = ComponentProps<"dl">

/**
 * A list of terms and their descriptions, such as metadata or a glossary. Groups of terms and descriptions are 16px
 * apart; wrap each pair in a `div` to keep them together.
 * @param props - Native `dl` attributes.
 * @returns The description list.
 */
function DescriptionList({ className, ...props }: DescriptionListProps) {
  return (
    <dl
      data-slot="description-list"
      className={cn(
        listTextClassName,
        "grid gap-(--space-1) [&>div]:grid [&>div]:gap-(--space-1) [&>div+div]:mt-(--space-3) [&>dd+dt]:mt-(--space-3)",
        className
      )}
      {...props}
    />
  )
}

export type DescriptionTermProps = ComponentProps<"dt">

/**
 * A term of a `DescriptionList`, at Arc's medium weight.
 * @param props - Native `dt` attributes.
 * @returns The term.
 */
function DescriptionTerm({ className, ...props }: DescriptionTermProps) {
  return <dt data-slot="description-term" className={cn("font-medium text-foreground", className)} {...props} />
}

export type DescriptionDetailsProps = ComponentProps<"dd">

/**
 * The description of the preceding term, in the secondary colour.
 * @param props - Native `dd` attributes.
 * @returns The description.
 */
function DescriptionDetails({ className, ...props }: DescriptionDetailsProps) {
  return (
    <dd data-slot="description-details" className={cn("m-0 text-pretty text-text-secondary", className)} {...props} />
  )
}

export { List, OrderedList, ListItem, DescriptionList, DescriptionTerm, DescriptionDetails }
