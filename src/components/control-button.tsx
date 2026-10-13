"use client"

/**
 * Internal compact control for composite components (dialog close buttons, carousel and pagination arrows, calendar
 * cells, table and editor actions) that need icon sizes, a link variant or `asChild`, which the public Arc `Button`
 * leaves out. Keeps Arc's press feedback and label motion (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md).
 * Not exported from the package: consumers use `Button`.
 */
import { Children, cloneElement, isValidElement } from "react"
import type { ComponentProps, MouseEvent, ReactElement, ReactNode, Ref } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { useIsPresent } from "motion/react"

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { useArcPress } from "../motion/arc-press.js"
import { useAttachedElement } from "../motion/use-attached-element.js"
import { ButtonLabel } from "./button-label.js"
import { LEAVING_ATTRIBUTES, LOADING_INERT_HANDLERS } from "./button-interaction.js"

/**
 * Class recipe. Press scale is driven by Motion alone, so `transform` never gets a CSS transition,
 * and anchors of floating layers never scale because Radix measures them on pointerdown.
 */
const controlButtonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none [-webkit-tap-highlight-color:transparent] transition-[color,background-color,border-color,opacity,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 motion-reduce:transition-none dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&:is([aria-haspopup]:not([aria-haspopup=false]),[data-state],[role=combobox])]:transform-none! [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-foreground text-background hover:not-disabled:opacity-90 hover:not-disabled:shadow-xs active:not-disabled:opacity-85",
        outline:
          "border-border bg-background text-foreground hover:not-disabled:bg-muted hover:not-disabled:shadow-xs active:not-disabled:bg-muted aria-expanded:bg-muted disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100",
        secondary:
          "bg-muted text-foreground hover:not-disabled:bg-muted/70 active:not-disabled:bg-muted/70 aria-expanded:bg-muted/70",
        ghost:
          "text-muted-foreground hover:not-disabled:bg-muted hover:not-disabled:text-foreground active:not-disabled:bg-muted active:not-disabled:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground disabled:text-muted-foreground/60 disabled:opacity-100",
        destructive:
          "border-border bg-background text-destructive hover:not-disabled:border-destructive hover:not-disabled:bg-muted active:not-disabled:border-destructive active:not-disabled:bg-muted focus-visible:border-destructive/40 focus-visible:ring-destructive/20 disabled:bg-muted disabled:text-destructive/55 disabled:opacity-100 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type SlottableChildProps = {
  children?: ReactNode
  onClick?: (event: MouseEvent<HTMLElement>) => void
  onPointerDown?: unknown
  onKeyDown?: unknown
}

/**
 * Wraps the content of an `asChild` element in the Arc label, so links morph and spin like buttons.
 * While loading, the child's own activation handlers are dropped too, because Slot runs them before ours.
 * Children given as render functions keep their content untouched.
 */
function withArcLabel(
  children: ReactNode,
  loading: boolean,
  renderLabel: (content: ReactNode) => ReactNode,
): ReactNode {
  const child = Children.only(children)
  if (!isValidElement<SlottableChildProps>(child)) return child
  const content = child.props.children
  const overrides = loading ? LOADING_INERT_HANDLERS : undefined
  const label = typeof content === "function" ? content : renderLabel(content)
  return cloneElement(child as ReactElement<SlottableChildProps>, overrides, label)
}

function ControlButton({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  children,
  ref,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof controlButtonVariants> & {
    asChild?: boolean
    /** Shows a spinner, sets `aria-busy` and swallows clicks while keeping keyboard focus. */
    loading?: boolean
  }) {
  const reduceMotion = usePrefersReducedMotion()
  const isPresent = useIsPresent()
  const [element, attach] = useAttachedElement<HTMLElement>(ref as Ref<HTMLElement> | undefined)
  useArcPress(element, !reduceMotion && variant !== "link")

  const renderLabel = (content: ReactNode) => (
    <ButtonLabel loading={loading} reduceMotion={reduceMotion}>
      {content}
    </ButtonLabel>
  )
  const sharedProps = {
    "data-slot": "button",
    "data-variant": variant,
    "data-size": size,
    className: cn(controlButtonVariants({ variant, size, className })),
    "aria-busy": loading || undefined,
    ...props,
    "aria-disabled": loading || props["aria-disabled"] || undefined,
    ...(loading ? LOADING_INERT_HANDLERS : undefined),
    ...(isPresent ? undefined : LEAVING_ATTRIBUTES),
  }

  if (asChild) {
    return (
      <Slot.Root ref={attach} {...(sharedProps as ComponentProps<typeof Slot.Root>)}>
        {withArcLabel(children, loading, renderLabel)}
      </Slot.Root>
    )
  }

  return (
    <ButtonPrimitive ref={attach} {...(sharedProps as ButtonPrimitive.Props)}>
      {renderLabel(children)}
    </ButtonPrimitive>
  )
}

export { ControlButton, controlButtonVariants }
