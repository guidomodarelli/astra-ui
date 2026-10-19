"use client"

/**
 * Arc's Empty state (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a useful next step when there is
 * nothing to show yet. A centered icon, title, description and optional action. When the copy changes it rolls in place
 * while the block height springs to fit, and a different icon component crossfades in.
 */
import { isValidElement, useEffect, useLayoutEffect, useRef } from "react"
import type { ComponentProps, ReactNode } from "react"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import type { AnimationPlaybackControls, TargetAndTransition, Transition } from "motion/react"
import { Folder } from "lucide-react"

import {
  EMPTY_STATE_HEIGHT_MORPH_WINDOW_MS,
  EMPTY_STATE_ICON_ENTER_SCALE,
  EMPTY_STATE_ICON_SIZE_PX,
  EMPTY_STATE_ICON_STROKE_WIDTH,
} from "../constants/empty-state.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ArcTextSwap } from "../motion/arc-text-swap.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_SMOOTH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"

export type EmptyStateProps = Omit<ComponentProps<"section">, "title" | "children"> & {
  /** Headline. A new title rises in while the old one leaves. */
  title: string
  /** One or two sentences on why it is empty and what to do. */
  description: string
  /** Call to action, usually a button. */
  action?: ReactNode
  /** Leading icon; defaults to a folder. A different icon component crossfades in. */
  icon?: ReactNode
  /** Accessible name of the section region. */
  label?: string
}

const iconEnter: TargetAndTransition = {
  opacity: 0,
  scale: EMPTY_STATE_ICON_ENTER_SCALE,
  filter: `blur(${ARC_BLUR.subtle}px)`,
}
const iconRest: TargetAndTransition = { opacity: 1, scale: 1, filter: "blur(0px)" }
const iconExit: TargetAndTransition = {
  ...iconEnter,
  transition: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] },
}
const reducedFade: TargetAndTransition = { opacity: 0 }
const reducedExit: TargetAndTransition = { opacity: 0, transition: { duration: ARC_DURATION.instant } }
const reducedTransition: Transition = { duration: ARC_DURATION.instant }

/**
 * Keys an icon by its component, so a new icon component crossfades in while re-rendering the same icon stays still.
 * @param icon - The icon element.
 * @returns A stable key for the icon's component.
 */
function iconKey(icon: ReactNode): string {
  if (!isValidElement(icon)) return "icon"
  const type = icon.type as string | { displayName?: string; name?: string }
  return typeof type === "string" ? type : (type.displayName ?? type.name ?? "icon")
}

type HeightFrameProps = {
  reduceMotion: boolean
  /** Changes whenever the copy changes; only then does a height change spring. */
  morphKey: string
  children: ReactNode
}

/**
 * Follows its content height. After `morphKey` changes the height springs from the old size to the new one and then
 * returns to auto, so passive reflows follow instantly. It clips only while moving, so focus outlines stay visible.
 */
function HeightFrame({ reduceMotion, morphKey, children }: HeightFrameProps) {
  const frame = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const height = useMotionValue<number | "auto">("auto")
  const changedAt = useRef(0)
  useLayoutEffect(() => {
    // The window opens on the first frame that shows the new copy, not at commit: a busy main thread can hold that
    // frame back longer than the window, and the copy would jump. Resize observations only arrive after that frame.
    changedAt.current = Number.POSITIVE_INFINITY
    const request = requestAnimationFrame(() => {
      changedAt.current = performance.now()
    })
    return () => cancelAnimationFrame(request)
  }, [morphKey])
  useEffect(() => {
    const node = content.current
    if (!node || typeof ResizeObserver === "undefined") return
    let lastHeight: number | undefined
    let controls: AnimationPlaybackControls | undefined
    const settle = () => {
      height.jump("auto")
      if (frame.current) Object.assign(frame.current.style, { overflow: "", height: "auto" })
    }
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const next = entry.borderBoxSize?.[0]?.blockSize ?? node.offsetHeight
      const current = height.get()
      const from = typeof current === "number" ? current : lastHeight
      lastHeight = next
      controls?.stop()
      if (reduceMotion || from === undefined || from === next || performance.now() - changedAt.current > EMPTY_STATE_HEIGHT_MORPH_WINDOW_MS) {
        settle()
        return
      }
      // Pins the old height before this frame paints, then springs to the new one.
      if (frame.current) Object.assign(frame.current.style, { overflow: "hidden", height: `${from}px` })
      controls = animate(height, [from, next], { ...ARC_SPRING_SMOOTH, onComplete: settle })
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      controls?.stop()
    }
  }, [height, reduceMotion])
  return (
    <motion.div ref={frame} data-slot="empty-state-copy" className="w-full max-w-full" style={{ height }}>
      <div ref={content} className="flow-root">
        {children}
      </div>
    </motion.div>
  )
}

/**
 * A centered placeholder for empty views with an icon, a title, a description and an optional action.
 * @param props - Copy, icon, action, accessible name and native section attributes.
 * @returns The empty state section.
 */
function EmptyState({ title, description, action, icon, label, className, ...props }: EmptyStateProps) {
  const reduceMotion = usePrefersReducedMotion()
  const glyph = icon ?? (
    <Folder width={EMPTY_STATE_ICON_SIZE_PX} height={EMPTY_STATE_ICON_SIZE_PX} strokeWidth={EMPTY_STATE_ICON_STROKE_WIDTH} />
  )
  return (
    <section
      data-slot="empty-state"
      aria-label={label}
      className={cn(
        "flex w-full flex-col items-center px-(--space-5) py-[clamp(var(--space-8),8vw,var(--space-12))] text-center text-foreground",
        className
      )}
      {...props}
    >
      {/* The icon settles in once when the state first appears (keyframes in src/styles/motion.css, transform and opacity only); later changes crossfade in place. */}
      <div
        data-slot="empty-state-icon"
        aria-hidden="true"
        className="relative grid size-(--space-12) place-items-center rounded-(--radius-panel) border border-border bg-surface-muted text-text-secondary animate-[golfo-empty-state-icon-enter_var(--duration-considered)_var(--ease-enter)_both] motion-reduce:animate-none"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={iconKey(glyph)}
            className="grid place-items-center"
            initial={reduceMotion ? reducedFade : iconEnter}
            animate={iconRest}
            exit={reduceMotion ? reducedExit : iconExit}
            transition={reduceMotion ? reducedTransition : ARC_SPRING_SNAPPY}
          >
            {glyph}
          </motion.span>
        </AnimatePresence>
      </div>
      <HeightFrame reduceMotion={reduceMotion} morphKey={`${title}\n${description}`}>
        <h3 data-slot="empty-state-title" className="relative mt-(--space-5) text-base leading-(--leading-body) font-medium text-foreground">
          <ArcTextSwap text={title} reduceMotion={reduceMotion} lineClassName="text-balance" />
        </h3>
        {/* Centered copy wraps into even lines, so a new description never leaves a single word hanging. */}
        <p
          data-slot="empty-state-description"
          className="relative mx-auto mt-(--space-2) max-w-72 text-sm leading-(--leading-body) text-text-secondary"
        >
          <ArcTextSwap text={description} reduceMotion={reduceMotion} lineClassName="text-balance" />
        </p>
      </HeightFrame>
      {action ? (
        <div data-slot="empty-state-action" className="mt-(--space-5) flex flex-wrap justify-center gap-(--space-3)">
          {action}
        </div>
      ) : null}
    </section>
  )
}

export { EmptyState }
