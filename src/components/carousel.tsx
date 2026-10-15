"use client"

/**
 * Carousel on Embla with Arc's carousel design (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): round
 * outlined controls on the surface that answer hover on fine pointers and press in, a grab cursor while the track can
 * be dragged, Home and End to reach the edges, and optional Arc indicators whose pill stretches and travels with the
 * slides frame by frame. Embla keeps dragging, snapping, looping and plugins.
 */
import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import type { MotionValue } from "motion/react"

import {
  CAROUSEL_COPY,
  CAROUSEL_EDGE_KEYS,
  CAROUSEL_INDICATOR_LENGTH_PX,
  CAROUSEL_KEYS,
  CAROUSEL_OWN_KEYBOARD_SELECTOR,
  type CarouselOrientation,
} from "../constants/carousel.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { ARC_SPRING_SMOOTH } from "../motion/arc-tokens.js"
import { cn } from "../lib/utils.js"
import { ControlButton } from "./control-button.js"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: CarouselOrientation
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

/** Arc's round control on the surface: outlined, a fill on hover-capable pointers and a dimmed disabled state. */
const carouselControlClassName =
  "absolute touch-manipulation rounded-full border-border bg-surface text-foreground hover-fine:not-disabled:bg-surface-muted disabled:bg-surface disabled:text-text-muted disabled:opacity-50 [&_svg:not([class*='size-'])]:size-[18px]"

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const shouldReduceMotion = usePrefersReducedMotion()
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  )
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
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      // Text fields and composite widgets inside the carousel keep their own navigation keys, as in Arc.
      const keyboardOwner = event.target instanceof Element ? event.target.closest(CAROUSEL_OWN_KEYBOARD_SELECTOR) : null
      if (keyboardOwner && event.currentTarget.contains(keyboardOwner)) return
      const keys = CAROUSEL_KEYS[orientation]
      if (event.key === keys.previous) {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === keys.next) {
        event.preventDefault()
        scrollNext()
      } else if (api && event.key === CAROUSEL_EDGE_KEYS.first) {
        event.preventDefault()
        api.scrollTo(0, shouldReduceMotion)
      } else if (api && event.key === CAROUSEL_EDGE_KEYS.last) {
        event.preventDefault()
        api.scrollTo(api.scrollSnapList().length - 1, shouldReduceMotion)
      }
    },
    [api, orientation, scrollPrev, scrollNext, shouldReduceMotion]
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
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

/**
 * The clipped viewport and the slide track. While the track can be dragged it shows Arc's grab cursor on fine
 * pointers, and a grabbing cursor while a drag is held.
 */
function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, api, opts, orientation, canScrollPrev, canScrollNext } = useCarousel()
  const [isDragging, setIsDragging] = React.useState(false)
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

  return (
    <div
      ref={carouselRef}
      className={cn(
        "overflow-hidden",
        isDraggable && "pointer-fine:cursor-grab pointer-fine:data-dragging:cursor-grabbing"
      )}
      data-slot="carousel-content"
      data-dragging={(isDraggable && isDragging) || undefined}
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon-lg",
  ...props
}: React.ComponentProps<typeof ControlButton>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <ControlButton
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        carouselControlClassName,
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeftIcon strokeWidth={1.75} />
      <span className="sr-only">Previous slide</span>
    </ControlButton>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon-lg",
  ...props
}: React.ComponentProps<typeof ControlButton>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <ControlButton
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        carouselControlClassName,
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRightIcon strokeWidth={1.75} />
      <span className="sr-only">Next slide</span>
    </ControlButton>
  )
}

/**
 * Default accessible name of one indicator, for example "Diapositiva 2 de 5".
 * @param index - Zero-based slide position.
 * @param count - Number of slides.
 * @returns The Spanish slide label.
 */
function defaultCarouselSlideLabel(index: number, count: number): string {
  return `${CAROUSEL_COPY.slideLabelPrefix} ${index + 1} ${CAROUSEL_COPY.slideLabelSeparator} ${count}`
}

/**
 * Continuous slide position, in slides, of a scroll progress between Embla's snap points. Snaps are progress values,
 * so trimmed edges and slides of different sizes still map to whole slides at rest.
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
  /** Accessible name of the indicator list. Defaults to "Elegir una diapositiva". */
  label?: string
  /** Names each indicator. Defaults to "Diapositiva 2 de 5". */
  slideLabel?: (index: number, count: number) => string
}

