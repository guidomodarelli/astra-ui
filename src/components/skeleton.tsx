"use client"

/**
 * Arc's Skeleton (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): placeholders that reserve space while
 * content loads, with a calm, finite pulse that ripples down the blocks and rests after about 20 seconds. Besides the
 * bare block it renders Arc's composed placeholder (`lines`, `avatar`) and its reveal, which crossfades into the
 * content while the height springs to its new size (`loading` with children).
 */
import { useEffect, useLayoutEffect, useRef } from "react"
import type { ComponentProps, CSSProperties, ReactNode, Ref, RefObject } from "react"
import { AnimatePresence, animate, motion, useIsPresent, useMotionValue } from "motion/react"
import type { AnimationPlaybackControls, HTMLMotionProps, MotionValue } from "motion/react"

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

export type SkeletonProps = ComponentProps<"div"> & {
  /** Draws Arc's composed placeholder with this many text lines, from 1 to 6. */
  lines?: number
  /** Adds a round avatar block before the lines of the composed placeholder. */
  avatar?: boolean
  /** Accessible name of the composed placeholder; defaults to "Cargando contenido". */
  label?: string
  /**
   * Turns the skeleton into Arc's reveal: while true it shows the composed placeholder, and once false it crossfades
   * into `children` while the height springs to the content's size.
   */
  loading?: boolean
}

/**
 * Follows the content height. After `busy` flips, the height springs from the old size to the new one and returns to
 * auto, so later reflows follow at once. It clips only while moving, so focus rings stay visible at rest.
 * @param contentRef - The measured content; its parent receives the height.
 * @param busy - Whether the placeholder is showing; a change opens the window in which resizes spring.
 * @param reduceMotion - Whether every resize should jump.
 * @returns The height to bind to the frame's `style.height`.
 */
function useMorphHeight(
  contentRef: RefObject<HTMLDivElement | null>,
  busy: boolean,
  reduceMotion: boolean
): MotionValue<number | "auto"> {
  const height = useMotionValue<number | "auto">("auto")
  const changedAt = useRef(0)
  useLayoutEffect(() => {
    changedAt.current = performance.now()
  }, [busy])
  useEffect(() => {
    const content = contentRef.current
    const frame = content?.parentElement
    if (!content || !frame || typeof ResizeObserver === "undefined") return
    let lastHeight: number | undefined
    let controls: AnimationPlaybackControls | undefined
    const settle = () => {
      height.jump("auto")
      frame.style.overflow = ""
    }
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const nextHeight = entry.borderBoxSize?.[0]?.blockSize ?? content.offsetHeight
      const current = height.get()
      const fromHeight = typeof current === "number" ? current : lastHeight
      lastHeight = nextHeight
      controls?.stop()
      const isOutsideWindow = performance.now() - changedAt.current > SKELETON_MORPH_WINDOW_MS
      if (reduceMotion || fromHeight === undefined || fromHeight === nextHeight || isOutsideWindow) return settle()
      // Pin the old height before this frame paints, then spring to the new one.
      frame.style.overflow = "hidden"
      height.jump(fromHeight)
      controls = animate(height, nextHeight, { ...ARC_SPRING_SMOOTH, onComplete: settle })
    })
    observer.observe(content)
    return () => {
      observer.disconnect()
      controls?.stop()
    }
  }, [contentRef, height, reduceMotion])
  return height
}

type SkeletonPlaceholderProps = ComponentProps<"div"> & {
  lines: number
  avatar: boolean
  label: string
}

/** Arc's composed placeholder: an optional avatar and a column of lines, announced once as a busy status. */
function SkeletonPlaceholder({ lines, avatar, label, className, ...props }: SkeletonPlaceholderProps) {
  const lineCount = Math.min(Math.max(Math.floor(lines), SKELETON_LINE_LIMITS.min), SKELETON_LINE_LIMITS.max)
  const firstLineIndex = avatar ? 1 : 0
  return (
    <div
      data-slot="skeleton-placeholder"
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn("flex w-full min-w-0 items-start gap-(--space-4)", className)}
      {...props}
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

type SkeletonRevealProps = ComponentProps<"div"> & {
  loading: boolean
  placeholder: ReactNode
}

/** Arc's reveal: the placeholder crossfades into the content while the frame springs to the new height. */
function SkeletonReveal({ loading, placeholder, children, className, style, ...props }: SkeletonRevealProps) {
  const reduceMotion = usePrefersReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  const height = useMorphHeight(contentRef, loading, reduceMotion)
  const exitTransition = { duration: reduceMotion ? ARC_DURATION.instant : ARC_DURATION.fast }
  return (
    <motion.div
      data-slot="skeleton-reveal"
      aria-busy={loading}
      className={className}
      {...(props as HTMLMotionProps<"div">)}
      style={{ ...style, height }}
    >
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
    </motion.div>
  )
}

/**
 * Reserves space while content loads. Without Arc's props it is a bare block sized by `className`; with `lines` or
 * `avatar` it draws Arc's composed placeholder; with `loading` it reveals `children` once loading finishes.
 * @param props - Optional placeholder shape, label and loading state, plus native div attributes.
 * @returns The placeholder, or the reveal frame when `loading` is set.
 */
function Skeleton({ lines, avatar, label = SKELETON_DEFAULT_LABEL, loading, className, children, ...props }: SkeletonProps) {
  const shape = { lines: lines ?? SKELETON_DEFAULT_LINES, avatar: avatar ?? false, label }
  if (loading !== undefined) {
    return (
      <SkeletonReveal loading={loading} placeholder={<SkeletonPlaceholder {...shape} />} className={className} {...props}>
        {children}
      </SkeletonReveal>
    )
  }
  if (lines !== undefined || avatar) return <SkeletonPlaceholder {...shape} className={className} {...props} />
  return (
    <div data-slot="skeleton" className={cn(blockClassName, className)} {...props}>
      {children}
    </div>
  )
}

export { Skeleton }
