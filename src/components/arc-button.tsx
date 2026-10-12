"use client"

/**
 * Button adapted from Arc (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli, MIT License.
 * The full license text ships in THIRD_PARTY_NOTICES.md. Styles are mapped from Arc's CSS module
 * onto beez-ui's theme tokens so the component works without Arc's foundation stylesheet.
 */
import { isValidElement, useCallback, useEffect, useLayoutEffect, useRef } from "react"
import type { ButtonHTMLAttributes, ReactNode, Ref, RefObject } from "react"
import { AnimatePresence, animate, motion, useIsPresent, useMotionValue } from "motion/react"
import type { TargetAndTransition, Transition, Variants } from "motion/react"
import { cva } from "class-variance-authority"

import {
  ARC_BUTTON_DEFAULT_PRESS_SCALE,
  ARC_BUTTON_ICON_PRESS_SCALE,
  ARC_BUTTON_ICON_THRESHOLD_PX,
  ARC_BUTTON_MORPH_WINDOW_MS,
  ARC_BUTTON_WIDE_PRESS_SCALE,
  ARC_BUTTON_WIDE_THRESHOLD_PX,
} from "../constants/arc-button.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_MORPH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"

/** Visual weight; use one primary action per surface. */
export type ArcButtonVariant = "primary" | "secondary" | "ghost" | "danger"
/** Height and horizontal padding. */
export type ArcButtonSize = "sm" | "md" | "lg"

export type ArcButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"
> & {
  variant?: ArcButtonVariant
  size?: ArcButtonSize
  /** Shows a spinner, sets `aria-busy` and swallows clicks while keeping keyboard focus. */
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

/**
 * Class recipe for ArcButton. Press scale is driven by Motion alone, so `transform` never gets a CSS
 * transition, and anchors of floating layers never scale because Radix measures them on pointerdown.
 */
const arcButtonVariants = cva(
  "relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent px-4 text-sm font-medium whitespace-nowrap outline-none [-webkit-tap-highlight-color:transparent] transition-[color,background-color,border-color,opacity,box-shadow] duration-150 ease-out focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress motion-reduce:transition-none [&:is([aria-haspopup]:not([aria-haspopup=false]),[data-state],[role=combobox])]:transform-none! [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "border-foreground bg-foreground text-background hover:not-disabled:opacity-90 hover:not-disabled:shadow-xs active:not-disabled:opacity-85",
        secondary:
          "border-border bg-background text-foreground hover:not-disabled:bg-muted hover:not-disabled:shadow-xs active:not-disabled:bg-muted disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100",
        ghost:
          "text-muted-foreground hover:not-disabled:bg-muted hover:not-disabled:text-foreground active:not-disabled:bg-muted active:not-disabled:text-foreground disabled:text-muted-foreground/60 disabled:opacity-100",
        danger:
          "border-border bg-background text-destructive hover:not-disabled:border-destructive hover:not-disabled:bg-muted active:not-disabled:border-destructive active:not-disabled:bg-muted disabled:bg-muted disabled:text-destructive/55 disabled:opacity-100",
      },
      size: {
        sm: "min-h-8 px-3",
        md: "min-h-9",
        lg: "min-h-10 px-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
)

/** Icon buttons press a little deeper and wide buttons a little less, so every size reads as the same push. */
const pressVariants: Variants = {
  pressed: (button: RefObject<HTMLButtonElement | null>) => {
    const width = button.current?.offsetWidth ?? 0
    const scale =
      width > ARC_BUTTON_WIDE_THRESHOLD_PX
        ? ARC_BUTTON_WIDE_PRESS_SCALE
        : width && width <= ARC_BUTTON_ICON_THRESHOLD_PX
          ? ARC_BUTTON_ICON_PRESS_SCALE
          : ARC_BUTTON_DEFAULT_PRESS_SCALE
    return { scale, transition: { duration: ARC_DURATION.instant, ease: [...ARC_EASE.standard] } }
  },
}

const restState: TargetAndTransition = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
/** Text rises out of a soft blur; the outgoing label lifts away a little faster. */
const textEnter: TargetAndTransition = { opacity: 0, y: 4, filter: `blur(${ARC_BLUR.soft}px)` }
/** Outgoing labels and icons leave faster than they enter. */
const exitTransition: Transition = { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] }
const textExit: TargetAndTransition = { opacity: 0, y: -3, filter: `blur(${ARC_BLUR.soft}px)`, transition: exitTransition }
const iconEnter: TargetAndTransition = { opacity: 0, scale: 0.6, filter: `blur(${ARC_BLUR.subtle}px)` }
const iconExit: TargetAndTransition = { ...iconEnter, transition: exitTransition }
const reducedEnter: TargetAndTransition = { ...restState, opacity: 0 }
const reducedTransition: Transition = { duration: ARC_DURATION.instant }
const reducedExit: TargetAndTransition = { opacity: 0, transition: reducedTransition }
/** Scale rides the spring; opacity and blur tween so blur never overshoots below zero. */
const iconTransition: Transition = {
  ...ARC_SPRING_SNAPPY,
  opacity: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
  filter: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.enter] },
}
const textTransition: Transition = { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] }

/** Matches markup tags inside a label key so icon-only labels can be detected. */
const LABEL_KEY_TAG_PATTERN = /<[^>]*>/g
/** Detects visible text left in a label key. */
const VISIBLE_TEXT_PATTERN = /\S/

