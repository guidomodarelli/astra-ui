"use client"

/**
 * Arc's Timeline (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): follow what happened, newest first,
 * grouped by day. Day labels stay pinned while their updates scroll, the connecting line draws itself as rows come into
 * view, rows with details expand in place, and new updates slide in at the top while the rest glide down. Arrow keys
 * move between expandable rows; Enter or Space expands one.
 */
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react"
import type { ComponentProps, CSSProperties, KeyboardEvent, ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { Transition } from "motion/react"
import { ChevronDown } from "lucide-react"

import {
  TIMELINE_AVATAR_SIZE_PX,
  TIMELINE_DEFAULT_HEADING_LEVEL,
  TIMELINE_DEFAULT_LOCALE,
  TIMELINE_DEFAULT_MESSAGES,
  TIMELINE_DEFAULT_TIME_ZONE,
  TIMELINE_FRESH_ROW_DELAY_S,
  TIMELINE_RELATIVE_WINDOW_HOURS,
  TIMELINE_REVEAL_AMOUNT,
  TIMELINE_REVEAL_QUEUE_LIMIT_S,
  TIMELINE_REVEAL_STEP_S,
} from "../constants/timeline.js"
import type { TimelineHeadingLevel, TimelineMessages, TimelineTone } from "../constants/timeline.js"
import { useIsHydrated } from "../hooks/use-is-hydrated.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ArcTextSwap } from "../motion/arc-text-swap.js"
import type { ArcTextSwapDirection } from "../motion/arc-text-swap.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_MORPH, ARC_SPRING_SMOOTH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"

export type { TimelineHeadingLevel, TimelineMessages, TimelineTone }

export type TimelineEvent = {
  id: string
  /** When it happened, as an ISO string or epoch milliseconds. */
  at: string | number
  /** Who did it, shown first in the foreground colour. */
  actor?: string
  /** What happened, completing the actor: "aprobó la solicitud". */
  title: string
  /** Short context under the title. */
  meta?: string
  /** Revealed in place when the row is expanded. Rows without detail are not interactive. */
  detail?: ReactNode
  /** Portrait URL for an event by a person. */
  avatar?: string
  /** Icon for a system event, used when there is no avatar. */
  icon?: ReactNode
  /** Status of a system event. Always say the outcome in the title too, so it never rests on colour. */
  tone?: TimelineTone
}

export type TimelineProps = Omit<ComponentProps<"div">, "children" | "role"> & {
  /** Updates in any order; the newest shows first. Rows with `detail` are expandable. */
  events: TimelineEvent[]
  /** Reference time for relative labels and day groups, in epoch milliseconds. Pass a ticking clock to keep labels fresh. */
  now: number
  /** Accessible name of the feed. */
  label: string
  /** Time zone of day groups and clock times. Defaults to `"UTC"`, so server and client agree. */
  timeZone?: string
  /** Locale of day labels and clock times. Defaults to `"es-AR"`. */
  locale?: string
  /** Height of the scrolling area. Without it the feed grows with the page. */
  maxHeight?: number | string
  /** Scrolls back to the top when a new update arrives. Defaults to `true`. */
  scrollToNew?: boolean
  /** Event ids expanded on mount. */
  defaultExpanded?: string[]
  /** Heading level of the day labels. Defaults to 3. */
  headingLevel?: TimelineHeadingLevel
  /** Replaces any of the Spanish day labels, relative times, counts and announcements. */
  messages?: Partial<TimelineMessages>
}

type Row = TimelineEvent & { time: number; day: string }
type Group = { day: string; label: string; rows: Row[] }

const MILLISECONDS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * MINUTES_PER_HOUR
/** Length of a `YYYY-MM-DD` day key, the start of an ISO timestamp. */
const DAY_KEY_LENGTH = 10
const MILLISECONDS_PER_SECOND = 1000
const enterEase = [...ARC_EASE.enter] as [number, number, number, number]
const standardEase = [...ARC_EASE.standard] as [number, number, number, number]
/** Quick fades that replace travel with reduced motion. */
const REDUCED_FADE_S = 0.15
const REDUCED_EXIT_S = 0.1
/** Delays, in seconds, between a row's marker popping and its line drawing, and before new content fades in. */
const LINE_DRAW_DELAY_S = 0.1
const CONTENT_FADE_DELAY_S = 0.05
const DETAIL_FADE_DELAY_S = 0.06
/** Visual durations, in seconds, of the marker pop, the line draw, a row leaving and details collapsing. */
const MARKER_POP_DURATION_S = 0.36
const MARKER_POP_BOUNCE = 0.32
const LINE_DRAW_DURATION_S = 0.34
const ROW_EXIT_DURATION_S = 0.3
const DETAIL_COLLAPSE_DURATION_S = 0.28
/** Travel, in pixels, of a new row's content and of expanded details settling in. */
const FRESH_CONTENT_OFFSET_PX = -10
const DETAIL_OFFSET_PX = -4
/** Scale a marker pops from. */
const MARKER_ENTER_SCALE = 0.4
const CHEVRON_SIZE_PX = 16
const HALF_TURN_DEG = 180

/** Rows reveal against the viewport, so rows that come into view together are spaced a beat apart. */
type RevealClock = { schedule: () => number; reduceMotion: boolean; fresh: Set<string> }
const RevealClockContext = createContext<RevealClock | null>(null)

/**
 * Keys a time by its calendar day in a time zone.
 * @param time - Epoch milliseconds.
 * @param timeZone - Time zone of the day groups.
 * @returns The day as `YYYY-MM-DD`.
 */
function dayKey(time: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(time))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

/**
 * The calendar day before a day key. It works on the date itself, so a daylight-saving change, where a day lasts 23 or
 * 25 hours, never skips or repeats a day.
 * @param day - A day as `YYYY-MM-DD`.
 * @returns The previous day as `YYYY-MM-DD`.
 */
function previousDayKey(day: string): string {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(Date.UTC(year!, month! - 1, date! - 1)).toISOString().slice(0, DAY_KEY_LENGTH)
}

/**
 * Relative time of a recent event, short for the row and long for screen readers.
 * @param time - When the event happened, in epoch milliseconds.
 * @param now - Reference time, in epoch milliseconds.
 * @param copy - Timeline copy.
 * @returns Short and long relative times.
 */
function relativeTime(time: number, now: number, copy: TimelineMessages): { short: string; long: string } {
  const minutes = Math.max(0, Math.floor((now - time) / MILLISECONDS_PER_MINUTE))
  if (minutes < 1) return { short: copy.justNowShort, long: copy.justNowLong }
  if (minutes < MINUTES_PER_HOUR) return { short: copy.minutesShort(minutes), long: copy.minutesLong(minutes) }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  return { short: copy.hoursShort(hours), long: copy.hoursLong(hours) }
}

/** The day's update count rolls digit by digit in the direction it moved. */
function RollingCount({ value, reduceMotion }: { value: number; reduceMotion: boolean }) {
  const [state, setState] = useState<{ value: number; direction: ArcTextSwapDirection }>({ value, direction: 1 })
  if (state.value !== value) setState({ value, direction: value > state.value ? 1 : -1 })
  const characters = [...String(value)]
  return (
    <span aria-hidden="true" className="inline-flex">
      {characters.map((character, index) => (
        <span key={characters.length - index} className="relative inline-flex overflow-clip [overflow-clip-margin:.15em]">
          <ArcTextSwap text={character} reduceMotion={reduceMotion} direction={state.direction} className="inline-flex" lineClassName="inline-block whitespace-nowrap" />
        </span>
      ))}
    </span>
  )
}

type DaySectionProps = { labelId: string; isFresh: boolean; reduceMotion: boolean; children: ReactNode }

/** A day's section. A new day opens from nothing and pushes the older days down; it clips only while it grows. */
function DaySection({ labelId, isFresh, reduceMotion, children }: DaySectionProps) {
  const [isEntering, setIsEntering] = useState(isFresh)
  return (
    <motion.section
      data-slot="timeline-day"
      aria-labelledby={labelId}
      className={cn("relative", isEntering && "overflow-clip")}
      initial={isFresh ? { height: 0, opacity: 0 } : false}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0, transition: { duration: reduceMotion ? ARC_DURATION.instant : ARC_DURATION.exit, ease: standardEase } }}
      transition={
        reduceMotion
          ? { duration: REDUCED_FADE_S }
          : { height: ARC_SPRING_SMOOTH, opacity: { duration: ARC_DURATION.standard, ease: enterEase } }
      }
      onAnimationComplete={() => setIsEntering(false)}
    >
      {children}
    </motion.section>
  )
}

