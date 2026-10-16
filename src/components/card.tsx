"use client"

/**
 * Arc's Card (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a contained group of related content on
 * Arc's surface, panel radius and spacing, with optional media, an owner byline whose status rolls in word by word, a
 * trailing action and Arc's quick look. A card holding a link or button floats a little on fine-pointer hover and its
 * media drifts in slowly. With `details`, the title becomes the trigger of a dialog that grows out of the card: the
 * surface, photo, title and byline travel on one spring while the details settle in beneath them.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import type { ComponentProps, CSSProperties, ReactNode } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import type { HTMLMotionProps, MotionProps, Transition, Variants } from "motion/react"
import { X } from "lucide-react"

import {
  CARD_CLOSE_HIDDEN_SCALE,
  CARD_CLOSE_LABEL,
  CARD_CLOSE_PRESS_SCALE,
  CARD_DEFAULT_HEADING_LEVEL,
  CARD_DETAILS_OFFSET_PX,
  CARD_GROW_DURATION_S,
  CARD_RETURN_MS,
  CARD_SETTLE_DURATION_S,
  CARD_STATUS_OFFSET_EM,
  CARD_STATUS_WORD_STAGGER_S,
} from "../constants/card.js"
import type { CardHeadingLevel } from "../constants/card.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_SMOOTH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"
import { MotionSlot } from "../motion/motion-slot.js"

export type { CardHeadingLevel }

export type CardProps = Omit<ComponentProps<"article">, "title"> & {
  /** Card heading. Without it the card renders only its surface and children. With `details` it opens the quick look. */
  title?: ReactNode
  /** Supporting line under the title. */
  description?: ReactNode
  /** Image or visual at the top. Zooms slightly on hover. */
  media?: ReactNode
  /** Trailing control of the byline row, such as a button. */
  action?: ReactNode
  /** Small leading visual of the byline, such as the owner's avatar. */
  avatar?: ReactNode
  /** Who the card belongs to, shown in the byline. */
  meta?: ReactNode
  /** Short status under the meta, such as "Actualizada hace 2 horas". Changes roll in word by word and are announced politely. */
  status?: string
  /** Quick look content. With a `title`, the card opens into a larger dialog that grows out of it. */
  details?: ReactNode
  /** Controlled quick look state. */
  open?: boolean
  /** Initial quick look state when uncontrolled. */
  defaultOpen?: boolean
  /** Called when the quick look opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Content rendered after the body and byline, such as a row of actions. */
  footer?: ReactNode
  /** Heading level of the title. */
  headingLevel?: CardHeadingLevel
}

type Side = "card" | "panel"
/** Pixel radii of the card and the quick look, and the card's description width, read back for the morph. */
type Geometry = { card?: number; panel?: number; measure?: number }
/** Where the quick look lands when it closes: the card's box on screen. */
type Landing = { top: number; left: number; width: number; height: number }

/** One critically damped spring carries the surface both ways, so it never overshoots and can reverse mid-flight. */
const grow: Transition = { ...ARC_SPRING_SMOOTH, visualDuration: CARD_GROW_DURATION_S }
const settle: Transition = { ...ARC_SPRING_SMOOTH, visualDuration: CARD_SETTLE_DURATION_S }
const fade: Transition = { duration: ARC_DURATION.instant }
/** Quick look extras arrive once the surface has mostly grown, so they never ride the stretch. */
const reveal: Transition = { delay: ARC_DURATION.instant, duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] }
const closeIn: Transition = { delay: ARC_DURATION.instant, duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] }

/** A new status replaces the whole line: the old one lifts away quickly while the new words rise in one after another. */
const statusLineMotion: Variants = {
  enter: {},
  center: {},
  exit: {
    opacity: 0,
    y: `${-CARD_STATUS_OFFSET_EM}em`,
    filter: `blur(${ARC_BLUR.subtle}px)`,
    transition: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] },
  },
}
const statusWordMotion: Variants = {
  enter: { opacity: 0, y: `${CARD_STATUS_OFFSET_EM}em`, filter: `blur(${ARC_BLUR.soft}px)` },
  center: (order: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter], delay: order * CARD_STATUS_WORD_STAGGER_S },
  }),
}

