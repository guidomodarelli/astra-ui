"use client"

/**
 * Arc's Badge (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a small pill for status, category or
 * metadata on Arc's tones and tokens. A new text label rises in while the pill springs to its new width, and a new
 * icon crossfades in place. The shadcn variants are kept and mapped onto Arc's tones.
 */
import { isValidElement, useRef } from "react"
import type { ComponentProps, ReactNode } from "react"
import { cva } from "class-variance-authority"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import type { HTMLMotionProps, TargetAndTransition, Transition } from "motion/react"
import { Slot } from "radix-ui"

import { BADGE_LABEL_OFFSET_EM } from "../constants/badge.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE } from "../motion/arc-tokens.js"
import {
  ARC_ICON_ENTER,
  ARC_ICON_EXIT,
  ARC_ICON_TRANSITION,
  ARC_REDUCED_EXIT,
  ARC_REDUCED_TRANSITION,
  ARC_SWAP_EXIT_TRANSITION,
  ARC_SWAP_REST,
} from "../motion/arc-swap.js"
import { MotionSlot } from "../motion/motion-slot.js"
import { useMorphWidth } from "../motion/use-morph-width.js"

/** shadcn-compatible visual variants, each drawn with one of Arc's tones. */
export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

/** Arc's semantic tones; a `tone` wins over the tone implied by `variant`. */
export type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger"

/** Arc's badge heights: 26px (`md`) and 22px (`sm`). */
export type BadgeSize = "sm" | "md"

/** The Arc tone each shadcn variant is drawn with when no explicit `tone` is passed. */
const VARIANT_TONE = {
  default: "info",
  secondary: "neutral",
  destructive: "danger",
  outline: "neutral",
  ghost: "neutral",
  link: "info",
} as const satisfies Record<BadgeVariant, BadgeTone>

/**
 * Arc's badge recipe. Each tone sets the pill's colour roles as custom properties, so hover can mix the tone into the
 * border and fill; variants only adjust the fill and border afterwards. Hover answers on fine pointers only.
 */
