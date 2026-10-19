"use client"

/**
 * Arc's Button (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): its variants, sizes, tokens and motion,
 * with width-aware press feedback, a label that springs to its new width and a loading spinner. It renders a native
 * button: navigation that looks like a button is a `ButtonLink`, and other elements take `buttonClassName`. Composite components that need icon sizes use the internal `ControlButton`.
 */
import type { ComponentProps, Ref } from "react"
import { useIsPresent } from "motion/react"

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-recipe.js"
import { useArcPress } from "../motion/arc-press.js"
import { useAttachedElement } from "../motion/use-attached-element.js"
import { ButtonLabel } from "./button-label.js"
import { LEAVING_ATTRIBUTES, LOADING_INERT_HANDLERS } from "./button-interaction.js"

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

export { Button }
// Types only: the runtime helper `buttonClassName` is exported from the server-safe recipe module.
export type { ButtonSize, ButtonVariant } from "./button-recipe.js"