type TimelineRowProps = {
  row: Row
  isLast: boolean
  isExpanded: boolean
  onToggle: () => void
  timeLabel: string
  timeFull: string
}

/** Marker colours: a quiet node for system events, tinted by tone. Portraits sit on a hairline ring. */
const MARKER_TONE_CLASS_NAMES = {
  neutral: "bg-surface",
  success: "bg-[color-mix(in_oklab,var(--success)_12%,var(--surface))] text-success",
  danger: "bg-[color-mix(in_oklab,var(--danger)_12%,var(--surface))] text-danger",
} as const satisfies Record<TimelineTone, string>

/** One update: a marker on the line, the copy and time, and details that expand in place. */
function TimelineRow({ row, isLast, isExpanded, onToggle, timeLabel, timeFull }: TimelineRowProps) {
  const clock = useContext(RevealClockContext)!
  const { reduceMotion } = clock
  const detailId = useId()
  // The row reveals once, the first time it scrolls into view: its marker pops, then its line draws toward the next row.
  const [revealDelay, setRevealDelay] = useState<number | null>(null)
  const isFresh = clock.fresh.has(row.id)
  const [isEntering, setIsEntering] = useState(isFresh)
  const isShown = revealDelay !== null
  const delay = (revealDelay ?? 0) + (isFresh ? TIMELINE_FRESH_ROW_DELAY_S : 0)
  const pop: Transition = reduceMotion
    ? { duration: 0, opacity: { duration: REDUCED_FADE_S } }
    : {
        ...ARC_SPRING_MORPH,
        visualDuration: MARKER_POP_DURATION_S,
        bounce: MARKER_POP_BOUNCE,
        delay,
        opacity: { duration: ARC_DURATION.fast, ease: enterEase, delay },
      }
  const draw: Transition = reduceMotion ? { duration: 0 } : { ...ARC_SPRING_SMOOTH, visualDuration: LINE_DRAW_DURATION_S, delay: delay + LINE_DRAW_DELAY_S }
  const tone = row.avatar ? undefined : (row.tone ?? "neutral")
  const triggerClassName =
    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-(--space-3) rounded-(--radius-control) border-0 bg-transparent px-(--space-3) py-3 text-left [font:inherit] text-inherit [-webkit-tap-highlight-color:transparent] transition-[background-color] duration-(--duration-fast) ease-(--ease-standard) max-[420px]:gap-x-(--space-2) max-[420px]:px-(--space-2) motion-reduce:transition-none"
  const content = (
    <>
      <span className="grid min-w-0 gap-0.5">
        <span data-slot="timeline-title" className="text-sm leading-5 text-text-secondary">
          {row.actor ? <span className="font-medium text-foreground">{row.actor}</span> : null}
          {row.actor ? " " : ""}
          {row.title}
        </span>
        {row.meta ? <span className="text-xs leading-(--leading-body) text-text-muted">{row.meta}</span> : null}
      </span>
      {/* Times keep a steady column, so "9 min" becoming "10 min" never rewraps the title beside it. */}
      <time
        data-slot="timeline-time"
        dateTime={new Date(row.time).toISOString()}
        title={timeFull}
        className="flex min-w-11 justify-end text-xs leading-5 whitespace-nowrap text-text-muted tabular-nums"
      >
        <span aria-hidden="true">
          <ArcTextSwap text={timeLabel} reduceMotion={reduceMotion} className="inline-flex" lineClassName="inline-block whitespace-nowrap" />
        </span>
        <span className="sr-only">{timeFull}</span>
      </time>
    </>
  )

  return (
    <motion.li
      data-slot="timeline-item"
      className={cn("relative pl-[calc(var(--marker)+var(--space-2))]", isEntering && "overflow-clip")}
      initial={isFresh ? { height: 0 } : false}
      animate={{ height: "auto" }}
      exit={{
        height: 0,
        opacity: 0,
        transition: reduceMotion
          ? { duration: REDUCED_EXIT_S }
          : { height: { ...ARC_SPRING_SMOOTH, visualDuration: ROW_EXIT_DURATION_S }, opacity: { duration: ARC_DURATION.instant } },
      }}
      transition={reduceMotion ? { duration: 0 } : ARC_SPRING_SMOOTH}
      onAnimationComplete={() => setIsEntering(false)}
      onViewportEnter={() => setRevealDelay((current) => current ?? clock.schedule())}
      viewport={{ once: true, amount: TIMELINE_REVEAL_AMOUNT }}
    >
      <motion.span
        data-slot="timeline-marker"
        data-tone={tone}
        aria-hidden="true"
        className={cn(
          "absolute top-(--marker-top) left-0 z-1 grid size-(--marker) place-items-center rounded-(--radius-pill) text-text-secondary after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] after:content-[''] [&_svg]:size-3.5 [&_svg]:stroke-2",
          tone && MARKER_TONE_CLASS_NAMES[tone]
        )}
        initial={{ scale: MARKER_ENTER_SCALE, opacity: 0 }}
        animate={isShown ? { scale: 1, opacity: 1 } : undefined}
        transition={pop}
      >
        {row.avatar ? (
          <img
            src={row.avatar}
            alt=""
            width={TIMELINE_AVATAR_SIZE_PX}
            height={TIMELINE_AVATAR_SIZE_PX}
            decoding="async"
            className="block size-full rounded-[inherit] object-cover"
          />
        ) : (
          row.icon
        )}
      </motion.span>
      {/* The line runs from just under this marker to just above the next one and draws downward from its top. */}
      {!isLast ? (
        <motion.span
          data-slot="timeline-line"
          aria-hidden="true"
          className="absolute top-[calc(var(--marker-top)+var(--marker)+var(--line-gap))] bottom-[calc(var(--line-gap)-var(--marker-top))] left-[calc(var(--marker)/2_-_.5px)] w-px origin-top bg-border-strong"
          initial={{ scaleY: 0 }}
          animate={isShown ? { scaleY: 1 } : undefined}
          transition={draw}
        />
      ) : null}
      <motion.div
        className="min-w-0"
        initial={isFresh ? (reduceMotion ? { opacity: 0 } : { opacity: 0, y: FRESH_CONTENT_OFFSET_PX, filter: `blur(${ARC_BLUR.soft}px)` }) : false}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={
          reduceMotion
            ? { duration: REDUCED_FADE_S }
            : {
                y: ARC_SPRING_SMOOTH,
                opacity: { duration: ARC_DURATION.standard, ease: enterEase, delay: CONTENT_FADE_DELAY_S },
                filter: { duration: ARC_DURATION.standard, ease: enterEase, delay: CONTENT_FADE_DELAY_S },
              }
        }
      >
        {row.detail ? (
          <button
            type="button"
            data-timeline-trigger=""
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? detailId : undefined}
            onClick={onToggle}
            className={cn(triggerClassName, "cursor-pointer grid-cols-[minmax(0,1fr)_auto_16px] hover-fine:bg-surface-muted active:bg-surface-muted")}
          >
            {content}
            <motion.span
              aria-hidden="true"
              className="grid h-5 place-items-center text-text-muted"
              initial={false}
              animate={{ rotate: isExpanded ? HALF_TURN_DEG : 0 }}
              transition={reduceMotion ? { duration: 0 } : ARC_SPRING_SNAPPY}
            >
              <ChevronDown size={CHEVRON_SIZE_PX} strokeWidth={1.75} />
            </motion.span>
          </button>
        ) : (
          <div className={triggerClassName}>{content}</div>
        )}
        <AnimatePresence initial={false}>
          {isExpanded && row.detail ? (
            <motion.div
              key="detail"
              id={detailId}
              data-slot="timeline-detail"
              className="overflow-clip [overflow-clip-margin:4px]"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0, transition: reduceMotion ? { duration: 0 } : { ...ARC_SPRING_SMOOTH, visualDuration: DETAIL_COLLAPSE_DURATION_S } }}
              transition={reduceMotion ? { duration: 0 } : ARC_SPRING_SMOOTH}
            >
              <motion.div
                className="px-(--space-3) pb-(--space-4) text-sm leading-(--leading-body) text-text-secondary max-[420px]:px-(--space-2)"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: DETAIL_OFFSET_PX, filter: `blur(${ARC_BLUR.soft}px)` }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, transition: { duration: ARC_DURATION.instant, ease: standardEase } }}
                transition={reduceMotion ? { duration: REDUCED_FADE_S } : { duration: ARC_DURATION.standard, ease: enterEase, delay: DETAIL_FADE_DELAY_S }}
              >
                {row.detail}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.li>
  )
}

