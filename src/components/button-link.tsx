"use client"

/**
 * Navigation that looks like Arc's Button (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): the
 * provider's `Link`, so it routes through the configured adapter, with the button recipe. A link stays a link for
 * assistive technology and the browser (it opens in a new tab, it can be copied), which a `Button` cannot.
 */
import { cn } from "../lib/utils.js"
import { buttonClassName, type ButtonSize, type ButtonVariant } from "./button-recipe.js"
import { Link, type LinkProps } from "./link.js"

export type ButtonLinkProps = LinkProps & {
  /** Visual weight, as in `Button`. Defaults to `primary`. */
  variant?: ButtonVariant
  /** Height and padding, as in `Button`. Defaults to `md`. */
  size?: ButtonSize
}

/**
 * A link styled as a button, such as "Volver al inicio" on an error page.
 * @param props - Variant, size and every `Link` prop, including `href`, `prefetch` and `component`.
 * @returns The link.
 */
function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return (
    <Link
      data-slot="button-link"
      data-variant={variant}
      data-size={size}
      {...props}
      className={cn(buttonClassName({ variant, size }), className)}
    />
  )
}

export { ButtonLink }
