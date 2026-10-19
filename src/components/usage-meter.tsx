"use client"

/**
 * Arc's Usage meter (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): shows what fills a fixed allowance and
 * how close it is to the limit. A segmented bar, a rolling total, a status badge and a legend that doubles as the
 * keyboard path. Segments grow in once the meter is seen and re-flow on one spring each when values change; crossing
 * the limit fades in a hatched overage and a limit marker, so going over never relies on colour alone.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import type { ComponentProps, KeyboardEvent, PointerEvent } from "react"
import { AnimatePresence, animate, motion, motionValue, useMotionValue, useTransform } from "motion/react"
import type { AnimationPlaybackControls, MotionValue, Variants } from "motion/react"
import { CircleAlert, TriangleAlert } from "lucide-react"

import {
  USAGE_METER_DEFAULT_DECIMALS,
  USAGE_METER_DEFAULT_FREE_LABEL,
  USAGE_METER_DEFAULT_LOCALE,
  USAGE_METER_DEFAULT_MESSAGES,
  USAGE_METER_DEFAULT_OVER_LABEL,
  USAGE_METER_DEFAULT_WARN_AT,
  USAGE_METER_FREE_ID,
  USAGE_METER_REVEAL_AMOUNT,
  USAGE_METER_REVEAL_STAGGER_S,
  USAGE_METER_SEGMENT_COLOR_COUNT,
  USAGE_METER_SEGMENT_GAP_PX,
} from "../constants/usage-meter.js"
import type { UsageMeterCopyValues, UsageMeterMessages, UsageMeterStatus } from "../constants/usage-meter.js"
import { useHasEnteredView } from "../hooks/use-has-entered-view.js"
import { useIsHydrated } from "../hooks/use-is-hydrated.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ArcOdometer, startNextFrame, toPhysicalSpring } from "../motion/arc-odometer.js"
import { ArcTextSwap } from "../motion/arc-text-swap.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_MORPH, ARC_SPRING_SMOOTH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"

export type { UsageMeterCopyValues, UsageMeterMessages, UsageMeterStatus }

export type UsageMeterSegment = {
  /** Stable identity. Keep it while the value changes, so the segment re-flows instead of being replaced. */
  id: string
  label: string
  /** Used amount, in the same unit as the limit. */
  value: number
}

export type UsageMeterProps = Omit<ComponentProps<"div">, "children"> & {
  /** What is measured, such as "Códigos enviados hoy". */
  label: string
  /** Used amounts in display order. Keep ids stable so segments re-flow. Up to four read clearly. */
  segments: UsageMeterSegment[]
  /** The plan limit, in the same unit as the segments. */
  limit: number
  /** Unit shown after numbers, such as "GB". */
  unit?: string
  /** Digits after the decimal separator. Defaults to 1. */
  decimals?: number
  /** Legend label of the remaining space. Defaults to "Libre". */
  freeLabel?: string
  /** Legend label of the overage. Defaults to "Excedente". */
  overLabel?: string
  /** Share of the limit at which the badge warns that it is almost full. Defaults to 0.9. */
  warnAt?: number
  /** Replaces any of the Spanish captions, badges and announcements. */
  messages?: Partial<UsageMeterMessages>
  /** Locale of the numbers' separators. Defaults to `"es-AR"`. */
  locale?: string
}

/** A highlighted item, the others dimmed, or nothing highlighted at all. */
type Highlight = "on" | "off" | undefined

const SETTLE_SPRING = toPhysicalSpring(ARC_SPRING_SMOOTH)
const REVEAL_SPRING = toPhysicalSpring({ visualDuration: ARC_DURATION.considered + 0.1, bounce: 0 })
const FIT_SPRING = toPhysicalSpring(ARC_SPRING_MORPH, 0.01)
/** Icons cross through a small scale and a blur a little stronger than text. */
const ICON_BLUR_PX = ARC_BLUR.subtle + 1
const ICON_ENTER_SCALE = 0.6
/** Smallest span of the bar, so an empty meter with a zero limit never divides by zero. */
const MINIMUM_SPAN = 1e-6
/** Size, in pixels, of the status badge's icon and of the legend's warning icon. */
const BADGE_ICON_SIZE_PX = 14
const LEGEND_ICON_SIZE_PX = 12
const PERCENT = 100

