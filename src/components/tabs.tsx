"use client"

/**
 * Arc's Tabs (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): its segmented list on Arc's tokens, a
 * highlight that glides between triggers with Arc's morph spring, a list that scrolls sideways and keeps the active
 * tab in view, and panels that slide in from the side of the chosen tab while their height morphs from the previous
 * panel. Radix keeps the roles, keyboard navigation and controlled or uncontrolled value.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type RefObject,
} from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot, Tabs as TabsPrimitive } from "radix-ui"
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  type AnimationPlaybackControls,
  type Variants,
} from "motion/react"

import {
  TABS_DIRECTION,
  TABS_PANEL_HEIGHT_TOLERANCE_PX,
  TABS_PANEL_OFFSET_PX,
  TABS_PANEL_REDUCED_EXIT_DURATION_S,
  TABS_REVEAL_MARGIN_PX,
} from "../constants/tabs.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_DURATION, ARC_EASE, ARC_SPRING_SMOOTH } from "../motion/arc-tokens.js"
import { GlideSlot } from "../motion/glide-slot.js"
import { useAttachedElement } from "../motion/use-attached-element.js"

/** Layout direction of the list, which also decides the axis panels slide along. */
type TabsOrientation = "horizontal" | "vertical"

/** Shared by the parts of one Tabs instance so panels know where the selection came from. */
interface TabsMotionState {
  activeValue: string
  /** +1 when the new tab sits after the previous one, -1 when it sits before. */
  direction: number
  orientation: TabsOrientation
  /** Height of the visible panel, so the next one can morph from it. */
  panelHeightRef: RefObject<number | null>
  /** Where the leaving panel was on screen, so it stays there while it fades out. */
  leavingRectRef: RefObject<LeavingPanelRect | null>
}

/** Screen rectangle of the panel that was active when a trigger selected `value`. */
interface LeavingPanelRect {
  value: string
  rect: DOMRect
}

const TabsMotionContext = createContext<TabsMotionState | null>(null)

/** Returns the elements of a slot that belong to this Tabs instance, never to a nested one. */
function getOwnElements(root: HTMLElement, selector: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => element.closest('[data-slot="tabs"]') === root
  )
}

/**
 * Reads which way the selection travels from the order of this instance's triggers.
 * @param root - The tabs root, or null before it is attached.
 * @param fromValue - Value of the previously active tab.
 * @param toValue - Value of the newly active tab.
 * @returns The travel direction, or null when either tab is not rendered.
 */
function getTravelDirection(root: HTMLElement | null, fromValue: string, toValue: string): number | null {
  if (!root) return null
  const order = getOwnElements(root, '[data-slot="tabs-trigger"]').map((trigger) =>
    trigger.getAttribute("data-value")
  )
  const fromIndex = order.indexOf(fromValue)
  const toIndex = order.indexOf(toValue)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return null
  return toIndex > fromIndex ? TABS_DIRECTION.forward : TABS_DIRECTION.backward
}

/**
 * Groups a tab list with its panels. Accepts Radix's `value`/`defaultValue`/`onValueChange` contract unchanged.
 * @param props - Radix root props, including `orientation` and `ref`.
 * @returns The tabs root.
 */
function Tabs({
  className,
  orientation = "horizontal",
  value,
  defaultValue,
  onValueChange,
  ref,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "")
  const [direction, setDirection] = useState<number>(TABS_DIRECTION.forward)
  const [root, attachRoot] = useAttachedElement<HTMLDivElement>(ref)
  const panelHeightRef = useRef<number | null>(null)
  const leavingRectRef = useRef<LeavingPanelRect | null>(null)
  const activeValue = value ?? uncontrolledValue
  const [renderedValue, setRenderedValue] = useState(activeValue)

  // Every change of the rendered value sets the direction, whether a trigger or a controlled parent (a router
  // update, a reset, an asynchronous confirmation) made it. The triggers have not re-rendered yet, so their order is
  // still readable.
  if (renderedValue !== activeValue) {
    setRenderedValue(activeValue)
    const travelDirection = getTravelDirection(root, renderedValue, activeValue)
    if (travelDirection !== null) setDirection(travelDirection)
  }

  /** Records where the active panel is on screen before Radix and the consumer learn about the change. */
  function handleValueChange(nextValue: string) {
    const activePanel = root
      ? getOwnElements(root, '[data-slot="tabs-content"][data-state="active"]')[0]
      : undefined
    leavingRectRef.current = activePanel
      ? { value: nextValue, rect: activePanel.getBoundingClientRect() }
      : null
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <TabsMotionContext.Provider
      value={{ activeValue, direction, orientation, panelHeightRef, leavingRectRef }}
    >
      <TabsPrimitive.Root
        ref={attachRoot}
        data-slot="tabs"
        data-orientation={orientation}
        orientation={orientation}
        className={cn(
          "group/tabs relative flex gap-(--space-4) data-horizontal:flex-col",
          className
        )}
        {...props}
        value={activeValue}
        onValueChange={handleValueChange}
      />
    </TabsMotionContext.Provider>
  )
}

