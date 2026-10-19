"use client"

/**
 * Arc's Metric card (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a compact summary for a number that
 * needs context. The number rolls up from zero the first time it scrolls into view and then turns like an odometer in
 * the direction it moved; the label, context and change chip roll in from the same side, and the chip width springs.
 */
import { useRef, useState } from "react"
import type { ComponentProps } from "react"
import { AnimatePresence, motion } from "motion/react"

import {
  METRIC_CARD_CHANGE_ENTER_SCALE,
  METRIC_CARD_DEFAULT_LOCALE,
  METRIC_CARD_REVEAL_AMOUNT,
  METRIC_CARD_TREND_PATTERN,
} from "../constants/metric-card.js"
import { useHasEnteredView } from "../hooks/use-has-entered-view.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ArcOdometer, formatOdometerValue } from "../motion/arc-odometer.js"
import { ArcTextSwap } from "../motion/arc-text-swap.js"
import type { ArcTextSwapDirection } from "../motion/arc-text-swap.js"
import { ARC_DURATION, ARC_EASE, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"
import { useMorphWidth } from "../motion/use-morph-width.js"

export type MetricCardProps = Omit<ComponentProps<"article">, "children"> & {
  /** What is measured. */
  label: string
  /** The number. Rolls up from zero on first view, then between values. */
  value: number
  /** Text after the number, such as "%" or " ms". */
  suffix?: string
  /** Line under the number, such as "vs. la semana pasada". */
  context: string
  /** Chip in the top corner, such as "+12%". Write the sign: it sets the colour and is what screen readers hear. */
  change?: string
  /** Locale of the number's separators. Defaults to `"es-AR"`. */
  locale?: string
}

/** Trend a signed change reads as, in colour as well as sign. */
type Trend = "up" | "down"

/**
 * Reads the first number in a line of copy, so copy that holds a number enters from the side it moved toward.
 * @param text - Copy that may contain a number.
 * @returns The number, or `NaN` when there is none.
 */
function amountIn(text: string): number {
  const match = text.match(/[-−]?\d+(?:[.,]\d+)?/)?.[0]
  return match ? Number(match.replace("−", "-").replace(",", ".")) : Number.NaN
}

/**
 * Keeps the direction of the last change of a line of copy.
 * @param text - Current copy.
 * @returns `-1` when the number in it went down, otherwise `1`.
 */
function useTextDirection(text: string): ArcTextSwapDirection {
  const [shown, setShown] = useState<{ text: string; direction: ArcTextSwapDirection }>({ text, direction: 1 })
  if (shown.text !== text) setShown({ text, direction: amountIn(text) < amountIn(shown.text) ? -1 : 1 })
  return shown.direction
}

type MetricCopyProps = { text: string; reduceMotion: boolean; className?: string }

/** A line of copy that rolls in from the direction its number moved. */
function MetricCopy({ text, reduceMotion, className }: MetricCopyProps) {
  const direction = useTextDirection(text)
  return <ArcTextSwap text={text} reduceMotion={reduceMotion} direction={direction} className={className} />
}

/** The change copy, whose slot springs to the width of each new value instead of snapping. */
function ChangeCopy({ text, reduceMotion }: { text: string; reduceMotion: boolean }) {
  const direction = useTextDirection(text)
  const sizer = useRef<HTMLSpanElement>(null)
  const width = useMorphWidth(sizer, text, reduceMotion)
  return (
    <motion.span className="relative inline-flex max-w-full overflow-x-clip align-top whitespace-nowrap" style={{ width }}>
      <span ref={sizer} aria-hidden="true" className="pointer-events-none invisible absolute top-0 left-0 whitespace-nowrap">
        {text}
      </span>
      <ArcTextSwap text={text} reduceMotion={reduceMotion} direction={direction} className="inline-flex" lineClassName="inline-block" />
    </motion.span>
  )
}

/** Chip classes: a neutral outline, or a faint tint with the trend colour on the text when the change is signed. */
const changeClassName =
  "inline-flex flex-none rounded-(--radius-pill) border border-border px-2 py-[3px] text-sm text-text-secondary tabular-nums transition-[color,background-color] duration-(--duration-fast) ease-(--ease-standard) data-trend:border-transparent data-[trend=up]:bg-success/11 data-[trend=up]:text-success data-[trend=down]:bg-danger/11 data-[trend=down]:text-danger"

/**
 * A compact card with a label, an odometer style number, a context line and an optional change chip.
 * @param props - Label, value, suffix, context, change, locale and native article attributes.
 * @returns The metric card.
 */
function MetricCard({ label, value, suffix, context, change, locale = METRIC_CARD_DEFAULT_LOCALE, className, ...props }: MetricCardProps) {
  const reduceMotion = usePrefersReducedMotion()
  const numberRef = useRef<HTMLSpanElement>(null)
  const hasEnteredView = useHasEnteredView(numberRef, METRIC_CARD_REVEAL_AMOUNT)
  const trend: Trend | undefined = change
    ? METRIC_CARD_TREND_PATTERN.up.test(change)
      ? "up"
      : METRIC_CARD_TREND_PATTERN.down.test(change)
        ? "down"
        : undefined
    : undefined
  const valueText = `${formatOdometerValue(value, 0, locale)}${suffix ?? ""}`
  return (
    <article
      data-slot="metric-card"
      className={cn(
        "min-w-0 rounded-(--radius-surface) border border-border bg-surface p-(--space-6) text-foreground shadow-(--shadow-resting) max-[380px]:p-(--space-4)",
        className
      )}
      {...props}
    >
      <div className="mb-(--space-8) flex items-center justify-between gap-(--space-3) max-[380px]:mb-(--space-6) max-[380px]:flex-wrap max-[380px]:items-start">
        <span data-slot="metric-card-label" className="min-w-0 text-sm text-text-secondary">
          <MetricCopy text={label} reduceMotion={reduceMotion} />
        </span>
        <AnimatePresence initial={false}>
          {change ? (
            <motion.small
              key="change"
              data-slot="metric-card-change"
              data-trend={trend}
              className={changeClassName}
              initial={{ opacity: 0, scale: reduceMotion ? 1 : METRIC_CARD_CHANGE_ENTER_SCALE }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: reduceMotion ? 1 : METRIC_CARD_CHANGE_ENTER_SCALE,
                transition: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] },
              }}
              transition={reduceMotion ? { duration: 0 } : ARC_SPRING_SNAPPY}
            >
              <ChangeCopy text={change} reduceMotion={reduceMotion} />
            </motion.small>
          ) : null}
        </AnimatePresence>
      </div>
      <span
        ref={numberRef}
        data-slot="metric-card-value"
        className="relative inline-flex font-display text-3xl leading-none font-medium tracking-(--tracking-display) tabular-nums"
      >
        <span className="sr-only">{valueText}</span>
        <span aria-hidden="true" className="inline-flex items-start whitespace-nowrap select-none">
          <ArcOdometer value={value} locale={locale} armed={!hasEnteredView && !reduceMotion} reduceMotion={reduceMotion} />
          {suffix ? <span className="inline-block whitespace-pre">{suffix}</span> : null}
        </span>
      </span>
      <p data-slot="metric-card-context" className="mt-(--space-4) text-sm leading-(--leading-body) text-text-muted">
        <MetricCopy text={context} reduceMotion={reduceMotion} />
      </p>
    </article>
  )
}

export { MetricCard }
