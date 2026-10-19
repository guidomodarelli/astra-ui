"use client"

/**
 * Rolling digits adapted from Arc's AnimatedCounter and UsageMeter (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli,
 * MIT License. The full license text ships in THIRD_PARTY_NOTICES.md. Internal: the odometer behind `MetricCard` and
 * `UsageMeter`. It is decoration over text that screen readers get elsewhere, so it is always `aria-hidden`.
 */
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, animate, cancelFrame, frame, motion, useMotionValue, useTransform } from "motion/react"
import type { MotionValue } from "motion/react"

import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_SPRING_MORPH, ARC_SPRING_SMOOTH, ARC_STAGGER } from "./arc-tokens.js"

/** A spring written as visual duration and bounce. */
type VisualSpring = { visualDuration: number; bounce: number }

/**
 * Motion drops inherited velocity on time-defined springs, so values that retarget mid-flight run the same springs
 * written as stiffness and damping.
 * @param spring - Visual duration and bounce of the spring.
 * @param restDelta - Distance at which the spring counts as settled.
 * @returns The equivalent physical spring.
 */
export function toPhysicalSpring({ visualDuration, bounce }: VisualSpring, restDelta = 0.001) {
  const angularFrequency = (2 * Math.PI) / (visualDuration * 1.2)
  return {
    type: "spring" as const,
    stiffness: angularFrequency * angularFrequency,
    damping: 2 * (1 - bounce) * angularFrequency,
    restDelta,
    restSpeed: restDelta * 2,
  }
}

/**
 * Starts an animation on the next frame, so the render that caused it never swallows a spring's first frames.
 * @param start - Starts the animation and returns its controls.
 * @returns A cleanup that cancels the pending start or stops the running animation.
 */
export function startNextFrame(start: () => { stop: () => void }): () => void {
  let controls: { stop: () => void } | null = null
  const run = () => {
    controls = start()
  }
  frame.update(run)
  return () => {
    cancelFrame(run)
    controls?.stop()
  }
}

/** Wheels turn on a critically damped spring. */
const TURN_SPRING = toPhysicalSpring(ARC_SPRING_SMOOTH)
/** The first reveal from zero takes a little longer, so the digits read as counting up. */
const REVEAL_SPRING = toPhysicalSpring({ visualDuration: ARC_DURATION.considered, bounce: 0 })
/** New columns and separators open from zero width on the morph spring. */
const FIT_SPRING = toPhysicalSpring(ARC_SPRING_MORPH, 0.01)
/** Longest stagger, in seconds, between columns revealed together. */
const REVEAL_STAGGER_LIMIT_S = 0.25
/** Number of glyphs on a wheel. */
const WHEEL_SIZE = 10
const DIGITS = Array.from({ length: WHEEL_SIZE }, (_, digit) => digit)
/** Distance, in wheel steps, at which a glyph is fully sharp. */
const SHARP_OFFSET = 0.02
const columnPresence = { initial: { width: 0, opacity: 0 }, animate: { width: "auto", opacity: 1 }, exit: { width: 0, opacity: 0 } }
/** Each wheel is clipped and feathers out at its edges, so a turning digit fades instead of being cut. */
const columnClassName =
  "relative inline-block overflow-hidden [--feather:.16em] -my-(--feather) py-(--feather) [mask-image:linear-gradient(to_bottom,transparent,#000_calc(var(--feather)*1.5),#000_calc(100%_-_var(--feather)*1.5),transparent)]"

type Part = { key: string; digit: number; order: number } | { key: string; text: string }

const numberFormats = new Map<string, Intl.NumberFormat>()

/**
 * Splits a formatted number into columns keyed by place value, so 999 → 1.000 keeps the ones column the ones column and
 * a new thousands column slides in.
 * @param value - Number to split.
 * @param decimals - Digits after the decimal separator.
 * @param locale - Formatting locale.
 * @returns Digit columns and separators in display order.
 */
function partsFor(value: number, decimals: number, locale: string): Part[] {
  const formatKey = `${locale}|${decimals}`
  let format = numberFormats.get(formatKey)
  if (!format) {
    format = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      numberingSystem: "latn",
    })
    numberFormats.set(formatKey, format)
  }
  const parts = format.formatToParts(value)
  let place = parts.reduce((count, part) => count + (part.type === "integer" ? part.value.length : 0), 0)
  let fraction = 0
  let order = 0
  return parts.flatMap((part, index): Part[] => {
    if (part.type === "integer") return [...part.value].map((character) => ({ key: `i${--place}`, digit: Number(character), order: order++ }))
    if (part.type === "fraction") return [...part.value].map((character) => ({ key: `f${fraction++}`, digit: Number(character), order: order++ }))
    const key = part.type === "group" ? `g${place}` : part.type === "decimal" ? "d" : `${part.type}${index}`
    return [{ key, text: part.value }]
  })
}

