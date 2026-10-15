"use client";

/**
 * Arc's Calendar (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md) on react-day-picker: round day cells
 * on a 4px grid, the month title on the left with quiet pill controls on the right, today marked by a dot under its
 * number, a selected disc that glides between days and an optional Today button. react-day-picker keeps selection
 * modes, ranges, dropdowns, locales and keyboard navigation; only the design and the motion come from Arc.
 */
import * as React from "react"
import { es } from "react-day-picker/locale"
import {
  DayPicker,
  UI,
  dateMatchModifiers,
  getDefaultClassNames,
  useDayPicker,
  type CustomComponents,
  type DayButton,
  type Locale,
  type Modifiers,
  type MonthProps,
  type NavProps,
  type SelectHandler,
} from "react-day-picker"
import { animate, frame } from "motion/react"
import type { AnimationPlaybackControls, Transition } from "motion/react"

import {
  CALENDAR_COPY,
  CALENDAR_MONTH_ENTER_OPACITY,
  CALENDAR_MONTH_SPRING,
  CALENDAR_SELECTED_DAY_SELECTOR,
  CALENDAR_SELECTION_DISC_ATTRIBUTE,
  CALENDAR_SELECTION_ENTER_SCALE,
  CALENDAR_SELECTION_EXIT_DURATION_S,
} from "../constants/calendar.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { useToday } from "../hooks/use-today.js"
import { ARC_DURATION, ARC_EASE, ARC_SPRING_MORPH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"
import { MOTION_MONTH_DISTANCE } from "../motion/tokens.js"
import { cn } from "../lib/utils.js"
import { ControlButton, controlButtonVariants } from "./control-button.js"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"

/** Settings of the Arc additions that the stable react-day-picker slots read without remounting. */
type CalendarSettings = {
  /** Visible copy and accessible name prefix of the Today button. */
  todayLabel: string
}

const CalendarSettingsContext = React.createContext<CalendarSettings>({ todayLabel: CALENDAR_COPY.today })

/** Arc's quiet header control: a fill on hover-capable pointers, a short press and a dimmed, inert disabled state. */
const calendarHeaderControlClassName =
  "h-8 rounded-full p-0 text-text-secondary select-none transition-[color,background-color,opacity,scale] duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none hover-fine:not-aria-disabled:bg-surface-muted hover-fine:not-aria-disabled:text-foreground active:not-aria-disabled:scale-[.96] motion-reduce:active:scale-100 aria-disabled:pointer-events-none aria-disabled:cursor-default aria-disabled:opacity-35"

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  /** Variant of the month navigation buttons, kept for compatibility; Arc's look is the default `ghost`. */
  buttonVariant?: React.ComponentProps<typeof ControlButton>["variant"]
  /**
   * Adds Arc's Today button before the month controls: it goes back to the month holding today and, in single
   * selection mode, selects today when it is available. It rests dimmed while there is nothing left to do.
   */
  showToday?: boolean
  /** Copy of the Today button. Defaults to "Hoy". */
  todayLabel?: string
}

