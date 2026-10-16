"use client"

/**
 * Arc's Alert (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a persistent message that helps people
 * recover or continue, on Arc's surface with a resting shadow. A `tone` tints and picks its icon, which morphs in
 * place when the tone changes, and a new title or string detail rises in over the old one. `onDismiss` adds a dismiss
 * button and `open` collapses the alert's height while it fades, so the content below closes the gap.
 */
import { useRef, useState } from "react"
import type { ComponentProps, ReactNode } from "react"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import type { HTMLMotionProps, TargetAndTransition, Transition } from "motion/react"
import { Check, CircleX, Info, TriangleAlert, X } from "lucide-react"

import { ALERT_DISMISS_LABEL, ALERT_DISMISS_LABEL_SEPARATOR, ALERT_TEXT_OFFSET_EM, ALERT_TONE_ROLE } from "../constants/alert.js"
import type { AlertTone } from "../constants/alert.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_SMOOTH } from "../motion/arc-tokens.js"
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
import { useAttachedElement } from "../motion/use-attached-element.js"

export type { AlertTone }

/** The icon each tone shows unless `icon` replaces it. */
const TONE_ICON = {
  info: Info,
  success: Check,
  warning: TriangleAlert,
  danger: CircleX,
} as const satisfies Record<AlertTone, typeof Info>

/** Colour of the icon for each tone. */
const TONE_ICON_CLASS_NAME = {
  info: "text-(--accent)",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const satisfies Record<AlertTone, string>

const reducedEnter: TargetAndTransition = { opacity: 0 }
/** A new title or detail rises out of a soft blur; the old one lifts away faster. */
const textEnter: TargetAndTransition = {
  opacity: 0,
  y: `${ALERT_TEXT_OFFSET_EM}em`,
  filter: `blur(${ARC_BLUR.soft}px)`,
}
const textExit: TargetAndTransition = {
  opacity: 0,
  y: `${-ALERT_TEXT_OFFSET_EM}em`,
  filter: `blur(${ARC_BLUR.subtle}px)`,
  transition: ARC_SWAP_EXIT_TRANSITION,
}
const textTransition: Transition = { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] }
const presenceTransition: Transition = {
  height: ARC_SPRING_SMOOTH,
  opacity: { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] },
}
/** The alert itself collapses, so its padding, border and margins close along with the height. */
const collapsedBox: TargetAndTransition = {
  height: 0,
  paddingTop: 0,
  paddingBottom: 0,
  borderTopWidth: 0,
  borderBottomWidth: 0,
  marginTop: 0,
  marginBottom: 0,
}
const presenceExit: TargetAndTransition = {
  ...collapsedBox,
  opacity: 0,
  transition: { default: ARC_SPRING_SMOOTH, opacity: ARC_SWAP_EXIT_TRANSITION },
}
const reducedPresenceExit: TargetAndTransition = { ...collapsedBox, opacity: 0, transition: { duration: 0 } }
/** Entrance target; once it settles, the alert hands height and opacity back to the consumer's classes and style. */
const presenceEnter: TargetAndTransition = { height: "auto", opacity: 1 }

/**
 * Converts a consumer style value into the inline string React would write.
 * @param value - The consumer's style value, if any.
 * @param unit - Unit appended to numbers, as React does for lengths.
 * @returns The inline value, or an empty string to fall back to the stylesheet.
 */
function toInlineStyleValue(value: string | number | undefined, unit = ""): string {
  if (value === undefined) return ""
  return typeof value === "number" ? `${value}${unit}` : value
}

/** Outgoing copies are hidden from assistive technology while they fade, so the live region reads only the current one. */
function AlertSwap(props: HTMLMotionProps<"span">) {
  const isPresent = useIsPresent()
  return <motion.span {...props} aria-hidden={isPresent ? props["aria-hidden"] : true} />
}

type AlertTextProps = {
  text: string
  reduceMotion: boolean
}

