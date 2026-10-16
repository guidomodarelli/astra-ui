"use client"

/**
 * Arc's Skeleton (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): placeholders that reserve space while
 * content loads, with a calm, finite pulse that ripples down the blocks and rests after about 20 seconds. It draws
 * Arc's placeholder of text lines and an optional avatar, and with children its reveal, which crossfades into the
 * content while the height springs to its new size. Like Arc, it only draws lines and an avatar: other shapes are
 * built by the consumer.
 */
import { useEffect, useLayoutEffect, useRef } from "react"
import type { CSSProperties, ReactNode, Ref, RefObject } from "react"
import { AnimatePresence, animate, motion, useIsPresent } from "motion/react"
import type { AnimationPlaybackControls, HTMLMotionProps } from "motion/react"

import {
  SKELETON_DEFAULT_LABEL,
  SKELETON_DEFAULT_LINES,
  SKELETON_LINE_LIMITS,
  SKELETON_MORPH_WINDOW_MS,
  SKELETON_REVEAL_OFFSET_PX,
} from "../constants/skeleton.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_DURATION, ARC_EASE, ARC_SPRING_SMOOTH } from "../motion/arc-tokens.js"

/**
 * Arc's block: a soft fill mixed from the strong border, and a 1.8s pulse that starts a beat later for each
 * `--index` and stops after 11 rounds. Reduced motion shows a still block.
 */
const blockClassName =
  "block rounded-(--radius-control) bg-[color-mix(in_oklab,var(--border-strong)_38%,var(--surface))] animate-pulse [animation-delay:calc(var(--index,0)*90ms)] [animation-duration:1.8s] [animation-fill-mode:both] [animation-iteration-count:11] [animation-timing-function:var(--ease-in-out)] motion-reduce:animate-none"

/** Custom property that staggers each block's pulse. */
type IndexedStyle = CSSProperties & { "--index"?: number }

export type SkeletonProps = {
  /** Accessible name of the loading status; defaults to "Cargando contenido". */
  label?: string
  /** Number of text lines, clamped to 1-6; defaults to 3. */
  lines?: number
  /** Adds a round avatar block before the lines. */
  avatar?: boolean
  /** Content to reveal once loading finishes; with children the placeholder crossfades into them. */
  children?: ReactNode
  /** Keeps the placeholder visible while true (the default). Only used together with `children`. */
  loading?: boolean
  /** Classes for the outer element: the placeholder, or the reveal frame when there are children. */
  className?: string
}

/**
 * Follows the content height. After `busy` flips, the frame springs from its old height to its new one, owning its
 * inline height and overflow only while it moves and restoring the consumer's values afterwards, so a fixed height
 * from `className` or `style` keeps applying at rest. It clips only while moving, so focus rings stay visible at rest.
 * @param contentRef - The measured content; its parent is the frame that springs.
 * @param busy - Whether the placeholder is showing; a change opens the window in which resizes spring.
 * @param reduceMotion - Whether every resize should jump.
 */
function useMorphHeight(contentRef: RefObject<HTMLDivElement | null>, busy: boolean, reduceMotion: boolean): void {
  const changedAt = useRef(0)
  useLayoutEffect(() => {
    changedAt.current = performance.now()
  }, [busy])
  useEffect(() => {
    const content = contentRef.current
    const frame = content?.parentElement
    if (!content || !frame || typeof ResizeObserver === "undefined") return
    let lastFrameHeight: number | undefined
    let controls: AnimationPlaybackControls | undefined
    // The consumer's inline height and overflow, saved only while the frame moves and restored afterwards.
    let restingStyle: { height: string; overflow: string } | undefined
    const readFrameHeight = () => frame.getBoundingClientRect().height
    const settle = () => {
      if (restingStyle) Object.assign(frame.style, restingStyle)
      restingStyle = undefined
    }
    const observer = new ResizeObserver(() => {
      controls?.stop()
      // A moving frame starts from where it is now; then its own height is restored to measure where it lands.
      const fromHeight = restingStyle ? readFrameHeight() : lastFrameHeight
      if (restingStyle) frame.style.height = restingStyle.height
      const nextHeight = readFrameHeight()
      lastFrameHeight = nextHeight
      const isOutsideWindow = performance.now() - changedAt.current > SKELETON_MORPH_WINDOW_MS
      if (reduceMotion || fromHeight === undefined || fromHeight === nextHeight || isOutsideWindow) return settle()
      // Pin the old height before this frame paints, then spring to the new one.
      restingStyle ??= { height: frame.style.height, overflow: frame.style.overflow }
      frame.style.overflow = "hidden"
      frame.style.height = `${fromHeight}px`
      controls = animate(fromHeight, nextHeight, {
        ...ARC_SPRING_SMOOTH,
        onUpdate: (animatedHeight) => {
          frame.style.height = `${animatedHeight}px`
        },
        onComplete: settle,
      })
    })
    observer.observe(content)
    return () => {
      observer.disconnect()
      controls?.stop()
      settle()
    }
  }, [contentRef, reduceMotion])
}