/**
 * A month grid for picking a day, several days or a range, controlled or uncontrolled like react-day-picker.
 * @param props - Every react-day-picker prop plus the Arc additions `showToday` and `todayLabel`.
 * @returns The calendar, in Spanish by default.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale = es,
  formatters,
  components,
  showToday = false,
  todayLabel = CALENDAR_COPY.today,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()
  const isRange = props.mode === "range"
  const settings = React.useMemo(() => ({ todayLabel }), [todayLabel])

  return (
    <CalendarSettingsContext.Provider value={settings}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn(
          "group/calendar bg-background p-2 text-foreground [--cell-radius:var(--radius-pill)] [--cell-size:--spacing(9)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
          String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
          String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
          className
        )}
        captionLayout={captionLayout}
        locale={locale}
        formatters={{
          formatMonthDropdown: (date) =>
            date.toLocaleString(locale?.code, { month: "short" }),
          ...formatters,
        }}
        classNames={{
          root: cn("w-fit", defaultClassNames.root),
          months: cn(
            "relative flex flex-col gap-6 md:flex-row",
            defaultClassNames.months
          ),
          month: cn(
            "group/calendar-month relative flex w-full flex-col gap-3",
            defaultClassNames.month
          ),
          nav: cn(
            "absolute end-0 top-0 z-20 flex items-center gap-0.5",
            defaultClassNames.nav
          ),
          button_previous: cn(
            controlButtonVariants({ variant: buttonVariant }),
            calendarHeaderControlClassName,
            "size-8",
            defaultClassNames.button_previous
          ),
          button_next: cn(
            controlButtonVariants({ variant: buttonVariant }),
            calendarHeaderControlClassName,
            "size-8",
            defaultClassNames.button_next
          ),
          month_caption: cn(
            "flex h-8 w-full items-center justify-start",
            showToday ? "pe-36" : "pe-18",
            defaultClassNames.month_caption
          ),
          dropdowns: cn(
            "flex h-8 w-full items-center justify-start gap-1.5 text-base font-medium",
            defaultClassNames.dropdowns
          ),
          dropdown_root: cn(
            "relative rounded-(--radius-control)",
            defaultClassNames.dropdown_root
          ),
          dropdown: cn(
            "absolute inset-0 bg-popover opacity-0",
            defaultClassNames.dropdown
          ),
          caption_label: cn(
            "font-medium whitespace-nowrap tabular-nums select-none",
            captionLayout === "label"
              ? "text-base"
              : "flex items-center gap-1 rounded-(--radius-control) text-base [&>svg]:size-3.5 [&>svg]:text-text-muted",
            defaultClassNames.caption_label
          ),
          month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
          weekdays: cn("flex", !isRange && "gap-1", defaultClassNames.weekdays),
          weekday: cn(
            "flex-1 text-xs leading-6 font-medium text-text-muted select-none",
            defaultClassNames.weekday
          ),
          week: cn("mt-1 flex w-full", !isRange && "gap-1", defaultClassNames.week),
          week_number_header: cn(
            "w-(--cell-size) select-none",
            defaultClassNames.week_number_header
          ),
          week_number: cn(
            "text-xs text-text-muted select-none",
            defaultClassNames.week_number
          ),
          day: cn(
            "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
            props.showWeekNumber
              ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
              : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
            defaultClassNames.day
          ),
          range_start: cn(
            "relative isolate z-0 rounded-l-(--cell-radius) bg-surface-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-surface-muted",
            defaultClassNames.range_start
          ),
          range_middle: cn("rounded-none", defaultClassNames.range_middle),
          range_end: cn(
            "relative isolate z-0 rounded-r-(--cell-radius) bg-surface-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-surface-muted",
            defaultClassNames.range_end
          ),
          today: cn(defaultClassNames.today),
          outside: cn(defaultClassNames.outside),
          disabled: cn(defaultClassNames.disabled),
          hidden: cn("invisible", defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          Root: CalendarRoot,
          Chevron: CalendarChevron,
          DayButton: CalendarDayButtonSlot,
          Month: CalendarMonth,
          ...(showToday ? { Nav: CalendarNav } : {}),
          WeekNumber: CalendarWeekNumber,
          ...components,
        }}
        {...props}
      />
    </CalendarSettingsContext.Provider>
  )
}

/** Props react-day-picker passes to one of its replaceable slots. */
type CalendarSlotProps<SlotName extends keyof CustomComponents> = React.ComponentProps<CustomComponents[SlotName]>

/*
 * The slots below live at module level so their component identity is stable across renders. Inline slot functions
 * would be new component types on every render: React would remount the whole calendar (Root wraps it) and every month
 * would lose its state, which cancels the month slide and the selected disc glide when nothing memoizes them.
 */

/** The calendar root, tagged with `data-slot="calendar"`. */
function CalendarRoot({ className, rootRef, ...props }: CalendarSlotProps<"Root">) {
  return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
}

/** Arc's chevrons for the month controls and the caption dropdowns. */
function CalendarChevron({ className, orientation, ...props }: CalendarSlotProps<"Chevron">) {
  if (orientation === "left") {
    return <ChevronLeft className={cn("size-4", className)} strokeWidth={1.75} {...props} />
  }
  if (orientation === "right") {
    return <ChevronRight className={cn("size-4", className)} strokeWidth={1.75} {...props} />
  }
  return <ChevronDown className={cn("size-4", className)} {...props} />
}

/** The day button slot, which reads the calendar locale for `data-day`. */
function CalendarDayButtonSlot(props: CalendarSlotProps<"DayButton">) {
  const { dayPickerProps } = useDayPicker()
  return <CalendarDayButton locale={dayPickerProps.locale} {...props} />
}

/** A week number cell sized like a day. */
function CalendarWeekNumber({ children, ...props }: CalendarSlotProps<"WeekNumber">) {
  return (
    <td {...props}>
      <div className="flex size-(--cell-size) items-center justify-center text-center">{children}</div>
    </td>
  )
}

