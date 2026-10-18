"use client"

/**
 * Arc's Badge (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a small pill for status, category or
 * metadata on Arc's tones and tokens. A new text label rises in while the pill springs to its new width, and a new
 * icon crossfades in place. The API is Arc's: `tone`, `size`, `icon` and `children`.
 */
import { isValidElement, useRef } from "react"
import type { ComponentProps, ReactNode } from "react"
import { cva } from "class-variance-authority"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import type { HTMLMotionProps, TargetAndTransition, Transition } from "motion/react"

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
import { useMorphWidth } from "../motion/use-morph-width.js"

/** Arc's semantic tones. */
export type BadgeTone = "neutral" | "success" | "info" | "warning" | "danger"

/** Arc's badge heights: 26px (`md`) and 22px (`sm`). */
export type BadgeSize = "sm" | "md"

/**
 * Arc's badge recipe. Each tone sets the pill's colour roles as custom properties, so hover can mix the tone into the
 * border and fill. Hover answers on fine pointers only.
 */
const badgeRecipe = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center overflow-clip rounded-(--radius-pill) border border-(--badge-border) bg-(--badge-background) leading-none font-medium tracking-[-.01em] whitespace-nowrap text-(--badge-foreground) transition-[border-color,background-color,color] duration-(--duration-standard) ease-(--ease-standard) motion-reduce:duration-(--duration-instant) hover-fine:border-[color-mix(in_oklab,var(--badge-color)_32%,var(--border))] hover-fine:bg-[color-mix(in_oklab,var(--badge-color)_10%,var(--surface))] aria-invalid:border-danger [&>svg]:pointer-events-none [&>svg]:size-3! [&>svg]:text-(--badge-color)",
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
      size: {
        sm: "min-h-[22px] gap-1 px-2 text-[11px]",
        md: "min-h-[26px] gap-[5px] px-2.5 text-xs",
      },
    },
  }
)

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
  /** Arc's semantic tone: `neutral` (default), `success`, `info`, `warning` or `danger`. */
  tone?: BadgeTone
  /** Arc's height: `md` (26px, default) or `sm` (22px). */
  size?: BadgeSize
  /** A leading icon tinted with the tone, hidden from assistive technology. A different icon component crossfades in. */
  icon?: ReactNode
}

/**
 * A small label for status, category or metadata. String or number children swap in place with Arc's motion and the
 * pill springs to the new width; other children render as they are.
 * @param props - Tone, size, optional icon and native span attributes.
 * @returns The badge.
 */
function Badge({ className, tone = "neutral", size = "md", icon, children, ...props }: BadgeProps) {
  const reduceMotion = usePrefersReducedMotion()
  const label = typeof children === "string" || typeof children === "number" ? String(children) : null
  const content =
    label === null ? (
      <>
        {icon ? <BadgeIcon icon={icon} iconKey={getIconKey(icon)} reduceMotion={reduceMotion} /> : null}
        {children}
      </>
    ) : (
      <BadgeContent icon={icon} label={label} reduceMotion={reduceMotion} />
    )

  return (
      <span
        data-slot="badge"
        data-tone={tone}
        data-size={size}
        className={cn(badgeRecipe({ tone, size }), className)}
        {...props}
      >
        {content}
      </span>
  )
}

export { Badge }