const popVariants: Variants = {
  hidden: { opacity: 0, scale: ICON_ENTER_SCALE, filter: `blur(${ICON_BLUR_PX}px)` },
  shown: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      ...ARC_SPRING_SNAPPY,
      opacity: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
      filter: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
    },
  },
  gone: {
    opacity: 0,
    scale: ICON_ENTER_SCALE,
    filter: `blur(${ICON_BLUR_PX}px)`,
    transition: { duration: ARC_DURATION.instant, ease: [...ARC_EASE.standard] },
  },
}
const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: ARC_DURATION.fast } },
  gone: { opacity: 0, transition: { duration: ARC_DURATION.instant } },
}

/** Category colours: steps of the accent, strongest first, so the meter reads as one allowance rather than a rainbow. */
const SEGMENT_COLOR_CLASS_NAMES = [
  "bg-(--accent)",
  "bg-[color-mix(in_oklab,var(--accent)_62%,var(--surface))]",
  "bg-[color-mix(in_oklab,var(--accent)_36%,var(--surface))]",
  "bg-[color-mix(in_oklab,var(--accent)_22%,var(--surface))]",
] as const
/** The free space is the track itself. */
const TRACK_COLOR_CLASS_NAME = "bg-[color-mix(in_oklab,var(--foreground)_7%,var(--surface))]"

/**
 * Colour class of a category by its position.
 * @param index - Position of the category in `segments`.
 * @returns The background class.
 */
function segmentColorClassName(index: number): string {
  return SEGMENT_COLOR_CLASS_NAMES[index % USAGE_METER_SEGMENT_COLOR_COUNT]!
}

type StatusBadgeProps = { status: UsageMeterStatus; text: string; reduceMotion: boolean }

/** The plan status as a compact mark. Its width springs to each new message and the warning icon grows in beside it. */
function StatusBadge({ status, text, reduceMotion }: StatusBadgeProps) {
  const inner = useRef<HTMLSpanElement>(null)
  const width = useMotionValue<number | "auto">("auto")
  useLayoutEffect(() => {
    const node = inner.current
    if (!node || typeof ResizeObserver === "undefined") return
    let hasMeasured = false
    const observer = new ResizeObserver(() => {
      const next = node.offsetWidth
      if (hasMeasured && !reduceMotion) animate(width, next, FIT_SPRING)
      else width.jump(next)
      hasMeasured = next > 0
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduceMotion, width])
  const Icon = status === "over" ? TriangleAlert : CircleAlert
  return (
    <motion.span
      data-slot="usage-meter-status"
      data-status={status}
      style={{ width }}
      className="inline-flex h-7 flex-none justify-end overflow-hidden rounded-(--radius-pill) bg-surface-muted text-xs leading-none font-medium text-text-secondary transition-[background-color,color] duration-(--duration-standard) ease-(--ease-standard) data-[status=near]:bg-[color-mix(in_oklab,var(--warning)_14%,var(--surface))] data-[status=near]:text-foreground data-[status=over]:bg-[color-mix(in_oklab,var(--danger)_12%,var(--surface))] data-[status=over]:text-foreground"
    >
      <span ref={inner} className="inline-flex flex-none items-center gap-1.5 px-(--space-3) whitespace-nowrap">
        <AnimatePresence mode="popLayout" initial={false}>
          {status !== "ok" ? (
            <motion.span
              key={status}
              className={cn("grid place-items-center", status === "over" ? "text-danger" : "text-warning")}
              variants={reduceMotion ? fadeVariants : popVariants}
              initial="hidden"
              animate="shown"
              exit="gone"
            >
              <Icon size={BADGE_ICON_SIZE_PX} strokeWidth={2} aria-hidden="true" />
            </motion.span>
          ) : null}
        </AnimatePresence>
        <ArcTextSwap text={text} reduceMotion={reduceMotion} lineClassName="truncate" />
      </span>
    </motion.span>
  )
}

type SegmentBarProps = {
  index: number
  amounts: MotionValue<number>[]
  limit: MotionValue<number>
  width: MotionValue<number>
  highlight: Highlight
}

/**
 * The span of the bar: the limit, or everything used once that is more. Computed values read only base values, because
 * a value derived from another derived value can read it stale when several base values jump in the same frame.
 * @param amounts - Used amount of every segment.
 * @param limit - The shown limit.
 * @returns The amount the full bar stands for.
 */
function readSpan(amounts: MotionValue<number>[], limit: MotionValue<number>): number {
  return Math.max(limit.get(), amounts.reduce((sum, amount) => sum + amount.get(), 0), MINIMUM_SPAN)
}

/** One category on the bar. It starts where the ones before it end, so growth anywhere pushes the rest along. */
function SegmentBar({ index, amounts, limit, width, highlight }: SegmentBarProps) {
  const x = useTransform(() => {
    let start = 0
    for (let position = 0; position < index; position++) start += amounts[position]!.get()
    return (start / readSpan(amounts, limit)) * width.get()
  })
  const scaleX = useTransform(() => {
    // Every value is read before any early return: Motion subscribes to the values the first run reads.
    const trackWidth = width.get()
    const span = readSpan(amounts, limit)
    let start = 0
    for (let position = 0; position < index; position++) start += amounts[position]!.get()
    const amount = amounts[index]!.get()
    if (!trackWidth) return 0
    const size = (amount / span) * trackWidth
    const rest = trackWidth - (start / span) * trackWidth - size
    return Math.max(0, size - Math.min(USAGE_METER_SEGMENT_GAP_PX, size, Math.max(0, rest))) / trackWidth
  })
  return (
    <motion.span
      data-slot="usage-meter-segment"
      data-index={index}
      data-highlight={highlight}
      style={{ x, scaleX, originX: 0 }}
      className={cn(
        "absolute inset-0 transition-opacity duration-(--duration-fast) ease-(--ease-standard) data-[highlight=off]:opacity-28",
        segmentColorClassName(index)
      )}
    />
  )
}

/**
 * Formats an amount with the meter's decimals, locale and unit.
 * @param value - Amount to format.
 * @param options - Locale, decimals, unit, and whether trailing zero decimals are dropped (for the limit).
 * @returns The formatted amount, such as "8,4 GB".
 */
function formatAmount(value: number, { locale, decimals, unit, trimZeros = false }: { locale: string; decimals: number; unit: string; trimZeros?: boolean }) {
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: trimZeros ? 0 : decimals,
    maximumFractionDigits: decimals,
  }).format(value)
  return unit ? `${number} ${unit}` : number
}

