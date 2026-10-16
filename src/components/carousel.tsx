"use client"

/**
 * Arc's Carousel (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md) as a closed component: one child per
 * slide, a centered slide row that is dragged, flicked or arrowed through, and a control row under it with an optional
 * rotation control, the indicator tab list and the arrows. Embla runs inside and is never exposed; the beez-ui
 * extensions (`loop`, `duration`, `watchFocus`, `onSettle`, deferred re-initialization, labels and visibility of the
 * controls) cover media viewers that used Embla's API directly.
 */
import * as React from "react"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import type { TargetAndTransition, Transition } from "motion/react"
import { Pause, Play } from "lucide-react"

import {
  CAROUSEL_COPY,
  CAROUSEL_DEFAULT_SLIDE_SIZE,
  CAROUSEL_ROTATION_ICON_ENTER_SCALE,
  CAROUSEL_ROTATION_ICON_SIZE_PX,
  CAROUSEL_SLIDE_SIZE_PROPERTY,
} from "../constants/carousel.js"
import { useIsHydrated } from "../hooks/use-is-hydrated.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"
import { cn } from "../lib/utils.js"
import { ControlButton } from "./control-button.js"
import {
  Carousel as CarouselRoot,
  CarouselContent,
  CarouselIndicators,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  defaultCarouselSlideLabel,
  type CarouselApi,
  type CarouselOptions,
} from "./primitives/carousel.js"

/** Props of {@link Carousel}: Arc's carousel API plus the beez-ui extensions marked below. */
type CarouselProps = {
  /** Names the carousel for assistive technology, for example "Fotos del encuentro". */
  label: string
  /** One child per slide. Give each a stable `key` when the list can change. */
  children: React.ReactNode
  /** Controlled active slide. Pair with `onIndexChange`. */
  index?: number
  /** Initial slide when uncontrolled. Defaults to 0. */
  defaultIndex?: number
  /** Called as soon as the active slide changes, when the scroll toward it starts. */
  onIndexChange?: (index: number) => void
  /** Width of one slide as a CSS length; `cqw` is a share of the carousel width. Defaults to `min(80cqw, 340px)`. */
  slideSize?: string
  /** Names each slide and its indicator. Defaults to "Diapositiva 2 de 5". */
  slideLabel?: (index: number, count: number) => string
  /**
   * Milliseconds per slide. Adds a play control that rotates through the slides; rotation pauses on hover, keyboard
   * focus, drag, offscreen and in hidden tabs; with reduced motion the control stays but is disabled.
   */
  interval?: number
  /** Starts rotating on mount. Off by default, so motion begins with the viewer. */
  autoplay?: boolean
  /** Class of the root section. */
  className?: string
  /** beez-ui: wraps from the last slide to the first and back. Defaults to `false`. */
  loop?: boolean
  /** beez-ui: speed of a scroll between slides, in Embla's units (higher is slower). Defaults to Embla's 25. */
  duration?: number
  /**
   * beez-ui: scrolls to a slide when something inside it receives focus. Defaults to `true`; turn it off when a slide
   * holds content that keeps focus, such as an embedded player, so it never pulls the carousel back.
   */
  watchFocus?: boolean
  /** beez-ui: called once a scroll has come to rest on a slide, the moment to mount heavy slide content. */
  onSettle?: (index: number) => void
  /** beez-ui: accessible name of the previous arrow. Defaults to "Diapositiva anterior". */
  previousLabel?: string
  /** beez-ui: accessible name of the next arrow. Defaults to "Diapositiva siguiente". */
  nextLabel?: string
  /** beez-ui: shows the previous and next arrows. Defaults to `true`. */
  showControls?: boolean
  /** beez-ui: shows the indicator tab list. Defaults to `true`. */
  showIndicators?: boolean
  /** beez-ui: class added to every slide panel. */
  slideClassName?: string
}

/**
 * Clamps a slide index to the slides that exist.
 * @param index - Requested index.
 * @param count - Number of slides.
 * @returns An index between 0 and the last slide.
 */
function clampSlideIndex(index: number, count: number): number {
  return Math.min(Math.max(0, count - 1), Math.max(0, index))
}

/** Rotation icon entering from a small, blurred state, as in Arc. */
const rotationIconHidden: TargetAndTransition = {
  opacity: 0,
  scale: CAROUSEL_ROTATION_ICON_ENTER_SCALE,
  filter: `blur(${ARC_BLUR.subtle}px)`,
}
const rotationIconRest: TargetAndTransition = { opacity: 1, scale: 1, filter: "blur(0px)" }
const rotationIconEnter: Transition = {
  ...ARC_SPRING_SNAPPY,
  opacity: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
  filter: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
}
const rotationIconExit: TargetAndTransition = {
  ...rotationIconHidden,
  transition: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] },
}

