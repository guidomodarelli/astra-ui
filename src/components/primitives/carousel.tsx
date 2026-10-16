"use client"

/**
 * Internal carousel composition on Embla with Arc's carousel design (https://uiarc.dev, MIT License, see
 * THIRD_PARTY_NOTICES.md): a focusable, draggable slide area with Arc's grab cursor, round outlined controls on the
 * surface that answer hover on fine pointers and press in, Home and End to reach the edges, and Arc's indicator tab list
 * whose pill stretches and travels with the slides frame by frame. Embla keeps dragging, snapping and looping.
 *
 * Not exported from the package: the public `Carousel` (`../carousel.tsx`) composes these parts behind Arc's closed API.
 */
import * as React from "react"
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import type { MotionValue } from "motion/react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import {
  CAROUSEL_COPY,
  CAROUSEL_EDGE_KEYS,
  CAROUSEL_INDICATOR_LENGTH_PX,
  CAROUSEL_INDICATORS_SELECTOR,
  CAROUSEL_KEYS,
  CAROUSEL_OWN_KEYBOARD_SELECTOR,
  CAROUSEL_ROOT_SELECTOR,
} from "../../constants/carousel.js"
import { usePrefersReducedMotion } from "../../hooks/use-prefers-reduced-motion.js"
import { ARC_SPRING_SMOOTH } from "../../motion/arc-tokens.js"
import { cn } from "../../lib/utils.js"
import { ControlButton } from "../control-button.js"

/** Embla's API, kept inside beez-ui. */
type CarouselApi = UseEmblaCarouselType[1]
/** Embla options the public carousel forwards. */
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0]