/** The animated heading element of each title level. */
const MOTION_HEADING = {
  2: motion.h2,
  3: motion.h3,
  4: motion.h4,
} as const satisfies Record<CardHeadingLevel, typeof motion.h3>

/** Splits a status into words and the spaces between them, so each word can rise on its own. */
const STATUS_WORD_SEPARATOR = /(\s+)/

/** Card surface. The outline is a 1px ring in the border token, so the hover shadow can stack on it, and isolation
 * keeps the rounded clip on media while the card lifts (Safari drops it otherwise). */
const cardClassName =
  "group/card relative isolate flex min-w-0 flex-col overflow-hidden rounded-(--radius-panel) bg-surface text-sm text-foreground ring-1 ring-border has-[[data-slot=card-trigger]:focus-visible]:ring-border-strong motion-safe:transition-[translate] motion-safe:duration-(--duration-spring) motion-safe:ease-(--ease-spring) hover-fine:has-[a,button]:motion-safe:-translate-y-0.5"

const titleClassName =
  "m-0 w-fit max-w-full font-sans text-lg leading-[1.3] font-medium tracking-(--tracking-body) text-balance"

const descriptionClassName = "m-0 mt-(--space-2) max-w-[34ch] text-sm leading-(--leading-body) text-pretty text-text-secondary"

/**
 * Arc's status line: the full text for assistive technology, and a decorative copy whose words rise in when it changes.
 * @param props - The status text and whether motion is reduced.
 * @returns The polite status region.
 */