/**
 * Arc's segmented list (`default`): a muted track whose active trigger is a raised surface. `line` keeps the
 * underline variant on the same tokens. Horizontal lists scroll sideways without a visible scrollbar.
 */
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit max-w-full min-w-0 items-center text-text-muted group-data-horizontal/tabs:overflow-x-auto group-data-horizontal/tabs:[scrollbar-width:none] group-data-horizontal/tabs:[&::-webkit-scrollbar]:hidden group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "gap-(--space-1) rounded-(--radius-control) border border-border bg-surface-muted p-(--space-1)",
        line: "gap-(--space-1) bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Scrolls a horizontally overflowing list just enough to show the trigger, never the page around it. The target is an
 * absolute offset, so a second call while a smooth scroll is still running (focus and selection both reveal the
 * trigger on the same key press) aims at the same place instead of adding its delta to a moving position.
 * @param list - The scrolling tab list.
 * @param trigger - The trigger to reveal.
 * @param reduceMotion - True jumps instead of scrolling smoothly.
 */
function revealTrigger(list: HTMLElement, trigger: HTMLElement | null, reduceMotion: boolean) {
  if (!trigger || list.scrollWidth <= list.clientWidth || typeof list.scrollTo !== "function") return
  const frame = list.getBoundingClientRect()
  const item = trigger.getBoundingClientRect()
  const itemStart = item.left - frame.left + list.scrollLeft
  const itemEnd = itemStart + item.width
  const visibleStart = list.scrollLeft
  const visibleEnd = visibleStart + list.clientWidth
  const target =
    itemStart < visibleStart + TABS_REVEAL_MARGIN_PX
      ? itemStart - TABS_REVEAL_MARGIN_PX
      : itemEnd > visibleEnd - TABS_REVEAL_MARGIN_PX
        ? itemEnd - list.clientWidth + TABS_REVEAL_MARGIN_PX
        : visibleStart
  if (target !== visibleStart) list.scrollTo({ left: target, behavior: reduceMotion ? "instant" : "smooth" })
}

/**
 * Holds the triggers. The active highlight glides to the newly selected trigger and the list scrolls to keep the
 * active or focused trigger visible.
 * @param props - Radix list props, the `variant` and `ref`.
 * @returns The tab list.
 */
function TabsList({
  className,
  variant = "default",
  ref,
  onFocusCapture,
  ...props
}: ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  const motionState = useContext(TabsMotionContext)
  const reduceMotion = usePrefersReducedMotion()
  const [list, attachList] = useAttachedElement<HTMLDivElement>(ref)
  const activeValue = motionState?.activeValue

  useLayoutEffect(() => {
    if (!list || motionState?.orientation === "vertical") return
    const revealActiveTrigger = () =>
      revealTrigger(
        list,
        list.querySelector<HTMLElement>('[data-slot="tabs-trigger"][data-state="active"]'),
        reduceMotion
      )
    revealActiveTrigger()
    // Triggers can widen after the reveal (a web font swapping in, a label changing), which grows the scrollable
    // width and pushes the active trigger back out of view; reveal it again whenever a trigger resizes.
    const observer = new ResizeObserver(revealActiveTrigger)
    for (const trigger of list.querySelectorAll('[data-slot="tabs-trigger"]')) observer.observe(trigger)
    return () => observer.disconnect()
  }, [list, activeValue, motionState?.orientation, reduceMotion])

  /** Keyboard focus may land on a trigger scrolled out of view before it becomes active. */
  function handleFocusCapture(event: FocusEvent<HTMLDivElement>) {
    onFocusCapture?.(event)
    if (!list || motionState?.orientation === "vertical") return
    if (event.target instanceof HTMLElement && event.target.getAttribute("role") === "tab")
      revealTrigger(list, event.target, reduceMotion)
  }

  return (
    <GlideSlot preset="tabs" ref={attachList}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        onFocusCapture={handleFocusCapture}
        {...props}
      />
    </GlideSlot>
  )
}