/**
 * Formats a number the way the odometer draws it, for the screen-reader copy beside it.
 * @param value - Number to format.
 * @param decimals - Digits after the decimal separator.
 * @param locale - Formatting locale.
 * @returns The formatted number.
 */
export function formatOdometerValue(value: number, decimals: number, locale: string): string {
  return partsFor(value, decimals, locale).map((part) => ("text" in part ? part.text : part.digit)).join("")
}

/** One digit on a wheel; its distance from the wheel position sets where it sits and how clearly it shows. */
function Glyph({ position, digit }: { position: MotionValue<number>; digit: number }) {
  const offset = useTransform(position, (current) => ((((digit - current) % WHEEL_SIZE) + WHEEL_SIZE * 1.5) % WHEEL_SIZE) - WHEEL_SIZE / 2)
  const y = useTransform(offset, (current) => `${current}em`)
  const opacity = useTransform(offset, (current) => Math.max(0, 1 - Math.abs(current)))
  const visibility = useTransform(offset, (current) => (Math.abs(current) >= 1 ? "hidden" : "visible"))
  const filter = useTransform(offset, (current) =>
    Math.abs(current) < SHARP_OFFSET || Math.abs(current) >= 1 ? "none" : `blur(${(Math.abs(current) * ARC_BLUR.subtle).toFixed(2)}px)`
  )
  return (
    <motion.span className="absolute inset-x-0 inset-y-(--feather) text-center" style={{ y, opacity, filter, visibility }}>
      {digit}
    </motion.span>
  )
}

type ColumnProps = {
  digit: number
  direction: number
  /** Holds the wheel at zero until the number is revealed. */
  armed: boolean
  delay: number
  reduceMotion: boolean
}

/** A digit wheel that always turns the way the whole number moved, wrapping 9 → 0 like an odometer. */
function Column({ digit, direction, armed, delay, reduceMotion }: ColumnProps) {
  const position = useMotionValue(armed ? 0 : digit)
  const wheel = useRef({ digit: armed ? 0 : digit, target: armed ? 0 : digit, revealed: !armed })
  const running = useRef<(() => void) | null>(null)
  useEffect(() => () => running.current?.(), [])
  useEffect(() => {
    const state = wheel.current
    if (armed || state.digit === digit) {
      if (!armed) state.revealed = true
      return
    }
    state.target +=
      direction < 0 && state.revealed ? -((state.digit - digit + WHEEL_SIZE) % WHEEL_SIZE) : (digit - state.digit + WHEEL_SIZE) % WHEEL_SIZE
    state.digit = digit
    running.current?.()
    const target = state.target
    const transition = state.revealed ? TURN_SPRING : { ...REVEAL_SPRING, delay }
    state.revealed = true
    if (reduceMotion) {
      position.jump(target)
      running.current = null
      return
    }
    running.current = startNextFrame(() => animate(position, target, transition))
  }, [armed, delay, digit, direction, position, reduceMotion])
  return (
    <motion.span className={columnClassName} {...columnPresence} transition={reduceMotion ? { duration: 0 } : FIT_SPRING}>
      <span className="invisible">0</span>
      {DIGITS.map((item) => (
        <Glyph key={item} position={position} digit={item} />
      ))}
    </motion.span>
  )
}

export type ArcOdometerProps = {
  value: number
  /** Digits after the decimal separator. */
  decimals?: number
  /** Formatting locale of separators and grouping. */
  locale: string
  /** Holds every wheel at zero; once it turns false the digits roll up from zero, one column after another. */
  armed?: boolean
  reduceMotion: boolean
  className?: string
}

/**
 * A number that rolls to each new value, digit by digit, in the direction it moved.
 * @param props - Value, decimals, locale, reveal state and motion preference.
 * @returns The odometer, hidden from assistive technology.
 */
export function ArcOdometer({ value, decimals = 0, locale, armed = false, reduceMotion, className }: ArcOdometerProps) {
  const [trend, setTrend] = useState({ value, direction: 1 })
  if (trend.value !== value) setTrend({ value, direction: value > trend.value ? 1 : -1 })
  return (
    <span
      data-slot="odometer"
      aria-hidden="true"
      className={cn("relative inline-flex items-start whitespace-nowrap tabular-nums select-none", className)}
    >
      <AnimatePresence initial={false}>
        {partsFor(value, decimals, locale).map((part) =>
          "digit" in part ? (
            <Column
              key={part.key}
              digit={part.digit}
              direction={trend.direction}
              armed={armed}
              delay={Math.min(part.order * ARC_STAGGER.item, REVEAL_STAGGER_LIMIT_S)}
              reduceMotion={reduceMotion}
            />
          ) : (
            <motion.span
              key={part.key}
              className="inline-block overflow-x-clip"
              {...columnPresence}
              transition={reduceMotion ? { duration: 0 } : FIT_SPRING}
            >
              {part.text}
            </motion.span>
          )
        )}
      </AnimatePresence>
    </span>
  )
}
