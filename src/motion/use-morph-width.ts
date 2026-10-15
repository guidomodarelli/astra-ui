/**
 * Label width spring adapted from Arc (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli, MIT License.
 * The full license text ships in THIRD_PARTY_NOTICES.md. Internal: shared by `Button` and `ActionButton`.
 */
import { useEffect, useLayoutEffect, useRef } from "react"
import type { RefObject } from "react"
import { animate, useMotionValue } from "motion/react"
import type { MotionValue } from "motion/react"

import { BUTTON_MORPH_WINDOW_MS } from "../constants/button.js"
import { ARC_SPRING_MORPH } from "./arc-tokens.js"

/**
 * Springs a label slot to the natural width of its content when the label changes, so new text never snaps the
 * layout. Other resizes (a late web font, a parent reflow) jump straight to the new width, so nothing wobbles on
 * first paint. While it springs, the slot carries `data-morphing` so it can clip overflowing glyphs.
 *
 * @param contentRef - Content measured by a `ResizeObserver`; its parent element is the slot that gets the width.
 * @param labelKey - Identity of the current label: a change opens the window in which resizes spring.
 * @param reduceMotion - Whether the user prefers reduced motion, which makes every resize jump.
 * @returns Width to bind to the slot's `style.width`.
 */
export function useMorphWidth(
  contentRef: RefObject<HTMLElement | null>,
  labelKey: string,
  reduceMotion: boolean,
): MotionValue<number | "auto"> {
  const width = useMotionValue<number | "auto">("auto")
  const lastLabelKey = useRef(labelKey)
  const morphDeadline = useRef(0)

  useLayoutEffect(() => {
    if (lastLabelKey.current === labelKey) return
    lastLabelKey.current = labelKey
    morphDeadline.current = performance.now() + BUTTON_MORPH_WINDOW_MS
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