/**
 * Arc's page indicator for a carousel: one dot per snap point, where the current one stretches into a pill that
 * follows the track frame by frame while it is dragged or scrolled. The dots are buttons in a named group and the
 * current one carries `aria-current`; activating a dot scrolls to its slide, and when a dot has focus the carousel's
 * arrow, Home and End keys move the focus to the dot of the new slide. It renders
 * once Embla has measured the slides. Place it inside `Carousel`.
 * @param props - Optional accessible copy plus native attributes of the list.
 * @returns The indicator list, or nothing until there is more than one snap point.
 */
function CarouselIndicators({
  className,
  label = CAROUSEL_COPY.indicatorsLabel,
  slideLabel = defaultCarouselSlideLabel,
  ...props
}: CarouselIndicatorsProps) {
  const { api, orientation } = useCarousel()
  const reduceMotion = usePrefersReducedMotion()
  const [snapCount, setSnapCount] = React.useState(0)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const position = useMotionValue(0)
  const listRef = React.useRef<HTMLDivElement>(null)
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
      setSnapCount(api.scrollSnapList().length)
      setSelectedIndex(nextIndex)
      // A looping track wraps its progress, so its pill hands over between snaps instead of following the scroll.
      if (isLoop()) {
        positionAnimation?.stop()
        positionAnimation = reduceMotion ? null : animate(position, nextIndex, ARC_SPRING_SMOOTH)
        if (reduceMotion) position.set(nextIndex)
      }
      const list = listRef.current
      if (list && list.contains(document.activeElement)) {
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
      ref={listRef}
      role="group"
      aria-label={label}
      data-slot="carousel-indicators"
      className={cn(
        "flex min-w-0 items-center justify-center",
        orientation === "vertical" && "flex-col",
        className
      )}
      {...props}
    >
      {Array.from({ length: snapCount }, (_, index) => (
        <CarouselIndicator
          key={index}
          index={index}
          lastIndex={snapCount - 1}
          position={position}
          isSelected={index === selectedIndex}
          orientation={orientation ?? "horizontal"}
          label={slideLabel(index, snapCount)}
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
  position: MotionValue<number>
  isSelected: boolean
  orientation: CarouselOrientation
  label: string
  indicatorRef: React.Ref<HTMLButtonElement>
  onSelect: () => void
}

/** One dot that grows toward the pill as the track nears its slide, so the pill hands over continuously. */
function CarouselIndicator({
  index,
  lastIndex,
  position,
  isSelected,
  orientation,
  label,
  indicatorRef,
  onSelect,
}: CarouselIndicatorProps) {
  const emphasis = useTransform(position, (value) =>
    Math.max(0, 1 - Math.abs(Math.min(lastIndex, Math.max(0, value)) - index))
  )
  const length = useTransform(
    emphasis,
    (value) => CAROUSEL_INDICATOR_LENGTH_PX.dot + (CAROUSEL_INDICATOR_LENGTH_PX.pill - CAROUSEL_INDICATOR_LENGTH_PX.dot) * value
  )

  return (
    <button
      ref={indicatorRef}
      type="button"
      aria-current={isSelected || undefined}
      aria-label={label}
      data-slot="carousel-indicator"
      className={cn(
        "group/indicator grid shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-3 focus-visible:ring-ring/50",
        orientation === "horizontal" ? "h-(--control-height-sm) px-[5px]" : "w-(--control-height-sm) py-[5px]"
      )}
      onClick={onSelect}
    >
      <motion.span
        aria-hidden="true"
        className={cn(
          "relative block overflow-hidden rounded-full bg-border-strong transition-colors duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none group-hover/indicator:bg-text-muted",
          orientation === "horizontal" ? "h-1.5" : "w-1.5"
        )}
        style={orientation === "horizontal" ? { width: length } : { height: length }}
      >
        <motion.span className="absolute inset-0 bg-foreground" style={{ opacity: emphasis }} />
      </motion.span>
    </button>
  )
}

export {
  type CarouselApi,
  type CarouselIndicatorsProps,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
  useCarousel,
}
