"use client"

/**
 * Labelled field with animated helper and error rows, adapted from Arc's Input and Textarea (https://uiarc.dev),
 * Copyright (c) 2026 Elia Kuratli, MIT License. The full license text ships in THIRD_PARTY_NOTICES.md.
 * Internal: shared by `Input` and `Textarea`, which render it only when they receive a label, description or error.
 */
import { useEffect, useId, useRef, useState } from "react"
import type { AriaAttributes, ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { Transition } from "motion/react"

import {
  FIELD_MESSAGE_DIGIT_OFFSET_EM,
  FIELD_MESSAGE_ID_SUFFIX,
  FIELD_MESSAGE_NUMBER_PATTERN,
  FIELD_MESSAGE_THOUSANDS_SEPARATOR_PATTERN,
  FIELD_MESSAGE_WORD_OFFSET_EM,
} from "../constants/field.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_MORPH, ARC_SPRING_SMOOTH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"

/** Copy that turns a bare control into a labelled field. */
export type FieldCopyProps = {
  /** Visible label, tied to the control with `htmlFor`. */
  label?: string
  /** Helper copy under the control, linked through `aria-describedby`; counts in it roll their digits. */
  description?: string
  /** Error copy: sets `aria-invalid` and renders in a `role="alert"` row that rewords in place. */
  error?: string
}

/** Roll direction of a count: 1 when it grows, -1 when it shrinks. */
type RollDirection = 1 | -1

const digitVariants = {
  enter: (direction: RollDirection) => ({
    opacity: 0,
    y: `${direction * FIELD_MESSAGE_DIGIT_OFFSET_EM}em`,
    filter: `blur(${ARC_BLUR.subtle}px)`,
  }),
  center: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: (direction: RollDirection) => ({
    opacity: 0,
    y: `${-direction * FIELD_MESSAGE_DIGIT_OFFSET_EM}em`,
    filter: `blur(${ARC_BLUR.subtle}px)`,
  }),
}
const instantTransition: Transition = { duration: 0 }

/**
 * Reads a count in the message as a number, ignoring thousands separators.
 * @param word - A word matching `FIELD_MESSAGE_NUMBER_PATTERN`.
 * @returns Its numeric value, `NaN` when it is a ratio or a time.
 */
function parseCount(word: string): number {
  return parseFloat(word.replace(FIELD_MESSAGE_THOUSANDS_SEPARATOR_PATTERN, ""))
}

/**
 * A count in the copy, such as "12 caracteres", rolls only the digits that changed, up when it grows and down when
 * it shrinks; a gained or lost digit opens or closes its width.
 */
function RollingNumber({ word }: { word: string }) {
  const reduceMotion = usePrefersReducedMotion()
  const [shown, setShown] = useState<{ word: string; direction: RollDirection }>({ word, direction: 1 })
  if (shown.word !== word) setShown({ word, direction: parseCount(word) < parseCount(shown.word) ? -1 : 1 })
  const characters = word.split("")
  const transition: Transition = reduceMotion
    ? instantTransition
    : {
        y: ARC_SPRING_SNAPPY,
        width: ARC_SPRING_MORPH,
        opacity: { duration: ARC_DURATION.fast },
        filter: { duration: ARC_DURATION.fast },
      }
  return (
    <AnimatePresence initial={false}>
      {characters.map((character, index) => (
        // Columns are keyed from the right, so the units digit keeps its column when the count gains a digit.
        <motion.span
          key={characters.length - index}
          className="relative inline-flex justify-center tabular-nums"
          initial={reduceMotion ? false : { width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={transition}
        >
          <AnimatePresence initial={false} mode="popLayout" custom={shown.direction}>
            <motion.span
              key={character}
              className="inline-block"
              custom={shown.direction}
              variants={digitVariants}
              initial={reduceMotion ? false : "enter"}
              animate="center"
              exit="exit"
              transition={transition}
            >
              {character}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      ))}
    </AnimatePresence>
  )
}

/** Changed words rise in and unblur while unchanged words hold still, and counts roll. Assistive tech reads the plain copy. */
function MotionText({ text }: { text: string }) {
  const reduceMotion = usePrefersReducedMotion()
  const words = text.split(" ")
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="relative block" aria-hidden="true">
        <AnimatePresence initial={false} mode="popLayout">
          {words.map((word, index) => {
            const isCount = FIELD_MESSAGE_NUMBER_PATTERN.test(word)
            return (
              <motion.span
                // A count keeps its key while its value changes, so it rolls its digits instead of being replaced.
                key={`${index}:${isCount ? "#" : word}`}
                className="inline-block whitespace-pre"
                // Reduced motion mounts a new word already visible: even a zero-duration fade paints one blank frame.
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: `${FIELD_MESSAGE_WORD_OFFSET_EM.enter}em`, filter: `blur(${ARC_BLUR.soft}px)` }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduceMotion
                    ? { opacity: 0, transition: instantTransition }
                    : {
                        opacity: 0,
                        y: `${FIELD_MESSAGE_WORD_OFFSET_EM.exit}em`,
                        filter: `blur(${ARC_BLUR.subtle}px)`,
                        transition: { duration: ARC_DURATION.exit, ease: [...ARC_EASE.standard] },
                      }
                }
                transition={reduceMotion ? instantTransition : { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] }}
              >
                {isCount ? <RollingNumber word={word} /> : word}
                {index < words.length - 1 ? " " : null}
              </motion.span>
            )
          })}
        </AnimatePresence>
      </span>
    </>
  )
}