/**
 * Keeps Embla in step with its slides without ever cutting a scroll short. Embla re-initializes when a slide is added,
 * removed or resized; a re-initialization recreates the engine and aborts a running scroll, so while a scroll or a
 * drag is in progress the request is parked and runs once the carousel comes to rest.
 * @returns Embla's `watchResize` and `watchSlides` callbacks, stable across renders, plus the handle to bind them.
 */
function useDeferredReInit() {
  const apiRef = React.useRef<CarouselApi>(undefined)
  const isPointerDownRef = React.useRef(false)
  const isPendingRef = React.useRef(false)

  const isBusy = React.useCallback(() => {
    const api = apiRef.current
    if (!api) return false
    return isPointerDownRef.current || !api.internalEngine().scrollBody.settled()
  }, [])

  /** Embla's own handling runs when the carousel is at rest; otherwise the re-initialization waits. */
  const deferWhileBusy = React.useCallback(() => {
    if (!isBusy()) return true
    isPendingRef.current = true
    return false
  }, [isBusy])

  const flush = React.useCallback(() => {
    const api = apiRef.current
    if (!api || !isPendingRef.current || isBusy()) return
    isPendingRef.current = false
    api.reInit()
  }, [isBusy])

  const bind = React.useCallback(
    (api: CarouselApi) => {
      apiRef.current = api
      if (!api) return undefined
      const handlePointerDown = () => {
        isPointerDownRef.current = true
      }
      const handlePointerUp = () => {
        isPointerDownRef.current = false
        // A press that never dragged leaves the track at rest without a `settle`.
        flush()
      }
      // Embla emits `settle` in the middle of a jump, before it selects the new slide; the flush waits for it to finish.
      const handleSettle = () => queueMicrotask(flush)
      api.on("pointerDown", handlePointerDown)
      api.on("pointerUp", handlePointerUp)
      api.on("settle", handleSettle)
      return () => {
        api.off("pointerDown", handlePointerDown)
        api.off("pointerUp", handlePointerUp)
        api.off("settle", handleSettle)
        isPointerDownRef.current = false
        isPendingRef.current = false
      }
    },
    [flush]
  )

  return { watch: deferWhileBusy, bind }
}

/**
 * A centered row of slides browsed by drag, flick, the arrow keys, Home and End, the arrows or the indicator tabs, with
 * optional rotation. Neighbouring slides stay in view as a hint that there is more, and are inert until selected.
 * @param props - Arc's carousel props plus the beez-ui extensions.
 * @returns The carousel section.
 */