/**
 * react-day-picker's month navigation with Arc's Today button in front of the arrows. Used only with `showToday`,
 * so the default navigation stays untouched otherwise.
 * @param props - Navigation handlers and the neighbouring months react-day-picker passes to its `Nav` slot.
 * @returns The navigation landmark.
 */
function CalendarNav({
  onPreviousClick,
  onNextClick,
  previousMonth,
  nextMonth,
  ...navProps
}: NavProps) {
  const {
    components,
    classNames,
    styles,
    labels: { labelPrevious, labelNext },
  } = useDayPicker()

  return (
    <nav {...navProps}>
      <CalendarTodayButton />
      <components.PreviousMonthButton
        type="button"
        className={classNames[UI.PreviousMonthButton]}
        style={styles?.[UI.PreviousMonthButton]}
        tabIndex={previousMonth ? undefined : -1}
        aria-disabled={previousMonth ? undefined : true}
        aria-label={labelPrevious(previousMonth)}
        onClick={(event) => {
          if (previousMonth) onPreviousClick?.(event)
        }}
      >
        <components.Chevron
          disabled={previousMonth ? undefined : true}
          className={classNames[UI.Chevron]}
          style={styles?.[UI.Chevron]}
          orientation="left"
        />
      </components.PreviousMonthButton>
      <components.NextMonthButton
        type="button"
        className={classNames[UI.NextMonthButton]}
        style={styles?.[UI.NextMonthButton]}
        tabIndex={nextMonth ? undefined : -1}
        aria-disabled={nextMonth ? undefined : true}
        aria-label={labelNext(nextMonth)}
        onClick={(event) => {
          if (nextMonth) onNextClick?.(event)
        }}
      >
        <components.Chevron
          disabled={nextMonth ? undefined : true}
          className={classNames[UI.Chevron]}
          style={styles?.[UI.Chevron]}
          orientation="right"
        />
      </components.NextMonthButton>
    </nav>
  )
}

/** Whether two dates fall in the same calendar month. */
function isSameMonth(firstDate: Date, secondDate: Date): boolean {
  return firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth()
}

/**
 * Arc's Today button. Today is read on the client only (or from the `today` prop), so server markup never depends on
 * the server clock; until then the button rests dimmed.
 * @returns A button that brings today into view and selects it in single mode when it is not disabled.
 */
function CalendarTodayButton() {
  const { months, goToMonth, select, isSelected, dayPickerProps } = useDayPicker()
  const { todayLabel } = React.useContext(CalendarSettingsContext)
  const viewerToday = useToday()
  const today = dayPickerProps.today ?? viewerToday
  const isTodayShown = Boolean(today && months.some((month) => isSameMonth(month.date, today)))
  const isTodaySelectable = Boolean(
    today &&
      select &&
      dayPickerProps.mode === "single" &&
      !dateMatchModifiers(today, dayPickerProps.disabled ?? [])
  )
  const isTodaySelected = Boolean(today && isSelected?.(today))
  const isIdle = !today || (isTodayShown && (!isTodaySelectable || isTodaySelected))

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isIdle || !today) return
    if (!isTodayShown) goToMonth(today)
    if (!isTodaySelectable || isTodaySelected) return
    const todayModifiers: Modifiers = { today: true }
    // Only single mode selects today, so the handler is react-day-picker's single selection handler.
    const selectSingle = select as SelectHandler<{ mode: "single" }> | undefined
    selectSingle?.(today, todayModifiers, event)
  }

  return (
    <button
      type="button"
      data-slot="calendar-today"
      aria-disabled={isIdle || undefined}
      className={cn(
        calendarHeaderControlClassName,
        "inline-flex cursor-pointer items-center border-0 bg-transparent px-[11px] text-sm leading-none font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [-webkit-tap-highlight-color:transparent]"
      )}
      onClick={handleClick}
    >
      {todayLabel}
    </button>
  )
}

