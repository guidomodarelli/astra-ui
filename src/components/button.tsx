"use client"

/**
 * Arc's Button (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): its variants, sizes, tokens and motion,
 * with width-aware press feedback, a label that springs to its new width and a loading spinner. It renders a native
 * button: navigation that looks like a button is a `ButtonLink`, and other elements take `buttonClassName`. Composite components that need icon sizes use the internal `ControlButton`.
 */
import type { ComponentProps, Ref } from "react"
import { cva } from "class-variance-authority"
import { useIsPresent } from "motion/react"

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { useArcPress } from "../motion/arc-press.js"
import { useAttachedElement } from "../motion/use-attached-element.js"
import { ButtonLabel } from "./button-label.js"
import { LEAVING_ATTRIBUTES, LOADING_INERT_HANDLERS } from "./button-interaction.js"

/** Visual weight, as in Arc: one primary action per surface. */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"

/** Height and padding, from Arc's control heights. */
export type ButtonSize = "sm" | "md" | "lg"

/**
 * Arc's button recipe on its tokens. Press scale is driven by Motion alone, so `transform` never gets a CSS
 * transition, and anchors of floating layers never scale because Radix measures them on pointerdown. Keyboard focus
 * uses the foundation's shared outline; pointer focus draws no ring.
 */
const buttonVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-(--radius-control) border border-transparent px-4 font-sans text-sm leading-(--leading-body) font-medium whitespace-nowrap select-none [-webkit-tap-highlight-color:transparent] transition-[color,background-color,border-color,opacity,box-shadow] duration-(--duration-fast) ease-(--ease-standard) disabled:cursor-not-allowed disabled:opacity-[.52] aria-busy:cursor-progress motion-reduce:transition-none [&:is([aria-haspopup]:not([aria-haspopup=false]),[data-state],[role=combobox])]:transform-none! [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "border-foreground bg-foreground text-background hover-fine:not-disabled:opacity-[.91] hover-fine:not-disabled:shadow-(--shadow-resting) active:not-disabled:opacity-[.84]",
        secondary:
          "border-border bg-surface text-foreground hover-fine:not-disabled:bg-surface-muted hover-fine:not-disabled:shadow-(--shadow-resting) active:not-disabled:bg-surface-muted disabled:bg-surface-muted disabled:text-text-muted disabled:opacity-100",
        ghost:
          "bg-transparent text-text-secondary hover-fine:not-disabled:bg-surface-muted hover-fine:not-disabled:text-foreground active:not-disabled:bg-surface-muted active:not-disabled:text-foreground disabled:text-text-muted disabled:opacity-100",
        danger:
          "border-border bg-surface text-danger hover-fine:not-disabled:border-danger hover-fine:not-disabled:bg-surface-muted active:not-disabled:border-danger active:not-disabled:bg-surface-muted disabled:bg-surface-muted disabled:text-[color-mix(in_oklab,var(--danger)_55%,var(--surface-muted))] disabled:opacity-100",
      },
      size: {
        sm: "min-h-(--control-height-sm) px-3",
        md: "min-h-(--control-height-md)",
        lg: "min-h-(--control-height-lg) px-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

/** Options of {@link buttonClassName}. */
export type ButtonClassNameOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Extra classes merged after the recipe, so they win on conflicts. */
  className?: string
}

/**
 * Arc's button classes for an element that is not a `Button`, such as a `<label>` that opens a file picker. Links
 * use {@link ButtonLink} instead. The press scale and the loading label are effects of `Button` and are not included.
 * @param options - Variant, size and extra classes. Defaults to `primary` and `md`.
 * @returns The class list.
 */
function buttonClassName({ variant = "primary", size = "md", className }: ButtonClassNameOptions = {}) {
  return cn(buttonVariants({ variant, size, className }))
}

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner, sets `aria-busy` and swallows clicks while keeping keyboard focus. */
  loading?: boolean
}

/**
 * A single action on a page, form or dialog. Defaults to `type="button"`, so it only submits a form when asked to.
 * @param props - Variant, size, loading state and native button attributes, including `ref`.
 * @returns The native button.
 */
function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  type = "button",
  children,
  ref,
  ...props
}: ButtonProps) {
  const reduceMotion = usePrefersReducedMotion()
  const isPresent = useIsPresent()
  const [element, attach] = useAttachedElement<HTMLButtonElement>(ref as Ref<HTMLButtonElement> | undefined)
  useArcPress(element, !reduceMotion)

  return (
    <button
      ref={attach}
      type={type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      aria-busy={loading || undefined}
      {...props}
      aria-disabled={loading || props["aria-disabled"] || undefined}
      {...(loading ? LOADING_INERT_HANDLERS : undefined)}
      {...(isPresent ? undefined : LEAVING_ATTRIBUTES)}
    >
      <ButtonLabel loading={loading} reduceMotion={reduceMotion}>
        {children}
      </ButtonLabel>
    </button>
  )
}

export { Button, buttonClassName }
