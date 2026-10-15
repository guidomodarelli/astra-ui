"use client"

/**
 * Letter-by-letter label morph adapted from Arc (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli, MIT License.
 * The full license text ships in THIRD_PARTY_NOTICES.md. Internal: shared by `ActionButton` and `SplitButton`.
 */
import { useState } from "react"
import type { Ref } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { TargetAndTransition, Transition } from "motion/react"

import { MORPH_TEXT_GLYPH_OFFSET_PX, MORPH_TEXT_MAX_GLYPH_DELAY_S, MORPH_TEXT_MIN_SHARED_RUN } from "../constants/morph-text.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_MORPH, ARC_STAGGER } from "../motion/arc-tokens.js"

const restState: TargetAndTransition = { opacity: 1, y: 0, filter: "blur(0px)" }
/** Letters rise in from a soft blur and lift away a little faster. */
const glyphEnter: TargetAndTransition = { opacity: 0, y: MORPH_TEXT_GLYPH_OFFSET_PX.enter, filter: `blur(${ARC_BLUR.soft}px)` }
const glyphExit: TargetAndTransition = {
  opacity: 0,
  y: MORPH_TEXT_GLYPH_OFFSET_PX.exit,
  filter: `blur(${ARC_BLUR.subtle}px)`,
  transition: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] },
}
const reducedTransition: Transition = { duration: ARC_DURATION.instant }
const reducedEnter: TargetAndTransition = { ...restState, opacity: 0 }
const reducedExit: TargetAndTransition = { opacity: 0, transition: reducedTransition }

/** One letter of the label; kept letters keep their id so they glide instead of being replaced. */
type Glyph = { id: string; character: string; order: number }

/** Grapheme segmenter created once; absent on runtimes without `Intl.Segmenter`. */
const graphemeSegmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : undefined

/**
 * Splits text into user-perceived characters, so emoji sequences, flags and combining accents stay in one glyph.
 * Falls back to code points when `Intl.Segmenter` is unavailable.
 * @param text - Text to split.
 * @returns Graphemes in reading order.
 */
function splitGraphemes(text: string): string[] {
  if (!graphemeSegmenter) return [...text]
  return Array.from(graphemeSegmenter.segment(text), (segment) => segment.segment)
}

/**
 * Turns characters into glyphs of one generation.
 * @param characters - Characters to wrap.
 * @param generation - Label generation, part of every glyph id.
 * @returns Glyphs in reading order.
 */
function toGlyphs(characters: string[], generation: number): Glyph[] {
  return characters.map((character, order) => ({ id: `${generation}:${order}`, character, order }))
}

/**
 * Splits a label into glyphs, keeping the identity of the shared leading and trailing characters of the previous
 * label, so `Copy page` → `Copied` only replaces the changed letters.
 * @param text - Current label.
 * @returns Glyphs of the label.
 */
function useGlyphs(text: string): Glyph[] {
  const [glyphState, setGlyphState] = useState(() => ({ text, generation: 0, glyphs: toGlyphs(splitGraphemes(text), 0) }))
  if (glyphState.text === text) return glyphState.glyphs

  const previous = splitGraphemes(glyphState.text)
  const next = splitGraphemes(text)
  let sharedStart = 0
  let sharedEnd = 0
  while (sharedStart < previous.length && sharedStart < next.length && previous[sharedStart] === next[sharedStart]) {
    sharedStart++
  }
  while (
    sharedEnd < previous.length - sharedStart &&
    sharedEnd < next.length - sharedStart &&
    previous[previous.length - 1 - sharedEnd] === next[next.length - 1 - sharedEnd]
  ) {
    sharedEnd++
  }
  if (sharedStart < MORPH_TEXT_MIN_SHARED_RUN) sharedStart = 0
  if (sharedEnd < MORPH_TEXT_MIN_SHARED_RUN) sharedEnd = 0

  const generation = glyphState.generation + 1
  const glyphs = [
    ...glyphState.glyphs.slice(0, sharedStart),
    ...toGlyphs(next.slice(sharedStart, next.length - sharedEnd), generation),
    ...glyphState.glyphs.slice(glyphState.glyphs.length - sharedEnd),
  ]
  setGlyphState({ text, generation, glyphs })
  return glyphs
}

export type MorphTextProps = {
  text: string
  reduceMotion: boolean
  /** Row of glyphs, for a caller that springs its slot to the row's width with `useMorphWidth`. */
  ref?: Ref<HTMLSpanElement>
}

/**
 * Morphs one label into the next: kept letters glide into place and new ones rise in from a soft blur. The row
 * keeps its natural width; callers spring the slot around it.
 * @param props - Label text, whether the user prefers reduced motion and an optional ref to the row.
 * @returns The row of animated letters. Callers hide it from assistive tech and name their control otherwise.
 */
export function MorphText({ text, reduceMotion, ref }: MorphTextProps) {
  const glyphs = useGlyphs(text)

  return (
    <span ref={ref} className="relative inline-flex flex-none whitespace-pre">
      <AnimatePresence mode="popLayout" initial={false}>
        {glyphs.map((glyph) => (
          <motion.span
            key={glyph.id}
            className="inline-block"
            layout={reduceMotion ? false : "position"}
            layoutDependency={text}
            initial={reduceMotion ? reducedEnter : glyphEnter}
            animate={restState}
            exit={reduceMotion ? reducedExit : glyphExit}
            transition={
              reduceMotion
                ? reducedTransition
                : {
                    duration: ARC_DURATION.standard,
                    ease: [...ARC_EASE.enter],
                    delay: Math.min(glyph.order * ARC_STAGGER.char, MORPH_TEXT_MAX_GLYPH_DELAY_S),
                    layout: ARC_SPRING_MORPH,
                  }
            }
          >
            {glyph.character}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  )
}
