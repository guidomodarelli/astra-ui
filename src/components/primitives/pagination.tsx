"use client";

/**
 * Internal composition behind Arc's Pagination (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): compact
 * page controls on Arc's tokens with tabular numbers, a current-page mark that glides to the newly selected page with
 * Arc's morph spring, hover only on fine pointers and arrows that press in. Each control is either a link rendered
 * through the provider's `Link` adapter (Next.js, TanStack Router or a native anchor) or a button. Not exported from
 * the package: the public `Pagination` in `../pagination.tsx` builds Arc's API on these parts.
 */
import type { ComponentProps, MouseEvent, ReactNode } from "react"
import { cva } from "class-variance-authority"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { usePrefersReducedMotion } from "../../hooks/use-prefers-reduced-motion.js"
import { cn } from "../../lib/utils.js"
import { useArcPress } from "../../motion/arc-press.js"
import { GlideSlot } from "../../motion/glide-slot.js"
import { useAttachedElement } from "../../motion/use-attached-element.js"
import { Link, type LinkProps } from "../link.js"

/**
 * Landmark that holds the page controls.
 * @param props - Native `nav` attributes; the caller names it with `aria-label`.
 * @returns The navigation landmark.
 */
function PaginationRoot({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

/** Lists page controls; the current page's mark glides to the newly selected page. */
function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return (
    <GlideSlot preset="pagination">
      <ul
        data-slot="pagination-content"
        className={cn("flex flex-wrap items-center gap-(--space-1)", className)}
        {...props}
      />
    </GlideSlot>
  )
}

function PaginationItem({ ...props }: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

/**
 * Arc's page control: a control-height square for numbers, padded for labelled arrows. The current page draws the
 * raised mark (border, surface and resting shadow) that the glide copies while it travels.
 */
const paginationControlVariants = cva(
  "relative inline-flex h-(--control-height-sm) min-w-(--control-height-sm) shrink-0 cursor-pointer items-center justify-center gap-1 rounded-(--radius-control) border border-transparent bg-transparent font-sans text-xs font-medium whitespace-nowrap text-text-secondary tabular-nums no-underline [-webkit-tap-highlight-color:transparent] transition-[color,background-color,border-color,box-shadow,opacity] duration-(--duration-fast) ease-(--ease-standard) select-none motion-reduce:transition-none hover-fine:bg-surface-muted hover-fine:text-foreground aria-[current=page]:border-border aria-[current=page]:bg-surface aria-[current=page]:text-foreground aria-[current=page]:shadow-(--shadow-resting) aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        page: "px-0",
        step: "px-(--space-3)",
      },
    },
    defaultVariants: {
      size: "page",
    },
  }
)

/** Size of a control: a square page number or a padded arrow with a label. */
type PaginationControlSize = "page" | "step"

/** State shared by page links and page buttons. */
type PaginationControlState = {
  /** Marks the current page with `aria-current="page"`. */
  isActive?: boolean
  /** Keeps the control visible and focusable but never acting, with `aria-disabled`. */
  disabled?: boolean
  size?: PaginationControlSize
}

/**
 * Builds the attributes common to every control.
 * @param state - Whether the control is current or disabled, and its size.
 * @param className - Consumer classes.
 * @returns Attributes for the link or the button.
 */
function controlAttributes({ isActive, disabled, size = "page" }: PaginationControlState, className?: string) {
  return {
    "aria-current": isActive ? ("page" as const) : undefined,
    "aria-disabled": disabled ? true : undefined,
    "data-slot": "pagination-link",
    "data-active": isActive,
    "data-size": size,
    className: cn(paginationControlVariants({ size }), className),
  }
}

/**
 * Wraps a click handler so a disabled control cancels the click before the native anchor, the router adapter (both
 * skip prevented clicks) or the consumer acts on it.
 * @param disabled - Whether the control is disabled.
 * @param onClick - Consumer click handler.
 * @returns The guarded handler.
 */
function guardDisabledClick<Element extends HTMLElement>(
  disabled: boolean | undefined,
  onClick: ((event: MouseEvent<Element>) => void) | undefined
) {
  return (event: MouseEvent<Element>) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }
}

/** Props of a page link: the provider's `Link` props plus the control state. */
type PaginationLinkProps = PaginationControlState & LinkProps

/**
 * One page, rendered through the provider's `Link` adapter or the `component` passed to it. Disabled, it never
 * navigates, whether clicked or activated with Enter, and `onClick` is not called.
 * @param props - Control state and link props.
 * @returns The page link.
 */
function PaginationLink({ className, isActive, disabled, size, onClick, ...props }: PaginationLinkProps) {
  return (
    <Link
      {...controlAttributes({ isActive, disabled, size }, className)}
      {...props}
      onClick={guardDisabledClick(disabled, onClick)}
    />
  )
}

/** Props of a page button: native button props plus the control state. */
type PaginationButtonProps = PaginationControlState & Omit<ComponentProps<"button">, "disabled">

/**
 * One page as a button, for pagination kept in state. Disabled, it stays focusable and `onClick` is not called.
 * @param props - Control state and button props.
 * @returns The page button.
 */
function PaginationButton({ className, isActive, disabled, size, onClick, type = "button", ...props }: PaginationButtonProps) {
  return (
    <button
      type={type}
      {...controlAttributes({ isActive, disabled, size }, className)}
      {...props}
      onClick={guardDisabledClick(disabled, onClick)}
    />
  )
}

/** Props of a previous or next arrow. */
type PaginationStepProps = {
  direction: "previous" | "next"
  /** Visible label, hidden on small screens. */
  text: ReactNode
  /** Accessible name of the arrow. */
  label: string
  /** Renders a link to this address; without it the arrow is a button. */
  href?: string
  disabled?: boolean
  onClick?: () => void
}

/**
 * A previous or next arrow: Arc presses it in, while page numbers stay still and let the mark travel.
 * @param props - Direction, copy, destination and state.
 * @returns The arrow link or button.
 */
function PaginationStep({ direction, text, label, href, disabled, onClick }: PaginationStepProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [element, attach] = useAttachedElement<HTMLElement>(undefined)
  useArcPress(element, !reduceMotion)
  const content =
    direction === "previous" ? (
      <>
        <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
        <span className="hidden sm:block">{text}</span>
      </>
    ) : (
      <>
        <span className="hidden sm:block">{text}</span>
        <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
      </>
    )
  const className = direction === "previous" ? "pl-(--space-2)" : "pr-(--space-2)"
  return href === undefined ? (
    <PaginationButton
      ref={attach}
      size="step"
      aria-label={label}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </PaginationButton>
  ) : (
    <PaginationLink
      ref={attach}
      size="step"
      href={href}
      aria-label={label}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </PaginationLink>
  )
}

export { PaginationButton, PaginationContent, PaginationItem, PaginationLink, PaginationRoot, PaginationStep }