function Carousel({
  label,
  children,
  index: controlledIndex,
  defaultIndex = 0,
  onIndexChange,
  slideSize = CAROUSEL_DEFAULT_SLIDE_SIZE,
  slideLabel = defaultCarouselSlideLabel,
  interval,
  autoplay = false,
  className,
  loop = false,
  duration,
  watchFocus = true,
  onSettle,
  previousLabel = CAROUSEL_COPY.previous,
  nextLabel = CAROUSEL_COPY.next,
  showControls = true,
  showIndicators = true,
  slideClassName,
}: CarouselProps) {
  const slides = React.Children.toArray(children)
  const count = slides.length
  const baseId = React.useId()
  const getSlideId = React.useCallback((slideIndex: number) => `${baseId}-slide-${slideIndex}`, [baseId])
  const reduceMotion = usePrefersReducedMotion()
  const isHydrated = useIsHydrated()
  const [startIndex] = React.useState(() => clampSlideIndex(controlledIndex ?? defaultIndex, count))
  const [selectedIndex, setSelectedIndex] = React.useState(startIndex)
  const [api, setApi] = React.useState<CarouselApi>()
  const [announcement, setAnnouncement] = React.useState("")
  const { watch, bind } = useDeferredReInit()

  // The latest callbacks, so Embla's listeners never need to be re-attached when a consumer passes new functions.
  const callbacksRef = React.useRef({ onIndexChange, onSettle, slideLabel })
  React.useLayoutEffect(() => {
    callbacksRef.current = { onIndexChange, onSettle, slideLabel }
  })
  const reportedIndexRef = React.useRef(startIndex)
  const settledIndexRef = React.useRef(startIndex)
  const isRotatingRef = React.useRef(false)

  // `startIndex` is left out on purpose: Embla would re-apply it on every option change. The first slide is placed by
  // a jump once the engine exists, and later re-initializations keep the selected slide.
  const options: CarouselOptions = {
    align: "center",
    containScroll: false,
    loop,
    watchFocus,
    watchResize: watch,
    watchSlides: watch,
    ...(duration === undefined ? {} : { duration }),
  }

  React.useEffect(() => bind(api), [api, bind])

  React.useLayoutEffect(() => {
    if (!api) return
    api.scrollTo(reportedIndexRef.current, true)
  }, [api])

  React.useEffect(() => {
    if (!api) return
    const handleSettle = () => {
      const settledIndex = api.selectedScrollSnap()
      if (settledIndex === settledIndexRef.current) return
      settledIndexRef.current = settledIndex
      callbacksRef.current.onSettle?.(settledIndex)
    }
    const handleSelect = () => {
      const nextIndex = api.selectedScrollSnap()
      setSelectedIndex(nextIndex)
      if (nextIndex !== reportedIndexRef.current) {
        reportedIndexRef.current = nextIndex
        const { onIndexChange: reportIndex, slideLabel: nameSlide } = callbacksRef.current
        reportIndex?.(nextIndex)
        if (!isRotatingRef.current) setAnnouncement(nameSlide(nextIndex, api.slideNodes().length))
      }
      isRotatingRef.current = false
      // A jump (reduced motion) lands before Embla selects the new slide, so its `settle` came too early to name it.
      if (api.internalEngine().scrollBody.settled() && !api.internalEngine().dragHandler.pointerDown()) handleSettle()
    }
    // A re-initialization lands at rest, possibly on another slide when slides were removed: it reports both.
    const handleReInit = () => {
      handleSelect()
      handleSettle()
    }
    api.on("select", handleSelect)
    api.on("settle", handleSettle)
    api.on("reInit", handleReInit)
    return () => {
      api.off("select", handleSelect)
      api.off("settle", handleSettle)
      api.off("reInit", handleReInit)
    }
  }, [api])

  React.useEffect(() => {
    if (!api || controlledIndex === undefined) return
    const nextIndex = clampSlideIndex(controlledIndex, api.slideNodes().length)
    if (nextIndex === api.selectedScrollSnap()) return
    // The parent already knows this slide, so its own change is not reported back to it.
    reportedIndexRef.current = nextIndex
    api.scrollTo(nextIndex, reduceMotion)
    // `selectedIndex` re-runs the sync after every selection, so a slide the parent rejected scrolls back to `index`.
  }, [api, controlledIndex, reduceMotion, selectedIndex])

  const rotation = useRotation({ api, count, interval, autoplay, reduceMotion, isHydrated, selectedIndex, loop, isRotatingRef })
  const visibleIndex = clampSlideIndex(selectedIndex, count)
  const hasControlRow = count > 1 && (showControls || showIndicators || rotation.hasControl)
  const rootStyle = { [CAROUSEL_SLIDE_SIZE_PROPERTY]: slideSize } as React.CSSProperties

  return (
    <CarouselRoot
      opts={options}
      setApi={setApi}
      aria-label={label}
      className={cn("@container/carousel grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-4", className)}
      style={rootStyle}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") rotation.setIsHovered(true)
      }}
      onPointerLeave={() => rotation.setIsHovered(false)}
      onFocus={(event) => rotation.handleFocus(event.target)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) rotation.handleFocus(null)
      }}
      ref={rotation.rootRef}
    >
      <CarouselContent className="select-none [&_img]:[-webkit-user-drag:none]">
        {slides.map((slide, slideIndex) => (
          <CarouselItem
            key={React.isValidElement(slide) && slide.key != null ? slide.key : slideIndex}
            id={getSlideId(slideIndex)}
            aria-label={slideLabel(slideIndex, count)}
            inert={slideIndex !== visibleIndex || undefined}
            className={cn("basis-(--carousel-slide)", slideClassName)}
          >
            {slide}
          </CarouselItem>
        ))}
      </CarouselContent>
      {hasControlRow ? (
        <div
          data-slot="carousel-controls"
          className="flex min-w-0 items-center gap-2 px-[calc((100cqw_-_var(--carousel-slide))/2)] @max-[340px]/carousel:gap-1 @max-[340px]/carousel:px-[max(0px,calc((100cqw_-_var(--carousel-slide))/2_-_var(--spacing)*2))]"
        >
          {rotation.hasControl ? (
            <ControlButton
              ref={rotation.playRef}
              data-slot="carousel-rotation"
              variant="outline"
              size="icon"
              className="size-(--control-height-sm) rounded-full border-border bg-surface text-foreground hover-fine:bg-surface-muted"
              aria-label={rotation.isPlaying ? CAROUSEL_COPY.pauseRotation : CAROUSEL_COPY.startRotation}
              disabled={!rotation.canRotate}
              onClick={rotation.toggle}
            >
              <span className="grid size-4 place-items-center">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={rotation.isPlaying ? "pause" : "play"}
                    className="col-start-1 row-start-1 grid place-items-center"
                    initial={reduceMotion ? { opacity: 0 } : rotationIconHidden}
                    animate={rotationIconRest}
                    exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : rotationIconExit}
                    transition={reduceMotion ? { duration: 0 } : rotationIconEnter}
                  >
                    {rotation.isPlaying ? (
                      <Pause size={CAROUSEL_ROTATION_ICON_SIZE_PX} strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
                    ) : (
                      <Play size={CAROUSEL_ROTATION_ICON_SIZE_PX} strokeWidth={1.75} fill="currentColor" aria-hidden="true" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </span>
            </ControlButton>
          ) : null}
          {showIndicators ? (
            <CarouselIndicators slideLabel={slideLabel} getSlideId={getSlideId} drain={rotation.drain} />
          ) : null}
          {showControls ? (
            <div className="ms-auto flex flex-none gap-2 @max-[340px]/carousel:gap-1">
              <CarouselPrevious aria-label={previousLabel} />
              <CarouselNext aria-label={nextLabel} />
            </div>
          ) : null}
        </div>
      ) : null}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </CarouselRoot>
  )
}