/**
 * Selects a panel. Arc's trigger: muted label, accent label once active, hover only on fine pointers and the
 * shared keyboard focus outline.
 * @param props - Radix trigger props, including `value`.
 * @returns The tab.
 */
function TabsTrigger({ className, value, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-value={value}
      value={value}
      className={cn(
        "relative inline-flex min-h-(--control-height-sm) min-w-[5.5rem] flex-[1_0_auto] cursor-pointer items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-3px)] border border-transparent bg-transparent px-(--space-3) font-sans text-sm font-medium whitespace-nowrap text-text-muted [-webkit-tap-highlight-color:transparent] transition-[color,background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard) select-none motion-reduce:transition-none hover-fine:text-foreground active:text-foreground disabled:cursor-not-allowed disabled:opacity-50 data-active:text-(--accent-strong) group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=default]/tabs-list:data-active:border-border group-data-[variant=default]/tabs-list:data-active:bg-surface group-data-[variant=default]/tabs-list:data-active:shadow-(--shadow-resting)",
        "after:absolute after:rounded-full after:bg-(--accent-strong) after:opacity-0 after:transition-opacity after:duration-(--duration-fast) group-data-horizontal/tabs:after:inset-x-(--space-2) group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-(--space-2) group-data-vertical/tabs:after:-right-px group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100 data-glide-target:after:opacity-0! data-glide-freeze:after:transition-none motion-reduce:after:transition-none",
        className
      )}
      {...props}
    />
  )
}

/** Panel classes: Arc's body text rhythm and a rounded keyboard focus outline. */
const tabsContentClassName =
  "flex-1 text-sm leading-(--leading-body) [--focus-outline-offset:3px] focus-visible:rounded-(--radius-control) data-[state=inactive]:pointer-events-none"

/** Values a panel's variants read: which way the selection travelled and along which axis. */
interface PanelMotionCustom {
  direction: number
  orientation: TabsOrientation
}

/** Places a slide offset on the axis the list runs along. */
function slideOffset({ orientation }: PanelMotionCustom, distance: number) {
  return orientation === "vertical" ? { x: 0, y: distance } : { x: distance, y: 0 }
}

/** Arc's panel motion: slides in from the side of the chosen tab and leaves quickly the opposite way. */
const panelVariants: Variants = {
  enter: (custom: PanelMotionCustom) => ({
    opacity: 0,
    ...slideOffset(custom, custom.direction * TABS_PANEL_OFFSET_PX.enter),
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      opacity: { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] },
      x: ARC_SPRING_SMOOTH,
      y: ARC_SPRING_SMOOTH,
    },
  },
  exit: (custom: PanelMotionCustom) => ({
    opacity: 0,
    ...slideOffset(custom, custom.direction * -TABS_PANEL_OFFSET_PX.exit),
    transition: { duration: ARC_DURATION.instant, ease: [...ARC_EASE.standard] },
  }),
}

/** Reduced motion: a short crossfade in place. Keys match `panelVariants`, so server and client styles agree. */
const reducedPanelVariants: Variants = {
  enter: { opacity: 0, x: 0, y: 0 },
  center: { opacity: 1, x: 0, y: 0, transition: { duration: ARC_DURATION.instant } },
  exit: { opacity: 0, x: 0, y: 0, transition: { duration: TABS_PANEL_REDUCED_EXIT_DURATION_S } },
}

/** Inline properties the height morph overrides on the panel and restores when it settles. */
const MORPH_STYLE_PROPERTIES = ["height", "overflow", "flex", "min-height"] as const

/** Animates the consumer's own element when `TabsContent` is used with `asChild`. */
const MotionPanelSlot = motion.create(Slot.Root)

type TabsPanelProps = ComponentProps<typeof motion.div> & {
  motionState: TabsMotionState
  reduceMotion: boolean
  /** Renders the single child as the panel instead of a `div`. */
  asChild?: boolean
}

/**
 * The animated element behind an active panel. While present it morphs from the previous panel's height to its
 * own; once leaving it stays pinned where it was, inert and hidden from assistive technology, until it fades out.
 */
