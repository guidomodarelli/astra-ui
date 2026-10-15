"use client";

/**
 * Arc's Pagination (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): compact page controls on Arc's
 * tokens with tabular numbers, a current-page mark that glides to the newly selected page with Arc's morph spring,
 * hover only on fine pointers and arrows that press in. Unlike Arc's stateful component it stays composable: every
 * page is a link rendered through the provider's `Link` adapter (Next.js, TanStack Router or a native anchor).
 */
import type { ComponentProps, Ref } from "react"
import { cva } from "class-variance-authority"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

import { PAGINATION_DEFAULT_COPY } from "../constants/pagination.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { useArcPress } from "../motion/arc-press.js"
import { GlideSlot } from "../motion/glide-slot.js"
import { useAttachedElement } from "../motion/use-attached-element.js"
import type { ControlButton } from "./control-button.js"
import { Link, type LinkProps } from "./link.js"

/**
 * Landmark that holds the page controls.
 * @param props - Native `nav` attributes; `aria-label` defaults to Spanish copy.
 * @returns The navigation landmark.
 */
function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label={PAGINATION_DEFAULT_COPY.navigationLabel}
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

/** Lists page links; the current page's mark glides to the newly selected page. */
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
const paginationLinkVariants = cva(
  "relative inline-flex h-(--control-height-sm) min-w-(--control-height-sm) shrink-0 cursor-pointer items-center justify-center gap-1 rounded-(--radius-control) border border-transparent bg-transparent font-sans text-xs font-medium whitespace-nowrap text-text-secondary tabular-nums no-underline [-webkit-tap-highlight-color:transparent] transition-[color,background-color,border-color,box-shadow,opacity] duration-(--duration-fast) ease-(--ease-standard) select-none motion-reduce:transition-none hover-fine:bg-surface-muted hover-fine:text-foreground aria-[current=page]:border-border aria-[current=page]:bg-surface aria-[current=page]:text-foreground aria-[current=page]:shadow-(--shadow-resting) aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        default: "px-(--space-3)",
        xs: "px-(--space-2)",
        sm: "px-(--space-2)",
        lg: "px-(--space-4)",
        icon: "px-0",
        "icon-xs": "px-0",
        "icon-sm": "px-0",
        "icon-lg": "px-0",
      },
    },
    defaultVariants: {
      size: "icon",
    },
  }
)

export type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ComponentProps<typeof ControlButton>, "size"> &
  LinkProps

/**
 * One page, rendered through the provider's `Link` adapter or the `component` passed to it.
 * @param props - `isActive` marks the current page (`aria-current="page"`); `size` keeps the previous size names
 *   and only changes the horizontal padding; every other prop reaches the link.
 * @returns The page link.
 */
function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      data-size={size}
      className={cn(paginationLinkVariants({ size }), className)}
      {...props}
    />
  )
}

/** Previous and next links accept an optional visible label, hidden on small screens. */
type PaginationStepProps = PaginationLinkProps & { text?: string }

/** A previous or next arrow: Arc presses it in, while page numbers stay still and let the mark travel. */
function PaginationStep({ ref, ...props }: PaginationLinkProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [element, attach] = useAttachedElement<HTMLAnchorElement>(ref as Ref<HTMLAnchorElement> | undefined)
  useArcPress(element, !reduceMotion)
  return <PaginationLink ref={attach} size="default" {...props} />
}

function PaginationPrevious({
  className,
  text = PAGINATION_DEFAULT_COPY.previousText,
  ...props
}: PaginationStepProps) {
  return (
    <PaginationStep
      aria-label={PAGINATION_DEFAULT_COPY.previousLabel}
      className={cn("pl-(--space-2)", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
      <span className="hidden sm:block">{text}</span>
    </PaginationStep>
  )
}

function PaginationNext({
  className,
  text = PAGINATION_DEFAULT_COPY.nextText,
  ...props
}: PaginationStepProps) {
  return (
    <PaginationStep
      aria-label={PAGINATION_DEFAULT_COPY.nextLabel}
      className={cn("pr-(--space-2)", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
    </PaginationStep>
  )
}

function PaginationEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-(--control-height-sm) items-center justify-center text-text-muted [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">{PAGINATION_DEFAULT_COPY.morePages}</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