type RotationSettings = {
  api: CarouselApi
  count: number
  interval?: number
  autoplay: boolean
  reduceMotion: boolean
  isHydrated: boolean
  selectedIndex: number
  loop: boolean
  /** Set while rotation moves the carousel, so that change is not announced. */
  isRotatingRef: React.RefObject<boolean>
}

/**
 * Arc's slide rotation: each slide stays for `interval` while its pill drains, then the carousel moves on, wrapping to
 * the first slide at the end. Rotation pauses on hover, keyboard focus, drag, offscreen and in hidden tabs; pausing it
 * with the control refills the pill. Reduced motion, once hydrated, makes rotation unavailable and disables the control,
 * which stays in place so the control row keeps its layout after hydration.
 * @param settings - Carousel state the rotation reads.
 * @returns Rotation state and the handlers the carousel binds.
 */
function useRotation({ api, count, interval, autoplay, reduceMotion, isHydrated, selectedIndex, loop, isRotatingRef }: RotationSettings) {
  const [isPlaying, setIsPlaying] = React.useState(autoplay)
  const [isHovered, setIsHovered] = React.useState(false)
  const [isFocusPaused, setIsFocusPaused] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isInView, setIsInView] = React.useState(true)
  const [isPageVisible, setIsPageVisible] = React.useState(true)
  const drain = useMotionValue(0)
  const rootRef = React.useRef<HTMLElement>(null)
  const playRef = React.useRef<HTMLButtonElement>(null)
  const hasControl = Boolean(interval) && count > 1
  const canRotate = hasControl && !(isHydrated && reduceMotion)
  const isRunning = canRotate && isPlaying && !isHovered && !isFocusPaused && !isDragging && isInView && isPageVisible

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

  // A new slide starts with a full pill.
  React.useEffect(() => {
    drain.jump(0)
  }, [drain, selectedIndex])

  React.useEffect(() => {
    if (!isRunning || !interval || !api) return
    const controls = animate(drain, 1, {
      duration: ((1 - drain.get()) * interval) / 1000,
      ease: "linear",
      onComplete: () => {
        isRotatingRef.current = true
        if (loop || api.canScrollNext()) api.scrollNext()
        else api.scrollTo(0)
      },
    })
    return () => controls.stop()
  }, [api, drain, interval, isRotatingRef, isRunning, loop, selectedIndex])

  React.useEffect(() => {
    const root = rootRef.current
    if (!interval || !root) return
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            if (entry) setIsInView(entry.isIntersecting)
          })
    observer?.observe(root)
    const handleVisibilityChange = () => setIsPageVisible(document.visibilityState !== "hidden")
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      observer?.disconnect()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [interval])

  /** Keyboard focus inside the carousel pauses rotation, except on the rotation control itself. */
  const handleFocus = (target: EventTarget | null) => {
    if (!(target instanceof Element) || target === playRef.current) {
      setIsFocusPaused(false)
      return
    }
    setIsFocusPaused(target.matches(":focus-visible"))
  }

  const toggle = () => {
    if (!isPlaying) {
      setIsPlaying(true)
      return
    }
    setIsPlaying(false)
    // Pausing refills the pill: this slide stays until the viewer moves on.
    if (reduceMotion) drain.jump(0)
    else animate(drain, 0, { duration: ARC_DURATION.standard, ease: [...ARC_EASE.standard] })
  }

  return {
    hasControl,
    canRotate,
    isPlaying: canRotate && isPlaying,
    drain: canRotate ? drain : undefined,
    rootRef,
    playRef,
    setIsHovered,
    handleFocus,
    toggle,
  }
}

export { Carousel }
export type { CarouselProps }