type CarouselProps = {
  /** Embla options. Keep the object's values stable: Embla re-initializes when they change. */
  opts?: CarouselOptions
  /** Receives Embla's API once it is created, and `undefined` when it is destroyed. */
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: CarouselApi
  opts?: CarouselOptions
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

/**
 * Reads the carousel the part is rendered in.
 * @returns The shared Embla API, scroll actions and edge state.
 */
function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

/** Arc's round control on the surface: outlined, a fill on hover-capable pointers and a dimmed unavailable state. */
const carouselControlClassName =
  "size-(--control-height-sm) touch-manipulation rounded-full border-border bg-surface text-foreground hover-fine:not-aria-disabled:bg-surface-muted aria-disabled:pointer-events-none aria-disabled:cursor-default aria-disabled:bg-surface aria-disabled:text-text-muted aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-[18px]"

/**
 * The carousel root: a named section that owns the arrow, Home and End keys pressed inside it.
 * @param props - Embla options and API callback plus native section attributes.
 * @returns The carousel section.
 */
function Carousel({
  opts,
  setApi,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & CarouselProps) {
  const shouldReduceMotion = usePrefersReducedMotion()
  const [carouselRef, api] = useEmblaCarousel(opts)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev(shouldReduceMotion)
  }, [api, shouldReduceMotion])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext(shouldReduceMotion)
  }, [api, shouldReduceMotion])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target instanceof Element ? event.target : null
      // Text fields and composite widgets inside the carousel keep their own navigation keys, as in Arc. The
      // carousel's own indicator tab list is the exception: its keys move the carousel.
      const keyboardOwner = target?.closest(CAROUSEL_OWN_KEYBOARD_SELECTOR) ?? null
      if (keyboardOwner && event.currentTarget.contains(keyboardOwner) && !keyboardOwner.matches(CAROUSEL_INDICATORS_SELECTOR)) return
      // A carousel nested in a slide handles its own keys; the outer one leaves them alone.
      const closestCarousel = target?.closest(CAROUSEL_ROOT_SELECTOR) ?? null
      if (closestCarousel && closestCarousel !== event.currentTarget) return
      if (!api) return
      let isHandled = true
      if (event.key === CAROUSEL_KEYS.previous) scrollPrev()
      else if (event.key === CAROUSEL_KEYS.next) scrollNext()
      else if (event.key === CAROUSEL_EDGE_KEYS.first) api.scrollTo(0, shouldReduceMotion)
      else if (event.key === CAROUSEL_EDGE_KEYS.last) api.scrollTo(api.scrollSnapList().length - 1, shouldReduceMotion)
      else isHandled = false
      if (!isHandled) return
      event.preventDefault()
      // The slide that held focus turns inert once another one is selected, so focus moves to the slide area.
      if (target && api.containerNode().contains(target)) api.rootNode().focus({ preventScroll: true })
    },
    [api, scrollPrev, scrollNext, shouldReduceMotion]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])

  React.useEffect(() => {
    if (!api) return
    let isMounted = true

    queueMicrotask(() => {
      if (isMounted) {
        onSelect(api)
      }
    })

    api.on("reInit", onSelect)
    api.on("select", onSelect)

    return () => {
      isMounted = false
      api?.off("reInit", onSelect)
      api?.off("select", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <section
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        aria-roledescription={CAROUSEL_COPY.roleDescription}
        data-slot="carousel"
        {...props}
      >
        {children}
      </section>
    </CarouselContext.Provider>
  )
}

type CarouselContentProps = React.ComponentProps<"div"> & {
  /** Accessible name of the focusable slide area. */
  viewportLabel?: string
  /** Class of the clipped viewport around the slide track. */
  viewportClassName?: string
}

/**
 * The clipped, focusable viewport and the slide track. While the track can be dragged it shows Arc's grab cursor on
 * fine pointers, and a grabbing cursor while a drag is held. A click on a neighbouring slide selects it, as in Arc.
 * @param props - Viewport copy and class plus native attributes of the track.
 * @returns The viewport holding the track.
 */
function CarouselContent({
  className,
  viewportLabel = CAROUSEL_COPY.viewportLabel,
  viewportClassName,
  ...props
}: CarouselContentProps) {
  const { carouselRef, api, opts, canScrollPrev, canScrollNext } = useCarousel()
  const [isDragging, setIsDragging] = React.useState(false)
  const reduceMotion = usePrefersReducedMotion()
  const isDraggable = opts?.watchDrag !== false && (canScrollPrev || canScrollNext)

  React.useEffect(() => {
    if (!api) return
    const handlePointerDown = () => setIsDragging(true)
    const handlePointerUp = () => setIsDragging(false)
    api.on("pointerDown", handlePointerDown)
    api.on("pointerUp", handlePointerUp)
    return () => {
      api.off("pointerDown", handlePointerDown)
      api.off("pointerUp", handlePointerUp)
    }
  }, [api])

  /**
   * Selects the neighbouring slide under a click; inactive slides are inert, so the click reaches the viewport. Embla
   * swallows the click that ends a drag before it gets here.
   */
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!api) return
    const slideIndex = api
      .slideNodes()
      .findIndex((slide) => {
        const rect = slide.getBoundingClientRect()
        return event.clientX >= rect.left && event.clientX <= rect.right
      })
    if (slideIndex < 0 || slideIndex === api.selectedScrollSnap()) return
    api.scrollTo(slideIndex, reduceMotion)
  }

  return (
    <div
      ref={carouselRef}
      role="group"
      aria-label={viewportLabel}
      tabIndex={0}
      className={cn(
        "min-w-0 overflow-hidden rounded-(--radius-panel) outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-3 focus-visible:ring-ring/50",
        isDraggable && "pointer-fine:cursor-grab pointer-fine:data-dragging:cursor-grabbing",
        viewportClassName
      )}
      data-slot="carousel-content"
      data-dragging={(isDraggable && isDragging) || undefined}
      onClick={handleClick}
    >
      <div className={cn("flex", className)} {...props} />
    </div>
  )
}

/**
 * One slide. Its trailing margin is the gap to the next slide, so Embla measures it and centers the slide itself. It is
 * a group described as a slide; pass `role="tabpanel"` only when indicator tabs control it.
 * @param props - Native attributes of the slide panel.
 * @returns The slide panel.
 */
