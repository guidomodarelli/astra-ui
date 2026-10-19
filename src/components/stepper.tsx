"use client"

/**
 * Arc's Stepper (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): shows where a person is in a multi-step
 * flow and what is done. Driven by `current`; with `onStepSelect` people can go back to completed steps by click or
 * keyboard. Connectors fill one after another when progress jumps several steps, the ring then grows around the new
 * current marker, and numbers morph into drawn checks or alerts.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import type { Transition } from "motion/react"

import {
  STEPPER_ALERT_DOT_DELAY_S,
  STEPPER_DEFAULT_COMPLETE_LABEL,
  STEPPER_DEFAULT_LABEL,
  STEPPER_DEFAULT_MESSAGES,
  STEPPER_GLYPH_DRAW_DELAY_S,
  STEPPER_GLYPH_ENTER_SCALE,
  STEPPER_RING_DELAY_S,
  STEPPER_RING_ENTER_SCALE,
  STEPPER_TEXT_MORPH_WINDOW_MS,
} from "../constants/stepper.js"
import type { StepperDetails, StepperMessages, StepperOrientation, StepperStatus } from "../constants/stepper.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ArcTextSwap } from "../motion/arc-text-swap.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_SMOOTH, ARC_SPRING_SNAPPY, ARC_STAGGER } from "../motion/arc-tokens.js"

export type { StepperDetails, StepperMessages, StepperOrientation, StepperStatus }

export type StepperStep = {
  /** Stable key, so each step keeps its own motion when the list changes. */
  id: string
  label: string
  /** A short hint under the label. */
  description?: string
  /** Marks the step as failed: the marker morphs into an alert and this message replaces the description. */
  error?: string
}

export type StepperProps = Omit<HTMLAttributes<HTMLElement>, "children" | "role"> & {
  /** Steps in order. */
  steps: StepperStep[]
  /** Index of the step in progress. `steps.length` marks the whole flow complete. */
  current: number
  /** Layout direction. Defaults to `"horizontal"`. */
  orientation?: StepperOrientation
  /** Called with the index of a completed step when it is chosen. Without it the stepper is read only. */
  onStepSelect?: (index: number) => void
  /** `"current"` shows only the active step's description. Errors always show. Defaults to `"all"`. */
  details?: StepperDetails
  /** Markers only. Horizontal steppers switch to this below 30rem on their own. */
  compact?: boolean
  /** Accessible name of the stepper. Defaults to "Progreso". */
  label?: string
  /** Announced, and shown in the compact caption, once every step is complete. Defaults to "Todos los pasos completados". */
  completeLabel?: string
  /** Replaces any of the Spanish screen-reader statuses and the step announcement. */
  messages?: Partial<StepperMessages>
}

type GlyphKind = "number" | "check" | "error"

const still: Transition = { duration: 0 }
const leave: Transition = { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] }
const glyphFrom = { opacity: 0, scale: STEPPER_GLYPH_ENTER_SCALE, filter: `blur(${ARC_BLUR.subtle}px)` }
const glyphRest = { opacity: 1, scale: 1, filter: "blur(0px)" }

type SwapSlotProps = { text?: string; className?: string; reduceMotion: boolean }

/**
 * Text that rises in when it changes. Its slot springs to the new height, so a message that wraps eases the steps below
 * it down instead of pushing them; unrelated resizes (fonts, container width) follow exactly.
 */