const badgeRecipe = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-clip rounded-(--radius-pill) border border-(--badge-border) bg-(--badge-background) leading-none font-medium tracking-[-.01em] whitespace-nowrap text-(--badge-foreground) transition-[border-color,background-color,color] duration-(--duration-standard) ease-(--ease-standard) motion-reduce:duration-(--duration-instant) hover-fine:border-[color-mix(in_oklab,var(--badge-color)_32%,var(--border))] hover-fine:bg-[color-mix(in_oklab,var(--badge-color)_10%,var(--surface))] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-danger [&>svg]:pointer-events-none [&>svg]:size-3! [&>svg]:text-(--badge-color)",
  {
    variants: {
      tone: {
        neutral:
          "[--badge-background:var(--surface-muted)] [--badge-border:var(--border)] [--badge-color:var(--text-secondary)] [--badge-foreground:var(--text-secondary)]",
        success:
          "[--badge-background:color-mix(in_oklab,var(--success)_10%,var(--surface))] [--badge-border:color-mix(in_oklab,var(--success)_25%,var(--border))] [--badge-color:var(--success)] [--badge-foreground:var(--success)]",
        info: "[--badge-background:var(--accent-subtle)] [--badge-border:color-mix(in_oklab,var(--accent)_24%,var(--border))] [--badge-color:var(--accent)] [--badge-foreground:var(--accent-strong)]",
        warning:
          "[--badge-background:color-mix(in_oklab,var(--warning)_11%,var(--surface))] [--badge-border:color-mix(in_oklab,var(--warning)_27%,var(--border))] [--badge-color:var(--warning)] [--badge-foreground:var(--warning)]",
        danger:
          "[--badge-background:color-mix(in_oklab,var(--danger)_10%,var(--surface))] [--badge-border:color-mix(in_oklab,var(--danger)_26%,var(--border))] [--badge-color:var(--danger)] [--badge-foreground:var(--danger)]",
      },
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "[--badge-background:var(--surface)] [--badge-foreground:var(--foreground)]",
        ghost: "[--badge-background:transparent] [--badge-border:transparent]",
        link: "[--badge-background:transparent] [--badge-border:transparent] underline-offset-4 hover-fine:border-transparent hover-fine:bg-transparent hover-fine:underline",
      },
      size: {
        sm: "min-h-[22px] gap-1 px-2 text-[11px]",
        md: "min-h-[26px] gap-[5px] px-2.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

/** Options of `badgeVariants`, for styling links or other elements as badges. */
export type BadgeVariantsOptions = {
  variant?: BadgeVariant | null
  tone?: BadgeTone | null
  size?: BadgeSize | null
  className?: string
}

/**
 * Arc's badge classes for any element. Without a `tone`, the tone implied by `variant` is used, as in `Badge`.
 * @param options - Variant, tone, size and extra classes.
 * @returns The class list.
 */
function badgeVariants({ variant, tone, size, className }: BadgeVariantsOptions = {}): string {
  return cn(badgeRecipe({ tone: tone ?? VARIANT_TONE[variant ?? "default"], variant, size }), className)
}

/** A new label rises out of a soft blur; the old one lifts away faster. */
const labelEnter: TargetAndTransition = {
  opacity: 0,
  y: `${BADGE_LABEL_OFFSET_EM.enter}em`,
  filter: `blur(${ARC_BLUR.soft}px)`,
}
const labelExit: TargetAndTransition = {
  opacity: 0,
  y: `${BADGE_LABEL_OFFSET_EM.exit}em`,
  filter: `blur(${ARC_BLUR.subtle}px)`,
  transition: ARC_SWAP_EXIT_TRANSITION,
}
const labelTransition: Transition = { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] }
const reducedEnter: TargetAndTransition = { opacity: 0 }

/** Outgoing copies are hidden from assistive technology while they fade, so only the current one is read. */
function BadgeSwap(props: HTMLMotionProps<"span">) {
  const isPresent = useIsPresent()
  return <motion.span {...props} aria-hidden={isPresent ? props["aria-hidden"] : true} />
}

/** Keys an icon by its component, so a new icon crossfades in while re-rendering the same icon stays still. */
function getIconKey(icon: ReactNode): string {
  if (!isValidElement(icon)) return "icon"
  const iconType = icon.type as string | { displayName?: string; name?: string }
  return typeof iconType === "string" ? iconType : (iconType.displayName ?? iconType.name ?? "icon")
}

type BadgeContentProps = {
  icon?: ReactNode
  label: string
  reduceMotion: boolean
}

/** Arc's swapping content: the icon and text change in place while the pill springs to the new width. */
function BadgeContent({ icon, label, reduceMotion }: BadgeContentProps) {
  const contentRef = useRef<HTMLSpanElement>(null)
  const iconKey = icon ? getIconKey(icon) : ""
  const width = useMorphWidth(contentRef, `${iconKey}\n${label}`, reduceMotion)
  return (
    <motion.span data-slot="badge-content" className="block gap-[inherit] data-morphing:overflow-clip" style={{ width }}>
      <span ref={contentRef} className="relative inline-flex w-max items-center gap-[inherit]">
        {icon ? <BadgeIcon icon={icon} iconKey={iconKey} reduceMotion={reduceMotion} /> : null}
        <span className="relative inline-flex items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <BadgeSwap
              key={label}
              className="block"
              initial={reduceMotion ? reducedEnter : labelEnter}
              animate={ARC_SWAP_REST}
              exit={reduceMotion ? ARC_REDUCED_EXIT : labelExit}
              transition={reduceMotion ? ARC_REDUCED_TRANSITION : labelTransition}
            >
              {label}
            </BadgeSwap>
          </AnimatePresence>
        </span>
      </span>
    </motion.span>
  )
}

type BadgeIconProps = {
  icon: ReactNode
  iconKey: string
  reduceMotion: boolean
}

/** The leading icon, tinted with the tone; a different icon component crossfades in. */
function BadgeIcon({ icon, iconKey, reduceMotion }: BadgeIconProps) {
  return (
    <span
      data-slot="badge-icon"
      aria-hidden="true"
      className="relative inline-flex flex-none items-center justify-center leading-none text-(--badge-color) [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <BadgeSwap
          key={iconKey}
          className="relative inline-flex items-center"
          initial={reduceMotion ? reducedEnter : ARC_ICON_ENTER}
          animate={ARC_SWAP_REST}
          exit={reduceMotion ? ARC_REDUCED_EXIT : ARC_ICON_EXIT}
          transition={reduceMotion ? ARC_REDUCED_TRANSITION : ARC_ICON_TRANSITION}
        >
          {icon}
        </BadgeSwap>
      </AnimatePresence>
    </span>
  )
}

export type BadgeProps = ComponentProps<"span"> & {
  /** shadcn-compatible variant, drawn with an Arc tone: default (info), secondary, outline and ghost (neutral),
   * destructive (danger) and link (info, underlined on hover). */
  variant?: BadgeVariant | null
  /** Arc's semantic tone; overrides the tone implied by `variant`. */
  tone?: BadgeTone
  /** Arc's height: `md` (26px, default) or `sm` (22px). */
  size?: BadgeSize
  /** A leading icon tinted with the tone, hidden from assistive technology. */
  icon?: ReactNode
  /** Renders the child element instead of a span, merging the badge props into it. Text and icon swaps are off. */
  asChild?: boolean
}

/**
 * A small label for status, category or metadata. Text children swap in place with Arc's motion and the pill springs
 * to the new width; other children render as they are.
 * @param props - Variant, tone, size, optional icon and native span attributes.
 * @returns The badge.
 */
function Badge({
  className,
  variant = "default",
  tone,
  size = "md",
  icon,
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  const reduceMotion = usePrefersReducedMotion()
  const resolvedVariant = variant ?? "default"
  const resolvedTone = tone ?? VARIANT_TONE[resolvedVariant]
  const label = typeof children === "string" || typeof children === "number" ? String(children) : null
  const Component = asChild ? Slot.Root : "span"
  const content = asChild ? (
    children
  ) : label === null ? (
    <>
      {icon ? <BadgeIcon icon={icon} iconKey={getIconKey(icon)} reduceMotion={reduceMotion} /> : null}
      {children}
    </>
  ) : (
    <BadgeContent icon={icon} label={label} reduceMotion={reduceMotion} />
  )

  return (
    <MotionSlot kind="fade">
      <Component
        data-slot="badge"
        data-variant={resolvedVariant}
        data-tone={resolvedTone}
        data-size={size}
        className={badgeVariants({ tone: resolvedTone, variant: resolvedVariant, size, className })}
        {...props}
      >
        {content}
      </Component>
    </MotionSlot>
  )
}

export { Badge, badgeVariants }
