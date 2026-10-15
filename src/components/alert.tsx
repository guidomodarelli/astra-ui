"use client"

/**
 * Arc's Alert (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a persistent message that helps people
 * recover or continue, on Arc's surface with a resting shadow. A `tone` tints and picks its icon, which morphs in
 * place when the tone changes; `onDismiss` adds a dismiss button and `open` collapses the alert's height while it
 * fades, so the content below closes the gap. The compound title, description and action parts are kept.
 */
import { useRef, useState } from "react"
import type { ComponentProps, ReactNode } from "react"
import { cva } from "class-variance-authority"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import type { HTMLMotionProps, TargetAndTransition, Transition } from "motion/react"
import { Check, CircleX, Info, TriangleAlert, X } from "lucide-react"

import { ALERT_DISMISS_LABEL, ALERT_TONE_ROLE } from "../constants/alert.js"
import type { AlertTone } from "../constants/alert.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_DURATION, ARC_EASE, ARC_SPRING_SMOOTH } from "../motion/arc-tokens.js"
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

export type { AlertTone }

/** shadcn-compatible variants; `destructive` is drawn with Arc's danger tone. */
export type AlertVariant = "default" | "destructive"

/** The icon each tone shows unless `icon` replaces it. */
const TONE_ICON = {
  info: Info,
  success: Check,
  warning: TriangleAlert,
  danger: CircleX,
} as const satisfies Record<AlertTone, typeof Info>

/**
 * Arc's alert recipe. The icon column (a direct svg or the tone icon) spans the title and description rows, and
 * `--alert-color` tints it by tone.
 */
const alertVariants = cva(
  "group/alert relative grid w-full items-start gap-x-(--space-3) gap-y-(--space-1) rounded-(--radius-control) border border-border bg-surface p-(--space-4) text-left text-sm text-foreground shadow-(--shadow-resting) [--alert-color:currentColor] has-[>svg]:grid-cols-[auto_1fr] has-data-[slot=alert-icon]:grid-cols-[auto_1fr] has-data-[slot=alert-action]:pr-18 has-data-[slot=alert-dismiss]:pr-12 *:[svg]:row-span-2 *:[svg]:mt-px *:[svg]:text-(--alert-color) *:[svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default: "",
        destructive: "[--alert-color:var(--danger)] *:data-[slot=alert-title]:text-danger",
      },
      tone: {
        info: "[--alert-color:var(--accent)]",
        success: "[--alert-color:var(--success)]",
        warning: "[--alert-color:var(--warning)]",
        danger: "[--alert-color:var(--danger)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const reducedEnter: TargetAndTransition = { opacity: 0 }
const presenceTransition: Transition = {
  height: ARC_SPRING_SMOOTH,
  opacity: { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] },
}
const presenceExit: TargetAndTransition = {
  height: 0,
  opacity: 0,
  transition: { height: ARC_SPRING_SMOOTH, opacity: ARC_SWAP_EXIT_TRANSITION },
}
const reducedPresenceExit: TargetAndTransition = { height: 0, opacity: 0, transition: { duration: 0 } }

/** Outgoing icons are hidden from assistive technology while they fade. */
function AlertIconSwap(props: HTMLMotionProps<"span">) {
  const isPresent = useIsPresent()
  return <motion.span {...props} aria-hidden={isPresent ? props["aria-hidden"] : true} />
}

type AlertIconProps = {
  icon: ReactNode
  iconKey: string
  reduceMotion: boolean
}

/** The tone icon column: a new tone morphs its icon in place. */
function AlertIcon({ icon, iconKey, reduceMotion }: AlertIconProps) {
  return (
    <span
      data-slot="alert-icon"
      aria-hidden="true"
      className="relative row-span-2 mt-px grid size-[18px] flex-none place-items-center text-(--alert-color) [&_svg]:block [&_svg:not([class*='size-'])]:size-[18px]"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <AlertIconSwap
          key={iconKey}
          className="relative grid place-items-center"
          initial={reduceMotion ? reducedEnter : ARC_ICON_ENTER}
          animate={ARC_SWAP_REST}
          exit={reduceMotion ? ARC_REDUCED_EXIT : ARC_ICON_EXIT}
          transition={reduceMotion ? ARC_REDUCED_TRANSITION : ARC_ICON_TRANSITION}
        >
          {icon}
        </AlertIconSwap>
      </AnimatePresence>
    </span>
  )
}