type MessageRowProps = { id: string; text: string; className: string; alert?: boolean }

/**
 * A helper or error row: it opens its height on a smooth spring, then the words settle in. The row tracks the
 * measured copy, so a longer message that wraps opens its next line instead of snapping.
 */
function MessageRow({ id, text, className, alert = false }: MessageRowProps) {
  const reduceMotion = usePrefersReducedMotion()
  const copyRef = useRef<HTMLSpanElement>(null)
  const [height, setHeight] = useState<number | "auto">("auto")
  useEffect(() => {
    const copyElement = copyRef.current
    if (!copyElement || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setHeight(entry.borderBoxSize?.[0]?.blockSize ?? copyElement.offsetHeight)
    })
    observer.observe(copyElement)
    return () => observer.disconnect()
  }, [])
  // Reduced motion mounts the row at full height: a zero-duration open would still paint one collapsed frame. The
  // presence starts with initial={false}, so rows present at hydration render the same on server and client.
  return (
    <motion.span
      className="block overflow-hidden"
      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
      animate={{ height, opacity: 1 }}
      exit={{
        height: 0,
        opacity: 0,
        transition: reduceMotion
          ? instantTransition
          : { height: ARC_SPRING_SMOOTH, opacity: { duration: ARC_DURATION.instant } },
      }}
      transition={reduceMotion ? instantTransition : { height: ARC_SPRING_SMOOTH, opacity: { duration: ARC_DURATION.fast } }}
    >
      <motion.span
        ref={copyRef}
        id={id}
        data-slot={alert ? "field-error" : "field-description"}
        className={cn("block pt-(--space-2) text-xs leading-(--leading-body)", className)}
        role={alert ? "alert" : undefined}
        initial={reduceMotion ? false : { y: `${FIELD_MESSAGE_WORD_OFFSET_EM.enter}em`, filter: `blur(${ARC_BLUR.soft}px)` }}
        animate={{ y: 0, filter: "blur(0px)" }}
        transition={{ duration: reduceMotion ? 0 : ARC_DURATION.standard, ease: [...ARC_EASE.enter] }}
      >
        <MotionText text={text} />
      </motion.span>
    </motion.span>
  )
}

type FieldMessageProps = Omit<MessageRowProps, "text"> & { text?: string }

/** Mounts a message row while there is copy, and closes it when the copy goes away. */
function FieldMessage({ text, ...props }: FieldMessageProps) {
  return <AnimatePresence initial={false}>{text ? <MessageRow key="message" text={text} {...props} /> : null}</AnimatePresence>
}

type FieldAriaOptions = FieldCopyProps & {
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: AriaAttributes["aria-invalid"]
}

/** Ids and ARIA wiring a labelled field passes to its control. */
export type FieldAria = {
  controlId: string
  descriptionId: string
  errorId: string
  "aria-describedby"?: string
  "aria-invalid"?: AriaAttributes["aria-invalid"]
}

/**
 * Resolves the control id (the caller's or a generated one) and merges the helper and error ids into the caller's
 * `aria-describedby`. An error always marks the control invalid.
 * @param options - Field copy and the caller's id and ARIA attributes.
 * @returns The ids and ARIA attributes for the control.
 */
export function useFieldAria({ id, description, error, ...aria }: FieldAriaOptions): FieldAria {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const descriptionId = `${controlId}-${FIELD_MESSAGE_ID_SUFFIX.description}`
  const errorId = `${controlId}-${FIELD_MESSAGE_ID_SUFFIX.error}`
  const describedBy = [aria["aria-describedby"], description ? descriptionId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ")
  return {
    controlId,
    descriptionId,
    errorId,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? true : aria["aria-invalid"],
  }
}

/**
 * Tells whether a control should render as a labelled field.
 * @param copy - Label, description and error passed to the control.
 * @returns `true` when any of them has copy.
 */
export function hasFieldCopy({ label, description, error }: FieldCopyProps): boolean {
  return Boolean(label || description || error)
}

type FieldProps = Omit<FieldCopyProps, "label"> & {
  label?: string
  aria: FieldAria
  className?: string
  children: ReactNode
}

/**
 * Arc's field layout: label, control, then the helper and error rows. There is no row gap, because grid tracks clamp
 * a negative margin at zero and a closed row would still pay it; each row carries its own space instead. The wrapper
 * keeps the bare control's full-width contract, so a field fills a flex row like the control alone does.
 */
export function Field({ label, description, error, aria, className, children }: FieldProps) {
  return (
    <div data-slot="field" className={cn("grid w-full min-w-0", className)}>
      {label ? (
        <label
          data-slot="field-label"
          htmlFor={aria.controlId}
          className="mb-(--space-2) text-sm leading-(--leading-body) font-medium text-foreground"
        >
          {label}
        </label>
      ) : null}
      {children}
      <FieldMessage id={aria.descriptionId} text={description} className="text-text-muted" />
      <FieldMessage id={aria.errorId} text={error} className="text-danger" alert />
    </div>
  )
}
