"use client"

/**
 * Label morph and loading spinner adapted from Arc (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli,
 * MIT License. The full license text ships in THIRD_PARTY_NOTICES.md. Internal to Button.
 */
import { isValidElement, useRef } from "react"
import type { ReactNode, Ref } from "react"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import type { TargetAndTransition, Transition } from "motion/react"

import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE } from "../motion/arc-tokens.js"
import {
  ARC_ICON_ENTER as iconEnter,
  ARC_ICON_EXIT as iconExit,
  ARC_ICON_TRANSITION as iconTransition,
  ARC_REDUCED_ENTER as reducedEnter,
  ARC_REDUCED_EXIT as reducedExit,
  ARC_REDUCED_TRANSITION as reducedTransition,
  ARC_SWAP_EXIT_TRANSITION as exitTransition,
  ARC_SWAP_REST as restState,
} from "../motion/arc-swap.js"
import { useMorphWidth } from "../motion/use-morph-width.js"

/** Text rises out of a soft blur; the outgoing label lifts away a little faster. */
const textEnter: TargetAndTransition = { opacity: 0, y: 4, filter: `blur(${ARC_BLUR.soft}px)` }
const textExit: TargetAndTransition = { opacity: 0, y: -3, filter: `blur(${ARC_BLUR.soft}px)`, transition: exitTransition }
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

type LabelPhaseProps = {
  children: ReactNode
  isIcon: boolean
  reduceMotion: boolean
  /** AnimatePresence's popLayout needs the node to pull the outgoing label out of flow. */
  ref?: Ref<HTMLSpanElement>
}

/** One generation of the label; the outgoing one is hidden from assistive tech while it leaves. */
function LabelPhase({ children, isIcon, reduceMotion, ref }: LabelPhaseProps) {
  const isPresent = useIsPresent()
  return (
    <motion.span
      ref={ref}
      className="inline-flex items-center justify-center gap-[inherit] whitespace-nowrap"
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

export type ButtonLabelProps = {
  children: ReactNode
  loading: boolean
  reduceMotion: boolean
}

/** Button content: a spinner while loading and a label whose width springs when it changes. */
export function ButtonLabel({ children, loading, reduceMotion }: ButtonLabelProps) {
  const contentRef = useRef<HTMLSpanElement>(null)
  const labelKey = getLabelKey(children)
  const width = useMorphWidth(contentRef, labelKey, reduceMotion)

  return (
    <>
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
        data-slot="button-label"
        className={cn(
          "inline-flex min-w-0 items-center justify-center gap-[inherit] transition-opacity duration-150 data-morphing:[clip-path:inset(-50%_calc(var(--spacing)*-3))]",
          loading && "opacity-0",
        )}
        style={{ width }}
      >
        <span ref={contentRef} className="inline-flex flex-none items-center gap-[inherit]">
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
    </>
  )
}