/** Offset of a day button inside its month, from layout offsets, so press scales and the month slide never skew it. */
function measureDayOffset(day: HTMLElement, month: HTMLElement): { x: number; y: number } {
  let horizontalOffset = 0
  let verticalOffset = 0
  let node: HTMLElement | null = day
  while (node && node !== month) {
    horizontalOffset += node.offsetLeft
    verticalOffset += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { x: horizontalOffset, y: verticalOffset }
}

/**
 * Arc's selected disc for one month in single selection mode. It glides on a spring between two days of the same
 * month, retargets mid-flight on a new pick, grows in when the selection enters the month and fades out when it leaves.
 * While it paints the selection the month carries {@link CALENDAR_SELECTION_DISC_ATTRIBUTE}, so the selected day drops
 * its own fill; before hydration, and in other modes, the day keeps that fill.
 * @param monthRef - The month container the disc is positioned in.
 * @param monthTime - The month being displayed, so a month change jumps the disc instead of gliding it.
 * @param isEnabled - Whether the calendar is in single selection mode.
 * @returns The ref for the disc element.
 */
function useSelectionDisc(
  monthRef: React.RefObject<HTMLDivElement | null>,
  monthTime: number,
  isEnabled: boolean
) {
  const discRef = React.useRef<HTMLSpanElement>(null)
  const placementRef = React.useRef<{ dayKey: string | null; monthTime: number }>({ dayKey: null, monthTime })
  const animationsRef = React.useRef<AnimationPlaybackControls[]>([])
  const reduceMotion = usePrefersReducedMotion()

  const stopAnimations = React.useCallback(() => {
    animationsRef.current.forEach((animation) => animation.stop())
    animationsRef.current = []
  }, [])

  React.useLayoutEffect(() => {
    const month = monthRef.current
    const disc = discRef.current
    if (!month || !disc) return
    const selectedDay = isEnabled ? month.querySelector<HTMLElement>(CALENDAR_SELECTED_DAY_SELECTOR) : null
    const dayKey = selectedDay?.getAttribute("data-day") ?? null
    const previous = placementRef.current
    if (previous.dayKey === dayKey && previous.monthTime === monthTime) return
    placementRef.current = { dayKey, monthTime }
    stopAnimations()

    if (!selectedDay) {
      month.removeAttribute(CALENDAR_SELECTION_DISC_ATTRIBUTE)
      if (previous.dayKey === null) return
      const fade: Transition = reduceMotion
        ? { duration: 0 }
        : { duration: CALENDAR_SELECTION_EXIT_DURATION_S, ease: [...ARC_EASE.standard] }
      animationsRef.current = [animate(disc, { opacity: 0, scale: CALENDAR_SELECTION_ENTER_SCALE }, fade)]
      return
    }

    const offset = measureDayOffset(selectedDay, month)
    disc.style.width = `${selectedDay.offsetWidth}px`
    disc.style.height = `${selectedDay.offsetHeight}px`
    month.setAttribute(CALENDAR_SELECTION_DISC_ATTRIBUTE, "visible")
    const isGlide = previous.dayKey !== null && previous.monthTime === monthTime && !reduceMotion
    if (isGlide) {
      animationsRef.current = [animate(disc, { x: offset.x, y: offset.y }, ARC_SPRING_MORPH)]
      return
    }
    const isEntering = previous.dayKey === null
    animationsRef.current = [animate(disc, { x: offset.x, y: offset.y }, { duration: 0 })]
    if (isEntering && !reduceMotion) {
      animationsRef.current.push(
        animate(disc, { opacity: [0, 1] }, { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] }),
        animate(disc, { scale: [CALENDAR_SELECTION_ENTER_SCALE, 1] }, ARC_SPRING_SNAPPY)
      )
    } else {
      animationsRef.current.push(animate(disc, { opacity: 1, scale: 1 }, { duration: 0 }))
    }
  })

  React.useEffect(() => {
    const month = monthRef.current
    const disc = discRef.current
    if (!month || !disc || typeof ResizeObserver === "undefined") return
    // A resized month moves its days, so the disc lands on the selected day again without animating.
    const observer = new ResizeObserver(() => {
      const selectedDay = month.querySelector<HTMLElement>(CALENDAR_SELECTED_DAY_SELECTOR)
      if (!selectedDay || placementRef.current.dayKey === null) return
      stopAnimations()
      const offset = measureDayOffset(selectedDay, month)
      disc.style.width = `${selectedDay.offsetWidth}px`
      disc.style.height = `${selectedDay.offsetHeight}px`
      animationsRef.current = [animate(disc, { x: offset.x, y: offset.y, opacity: 1, scale: 1 }, { duration: 0 })]
    })
    observer.observe(month)
    return () => {
      observer.disconnect()
      stopAnimations()
    }
  }, [monthRef, stopAnimations])

  return discRef
}