function TabsPanel({ motionState, reduceMotion, asChild, ref, ...props }: TabsPanelProps) {
  const isPresent = useIsPresent()
  const [panel, attachPanel] = useAttachedElement<HTMLDivElement>(ref)
  const { panelHeightRef, leavingRectRef, direction, orientation } = motionState
  // A leaving panel keeps the props it last rendered with; the live context says which value replaced it.
  const activeValue = useContext(TabsMotionContext)?.activeValue ?? motionState.activeValue
  const PanelElement = asChild ? MotionPanelSlot : motion.div

  useLayoutEffect(() => {
    if (!panel) return
    if (!isPresent) {
      // The tabs root may have resized around the leaving panel; keep it where it was on screen. Only a rectangle
      // measured for this very change counts: one left by an earlier selection would misplace it.
      const leaving = leavingRectRef.current
      const before = leaving?.value === activeValue ? leaving.rect : null
      const now = panel.getBoundingClientRect()
      if (before) panel.style.translate = `${before.left - now.left}px ${before.top - now.top}px`
      return
    }
    panel.style.translate = ""
    const fromHeight = panelHeightRef.current
    const toHeight = panel.offsetHeight
    let controls: AnimationPlaybackControls | undefined
    // The panel is the consumer's tabpanel, whose `style` prop may set these properties too: snapshot them before the
    // morph overrides them and put that snapshot back once it settles.
    const inlineStyle = MORPH_STYLE_PROPERTIES.map((property) => ({
      property,
      value: panel.style.getPropertyValue(property),
      priority: panel.style.getPropertyPriority(property),
    }))
    const release = () => {
      for (const { property, value, priority } of inlineStyle) panel.style.setProperty(property, value, priority)
    }
    if (
      fromHeight !== null &&
      Math.abs(fromHeight - toHeight) > TABS_PANEL_HEIGHT_TOLERANCE_PX &&
      !reduceMotion
    ) {
      // A flex item's automatic minimum size is its content height, which would override the animated height in a
      // column of horizontal tabs; the panel gives up flexing until the morph ends.
      panel.style.flex = "none"
      panel.style.minHeight = "0"
      if (toHeight > fromHeight) panel.style.overflow = "clip"
      // Motion writes its first keyframe on the next frame; pin the starting height now so the panel never paints a
      // frame at its full height before the morph begins.
      panel.style.height = `${fromHeight}px`
      controls = animate(panel, { height: [fromHeight, toHeight] }, { ...ARC_SPRING_SMOOTH, onComplete: release })
    }
    panelHeightRef.current = controls && fromHeight !== null ? fromHeight : toHeight
    const observer = new ResizeObserver(() => {
      panelHeightRef.current = panel.offsetHeight
    })
    observer.observe(panel)
    return () => {
      observer.disconnect()
      controls?.stop()
      release()
    }
  }, [panel, isPresent, reduceMotion, panelHeightRef, leavingRectRef, activeValue])

  return (
    <PanelElement
      ref={attachPanel}
      {...props}
      custom={{ direction, orientation } satisfies PanelMotionCustom}
      variants={reduceMotion ? reducedPanelVariants : panelVariants}
      initial="enter"
      animate="center"
      exit="exit"
      inert={!isPresent || undefined}
      aria-hidden={!isPresent || undefined}
    />
  )
}

/**
 * Content of one tab. Inside `Tabs` it animates between panels; with `forceMount` it stays mounted and switches
 * without motion, as Radix renders it. With `asChild` the consumer's element is the panel in both cases.
 * @param props - Radix content props, including `value` and `forceMount`.
 * @returns The tab panel, or nothing while another tab is active.
 */
function TabsContent({
  className,
  value,
  forceMount,
  asChild,
  children,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  const motionState = useContext(TabsMotionContext)
  const reduceMotion = usePrefersReducedMotion()
  const classes = cn(tabsContentClassName, className)
  if (forceMount || !motionState)
    return (
      <TabsPrimitive.Content
        data-slot="tabs-content"
        value={value}
        forceMount={forceMount}
        asChild={asChild}
        className={classes}
        {...props}
      >
        {children}
      </TabsPrimitive.Content>
    )
  const isSelected = motionState.activeValue === value
  return (
    <AnimatePresence
      initial={false}
      mode="popLayout"
      custom={{ direction: motionState.direction, orientation: motionState.orientation } satisfies PanelMotionCustom}
    >
      {isSelected && (
        <TabsPrimitive.Content
          key={value}
          data-slot="tabs-content"
          {...props}
          value={value}
          forceMount
          asChild
        >
          <TabsPanel className={classes} motionState={motionState} reduceMotion={reduceMotion} asChild={asChild}>
            {children}
          </TabsPanel>
        </TabsPrimitive.Content>
      )}
    </AnimatePresence>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