/** A line of copy that rises in over the previous one when it changes. */
function AlertText({ text, reduceMotion }: AlertTextProps) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <AlertSwap
        key={text}
        className="relative block"
        initial={reduceMotion ? reducedEnter : textEnter}
        animate={ARC_SWAP_REST}
        exit={reduceMotion ? ARC_REDUCED_EXIT : textExit}
        transition={reduceMotion ? ARC_REDUCED_TRANSITION : textTransition}
      >
        {text}
      </AlertSwap>
    </AnimatePresence>
  )
}

type AlertIconProps = {
  icon: ReactNode
  iconKey: string
  tone: AlertTone
  reduceMotion: boolean
}

/** The tone icon: a new tone morphs its icon in place. */
function AlertIcon({ icon, iconKey, tone, reduceMotion }: AlertIconProps) {
  return (
    <span
      data-slot="alert-icon"
      aria-hidden="true"
      className={cn(
        "relative mt-px grid size-[18px] flex-none place-items-center [&_svg]:block [&_svg:not([class*='size-'])]:size-[18px]",
        TONE_ICON_CLASS_NAME[tone]
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <AlertSwap
          key={iconKey}
          className="relative grid place-items-center"
          initial={reduceMotion ? reducedEnter : ARC_ICON_ENTER}
          animate={ARC_SWAP_REST}
          exit={reduceMotion ? ARC_REDUCED_EXIT : ARC_ICON_EXIT}
          transition={reduceMotion ? ARC_REDUCED_TRANSITION : ARC_ICON_TRANSITION}
        >
          {icon}
        </AlertSwap>
      </AnimatePresence>
    </span>
  )
}

export type AlertProps = Omit<ComponentProps<"div">, "title" | "children"> & {
  /** Headline. A new title rises in over the old one. */
  title: string
  /**
   * Colour and icon: `info` (default), `success`, `warning` or `danger`. Danger interrupts with `role="alert"`; the
   * rest are announced politely with `role="status"`.
   */
  tone?: AlertTone
  /** Details under the title. String details rise in over the old ones when they change. */
  children?: ReactNode
  /** Controls presence: hiding the alert collapses its height while it fades out. */
  open?: boolean
  /** Shows a dismiss button. An uncontrolled alert collapses first and then calls this. */
  onDismiss?: () => void
  /** Accessible name of the dismiss button; defaults to "Descartar aviso: " followed by the title. */
  dismissLabel?: string
  /** Replaces the tone icon, or hides it with `false`. */
  icon?: ReactNode
  /** A control beside the copy, such as a button that resolves the alert. */
  action?: ReactNode
}

type AlertBoxProps = Omit<AlertProps, "open"> & {
  reduceMotion: boolean
  /**
   * Presence animation played on the alert root itself, so consumer classes, styles and props keep applying to the
   * element that takes part in the parent layout. Without it, the shared message entrance plays instead.
   */
  presence?: HTMLMotionProps<"div">
}

/** Arc's alert surface: icon, copy column, optional action and dismiss button in one row. */
const alertClassName =
  "group/alert relative flex w-full min-w-0 items-start gap-(--space-3) rounded-(--radius-control) border border-border bg-surface p-(--space-4) text-left text-sm text-foreground shadow-(--shadow-resting)"

/** The alert surface itself. */
function AlertBox({
  className,
  title,
  tone = "info",
  icon,
  action,
  onDismiss,
  dismissLabel,
  reduceMotion,
  presence,
  children,
  ...props
}: AlertBoxProps) {
  const isPresent = useIsPresent()
  const ToneIcon = TONE_ICON[tone]
  const resolvedIcon = icon === false ? null : (icon ?? <ToneIcon aria-hidden="true" />)
  const details = typeof children === "string" || typeof children === "number" ? String(children) : null
  const hasDetails = children !== undefined && children !== null && children !== false && children !== ""
  const rootProps = {
    "data-slot": "alert",
    "data-tone": tone,
    role: ALERT_TONE_ROLE[tone],
    className: cn(alertClassName, className),
    ...props,
  }
  const content = (
    <>
      {resolvedIcon ? (
        <AlertIcon icon={resolvedIcon} iconKey={icon ? "custom" : tone} tone={tone} reduceMotion={reduceMotion} />
      ) : null}
      <div data-slot="alert-copy" className="grid min-w-0 flex-1 gap-(--space-1)">
        <strong data-slot="alert-title" className="relative block text-sm font-medium">
          <AlertText text={title} reduceMotion={reduceMotion} />
        </strong>
        {hasDetails ? (
          <div
            data-slot="alert-description"
            className="relative text-xs leading-(--leading-body) text-pretty text-text-secondary [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover-fine:text-foreground [&_p:not(:last-child)]:mb-4"
          >
            {details === null ? children : <AlertText text={details} reduceMotion={reduceMotion} />}
          </div>
        ) : null}
      </div>
      {action ? (
        <div data-slot="alert-action" className="flex flex-none flex-wrap items-center gap-(--space-2) self-start">
          {action}
        </div>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          data-slot="alert-dismiss"
          aria-label={dismissLabel ?? `${ALERT_DISMISS_LABEL}${ALERT_DISMISS_LABEL_SEPARATOR}${title}`}
          onClick={onDismiss}
          className="-my-[5px] -mr-1.5 grid size-7 flex-none cursor-pointer place-items-center rounded-(--radius-pill) border-0 bg-transparent text-text-muted [-webkit-tap-highlight-color:transparent] transition-[scale,background-color,color] duration-(--duration-fast) ease-(--ease-standard) hover-fine:bg-surface-muted hover-fine:text-foreground active:scale-[.96] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      ) : null}
    </>
  )
  if (presence) {
    // A leaving alert turns inert and hidden at once, so its controls and live region are gone while it collapses.
    return (
      <motion.div
        {...(rootProps as HTMLMotionProps<"div">)}
        {...presence}
        aria-hidden={isPresent ? rootProps["aria-hidden"] : true}
        inert={!isPresent || rootProps.inert}
      >
        {content}
      </motion.div>
    )
  }
  return (
    <MotionSlot kind="message">
      <div {...rootProps}>{content}</div>
    </MotionSlot>
  )
}

/**
 * A persistent, in-flow message with a tone icon, a title and optional details, action and dismissal.
 * @param props - Title, tone, details, presence and dismissal, extensions and native div attributes.
 * @returns The alert; with `open` or `onDismiss` it collapses its own height when hidden.
 */
function Alert({ open, onDismiss, ref: consumerRef, ...props }: AlertProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [isDismissed, setIsDismissed] = useState(false)
  // Shares the alert node with the consumer's ref, keeping its React 19 cleanup, and with the clip toggled while it moves.
  const [presenceElement, attachPresence] = useAttachedElement<HTMLDivElement>(consumerRef)
  // The consumer's inline overflow, kept while the alert clips its content during a move.
  const restingOverflow = useRef<string | undefined>(undefined)
  const clipPresence = () => {
    if (!presenceElement) return
    restingOverflow.current ??= presenceElement.style.overflow
    presenceElement.style.overflow = "hidden"
  }
  const settlePresence = (definition: unknown) => {
    if (!presenceElement) return
    if (restingOverflow.current !== undefined) presenceElement.style.overflow = restingOverflow.current
    restingOverflow.current = undefined
    // Motion leaves the entrance's `height: auto` and `opacity: 1` inline; hand both back to the consumer.
    if (definition === presenceEnter) {
      presenceElement.style.height = toInlineStyleValue(props.style?.height, "px")
      presenceElement.style.opacity = toInlineStyleValue(props.style?.opacity)
    }
  }
  if (open === undefined && !onDismiss) {
    return <AlertBox {...props} ref={consumerRef} reduceMotion={reduceMotion} />
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
        <AlertBox
          key="alert"
          {...props}
          onDismiss={dismiss}
          reduceMotion={reduceMotion}
          presence={{
            ref: attachPresence,
            initial: { height: 0, opacity: 0 },
            animate: presenceEnter,
            exit: reduceMotion ? reducedPresenceExit : presenceExit,
            transition: reduceMotion ? { duration: 0 } : presenceTransition,
            // Clips only while moving, so focus outlines inside the alert are not cut off at rest.
            onAnimationStart: clipPresence,
            onAnimationComplete: settlePresence,
          }}
        />
      ) : null}
    </AnimatePresence>
  )
}

export { Alert }