/**
 * Renders one displayed month and slides it in from the side the user navigated from, on Arc's month spring.
 * DayPicker keys months by display position, so this instance survives navigation and can
 * compare the new month with the previous one. The first render and reduced motion stay static.
 * @param props - DayPicker month properties, including the month being displayed.
 * @returns The month container with its caption, grid and selected disc.
 */
function CalendarMonth({
  calendarMonth,
  displayIndex,
  children,
  ...props
}: MonthProps) {
  const monthRef = React.useRef<HTMLDivElement>(null)
  const monthTime = calendarMonth.date.getTime()
  const previousMonthTimeRef = React.useRef(monthTime)
  const reduceMotion = usePrefersReducedMotion()
  const { dayPickerProps } = useDayPicker()
  const discRef = useSelectionDisc(monthRef, monthTime, dayPickerProps.mode === "single")

  React.useLayoutEffect(() => {
    const previousMonthTime = previousMonthTimeRef.current
    previousMonthTimeRef.current = monthTime
    const element = monthRef.current
    if (!element || reduceMotion || previousMonthTime === monthTime) return
    const isForward = monthTime > previousMonthTime
    const isRightToLeft = getComputedStyle(element).direction === "rtl"
    const direction = isForward !== isRightToLeft ? 1 : -1
    const original = { opacity: element.style.opacity, transform: element.style.transform }
    const restore = () => {
      element.style.opacity = original.opacity
      element.style.transform = original.transform
    }
    const animation = animate(
      element,
      {
        opacity: [CALENDAR_MONTH_ENTER_OPACITY, 1],
        transform: [`translateX(${direction * MOTION_MONTH_DISTANCE}px)`, "translateX(0px)"],
      },
      CALENDAR_MONTH_SPRING
    )
    let isActive = true
    // Motion commits final values after `then`; restoring on the next render frame wins over them.
    void animation.then(() =>
      frame.postRender(() => {
        if (isActive) restore()
      })
    )
    return () => {
      isActive = false
      animation.cancel()
      restore()
    }
  }, [monthTime, reduceMotion])

  return (
    <div
      ref={monthRef}
      data-slot="calendar-month"
      data-display-index={displayIndex}
      {...props}
    >
      <span
        ref={discRef}
        aria-hidden="true"
        data-slot="calendar-selection"
        className="pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-accent opacity-0"
      />
      {children}
    </div>
  )
}

/**
 * One day of the grid: a round cell whose fill answers hover on fine pointers, presses in slightly and marks today
 * with a dot under its number that takes the number's colour.
 * @param props - react-day-picker day button properties plus the locale used for `data-day`.
 * @returns The day button.
 */
function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelectedSingle = Boolean(
    modifiers.selected &&
      !modifiers.range_start &&
      !modifiers.range_end &&
      !modifiers.range_middle
  )

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={isSelectedSingle}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      data-today={modifiers.today || undefined}
      className={cn(
        "relative isolate z-10 flex aspect-square w-full min-w-(--cell-size) cursor-pointer flex-col items-center justify-center gap-1 rounded-(--cell-radius) border-0 bg-transparent p-0 text-sm leading-none font-normal text-foreground tabular-nums outline-none select-none [-webkit-tap-highlight-color:transparent] [&>span]:text-xs [&>span]:opacity-70",
        "transition-[color,background-color,scale] duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none",
        "hover-fine:not-disabled:not-data-[selected-single=true]:not-data-[range-start=true]:not-data-[range-end=true]:bg-surface-muted active:not-disabled:scale-[.94] motion-reduce:active:scale-100",
        "focus-visible:ring-3 focus-visible:ring-ring/50 group-data-[focused=true]/day:ring-3 group-data-[focused=true]/day:ring-ring/50",
        modifiers.outside && "text-text-muted",
        modifiers.disabled && "cursor-default text-text-muted opacity-40",
        modifiers.today &&
          "font-medium after:pointer-events-none after:absolute after:bottom-[18%] after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current",
        "data-[selected-single=true]:bg-accent data-[selected-single=true]:font-medium data-[selected-single=true]:text-accent-foreground group-data-[selection-disc=visible]/calendar-month:data-[selected-single=true]:bg-transparent",
        "data-[range-start=true]:bg-accent data-[range-start=true]:text-accent-foreground data-[range-end=true]:bg-accent data-[range-end=true]:text-accent-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-surface-muted data-[range-middle=true]:text-foreground",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
export type { CalendarProps }