/**
 * A segmented bar showing what uses a fixed allowance, with a rolling total, a status badge and an interactive legend.
 * @param props - Label, segments, limit, unit, legend labels, copy overrides and native div attributes.
 * @returns The usage meter.
 */
function UsageMeter({
  label,
  segments,
  limit,
  unit = "",
  decimals = USAGE_METER_DEFAULT_DECIMALS,
  freeLabel = USAGE_METER_DEFAULT_FREE_LABEL,
  overLabel = USAGE_METER_DEFAULT_OVER_LABEL,
  warnAt = USAGE_METER_DEFAULT_WARN_AT,
  messages,
  locale = USAGE_METER_DEFAULT_LOCALE,
  className,
  ...props
}: UsageMeterProps) {
  const copy: UsageMeterMessages = { ...USAGE_METER_DEFAULT_MESSAGES, ...messages }
  const reduceMotion = usePrefersReducedMotion()
  const isHydrated = useIsHydrated()
  const root = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)
  const hasEnteredView = useHasEnteredView(root, USAGE_METER_REVEAL_AMOUNT)
  const titleId = useId()
  const hatchId = `usage-meter-hatch${titleId.replace(/[^a-zA-Z0-9_-]/g, "")}`
  const isReady = isHydrated && (hasEnteredView || reduceMotion)

  const decimalFactor = 10 ** decimals
  const round = (value: number) => Math.round(value * decimalFactor) / decimalFactor
  const total = round(segments.reduce((sum, segment) => sum + segment.value, 0))
  const free = round(Math.max(0, limit - total))
  const over = round(Math.max(0, total - limit))
  const status: UsageMeterStatus = total > limit ? "over" : total >= limit * warnAt ? "near" : "ok"
  const format = (value: number) => formatAmount(value, { locale, decimals, unit })
  const values: UsageMeterCopyValues = {
    label,
    unit,
    limit: formatAmount(limit, { locale, decimals, unit, trimZeros: true }),
    total: format(total),
    free: format(free),
    over: format(over),
  }

  // One motion value per segment id, kept across renders so a changed value springs from where it is.
  const [amountStore] = useState(() => new Map<string, MotionValue<number>>())
  const amounts = segments.map((segment) => {
    let amount = amountStore.get(segment.id)
    if (!amount) {
      amount = motionValue(0)
      amountStore.set(segment.id, amount)
    }
    return amount
  })
  const shownLimit = useMotionValue(limit)
  const trackWidth = useMotionValue(0)
  // The bar spans the limit, or everything used once that is more; both follow their springs, so crossing is continuous.
  const limitX = useTransform(() => Math.round((shownLimit.get() / readSpan(amounts, shownLimit)) * trackWidth.get()))
  const overClip = useTransform(
    () => `inset(0 0 0 ${Math.round((shownLimit.get() / readSpan(amounts, shownLimit)) * trackWidth.get()) + USAGE_METER_SEGMENT_GAP_PX}px)`
  )
  // The limit marker and the hatch fade on a short tween whenever usage crosses the limit.
  const markerOpacity = useMotionValue(0)
  const amountIds = segments.map((segment) => segment.id).join("|")
  useEffect(() => {
    const watched = amountIds.split("|").flatMap((id) => amountStore.get(id) ?? [])
    const isUsageOver = () => watched.reduce((sum, amount) => sum + amount.get(), 0) > shownLimit.get()
    let isOver = isUsageOver()
    markerOpacity.jump(isOver ? 1 : 0)
    let fading: AnimationPlaybackControls | undefined
    const check = () => {
      const next = isUsageOver()
      if (next === isOver) return
      isOver = next
      fading?.stop()
      if (reduceMotion) markerOpacity.jump(next ? 1 : 0)
      else fading = animate(markerOpacity, next ? 1 : 0, { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] })
    }
    const stops = [...watched.map((amount) => amount.on("change", check)), shownLimit.on("change", check)]
    return () => {
      stops.forEach((stop) => stop())
      fading?.stop()
    }
  }, [amountIds, amountStore, markerOpacity, reduceMotion, shownLimit])

  useLayoutEffect(() => {
    const node = trackRef.current
    if (!node) return
    trackWidth.set(node.clientWidth)
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => trackWidth.set(node.clientWidth))
    observer.observe(node)
    return () => observer.disconnect()
  }, [trackWidth])

  // Segments grow into place once seen, left to right; later changes re-flow every segment on one spring each.
  // The serialized ids and values keep the effect from restarting springs on renders that change nothing.
  const segmentTargets = JSON.stringify(segments.map((segment) => [segment.id, segment.value]))
  const hasRevealed = useRef(false)
  useEffect(() => {
    if (!isReady) return
    const isFirstReveal = !hasRevealed.current
    hasRevealed.current = true
    const targets = JSON.parse(segmentTargets) as Array<[string, number]>
    const stops = targets.map(([id, value], index) => {
      const amount = amountStore.get(id)
      if (!amount || amount.get() === value) return null
      if (reduceMotion) {
        amount.jump(value)
        return null
      }
      const transition = isFirstReveal ? { ...REVEAL_SPRING, delay: index * USAGE_METER_REVEAL_STAGGER_S } : SETTLE_SPRING
      return startNextFrame(() => animate(amount, value, transition))
    })
    return () => stops.forEach((stop) => stop?.())
  }, [segmentTargets, isReady, reduceMotion, amountStore])
  useEffect(() => {
    if (shownLimit.get() === limit) return
    if (reduceMotion) {
      shownLimit.jump(limit)
      return
    }
    return startNextFrame(() => animate(shownLimit, limit, SETTLE_SPRING))
  }, [limit, reduceMotion, shownLimit])

  // Hover previews a category, focus previews it too, and a press pins it until pressed again or Escape.
  const [hovered, setHovered] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const [rovingIndex, setRovingIndex] = useState(0)
  const items = [
    ...segments.map((segment) => ({ id: segment.id, label: segment.label, value: segment.value })),
    { id: USAGE_METER_FREE_ID, label: status === "over" ? overLabel : freeLabel, value: status === "over" ? over : free },
  ]
  const active = hovered ?? focused ?? pinned
  const activeItem = items.find((item) => item.id === active) ?? null
  const highlightOf = (id: string): Highlight => (active ? (active === id ? "on" : "off") : undefined)

  const idAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect?.width) return null
    const at = ((clientX - rect.left) / rect.width) * Math.max(limit, total)
    // Past the limit the hatch stands for the overage, so pointing there highlights it rather than the category beneath.
    if (at > limit) return USAGE_METER_FREE_ID
    let end = 0
    for (const segment of segments) {
      end += segment.value
      if (at <= end) return segment.id
    }
    return USAGE_METER_FREE_ID
  }
  const onTrackMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") setHovered(idAt(event.clientX))
  }
  const onTrackTap = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return
    const id = idAt(event.clientX)
    setPinned((current) => (current === id ? null : id))
  }
  const onLegendKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (pinned || focused) {
        event.preventDefault()
        setPinned(null)
      }
      return
    }
    const targets: Record<string, number> = {
      ArrowRight: rovingIndex + 1,
      ArrowDown: rovingIndex + 1,
      ArrowLeft: rovingIndex - 1,
      ArrowUp: rovingIndex - 1,
      Home: 0,
      End: items.length - 1,
    }
    const next = targets[event.key]
    if (next === undefined) return
    event.preventDefault()
    const index = (next + items.length) % items.length
    setRovingIndex(index)
    legendRef.current?.querySelectorAll<HTMLButtonElement>("button")[index]?.focus()
  }

  const headline = isReady ? (activeItem ? activeItem.value : total) : 0
  const share = activeItem && limit > 0 ? Math.round((activeItem.value / limit) * PERCENT) : 0
  const caption = !activeItem
    ? copy.usedCaption(values)
    : activeItem.id === USAGE_METER_FREE_ID
      ? status === "over"
        ? copy.overCaption(values)
        : copy.freeCaption(values)
      : copy.segmentCaption({ ...values, segment: activeItem.label, share })
  const badge = status === "over" ? copy.overBadge(values) : status === "near" ? copy.nearBadge(values) : copy.freeBadge(values)
  const barSummary = copy.barSummary({
    ...values,
    status,
    segments: segments.map((segment) => `${segment.label} ${format(segment.value)}`).join(", "),
  })
  // Status changes are announced, and so is a growing overage; routine changes inside a status stay quiet.
  const notice = status === "over" ? `over:${over}` : status
  const [announced, setAnnounced] = useState({ notice, message: "" })
  if (announced.notice !== notice) {
    const message =
      status === "over" ? copy.overAnnouncement(values) : status === "near" ? copy.nearAnnouncement(values) : copy.okAnnouncement(values)
    setAnnounced({ notice, message })
  }

  return (
    <div
      ref={root}
      data-slot="usage-meter"
      data-status={status}
      role="group"
      aria-labelledby={titleId}
      className={cn("grid min-w-0 gap-(--space-4) text-foreground", className)}
      {...props}
    >
      <div className="flex min-h-7 min-w-0 items-center justify-between gap-(--space-3)">
        {/* A long label wraps beside the status mark instead of hiding its end. */}
        <span id={titleId} className="min-w-0 text-base leading-(--leading-body) font-medium tracking-(--tracking-body) text-balance text-foreground">
          {label}
        </span>
        <StatusBadge status={status} text={badge} reduceMotion={reduceMotion} />
      </div>
      <p className="m-0 flex min-w-0 items-baseline gap-(--space-2)">
        <span className="sr-only">{copy.usedSummary(values)}</span>
        <span aria-hidden="true" className="flex-none font-display text-3xl leading-(--leading-display) font-medium tracking-(--tracking-display)">
          <ArcOdometer value={headline} decimals={decimals} locale={locale} reduceMotion={reduceMotion} />
        </span>
        <span data-slot="usage-meter-caption" aria-hidden="true" className="min-w-0 flex-1 text-sm text-text-secondary">
          <ArcTextSwap text={caption} reduceMotion={reduceMotion} lineClassName="truncate" />
        </span>
      </p>
      {/* The bar leaves room above and below the track for the limit marker. */}
      <div className="relative py-[5px]">
        <div
          ref={trackRef}
          data-slot="usage-meter-track"
          role="img"
          aria-label={barSummary}
          data-active={active ?? undefined}
          onPointerMove={onTrackMove}
          onPointerLeave={() => setHovered(null)}
          onPointerUp={onTrackTap}
          className={cn("relative isolate h-3.5 overflow-hidden rounded-(--radius-pill) [-webkit-tap-highlight-color:transparent]", TRACK_COLOR_CLASS_NAME)}
        >
          {segments.map((segment, index) => (
            <SegmentBar key={segment.id} index={index} amounts={amounts} limit={shownLimit} width={trackWidth} highlight={highlightOf(segment.id)} />
          ))}
          {/* Past the limit the bar is struck through: the overflow keeps its colours, hatched so it reads as over without colour. */}
          <motion.svg
            data-slot="usage-meter-overflow"
            data-highlight={highlightOf(USAGE_METER_FREE_ID)}
            style={{ clipPath: overClip, opacity: markerOpacity }}
            aria-hidden="true"
            focusable="false"
            className="group/overflow pointer-events-none absolute inset-0 size-full"
          >
            <defs>
              <pattern id={hatchId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width={2.5} height={6} className="fill-surface" />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              className="fill-danger opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-standard) group-data-[highlight=on]/overflow:opacity-100"
            />
            <rect width="100%" height="100%" fill={`url(#${hatchId})`} />
          </motion.svg>
        </div>
        <motion.span
          data-slot="usage-meter-limit"
          aria-hidden="true"
          style={{ x: limitX, opacity: markerOpacity }}
          className="pointer-events-none absolute inset-y-0 -left-px w-0.5 rounded-[1px] bg-foreground"
        />
      </div>
      {/* The legend doubles as the keyboard path: arrow keys move between categories, focus previews one, a press pins it. */}
      <div
        ref={legendRef}
        data-slot="usage-meter-legend"
        role="group"
        aria-label={copy.legendLabel(values)}
        onKeyDown={onLegendKeyDown}
        className="-mx-(--space-2) grid grid-cols-[repeat(auto-fit,minmax(108px,1fr))] gap-0.5"
      >
        {items.map((item, index) => {
          const isOverage = item.id === USAGE_METER_FREE_ID && status === "over"
          const isFree = item.id === USAGE_METER_FREE_ID
          return (
            <button
              key={item.id}
              type="button"
              data-slot="usage-meter-legend-item"
              data-highlight={highlightOf(item.id)}
              aria-pressed={pinned === item.id}
              aria-label={`${item.label}, ${format(item.value)}`}
              tabIndex={index === rovingIndex ? 0 : -1}
              onClick={() => {
                setRovingIndex(index)
                setPinned((current) => (current === item.id ? null : item.id))
              }}
              onFocus={() => {
                setRovingIndex(index)
                setFocused(item.id)
              }}
              onBlur={() => setFocused(null)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHovered(item.id)
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") setHovered(null)
              }}
              className="grid min-w-0 cursor-pointer justify-items-start gap-0.5 rounded-[calc(var(--radius-control)-6px)] border-0 bg-transparent p-(--space-2) text-left [font:inherit] text-inherit [-webkit-tap-highlight-color:transparent] transition-[background-color,opacity] duration-(--duration-fast) ease-(--ease-standard) hover-fine:bg-surface-muted aria-pressed:bg-surface-muted data-[highlight=off]:opacity-45"
            >
              <span className="flex max-w-full min-w-0 items-center gap-(--space-2) text-sm leading-(--leading-body) text-text-secondary">
                <span aria-hidden="true" className="grid size-3 flex-none place-items-center">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isOverage ? (
                      <motion.span
                        key="alert"
                        className="col-start-1 row-start-1 grid place-items-center text-danger"
                        variants={reduceMotion ? fadeVariants : popVariants}
                        initial="hidden"
                        animate="shown"
                        exit="gone"
                      >
                        <TriangleAlert size={LEGEND_ICON_SIZE_PX} strokeWidth={2} />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="swatch"
                        className={cn(
                          "col-start-1 row-start-1 size-2.5 rounded-[3px]",
                          isFree ? cn(TRACK_COLOR_CLASS_NAME, "shadow-[inset_0_0_0_1px_var(--border-strong)]") : segmentColorClassName(index)
                        )}
                        variants={reduceMotion ? fadeVariants : popVariants}
                        initial="hidden"
                        animate="shown"
                        exit="gone"
                      />
                    )}
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1">
                  <ArcTextSwap text={item.label} reduceMotion={reduceMotion} lineClassName="truncate" />
                </span>
              </span>
              <span className="flex items-baseline gap-1 pl-5 text-base leading-(--leading-body) font-medium text-foreground">
                <ArcOdometer value={item.value} decimals={decimals} locale={locale} reduceMotion={reduceMotion} />
                {unit ? <span className="text-sm font-normal text-text-secondary">{unit}</span> : null}
              </span>
            </button>
          )
        })}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announced.message}
      </p>
    </div>
  )
}

export { UsageMeter }