function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      aria-roledescription={CAROUSEL_COPY.slideRoleDescription}
      data-slot="carousel-item"
      className={cn("me-4 min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  )
}

/**
 * Moves to the previous slide. It stays focusable and reports `aria-disabled` at the first slide, so focus is never
 * lost when the carousel reaches its edge.
 * @param props - Control button attributes; `aria-label` defaults to "Diapositiva anterior".
 * @returns The previous control.
 */
function CarouselPrevious({ className, onClick, ...props }: React.ComponentProps<typeof ControlButton>) {
  const { scrollPrev, canScrollPrev } = useCarousel()

  return (
    <ControlButton
      data-slot="carousel-previous"
      variant="outline"
      size="icon"
      className={cn(carouselControlClassName, className)}
      aria-label={CAROUSEL_COPY.previous}
      aria-disabled={!canScrollPrev || undefined}
      onClick={(event) => {
        onClick?.(event)
        if (canScrollPrev) scrollPrev()
      }}
      {...props}
    >
      <ChevronLeftIcon strokeWidth={1.75} aria-hidden="true" />
    </ControlButton>
  )
}

/**
 * Moves to the next slide. It stays focusable and reports `aria-disabled` at the last slide.
 * @param props - Control button attributes; `aria-label` defaults to "Diapositiva siguiente".
 * @returns The next control.
 */
function CarouselNext({ className, onClick, ...props }: React.ComponentProps<typeof ControlButton>) {
  const { scrollNext, canScrollNext } = useCarousel()

  return (
    <ControlButton
      data-slot="carousel-next"
      variant="outline"
      size="icon"
      className={cn(carouselControlClassName, className)}
      aria-label={CAROUSEL_COPY.next}
      aria-disabled={!canScrollNext || undefined}
      onClick={(event) => {
        onClick?.(event)
        if (canScrollNext) scrollNext()
      }}
      {...props}
    >
      <ChevronRightIcon strokeWidth={1.75} aria-hidden="true" />
    </ControlButton>
  )
}

/**
 * Default accessible name of one slide and its indicator, for example "Diapositiva 2 de 5".
 * @param index - Zero-based slide position.
 * @param count - Number of slides.
 * @returns The Spanish slide label.
 */
function defaultCarouselSlideLabel(index: number, count: number): string {
  return `${CAROUSEL_COPY.slideLabelPrefix} ${index + 1} ${CAROUSEL_COPY.slideLabelSeparator} ${count}`
}

/**
 * Continuous slide position, in slides, of a scroll progress between Embla's snap points. Snaps are progress values,
 * so slides of different sizes still map to whole slides at rest.
 * @param progress - Embla's scroll progress, from 0 to 1.
 * @param snaps - Embla's snap points, as scroll progress values.
 * @returns The fractional index of the slide in view.
 */
function toSlidePosition(progress: number, snaps: number[]): number {
  const lastIndex = snaps.length - 1
  if (lastIndex < 1) return 0
  const first = snaps[0] ?? 0
  const last = snaps[lastIndex] ?? 1
  if (progress <= first) return 0
  if (progress >= last) return lastIndex
  for (let index = 0; index < lastIndex; index += 1) {
    const start = snaps[index] ?? 0
    const end = snaps[index + 1] ?? 1
    if (progress <= end) return end > start ? index + (progress - start) / (end - start) : index
  }
  return lastIndex
}

type CarouselIndicatorsProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Accessible name of the indicator tab list. Defaults to "Elegir una diapositiva". */
  label?: string
  /** Names each indicator. Defaults to "Diapositiva 2 de 5". */
  slideLabel?: (index: number, count: number) => string
  /** Id of the slide panel an indicator controls. */
  getSlideId?: (index: number) => string
  /** Rotation time spent on the selected slide, from 0 to 1; it drains the selected pill from its end. */
  drain?: MotionValue<number>
}

/**
 * Arc's page indicator: a tab per snap point, where the selected one stretches into a pill that follows the track frame
 * by frame while it is dragged or scrolled. Only the selected tab is in the tab order; activating a tab scrolls to its
 * slide, and while a tab has focus the carousel's arrow, Home and End keys move the focus to the tab of the new slide.
 * It renders once Embla has measured the slides. Place it inside `Carousel`.
 * @param props - Optional accessible copy, slide ids and rotation drain plus native attributes of the list.
 * @returns The indicator tab list, or nothing until there is more than one snap point.
 */