/**
 * A vertical activity feed grouped by day with pinned day labels and rows that expand in place.
 * @param props - Events, reference time, accessible name, formatting, scrolling, copy and native div attributes.
 * @returns The labelled feed region.
 */
function Timeline({
  events,
  now,
  label,
  timeZone = TIMELINE_DEFAULT_TIME_ZONE,
  locale = TIMELINE_DEFAULT_LOCALE,
  maxHeight,
  scrollToNew = true,
  defaultExpanded = [],
  headingLevel = TIMELINE_DEFAULT_HEADING_LEVEL,
  messages,
  className,
  ...props
}: TimelineProps) {
  const copy: TimelineMessages = { ...TIMELINE_DEFAULT_MESSAGES, ...messages }
  const prefersReducedMotion = usePrefersReducedMotion()
  // Reduced motion applies only after hydration, so the server and the first client render agree.
  const isHydrated = useIsHydrated()
  const reduceMotion = isHydrated && prefersReducedMotion
  const id = useId()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded))

  // Rows added after the first render are fresh: they slide in and the rest glide down. Their titles are announced.
  const ids = events.map((event) => event.id).join("|")
  const [known, setKnown] = useState(() => ({ ids, set: new Set(events.map((event) => event.id)), fresh: new Set<string>(), announcement: "", announcementCount: 0 }))
  if (known.ids !== ids) {
    const added = events.filter((event) => !known.set.has(event.id))
    setKnown({
      ids,
      set: new Set(events.map((event) => event.id)),
      fresh: new Set([...known.fresh, ...added.map((event) => event.id)]),
      announcement: added.length
        ? copy.newUpdates(added.map((event) => [event.actor, event.title].filter(Boolean).join(" ")).join(". "))
        : known.announcement,
      // Counts announcements, so a repeated summary still replaces the live region's node and is read again.
      announcementCount: known.announcementCount + (added.length ? 1 : 0),
    })
  }

  // The bottom edge feathers while more updates wait below, and clears once the end is in view.
  const scrolls = maxHeight !== undefined
  useEffect(() => {
    const scroller = scrollerRef.current
    const track = trackRef.current
    if (!scrolls || !scroller || !track || typeof ResizeObserver === "undefined") return
    const update = () => {
      if (scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > 2) scroller.dataset.more = ""
      else delete scroller.dataset.more
    }
    update()
    scroller.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    observer.observe(track)
    return () => {
      scroller.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [scrolls])

  const newestId = events.reduce<TimelineEvent | null>(
    (latest, event) => (!latest || new Date(event.at).getTime() > new Date(latest.at).getTime() ? event : latest),
    null
  )?.id
  // Only a new newest event scrolls back to the top; a change of `scrollToNew` or of the motion preference never does.
  const scrollOptions = useRef({ scrollToNew, reduceMotion })
  useEffect(() => {
    scrollOptions.current = { scrollToNew, reduceMotion }
  })
  const shownNewestId = useRef(newestId)
  useEffect(() => {
    if (shownNewestId.current === newestId) return
    shownNewestId.current = newestId
    const scroller = scrollerRef.current
    if (!scrollOptions.current.scrollToNew || !scroller || scroller.scrollTop < 1) return
    scroller.scrollTo({ top: 0, behavior: scrollOptions.current.reduceMotion ? "auto" : "smooth" })
  }, [newestId])

  const [initialDays] = useState(() => new Set(events.map((event) => dayKey(new Date(event.at).getTime(), timeZone))))
  const { today: todayLabel, yesterday: yesterdayLabel } = copy
  const todayKey = dayKey(now, timeZone)
  const groups = useMemo<Group[]>(() => {
    const today = dayKey(now, timeZone)
    const yesterday = previousDayKey(today)
    const heading = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", timeZone })
    const byDay = new Map<string, Row[]>()
    events
      .map((event) => ({ ...event, time: new Date(event.at).getTime() }))
      .sort((first, second) => second.time - first.time)
      .forEach((event) => {
        const day = dayKey(event.time, timeZone)
        byDay.set(day, [...(byDay.get(day) ?? []), { ...event, day }])
      })
    return [...byDay].map(([day, rows]) => ({
      day,
      rows,
      label: day === today ? todayLabel : day === yesterday ? yesterdayLabel : heading.format(new Date(rows[0]!.time)),
    }))
  }, [events, now, timeZone, locale, todayLabel, yesterdayLabel])
  const formats = useMemo(
    () => ({
      clock: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone }),
      full: new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone }),
    }),
    [locale, timeZone]
  )

  // Rows that come into view together are spaced a beat apart, so the line reads as drawing down the feed.
  const nextReveal = useRef(0)
  const schedule = useCallback(() => {
    if (reduceMotion) return 0
    const current = performance.now() / MILLISECONDS_PER_SECOND
    const start = Math.min(Math.max(current, nextReveal.current), current + TIMELINE_REVEAL_QUEUE_LIMIT_S)
    nextReveal.current = start + TIMELINE_REVEAL_STEP_S
    return start - current
  }, [reduceMotion])
  const clock = useMemo<RevealClock>(() => ({ schedule, reduceMotion, fresh: known.fresh }), [schedule, reduceMotion, known.fresh])

  const toggle = (eventId: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(eventId)) next.delete(eventId)
      else next.add(eventId)
      return next
    })
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return
    const triggers = [...(scrollerRef.current?.querySelectorAll<HTMLElement>("[data-timeline-trigger]") ?? [])]
    const index = triggers.indexOf(document.activeElement as HTMLElement)
    if (index < 0) return
    event.preventDefault()
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? triggers.length - 1
          : Math.min(Math.max(index + (event.key === "ArrowDown" ? 1 : -1), 0), triggers.length - 1)
    triggers[next]?.focus()
  }

  return (
    <RevealClockContext.Provider value={clock}>
      <div
        data-slot="timeline"
        role="region"
        aria-label={label}
        className={cn("relative grid min-w-0 text-foreground [--line-gap:4px] [--marker-top:8px] [--marker:28px]", className)}
        {...props}
      >
        <div
          ref={scrollerRef}
          data-slot="timeline-scroller"
          data-scrolls={scrolls || undefined}
          className="min-w-0 [overflow-anchor:none] data-scrolls:max-h-(--timeline-height) data-scrolls:overflow-y-auto data-scrolls:overscroll-contain data-scrolls:[scrollbar-color:var(--border-strong)_transparent] data-scrolls:[scrollbar-width:thin] data-more:[mask-image:linear-gradient(to_bottom,#000_calc(100%_-_36px),transparent)]"
          style={scrolls ? ({ "--timeline-height": typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight } as CSSProperties) : undefined}
          onKeyDown={onKeyDown}
        >
          {/* Presence starts enabled so markers keep their hidden first frame; rows and days present at mount opt out of entering. */}
          <div ref={trackRef}>
            <AnimatePresence>
              {groups.map((group) => {
                const labelId = `${id}-${group.day}`
                const noun = copy.updates(group.rows.length)
                return (
                  <DaySection key={group.day} labelId={labelId} isFresh={!initialDays.has(group.day)} reduceMotion={reduceMotion}>
                    {/* Day labels stay pinned while their updates scroll under them. Set --timeline-surface on another surface. */}
                    <div
                      id={labelId}
                      role="heading"
                      aria-level={headingLevel}
                      className="sticky top-0 z-2 flex items-baseline justify-between gap-(--space-3) bg-[var(--timeline-surface,var(--surface))] py-(--space-2) pr-(--space-3) text-sm leading-(--leading-body) font-medium text-foreground"
                    >
                      <span>{group.label}</span>
                      <span aria-hidden="true" className="inline-flex items-baseline text-xs font-normal whitespace-pre text-text-muted tabular-nums">
                        <RollingCount value={group.rows.length} reduceMotion={reduceMotion} />
                        {` ${noun}`}
                      </span>
                      <span className="sr-only">{`, ${group.rows.length} ${noun}`}</span>
                    </div>
                    <ol className="m-0 mb-(--space-3) list-none p-0">
                      <AnimatePresence>
                        {group.rows.map((row, index) => {
                          const isRecent = group.day === todayKey && now - row.time < TIMELINE_RELATIVE_WINDOW_HOURS * MILLISECONDS_PER_HOUR
                          const full = formats.full.format(new Date(row.time))
                          const relative = isRecent ? relativeTime(row.time, now, copy) : null
                          return (
                            <TimelineRow
                              key={row.id}
                              row={row}
                              isLast={index === group.rows.length - 1}
                              isExpanded={expanded.has(row.id)}
                              onToggle={() => toggle(row.id)}
                              timeLabel={relative ? relative.short : formats.clock.format(new Date(row.time))}
                              timeFull={relative ? `${relative.long}, ${full}` : full}
                            />
                          )
                        })}
                      </AnimatePresence>
                    </ol>
                  </DaySection>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
        <span className="sr-only" role="status">
          <span key={known.announcementCount}>{known.announcement}</span>
        </span>
      </div>
    </RevealClockContext.Provider>
  )
}

export { Timeline }
