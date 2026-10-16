"use client"

/**
 * Arc's Hover Card (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a read-only preview of a person or
 * link that opens after half a second of hover or on keyboard focus, grows from the trigger edge on a smooth spring
 * and closes fast on leave. While a card is open, and briefly after it closes, moving to another trigger opens its
 * card almost at once and only fades. It keeps the Radix composition and adds Arc's `HoverCardProfile` preset.
 */
import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"
import { motion, type HTMLMotionProps } from "motion/react"

import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { ArcFloatingSlot } from "../motion/arc-floating-slot.js"
import { ARC_DURATION, ARC_EASE } from "../motion/arc-tokens.js"
import { createOverlayWarmth, useOpenedWhileWarm } from "../motion/overlay-warmth.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../motion/presence.js"
import { cn } from "../lib/utils.js"
import {
  HOVER_CARD_CLOSE_DELAY_MS,
  HOVER_CARD_COLLISION_PADDING_PX,
  HOVER_CARD_INSTANT_MOTION,
  HOVER_CARD_MOTION,
  HOVER_CARD_OPEN_DELAY_MS,
  HOVER_CARD_PROFILE_INITIALS_LENGTH,
  HOVER_CARD_PROFILE_PORTRAIT_SIZE_PX,
  HOVER_CARD_PROFILE_ROW_ORDER,
  HOVER_CARD_PROFILE_SETTLE_DELAY_S,
  HOVER_CARD_PROFILE_SETTLE_DISTANCE_PX,
  HOVER_CARD_PROFILE_STAGGER_S,
  HOVER_CARD_SIDE_OFFSET_PX,
  HOVER_CARD_SKIP_WINDOW_MS,
  HOVER_CARD_WARM_OPEN_DELAY_MS,
} from "../constants/hover-card.js"

/** Every hover card on the page shares one skip window. */
const hoverCardWarmth = createOverlayWarmth(HOVER_CARD_SKIP_WINDOW_MS)

/** Whether the page was already warm when the surrounding layer opened, so its entrance only fades. */
const HoverCardOpenedWhileWarmContext = React.createContext(false)

/**
 * Owns the open state and timing of one hover card.
 * @param props - Radix root properties. `openDelay` defaults to Arc's 500ms and `closeDelay` to 140ms; within the
 *   skip window the card waits at most 80ms.
 * @returns The hover card root.
 */
function HoverCard({
  openDelay = HOVER_CARD_OPEN_DELAY_MS,
  closeDelay = HOVER_CARD_CLOSE_DELAY_MS,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)
  const isWarm = React.useSyncExternalStore(
    hoverCardWarmth.subscribe,
    hoverCardWarmth.isWarm,
    hoverCardWarmth.isWarmOnServer
  )
  const openedWhileWarm = useOpenedWhileWarm(motionOpen, isWarm)

  React.useEffect(() => {
    if (!motionOpen) return
    return hoverCardWarmth.open()
  }, [motionOpen])

  return (
    <MotionOpenProvider scope="hover-card" open={motionOpen}>
      <HoverCardOpenedWhileWarmContext.Provider value={openedWhileWarm}>
        <HoverCardPrimitive.Root
          data-slot="hover-card"
          {...props}
          openDelay={isWarm ? Math.min(openDelay, HOVER_CARD_WARM_OPEN_DELAY_MS) : openDelay}
          closeDelay={closeDelay}
          open={motionOpen}
          onOpenChange={setMotionOpen}
        />
      </HoverCardOpenedWhileWarmContext.Provider>
    </MotionOpenProvider>
  )
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

/**
 * Renders Arc's card: raised surface, hairline border, panel radius and floating shadow, 18.5rem wide at most.
 * @param props - Radix content properties. `align` defaults to `center`, `sideOffset` to 8px and `collisionPadding`
 *   to 12px.
 * @returns The portaled card.
 */
function HoverCardContent({
  className,
  align = "center",
  sideOffset = HOVER_CARD_SIDE_OFFSET_PX,
  collisionPadding = HOVER_CARD_COLLISION_PADDING_PX,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  // Within the skip window the layer opens in place and only fades.
  const openedWhileWarm = React.useContext(HoverCardOpenedWhileWarmContext)
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal" forceMount>
      <MotionPresence scope="hover-card" forceMount={props.forceMount}>
        <ArcFloatingSlot motion={() => (openedWhileWarm ? HOVER_CARD_INSTANT_MOTION : HOVER_CARD_MOTION)}>
          <HoverCardPrimitive.Content
            forceMount
            data-slot="hover-card-content"
            align={align}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            className={cn(
              "z-50 box-border w-74 max-w-[min(18.5rem,var(--radix-hover-card-content-available-width,calc(100vw-24px)))] origin-(--radix-hover-card-content-transform-origin) rounded-(--radius-panel) border border-border bg-surface-raised p-(--space-4) font-sans text-sm leading-(--leading-body) tracking-(--tracking-body) text-foreground shadow-(--shadow-floating) outline-hidden",
              className
            )}
            {...props}
          />
        </ArcFloatingSlot>
      </MotionPresence>
    </HoverCardPrimitive.Portal>
  )
}

/** One number of `HoverCardProfile`, such as followers or projects. */
export interface HoverCardStat {
  label: string
  value: string | number
}

/** A person preview for `HoverCardContent`. */
export interface HoverCardProfileProps {
  name: string
  /** Role and team, such as "Diseñadora de producto, Pagos". */
  role?: string
  /** A portrait URL, or your own image element such as an `Image` adapter. Initials show when it is missing. */
  avatar?: string | React.ReactNode
  bio?: string
  stats?: HoverCardStat[]
  /** A footer line, such as a location and local time. */
  meta?: React.ReactNode
  className?: string
}

/**
 * Shows a portrait that fades in from a soft blur while it downloads, and at once when it is cached.
 * @param props.source - Portrait URL.
 * @returns The decorative portrait image.
 */
function HoverCardPortrait({ source }: { source: string }) {
  const [isLoading, setIsLoading] = React.useState(false)
  const imageRef = React.useRef<HTMLImageElement>(null)
  React.useLayoutEffect(() => {
    const image = imageRef.current
    setIsLoading(Boolean(image && !image.complete))
  }, [source])
  return (
    <img
      ref={imageRef}
      src={source}
      alt=""
      width={HOVER_CARD_PROFILE_PORTRAIT_SIZE_PX}
      height={HOVER_CARD_PROFILE_PORTRAIT_SIZE_PX}
      decoding="async"
      data-loading={isLoading || undefined}
      onLoad={() => setIsLoading(false)}
      className="block size-full object-cover transition-[opacity,filter] duration-(--duration-standard) ease-(--ease-enter) data-loading:opacity-0 data-loading:blur-xs data-loading:transition-none motion-reduce:transition-none motion-reduce:data-loading:blur-none"
    />
  )
}

/**
 * Builds the initials shown when the profile has no portrait.
 * @param name - The person's name.
 * @returns Up to two uppercase initials.
 */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, HOVER_CARD_PROFILE_INITIALS_LENGTH)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Arc's person preview: portrait, name, role, a short bio, a couple of numbers and a quiet footer line. Its rows
 * settle in with a tiny stagger, and stay still when the user prefers reduced motion.
 * @param props - The person's details.
 * @returns The profile, meant as the child of `HoverCardContent`.
 */