function CardStatus({ text, reduceMotion }: { text: string; reduceMotion: boolean }) {
  return (
    <span data-slot="card-status" role="status" className="relative overflow-x-clip text-text-muted tabular-nums whitespace-nowrap">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="relative block">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            className="block overflow-x-clip text-ellipsis"
            variants={statusLineMotion}
            initial={reduceMotion ? false : "enter"}
            animate="center"
            exit={reduceMotion ? undefined : "exit"}
          >
            {text.split(STATUS_WORD_SEPARATOR).map((part, index) => (
              <motion.span key={index} className="inline-block whitespace-pre" custom={index / 2} variants={statusWordMotion}>
                {part}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  )
}

/**
 * Reads a radius back in pixels: Motion only scale-corrects pixel radii, so token radii are converted for the morph.
 * @param node - Element whose document gives the root font size.
 * @param value - Computed radius, in pixels or rem.
 * @returns The radius in pixels, or `undefined` when it is not a length.
 */
function toPixels(node: Element, value: string): number | undefined {
  const amount = parseFloat(value)
  if (!Number.isFinite(amount)) return undefined
  return value.trim().endsWith("rem") ? amount * parseFloat(getComputedStyle(node.ownerDocument.documentElement).fontSize) : amount
}

/**
 * A content card with optional media, byline, action and footer that can grow into a quick look dialog.
 * @param props - Arc's card content and quick look state, the heading level, a footer and native article attributes.
 * @returns The card article, wrapped in its quick look dialog when `details` is set.
 */
function Card({
  title,
  description,
  media,
  action,
  avatar,
  meta,
  status,
  details,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  footer,
  headingLevel = CARD_DEFAULT_HEADING_LEVEL,
  children,
  className,
  style,
  ...props
}: CardProps) {
  const reduceMotion = usePrefersReducedMotion()
  const layoutGroupId = useId()
  const cardRef = useRef<HTMLElement>(null)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [geometry, setGeometry] = useState<Geometry>({})
  const [landing, setLanding] = useState<Landing | null>(null)
  const hasQuickLook = Boolean(details) && title !== undefined && title !== null
  const isOpen = hasQuickLook ? (openProp ?? uncontrolledOpen) : false
  const shouldMorph = hasQuickLook && !reduceMotion
  const isReturning = !isOpen && landing !== null
  const hasDescription = Boolean(description)
  const MotionHeading = MOTION_HEADING[headingLevel]
  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [openProp, onOpenChange]
  )

  // The quick look keeps the card's line length, so the description never rewraps while it travels.
  useEffect(() => {
    const node = cardRef.current
    const text = descriptionRef.current
    if (!shouldMorph || !node || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      const computed = getComputedStyle(node)
      const cardRadius = toPixels(node, computed.borderTopLeftRadius)
      const panelRadius = toPixels(node, computed.getPropertyValue("--radius-surface"))
      const measure = text?.offsetWidth || undefined
      setGeometry((current) =>
        current.card !== undefined && current.measure === measure
          ? current
          : { card: current.card ?? cardRadius, panel: current.panel ?? panelRadius, measure }
      )
    })
    observer.observe(node)
    if (text) observer.observe(text)
    return () => observer.disconnect()
  }, [shouldMorph, hasDescription])

  // Closing keeps the quick look mounted and sends it back to the card's box, so it never drops behind the page.
  const wasOpen = useRef(isOpen)
  useLayoutEffect(() => {
    const hasClosed = wasOpen.current && !isOpen
    wasOpen.current = isOpen
    const node = cardRef.current
    if (isOpen) {
      setLanding(null)
    } else if (hasClosed && shouldMorph && node) {
      const box = node.getBoundingClientRect()
      setLanding({ top: box.top, left: box.left, width: box.width, height: box.height })
    }
  }, [isOpen, shouldMorph])
  // Once the surface has visually landed, the card takes over, so the handoff has no seam.
  useEffect(() => {
    if (!isReturning) return
    const timer = window.setTimeout(() => setLanding(null), CARD_RETURN_MS)
    return () => window.clearTimeout(timer)
  }, [isReturning])

  /**
   * The same pieces live in the card and in the quick look; a shared id lets each one travel between them. Crossfade is
   * off: the arriving piece takes over at full opacity, so one solid surface moves instead of two translucent copies.
   */
  const shared = (id: string, side: Side, layout: true | "position" = true): MotionProps =>
    shouldMorph
      ? {
          layoutId: id,
          layout,
          layoutCrossfade: false,
          layoutDependency: side === "card" ? isOpen : isReturning ? "return" : "panel",
          transition: { layout: side === "card" ? settle : grow },
        }
      : {}

  const byline = (side: Side) =>
    avatar || meta || status || action ? (
      <div data-slot="card-byline" className="mt-(--space-5) flex items-center justify-between gap-(--space-3)">
        {avatar || meta || status ? (
          <motion.div className="flex min-w-0 flex-auto items-center gap-(--space-3)" {...shared("byline", side, "position")}>
            {avatar ? (
              <span className="grid size-(--space-8) flex-none overflow-hidden rounded-(--radius-pill) bg-surface-muted *:size-full *:object-cover">
                {avatar}
              </span>
            ) : null}
            <span className="grid min-w-0 grid-cols-[minmax(0,1fr)] text-xs leading-(--leading-body)">
              {meta ? <span className="overflow-hidden font-medium text-ellipsis whitespace-nowrap text-foreground">{meta}</span> : null}
              {status ? <CardStatus text={status} reduceMotion={reduceMotion} /> : null}
            </span>
          </motion.div>
        ) : null}
        {action ? (
          <motion.div data-slot="card-action" className="relative z-1 flex flex-none flex-wrap gap-(--space-3)" {...shared("action", side, "position")}>
            {action}
          </motion.div>
        ) : null}
      </div>
    ) : null

  const footerRow = footer ? (
    <div data-slot="card-footer" className="relative z-1 mt-(--space-5) flex items-center justify-between gap-(--space-3)">
      {footer}
    </div>
  ) : null

  const card = (
    <MotionSlot kind="card">
      <motion.article
        {...(props as HTMLMotionProps<"article">)}
        ref={cardRef}
        data-slot="card"
        className={cn(cardClassName, className)}
        style={{ ...style, borderRadius: geometry.card ?? style?.borderRadius }}
        {...shared("card", "card")}
        transition={{ default: ARC_SPRING_SNAPPY, layout: settle }}
      >
        {media ? (
          <motion.div data-slot="card-media" className="relative overflow-hidden bg-surface-muted" {...shared("media", "card")}>
            <div className="grid min-h-28 place-items-center transition-transform duration-(--duration-considered) ease-(--ease-standard) motion-reduce:transition-none pointer-fine:group-hover/card:scale-[1.04] pointer-fine:group-hover/card:duration-[calc(var(--duration-considered)*2)] motion-reduce:scale-100! [&>img]:size-full [&>img]:object-cover">
              {media}
            </div>
          </motion.div>
        ) : null}
        <div data-slot="card-content" className="p-(--space-5)">
          {title !== undefined && title !== null ? (
            <MotionHeading data-slot="card-title" className={titleClassName} {...shared("title", "card")}>
              {hasQuickLook ? (
                  <DialogPrimitive.Trigger asChild>
                    {/* The title's hit area stretches over the whole card, so pointing anywhere opens the quick look
                        while the action stays on top. */}
                    <button
                      type="button"
                      data-slot="card-trigger"
                      className="cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] [letter-spacing:inherit] text-inherit [-webkit-tap-highlight-color:transparent] after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                    >
                      {title}
                    </button>
                  </DialogPrimitive.Trigger>
                ) : (
                  title
                )}
            </MotionHeading>
          ) : null}
          {description ? (
            <motion.p ref={descriptionRef} data-slot="card-description" className={descriptionClassName} {...shared("description", "card", "position")}>
              {description}
            </motion.p>
          ) : null}
          {children}
          {byline("card")}
          {footerRow}
        </div>
      </motion.article>
    </MotionSlot>
  )

  if (!hasQuickLook) return card

  const panelStyle = {
    borderRadius: geometry.panel,
    "--card-measure": geometry.measure ? `${geometry.measure}px` : undefined,
    ...(landing && isReturning
      ? {
          "--landing-top": `${landing.top}px`,
          "--landing-left": `${landing.left}px`,
          "--landing-width": `${landing.width}px`,
          "--landing-height": `${landing.height}px`,
        }
      : {}),
  } as CSSProperties

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <LayoutGroup id={layoutGroupId}>
        {card}
        <AnimatePresence>
          {isOpen || isReturning ? (
            <DialogPrimitive.Portal key="quick-look" forceMount>
              <AnimatePresence>
                {isOpen ? (
                  <DialogPrimitive.Overlay key="overlay" asChild forceMount>
                    <motion.div
                      data-slot="card-quick-look-overlay"
                      className="fixed inset-0 z-50 bg-[oklch(10%_0_0/0.46)] supports-backdrop-filter:backdrop-blur-[7px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: reduceMotion ? fade : { duration: ARC_DURATION.exit, ease: [...ARC_EASE.standard] } }}
                      transition={reduceMotion ? fade : { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] }}
                    />
                  </DialogPrimitive.Overlay>
                ) : null}
              </AnimatePresence>
              <DialogPrimitive.Content asChild forceMount {...(description ? {} : { "aria-describedby": undefined })}>
                <motion.div
                  data-slot="card-quick-look"
                  data-returning={isReturning || undefined}
                  // While it flies back the dialog has already closed, so its panel leaves the tab order and the
                  // accessibility tree at once.
                  inert={isReturning || undefined}
                  aria-hidden={isReturning || undefined}
                  className="group/quick-look fixed inset-0 z-50 m-auto h-fit max-h-[calc(100dvh-var(--space-8))] w-[min(calc(100vw-var(--space-8)),30rem)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-(--radius-surface) border border-border bg-surface-raised text-sm text-foreground shadow-(--shadow-floating) transition-[background-color,box-shadow] duration-(--duration-standard) ease-(--ease-standard) focus:outline-none data-returning:pointer-events-none data-returning:inset-auto data-returning:top-(--landing-top) data-returning:left-(--landing-left) data-returning:m-0 data-returning:h-(--landing-height) data-returning:max-h-none data-returning:w-(--landing-width) data-returning:overflow-hidden data-returning:bg-surface data-returning:shadow-none"
                  data-framer-portal-id={layoutGroupId}
                  layoutScroll
                  style={panelStyle}
                  {...(shouldMorph
                    ? {
                        ...shared("card", "panel"),
                        initial: false,
                        animate:
                          geometry.card !== undefined && geometry.panel !== undefined
                            ? { borderRadius: isReturning ? geometry.card : geometry.panel }
                            : undefined,
                        transition: { layout: isReturning ? settle : grow, borderRadius: isReturning ? settle : grow },
                        exit: { opacity: 0, transition: { duration: 0 } },
                      }
                    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: fade }, transition: fade })}
                >
                  {media ? (
                    <motion.div className="relative overflow-hidden bg-surface-muted" {...shared("media", "panel")}>
                      <div className="grid min-h-28 place-items-center [&>img]:size-full [&>img]:object-cover">{media}</div>
                    </motion.div>
                  ) : null}
                  <motion.span
                    className="absolute top-(--space-4) right-(--space-4) z-2 grid"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: CARD_CLOSE_HIDDEN_SCALE }}
                    animate={isReturning ? { opacity: 0, scale: CARD_CLOSE_HIDDEN_SCALE } : { opacity: 1, scale: 1 }}
                    transition={isReturning || reduceMotion ? fade : closeIn}
                  >
                    <DialogPrimitive.Close asChild>
                      <motion.button
                        type="button"
                        data-slot="card-quick-look-close"
                        aria-label={CARD_CLOSE_LABEL}
                        className="grid size-(--space-8) cursor-pointer place-items-center rounded-(--radius-pill) border border-[color-mix(in_oklab,var(--border)_70%,transparent)] bg-[color-mix(in_oklab,var(--surface-raised)_74%,transparent)] p-0 text-foreground [-webkit-tap-highlight-color:transparent] backdrop-blur-[12px] transition-[background-color] duration-(--duration-fast) ease-(--ease-standard) hover-fine:bg-surface-raised"
                        whileTap={reduceMotion ? undefined : { scale: CARD_CLOSE_PRESS_SCALE }}
                        transition={ARC_SPRING_SNAPPY}
                      >
                        <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
                      </motion.button>
                    </DialogPrimitive.Close>
                  </motion.span>
                  <div className="p-(--space-6) group-data-returning/quick-look:p-(--space-5)">
                    <DialogPrimitive.Title asChild>
                      <motion.h2
                        className={cn(titleClassName, "text-xl group-data-returning/quick-look:text-lg")}
                        {...shared("title", "panel")}
                      >
                        {title}
                      </motion.h2>
                    </DialogPrimitive.Title>
                    {description ? (
                      <DialogPrimitive.Description asChild>
                        <motion.p
                          className={cn(descriptionClassName, "max-w-[var(--card-measure,34ch)]")}
                          {...shared("description", "panel", "position")}
                        >
                          {description}
                        </motion.p>
                      </DialogPrimitive.Description>
                    ) : null}
                    {/* The children stay mounted in the card alone: a second copy here would restart their state and
                        duplicate their ids. */}
                    {byline("panel")}
                    {footerRow}
                    <motion.div
                      data-slot="card-details"
                      className="mt-(--space-6) border-t border-border pt-(--space-5) text-sm leading-(--leading-body) text-text-secondary"
                      initial={reduceMotion ? false : { opacity: 0, y: CARD_DETAILS_OFFSET_PX }}
                      animate={isReturning ? { opacity: 0, y: 0 } : { opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: fade }}
                      transition={isReturning || reduceMotion ? fade : reveal}
                    >
                      {details}
                    </motion.div>
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </DialogPrimitive.Root>
  )
}

export { Card }