type SkeletonPlaceholderProps = {
  lines: number
  avatar: boolean
  label: string
  className?: string
}

/** Arc's composed placeholder: an optional avatar and a column of lines, announced once as a busy status. */
function SkeletonPlaceholder({ lines, avatar, label, className }: SkeletonPlaceholderProps) {
  const lineCount = Math.min(Math.max(Math.floor(lines), SKELETON_LINE_LIMITS.min), SKELETON_LINE_LIMITS.max)
  const firstLineIndex = avatar ? 1 : 0
  return (
    <div
      data-slot="skeleton-placeholder"
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn("flex w-full min-w-0 items-start gap-(--space-4)", className)}
    >
      {avatar ? (
        <span
          data-slot="skeleton"
          aria-hidden="true"
          className={cn(blockClassName, "size-(--control-height-md) flex-none rounded-(--radius-pill)")}
        />
      ) : null}
      <span aria-hidden="true" className="grid flex-1 gap-(--space-3) pt-(--space-1)">
        {Array.from({ length: lineCount }, (_, lineIndex) => (
          <span
            key={lineIndex}
            data-slot="skeleton"
            className={cn(
              blockClassName,
              "h-(--space-3) w-full first:h-(--space-4) first:w-[48%] last:not-first:w-[72%]"
            )}
            style={{ "--index": lineIndex + firstLineIndex } as IndexedStyle}
          />
        ))}
      </span>
    </div>
  )
}

type SkeletonBranchProps = HTMLMotionProps<"div"> & {
  /** AnimatePresence's popLayout needs the node to pull the leaving branch out of flow. */
  ref?: Ref<HTMLDivElement>
}

/**
 * One side of the reveal. While it fades out it turns inert and hidden from assistive technology, so stale content
 * under the new branch cannot be clicked, focused or announced.
 */
function SkeletonBranch({ ref, ...props }: SkeletonBranchProps) {
  const isPresent = useIsPresent()
  return <motion.div ref={ref} {...props} aria-hidden={isPresent ? undefined : true} inert={!isPresent || undefined} />
}

type SkeletonRevealProps = {
  loading: boolean
  placeholder: ReactNode
  children: ReactNode
  className?: string
}

/** Arc's reveal: the placeholder crossfades into the content while the frame springs to the new height. */
function SkeletonReveal({ loading, placeholder, children, className }: SkeletonRevealProps) {
  const reduceMotion = usePrefersReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  useMorphHeight(contentRef, loading, reduceMotion)
  const exitTransition = { duration: reduceMotion ? ARC_DURATION.instant : ARC_DURATION.fast }
  return (
    <div data-slot="skeleton-reveal" aria-busy={loading} className={className}>
      <div ref={contentRef} className="relative flow-root">
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? (
            <SkeletonBranch
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: exitTransition }}
              transition={{
                duration: reduceMotion ? ARC_DURATION.instant : ARC_DURATION.fast,
                ease: [...ARC_EASE.standard],
              }}
            >
              {placeholder}
            </SkeletonBranch>
          ) : (
            <SkeletonBranch
              key="content"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: SKELETON_REVEAL_OFFSET_PX }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: exitTransition }}
              transition={{
                duration: reduceMotion ? ARC_DURATION.instant : ARC_DURATION.standard,
                ease: [...ARC_EASE.enter],
              }}
            >
              {children}
            </SkeletonBranch>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Reserves space while content loads. Without children it draws Arc's placeholder, three text lines by default; with
 * children it shows that placeholder while `loading` and then crossfades into them.
 * @param props - Placeholder shape, accessible label, loading state and classes.
 * @returns The placeholder, or the reveal frame when there are children.
 */
function Skeleton({
  label = SKELETON_DEFAULT_LABEL,
  lines = SKELETON_DEFAULT_LINES,
  avatar = false,
  children,
  loading = true,
  className,
}: SkeletonProps) {
  if (children === undefined) return <SkeletonPlaceholder lines={lines} avatar={avatar} label={label} className={className} />
  return (
    <SkeletonReveal
      loading={loading}
      placeholder={<SkeletonPlaceholder lines={lines} avatar={avatar} label={label} />}
      className={className}
    >
      {children}
    </SkeletonReveal>
  )
}

export { Skeleton }