function HoverCardProfile({ name, role, avatar, bio, stats = [], meta, className }: HoverCardProfileProps) {
  const reduceMotion = usePrefersReducedMotion()
  const settle = (order: number): Pick<HTMLMotionProps<"div">, "initial" | "animate" | "transition"> =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: HOVER_CARD_PROFILE_SETTLE_DISTANCE_PX },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: ARC_DURATION.standard,
            ease: [...ARC_EASE.enter],
            delay: HOVER_CARD_PROFILE_SETTLE_DELAY_S + order * HOVER_CARD_PROFILE_STAGGER_S,
          },
        }
  return (
    <div data-slot="hover-card-profile" className={cn("grid gap-(--space-3)", className)}>
      <motion.div
        className="flex min-w-0 items-center gap-(--space-3)"
        {...settle(HOVER_CARD_PROFILE_ROW_ORDER.head)}
      >
        <span
          aria-hidden="true"
          className="relative grid size-12 flex-none place-items-center overflow-hidden rounded-full border border-border bg-surface-muted text-sm font-medium text-foreground"
        >
          {typeof avatar === "string" ? <HoverCardPortrait source={avatar} /> : (avatar ?? initialsOf(name))}
        </span>
        <span className="grid min-w-0">
          <span className="truncate text-base leading-(--leading-body) font-medium text-foreground">{name}</span>
          {role ? <span className="truncate text-sm leading-(--leading-body) text-text-secondary">{role}</span> : null}
        </span>
      </motion.div>
      {bio ? (
        <motion.p
          className="m-0 text-sm leading-(--leading-body) text-text-secondary"
          {...settle(HOVER_CARD_PROFILE_ROW_ORDER.bio)}
        >
          {bio}
        </motion.p>
      ) : null}
      {stats.length > 0 ? (
        <motion.dl
          className="m-0 flex flex-wrap gap-x-(--space-6) gap-y-(--space-2) border-t border-border-subtle pt-(--space-3)"
          {...settle(HOVER_CARD_PROFILE_ROW_ORDER.stats)}
        >
          {stats.map((stat) => (
            // Numbers lead and labels follow, while the markup keeps label then value for screen readers.
            <div key={stat.label} className="flex flex-col-reverse">
              <dt className="text-xs leading-(--leading-body) text-text-muted">{stat.label}</dt>
              <dd className="m-0 text-base leading-(--leading-body) font-medium text-foreground tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </motion.dl>
      ) : null}
      {meta ? (
        <motion.div
          className="flex items-center gap-1.5 text-xs leading-(--leading-body) text-text-muted [&_svg]:flex-none"
          {...settle(HOVER_CARD_PROFILE_ROW_ORDER.meta)}
        >
          {meta}
        </motion.div>
      ) : null}
    </div>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent, HoverCardProfile }