function SwapSlot({ text, className, reduceMotion }: SwapSlotProps) {
  const inner = useRef<HTMLSpanElement>(null)
  const armedUntil = useRef(0)
  const height = useMotionValue<number | "auto">("auto")
  useLayoutEffect(() => {
    armedUntil.current = performance.now() + STEPPER_TEXT_MORPH_WINDOW_MS
  }, [text])
  useEffect(() => {
    const node = inner.current
    if (!node || typeof ResizeObserver === "undefined") return
    let hasMeasured = false
    const observer = new ResizeObserver(() => {
      const next = node.offsetHeight
      if (!hasMeasured || reduceMotion || performance.now() > armedUntil.current) {
        hasMeasured = true
        height.jump(next)
        return
      }
      animate(height, next, ARC_SPRING_SMOOTH)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [height, reduceMotion])
  return (
    <motion.span className="block" style={{ height }}>
      <span ref={inner} className="relative block">
        <ArcTextSwap text={text} reduceMotion={reduceMotion} lineClassName={cn("break-words", className)} />
      </span>
    </motion.span>
  )
}

type GlyphProps = { kind: GlyphKind; number: number; delay: number; reduceMotion: boolean }

/** The number, check and alert share one spot: the outgoing glyph shrinks away while the next pops in and draws. */
function Glyph({ kind, number, delay, reduceMotion }: GlyphProps) {
  const pop: Transition = reduceMotion
    ? still
    : {
        scale: { ...ARC_SPRING_SNAPPY, delay },
        opacity: { duration: ARC_DURATION.fast, delay },
        filter: { duration: ARC_DURATION.fast, delay },
      }
  const exit = { ...glyphFrom, transition: reduceMotion ? still : leave }
  const draw: Transition = reduceMotion
    ? still
    : { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter], delay: delay + STEPPER_GLYPH_DRAW_DELAY_S }
  const glyphClassName = "col-start-1 row-start-1 grid place-items-center"
  if (kind === "number") {
    return (
      <motion.span className={glyphClassName} initial={glyphFrom} animate={glyphRest} exit={exit} transition={pop}>
        {number}
      </motion.span>
    )
  }
  return (
    <motion.svg
      className={cn(glyphClassName, "size-3.5")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={glyphFrom}
      animate={glyphRest}
      exit={exit}
      transition={pop}
    >
      {kind === "check" ? (
        <motion.path d="M5.5 12.5l4.25 4.25L18.5 8" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={draw} />
      ) : (
        <>
          <motion.path d="M12 6.75v6.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={draw} />
          <motion.circle
            cx={12}
            cy={17.4}
            r={1.4}
            fill="currentColor"
            stroke="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={reduceMotion ? still : { ...ARC_SPRING_SNAPPY, delay: delay + STEPPER_ALERT_DOT_DELAY_S }}
          />
        </>
      )}
    </motion.svg>
  )
}

type MarkerProps = {
  number: number
  kind: GlyphKind
  isCurrent: boolean
  glyphDelay: number
  ringDelay: number
  reduceMotion: boolean
}

/** The ring grows out from behind the disc once progress arrives, so the eye lands on the new step after the connector fills. */
function Marker({ number, kind, isCurrent, glyphDelay, ringDelay, reduceMotion }: MarkerProps) {
  return (
    <span data-slot="stepper-marker" aria-hidden="true" className="relative grid size-(--marker) flex-none place-items-center">
      <AnimatePresence initial={false}>
        {isCurrent ? (
          <motion.span
            key="ring"
            className="absolute -inset-(--halo) rounded-(--radius-pill) bg-(--accent-subtle) transition-[background-color] duration-(--duration-standard) ease-(--ease-standard) group-data-[status=error]/step:bg-danger/16"
            initial={{ opacity: 0, scale: STEPPER_RING_ENTER_SCALE }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: STEPPER_RING_ENTER_SCALE, transition: reduceMotion ? still : leave }}
            transition={
              reduceMotion
                ? still
                : { scale: { ...ARC_SPRING_SNAPPY, delay: ringDelay }, opacity: { duration: ARC_DURATION.fast, delay: ringDelay } }
            }
          />
        ) : null}
      </AnimatePresence>
      <span className="relative grid size-full place-items-center rounded-(--radius-pill) bg-surface text-xs leading-none font-medium text-text-muted tabular-nums shadow-[inset_0_0_0_1px_var(--border-strong)] transition-[background-color,box-shadow,color,transform] duration-(--duration-standard) ease-(--ease-standard) group-data-[status=current]/step:text-foreground group-data-[status=current]/step:shadow-[inset_0_0_0_1.5px_var(--accent)] group-data-[status=complete]/step:bg-(--accent) group-data-[status=complete]/step:text-(--accent-foreground) group-data-[status=complete]/step:shadow-[inset_0_0_0_1px_var(--accent)] group-data-[status=error]/step:bg-[color-mix(in_oklab,var(--danger)_10%,var(--surface))] group-data-[status=error]/step:text-danger group-data-[status=error]/step:shadow-[inset_0_0_0_1.5px_var(--danger)] group-data-clickable/head:group-active/head:scale-92 group-data-clickable/head:group-data-[status=complete]/step:group-hover/head:bg-(--accent-strong) group-data-clickable/head:group-data-[status=complete]/step:group-hover/head:shadow-[inset_0_0_0_1px_var(--accent-strong)] group-data-clickable/head:group-data-[status=error]/step:group-hover/head:bg-[color-mix(in_oklab,var(--danger)_18%,var(--surface))] motion-reduce:transition-none motion-reduce:group-active/head:scale-100">
        <AnimatePresence initial={false}>
          <Glyph key={kind} kind={kind} number={number} delay={glyphDelay} reduceMotion={reduceMotion} />
        </AnimatePresence>
      </span>
    </span>
  )
}

/**
 * A horizontal or vertical steps indicator driven by the current index, with optional navigation back to completed steps.
 * @param props - Steps, current index, orientation, selection callback, copy and native attributes.
 * @returns The stepper: a labelled `nav` when interactive, otherwise a `role="group"`.
 */
function Stepper({
  steps,
  current,
  orientation = "horizontal",
  onStepSelect,
  details = "all",
  compact = false,
  label = STEPPER_DEFAULT_LABEL,
  completeLabel = STEPPER_DEFAULT_COMPLETE_LABEL,
  messages,
  className,
  ...props
}: StepperProps) {
  const copy: StepperMessages = { ...STEPPER_DEFAULT_MESSAGES, ...messages }
  const statusText: Record<StepperStatus, string> = {
    complete: copy.completed,
    current: "",
    upcoming: copy.notStarted,
    error: copy.error,
  }
  const reduceMotion = usePrefersReducedMotion()
  const count = steps.length
  const active = Math.min(Math.max(Math.round(current), 0), count)
  // Remembers where progress came from, so a jump across several steps fills or drains its connectors one after another.
  const [travel, setTravel] = useState({ to: active, from: active })
  if (travel.to !== active) setTravel({ to: active, from: travel.to })
  const from = travel.from
  const stagger = ARC_STAGGER.line
  const delayAt = (index: number) => {
    if (reduceMotion) return 0
    if (active > from) return index >= from && index < active ? (index - from) * stagger : 0
    return index >= active && index < from ? (from - 1 - index) * stagger : 0
  }
  const ringDelay = reduceMotion ? 0 : Math.max(0, Math.abs(active - from) - 1) * stagger + STEPPER_RING_DELAY_S
  const isInteractive = Boolean(onStepSelect)
  const isVertical = orientation === "vertical"
  const currentStep = active >= count ? undefined : steps[active]

  /** Arrow keys move between the steps people can reach; Home and End jump to the first and the current one. */
  function onKeyDown(event: KeyboardEvent<HTMLOListElement>) {
    const isRightToLeft = !isVertical && getComputedStyle(event.currentTarget).direction === "rtl"
    const backKeys = ["ArrowUp", isRightToLeft ? "ArrowRight" : "ArrowLeft"]
    const aheadKeys = ["ArrowDown", isRightToLeft ? "ArrowLeft" : "ArrowRight"]
    if (![...backKeys, ...aheadKeys, "Home", "End"].includes(event.key)) return
    const targets = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-reachable]"))
    const position = targets.indexOf(event.target as HTMLButtonElement)
    if (position < 0) return
    event.preventDefault()
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? targets.length - 1
          : backKeys.includes(event.key)
            ? Math.max(0, position - 1)
            : Math.min(targets.length - 1, position + 1)
    targets[next]?.focus()
  }

  const Root = isInteractive ? "nav" : "div"
  // Below 30rem a horizontal stepper keeps its markers and names the current step underneath.
  const hiddenTextClassName = compact ? "sr-only" : isVertical ? "" : "@max-[30rem]/stepper:sr-only"
  return (
    <Root
      data-slot="stepper"
      data-orientation={orientation}
      aria-label={label}
      role={isInteractive ? undefined : "group"}
      className={cn(
        "min-w-0 font-sans tracking-(--tracking-body) text-foreground [--halo:4px] [--marker:1.75rem]",
        !isVertical && "@container/stepper w-full",
        className
      )}
      {...props}
    >
      <ol
        className="m-0 grid list-none p-0"
        style={isVertical ? undefined : { gridTemplateColumns: count > 1 ? `repeat(${count - 1}, minmax(0, 1fr)) auto` : "auto" }}
        onKeyDown={isInteractive ? onKeyDown : undefined}
      >
        {steps.map((step, index) => {
          const isCurrent = index === active
          const status: StepperStatus = step.error ? "error" : index < active ? "complete" : isCurrent ? "current" : "upcoming"
          const isClickable = isInteractive && index < active
          const detail = step.error ?? (details === "all" || isCurrent ? step.description : undefined)
          const kind: GlyphKind = step.error ? "error" : index < active ? "check" : "number"
          const isLast = index === count - 1
          const content: ReactNode = (
            <>
              <Marker number={index + 1} kind={kind} isCurrent={isCurrent} glyphDelay={delayAt(index)} ringDelay={ringDelay} reduceMotion={reduceMotion} />
              <span data-slot="stepper-text" className={cn("grid min-w-0", isVertical && "pt-1", hiddenTextClassName)}>
                <span className="block text-sm leading-5 font-medium break-words text-text-muted transition-colors duration-(--duration-standard) ease-(--ease-standard) group-data-[status=complete]/step:text-text-secondary group-data-[status=current]/step:text-foreground group-data-[status=error]/step:text-foreground group-data-clickable/head:group-hover/head:text-foreground motion-reduce:transition-none">
                  {step.label}
                </span>
                {statusText[status] ? <span className="sr-only">{`, ${statusText[status]}`}</span> : null}
                <SwapSlot
                  text={detail}
                  className={cn("pt-0.5 text-xs leading-(--leading-body) font-normal", step.error ? "text-danger" : "text-text-muted")}
                  reduceMotion={reduceMotion}
                />
              </span>
            </>
          )
          const headClassName = cn(
            "group/head m-0 grid cursor-default rounded-(--space-2) border-0 bg-transparent p-0 text-start [font:inherit] [letter-spacing:inherit] text-inherit [-webkit-tap-highlight-color:transparent] [--focus-outline-offset:4px] data-clickable:cursor-pointer",
            isVertical
              ? cn("w-full items-start gap-x-(--space-3)", compact ? "grid-cols-[var(--marker)] gap-x-0" : "grid-cols-[var(--marker)_minmax(0,1fr)]")
              : "w-fit max-w-full justify-items-start gap-y-(--space-3)"
          )
          return (
            <li
              key={step.id}
              data-slot="stepper-step"
              data-status={status}
              className={cn(
                "group/step relative min-w-0",
                !isLast && (isVertical ? (compact ? "pb-(--space-6)" : "pb-(--space-5)") : "pe-(--space-4)")
              )}
            >
              {!isLast ? (
                <span
                  data-slot="stepper-connector"
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute overflow-hidden rounded-(--radius-pill) bg-border",
                    isVertical
                      ? "start-[calc(var(--marker)/2_-_1px)] top-[calc(var(--marker)+var(--halo)+2px)] bottom-[calc(var(--halo)+2px)] w-0.5"
                      : "start-[calc(var(--marker)+var(--halo)+var(--space-1))] end-[calc(var(--halo)+var(--space-1))] top-[calc(var(--marker)/2_-_1px)] h-0.5"
                  )}
                >
                  {/* The track stays put; only the fill scales along it on a spring, from the step just finished. */}
                  <motion.span
                    key={orientation}
                    className={cn(
                      "absolute inset-0 rounded-[inherit] bg-(--accent)",
                      isVertical ? "origin-top" : "origin-left rtl:origin-right"
                    )}
                    initial={false}
                    animate={isVertical ? { scaleY: index < active ? 1 : 0 } : { scaleX: index < active ? 1 : 0 }}
                    transition={reduceMotion ? still : { ...ARC_SPRING_SMOOTH, delay: delayAt(index) }}
                  />
                </span>
              ) : null}
              {isInteractive ? (
                <button
                  type="button"
                  className={headClassName}
                  data-clickable={isClickable || undefined}
                  data-reachable={index <= active || undefined}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-disabled={isClickable ? undefined : true}
                  // The current step stays reachable by the arrows and End, so it keeps a tab stop: `tabindex="-1"`
                  // targets never draw the keyboard focus outline. Only upcoming steps leave the tab order.
                  tabIndex={isClickable || isCurrent ? undefined : -1}
                  onClick={isClickable ? () => onStepSelect?.(index) : undefined}
                >
                  {content}
                </button>
              ) : (
                <span className={headClassName} aria-current={isCurrent ? "step" : undefined}>
                  {content}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {isVertical ? null : (
        <span
          data-slot="stepper-caption"
          aria-hidden="true"
          className={cn("mt-(--space-3)", compact ? "grid" : "hidden @max-[30rem]/stepper:grid")}
        >
          <SwapSlot text={currentStep?.label ?? completeLabel} className="text-sm leading-5 font-medium text-foreground" reduceMotion={reduceMotion} />
          <SwapSlot
            text={currentStep?.error ?? currentStep?.description}
            className={cn("pt-0.5 text-xs leading-(--leading-body) font-normal", currentStep?.error ? "text-danger" : "text-text-muted")}
            reduceMotion={reduceMotion}
          />
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {currentStep ? copy.stepAnnouncement({ position: active + 1, count, label: currentStep.label }) : completeLabel}
      </span>
    </Root>
  )
}

export { Stepper }