export type AlertProps = ComponentProps<"div"> & {
  variant?: AlertVariant | null
  /**
   * Arc's semantic tone: tints and picks the icon, and sets the live-region role (`alert` for danger, `status` for
   * the rest). Without a tone the alert keeps `role="alert"`.
   */
  tone?: AlertTone
  /** Replaces the tone icon, or hides it with `false`. Without a tone, place an svg as the first child instead. */
  icon?: ReactNode
  /** Controls presence: hiding the alert collapses its height while it fades out. */
  open?: boolean
  /** Shows a dismiss button. An uncontrolled alert collapses first and then calls this. */
  onDismiss?: () => void
  /** Accessible name of the dismiss button; defaults to "Descartar aviso". */
  dismissLabel?: string
}

type AlertBoxProps = Omit<AlertProps, "open"> & {
  reduceMotion: boolean
  /** Plays the shared message entrance; off inside the presence wrapper, which animates on its own. */
  animatesEntrance: boolean
}

/** The alert surface itself. */
function AlertBox({
  className,
  variant,
  tone,
  icon,
  onDismiss,
  dismissLabel = ALERT_DISMISS_LABEL,
  reduceMotion,
  animatesEntrance,
  children,
  ...props
}: AlertBoxProps) {
  const ToneIcon = tone ? TONE_ICON[tone] : null
  const resolvedIcon = icon === false ? null : (icon ?? (ToneIcon ? <ToneIcon aria-hidden="true" /> : null))
  const box = (
    <div
      data-slot="alert"
      data-tone={tone}
      role={tone ? ALERT_TONE_ROLE[tone] : "alert"}
      className={cn(alertVariants({ variant, tone }), className)}
      {...props}
    >
      {resolvedIcon ? (
        <AlertIcon icon={resolvedIcon} iconKey={icon ? "custom" : (tone ?? "custom")} reduceMotion={reduceMotion} />
      ) : null}
      {children}
      {onDismiss ? (
        <button
          type="button"
          data-slot="alert-dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="absolute top-(--space-3) right-(--space-3) grid size-7 cursor-pointer place-items-center rounded-(--radius-pill) border-0 bg-transparent text-text-muted [-webkit-tap-highlight-color:transparent] transition-[scale,background-color,color] duration-(--duration-fast) ease-(--ease-standard) hover-fine:bg-surface-muted hover-fine:text-foreground active:scale-[.96] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
  return animatesEntrance ? <MotionSlot kind="message">{box}</MotionSlot> : box
}

/**
 * A persistent message. Compose it with `AlertTitle`, `AlertDescription` and `AlertAction`.
 * @param props - Variant, Arc tone and icon, optional presence and dismissal, plus native div attributes.
 * @returns The alert, wrapped in a collapsing presence frame when `open` or `onDismiss` is set.
 */
function Alert({ open, onDismiss, ...props }: AlertProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [isDismissed, setIsDismissed] = useState(false)
  const presenceRef = useRef<HTMLDivElement>(null)
  const setPresenceClip = (overflow: string) => {
    if (presenceRef.current) presenceRef.current.style.overflow = overflow
  }
  if (open === undefined && !onDismiss) {
    return <AlertBox {...props} reduceMotion={reduceMotion} animatesEntrance />
  }
  const isOpen = open ?? !isDismissed
  const dismiss = onDismiss && (() => (open === undefined ? setIsDismissed(true) : onDismiss()))
  // Presence collapses the height with the fade, so the content below closes the gap instead of jumping.
  return (
    <AnimatePresence
      initial={false}
      onExitComplete={() => {
        if (open === undefined) onDismiss?.()
      }}
    >
      {isOpen ? (
        <motion.div
          key="alert"
          data-slot="alert-presence"
          className="min-w-0"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={reduceMotion ? reducedPresenceExit : presenceExit}
          transition={reduceMotion ? { duration: 0 } : presenceTransition}
          ref={presenceRef}
          // Clips only while moving, so focus outlines on the alert are not cut off at rest.
          onAnimationStart={() => setPresenceClip("hidden")}
          onAnimationComplete={() => setPresenceClip("")}
        >
          <AlertBox {...props} onDismiss={dismiss} reduceMotion={reduceMotion} animatesEntrance={false} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function AlertTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "text-sm font-medium group-has-[>svg]/alert:col-start-2 group-has-data-[slot=alert-icon]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover-fine:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-xs leading-(--leading-body) text-pretty text-text-secondary group-has-[>svg]/alert:col-start-2 group-has-data-[slot=alert-icon]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover-fine:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-(--space-3) right-(--space-3)", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