/** Builds a key from text and element names, so a new label crossfades while prop-only updates stay in place. */
function getLabelKey(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node)
  if (Array.isArray(node)) return node.map(getLabelKey).join("")
  if (!isValidElement(node)) return ""
  const elementType = node.type as string | { displayName?: string; name?: string }
  const elementName =
    typeof elementType === "string" ? elementType : (elementType?.displayName ?? elementType?.name ?? "")
  return `<${elementName}>${getLabelKey((node.props as { children?: ReactNode }).children)}`
}

/**
 * Springs the label slot to the natural width of an incoming label, so a new label never snaps the
 * button's size. Other resizes jump straight to the new width.
 */
function useMorphWidth(contentRef: RefObject<HTMLElement | null>, labelKey: string, reduceMotion: boolean) {
  const width = useMotionValue<number | "auto">("auto")
  const lastLabelKey = useRef(labelKey)
  const morphDeadline = useRef(0)

  useLayoutEffect(() => {
    if (lastLabelKey.current === labelKey) return
    lastLabelKey.current = labelKey
    morphDeadline.current = performance.now() + ARC_BUTTON_MORPH_WINDOW_MS
  }, [labelKey])

  useEffect(() => {
    const content = contentRef.current
    const slot = content?.parentElement
    if (!content || !slot || typeof ResizeObserver === "undefined") return
    let hasMeasured = false
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const nextWidth = entry.contentRect.width
      const shouldJump = !nextWidth || !hasMeasured || reduceMotion || performance.now() > morphDeadline.current
      if (shouldJump) {
        hasMeasured = nextWidth > 0
        width.jump(nextWidth || "auto")
        delete slot.dataset.morphing
        return
      }
      slot.dataset.morphing = ""
      animate(width, nextWidth, {
        ...ARC_SPRING_MORPH,
        onComplete: () => {
          delete slot.dataset.morphing
        },
      })
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [contentRef, reduceMotion, width])

  return width
}

type LabelPhaseProps = {
  children: ReactNode
  isIcon: boolean
  reduceMotion: boolean
}

/** One generation of the label; the outgoing one is hidden from assistive tech while it leaves. */
function LabelPhase({ children, isIcon, reduceMotion }: LabelPhaseProps) {
  const isPresent = useIsPresent()
  return (
    <motion.span
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
      aria-hidden={isPresent ? undefined : true}
      initial={reduceMotion ? reducedEnter : isIcon ? iconEnter : textEnter}
      animate={restState}
      exit={reduceMotion ? reducedExit : isIcon ? iconExit : textExit}
      transition={reduceMotion ? reducedTransition : isIcon ? iconTransition : textTransition}
    >
      {children}
    </motion.span>
  )
}

/** Native button with press feedback, a spinner for short async work and a label that morphs its width. */
function ArcButton({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  onClick,
  ref,
  ...props
}: ArcButtonProps) {
  const reduceMotion = usePrefersReducedMotion()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const contentRef = useRef<HTMLSpanElement>(null)
  const labelKey = getLabelKey(children)
  const width = useMorphWidth(contentRef, labelKey, reduceMotion)
  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  // A trigger that anchors a menu, popover or dialog keeps its rect still while pressed.
  const popup = props["aria-haspopup"]
  const anchorsLayer =
    (popup !== undefined && popup !== false && popup !== "false") ||
    props.role === "combobox" ||
    (props as Record<string, unknown>)["data-state"] !== undefined
  const isInert = disabled || loading || props["aria-disabled"] === true || props["aria-disabled"] === "true"

  return (
    <motion.button
      ref={setRefs}
      data-slot="arc-button"
      data-variant={variant}
      data-size={size}
      className={cn(arcButtonVariants({ variant, size }), className)}
      disabled={disabled}
      aria-busy={loading || undefined}
      custom={buttonRef}
      variants={pressVariants}
      whileTap={reduceMotion || anchorsLayer || isInert ? undefined : "pressed"}
      transition={ARC_SPRING_SNAPPY}
      {...props}
      // Loading keeps the button focusable (disabled would drop keyboard focus mid-action) and swallows presses instead.
      aria-disabled={loading || props["aria-disabled"] || undefined}
      onClick={loading ? (event) => event.preventDefault() : onClick}
    >
      <AnimatePresence initial={false}>
        {loading ? (
          <motion.span
            key="loader"
            className="absolute top-1/2 left-1/2 -m-2 grid size-4"
            aria-hidden="true"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? reducedExit : { ...iconExit, scale: 0.8 }}
            transition={reduceMotion ? reducedTransition : iconTransition}
          >
            <span className="animate-spin rounded-full border-[1.5px] border-current border-r-transparent motion-reduce:animate-none" />
          </motion.span>
        ) : null}
      </AnimatePresence>
      <motion.span
        className={cn(
          "relative inline-flex min-w-0 items-center justify-center transition-opacity duration-150 data-morphing:[clip-path:inset(-50%_calc(var(--spacing)*-3))]",
          loading && "opacity-0",
        )}
        style={{ width }}
      >
        <span ref={contentRef} className="inline-flex flex-none items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <LabelPhase
              key={labelKey}
              isIcon={!VISIBLE_TEXT_PATTERN.test(labelKey.replace(LABEL_KEY_TAG_PATTERN, ""))}
              reduceMotion={reduceMotion}
            >
              {children}
            </LabelPhase>
          </AnimatePresence>
        </span>
      </motion.span>
    </motion.button>
  )
}

export { ArcButton, arcButtonVariants }