function CarouselIndicators({
  className,
  label = CAROUSEL_COPY.indicatorsLabel,
  slideLabel = defaultCarouselSlideLabel,
  getSlideId,
  drain,
  ...props
}: CarouselIndicatorsProps) {
  const { api } = useCarousel()
  const reduceMotion = usePrefersReducedMotion()
  const [snapCount, setSnapCount] = React.useState(0)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isLooping, setIsLooping] = React.useState(false)
  const position = useMotionValue(0)
  const indicatorRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  React.useEffect(() => {
    if (!api) return
    let positionAnimation: ReturnType<typeof animate> | null = null
    const isLoop = () => api.internalEngine().options.loop
    const trackScroll = () => {
      if (isLoop()) return
      positionAnimation?.stop()
      position.set(toSlidePosition(api.scrollProgress(), api.scrollSnapList()))
    }
    const syncSelection = () => {
      const nextIndex = api.selectedScrollSnap()
      const count = api.scrollSnapList().length
      setSnapCount(count)
      setSelectedIndex(nextIndex)
      setIsLooping(isLoop())
      // A looping track wraps its progress, so its pill hands over between snaps instead of following the scroll.
      // It travels the short way round: across the loop boundary the position runs past the last dot, which the
      // dots read on a circle, and settles back on the snap's own index once it lands.
      if (isLoop()) {
        positionAnimation?.stop()
        const turns = Math.round((position.get() - nextIndex) / count)
        const destination = nextIndex + turns * count
        positionAnimation = reduceMotion
          ? null
          : animate(position, destination, { ...ARC_SPRING_SMOOTH, onComplete: () => position.jump(nextIndex) })
        if (reduceMotion) position.set(nextIndex)
      }
      // Focus follows the selection only while one of the tabs has it. The tabs are tracked by their own refs, so the
      // consumer's `ref` reaches the list untouched.
      if (indicatorRefs.current.some((indicator) => indicator !== null && indicator === document.activeElement)) {
        indicatorRefs.current[nextIndex]?.focus({ preventScroll: true })
      }
    }
    const syncAll = () => {
      syncSelection()
      if (isLoop()) {
        positionAnimation?.stop()
        position.set(api.selectedScrollSnap())
      } else {
        trackScroll()
      }
    }
    syncAll()
    api.on("reInit", syncAll)
    api.on("select", syncSelection)
    api.on("scroll", trackScroll)
    return () => {
      positionAnimation?.stop()
      api.off("reInit", syncAll)
      api.off("select", syncSelection)
      api.off("scroll", trackScroll)
    }
  }, [api, position, reduceMotion])

  if (snapCount < 2) return null

  return (
    <div
      role="tablist"
      aria-label={label}
      data-slot="carousel-indicators"
      className={cn("flex min-w-0 items-center", className)}
      {...props}
    >
      {Array.from({ length: snapCount }, (_, index) => (
        <CarouselIndicator
          key={index}
          index={index}
          lastIndex={snapCount - 1}
          isLooping={isLooping}
          position={position}
          isSelected={index === selectedIndex}
          drain={index === selectedIndex ? drain : undefined}
          label={slideLabel(index, snapCount)}
          controls={getSlideId?.(index)}
          indicatorRef={(node) => {
            indicatorRefs.current[index] = node
          }}
          onSelect={() => api?.scrollTo(index, reduceMotion)}
        />
      ))}
    </div>
  )
}

type CarouselIndicatorProps = {
  index: number
  lastIndex: number
  /** Whether the track loops, so the first and last dots are neighbours on a circle. */
  isLooping: boolean
  position: MotionValue<number>
  isSelected: boolean
  /** Rotation drain of the selected tab. */
  drain?: MotionValue<number>
  label: string
  /** Id of the slide panel this tab selects. */
  controls?: string
  indicatorRef: React.Ref<HTMLButtonElement>
  onSelect: () => void
}

/** One tab whose dot grows toward the pill as the track nears its slide, so the pill hands over continuously. */
function CarouselIndicator({
  index,
  lastIndex,
  isLooping,
  position,
  isSelected,
  drain,
  label,
  controls,
  indicatorRef,
  onSelect,
}: CarouselIndicatorProps) {
  const emphasis = useTransform(position, (value) => {
    if (!isLooping) return Math.max(0, 1 - Math.abs(Math.min(lastIndex, Math.max(0, value)) - index))
    const count = lastIndex + 1
    const distance = Math.abs(value - index) % count
    return Math.max(0, 1 - Math.min(distance, count - distance))
  })
  const length = useTransform(
    emphasis,
    (value) => CAROUSEL_INDICATOR_LENGTH_PX.dot + (CAROUSEL_INDICATOR_LENGTH_PX.pill - CAROUSEL_INDICATOR_LENGTH_PX.dot) * value
  )

  return (
    <button
      ref={indicatorRef}
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-controls={controls}
      aria-label={label}
      tabIndex={isSelected ? 0 : -1}
      data-slot="carousel-indicator"
      className="group/indicator grid h-(--control-height-sm) shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent px-[5px] py-0 outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-3 focus-visible:ring-ring/50 @max-[340px]/carousel:px-1"
      onClick={onSelect}
    >
      <motion.span
        aria-hidden="true"
        className="relative block h-1.5 overflow-hidden rounded-full bg-border-strong transition-colors duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none hover-fine:group-hover/indicator:bg-text-muted"
        style={{ width: length }}
      >
        <motion.span className="absolute inset-0 bg-foreground" style={{ opacity: emphasis }} />
        {drain ? (
          <motion.span
            data-slot="carousel-indicator-drain"
            className="absolute inset-0 origin-right bg-border-strong"
            style={{ scaleX: drain }}
          />
        ) : null}
      </motion.span>
    </button>
  )
}

export {
  type CarouselApi,
  type CarouselOptions,
  type CarouselIndicatorsProps,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
  defaultCarouselSlideLabel,
  useCarousel,
}
