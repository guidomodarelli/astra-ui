"use client"

/**
 * Arc's ActionButton (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md) on top of beez-ui's `Button`: a
 * call to action with a trailing arrow that runs an async action and morphs, letter by letter, through a pending
 * and a success label before returning to idle on its own.
 */
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { TargetAndTransition } from "motion/react"
import { ArrowRight } from "lucide-react"

import {
  ACTION_BUTTON_ARROW_OFFSET_PX,
  ACTION_BUTTON_CHECK_DRAW_DELAY_S,
  ACTION_BUTTON_DEFAULT_RESET_AFTER_MS,
  ACTION_BUTTON_ICON_SIZE_PX,
  ACTION_BUTTON_STATE,
} from "../constants/action-button.js"
import type { ActionButtonState } from "../constants/action-button.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
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
import { Button } from "./button.js"
import type { ButtonProps } from "./button.js"
import { MorphText } from "./morph-text.js"

/** The arrow leaves in the direction of the action and returns from behind once the button resets. */
const arrowEnter: TargetAndTransition = { opacity: 0, x: ACTION_BUTTON_ARROW_OFFSET_PX.enter, filter: `blur(${ARC_BLUR.subtle}px)` }
const arrowExit: TargetAndTransition = {
  opacity: 0,
  x: ACTION_BUTTON_ARROW_OFFSET_PX.exit,
  filter: `blur(${ARC_BLUR.subtle}px)`,
  transition: exitTransition,
}
const iconSlotStyle = { width: ACTION_BUTTON_ICON_SIZE_PX, height: ACTION_BUTTON_ICON_SIZE_PX } as const

export type ActionButtonProps = Omit<ButtonProps, "children" | "loading" | "onClick"> & {
  /** Idle label and the button's accessible name. */
  label: string
  /** Runs on press; the pending state lasts until its promise settles. */
  onAction: () => void | Promise<void>
  /** Label while `onAction` runs. */
  pendingLabel?: string
  /** Label after `onAction` resolves. */
  successLabel?: string
  /** Delay before returning to idle after success; `0` keeps the success state. */
  resetAfterMs?: number
  /** Called when `onAction` rejects; the button returns to idle. Without it, the error is logged to the console. */
  onActionError?: (error: unknown) => void
}

/**
 * The success tick draws itself from its short stroke, the way a hand would write it.
 * @param props - Whether the user prefers reduced motion, which shows the tick at once.
 * @returns The check icon.
 */
function DrawnCheck({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <svg
      width={ACTION_BUTTON_ICON_SIZE_PX}
      height={ACTION_BUTTON_ICON_SIZE_PX}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M4 12l5 5L20 6"
        initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter], delay: ACTION_BUTTON_CHECK_DRAW_DELAY_S },
          opacity: { duration: ACTION_BUTTON_CHECK_DRAW_DELAY_S, delay: ACTION_BUTTON_CHECK_DRAW_DELAY_S },
        }}
      />
    </svg>
  )
}

/**
 * Visible content of the button: the morphing label, whose width follows on a spring, and a slot that swaps the
 * arrow, the spinner and the check.
 * @param props - Current state, the text it shows and whether the user prefers reduced motion.
 * @returns Content hidden from assistive tech; the button's name and status region carry its meaning.
 */
function ActionButtonContent({ state, text, reduceMotion }: { state: ActionButtonState; text: string; reduceMotion: boolean }) {
  const rowRef = useRef<HTMLSpanElement>(null)
  const width = useMorphWidth(rowRef, text, reduceMotion)
  const isIdle = state === ACTION_BUTTON_STATE.idle

  return (
    <span className="inline-flex items-center justify-center gap-[inherit] whitespace-nowrap" aria-hidden="true">
      <motion.span
        data-slot="action-button-label"
        className="inline-flex min-w-0 data-morphing:[clip-path:inset(-0.6em_0_-0.6em_-0.3em)]"
        style={{ width }}
      >
        <MorphText ref={rowRef} text={text} reduceMotion={reduceMotion} />
      </motion.span>
      <span className="grid flex-none place-items-center" style={iconSlotStyle}>
        <AnimatePresence initial={false}>
          <motion.span
            key={state}
            className="col-start-1 row-start-1 grid place-items-center"
            style={iconSlotStyle}
            initial={reduceMotion ? reducedEnter : isIdle ? arrowEnter : iconEnter}
            animate={restState}
            exit={reduceMotion ? reducedExit : isIdle ? arrowExit : iconExit}
            transition={reduceMotion ? reducedTransition : iconTransition}
          >
            {state === ACTION_BUTTON_STATE.pending ? (
              <span className="size-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent motion-reduce:animate-none" />
            ) : state === ACTION_BUTTON_STATE.success ? (
              <DrawnCheck reduceMotion={reduceMotion} />
            ) : (
              <ArrowRight width={ACTION_BUTTON_ICON_SIZE_PX} height={ACTION_BUTTON_ICON_SIZE_PX} />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  )
}

/**
 * A single async commit, such as Save, Publish or Submit, whose result shows on the button itself. While the
 * action runs the button stays focusable (`aria-disabled` and `aria-busy` instead of `disabled`) and ignores new
 * presses; a polite status region announces the pending and success labels. For a plain form submit without a
 * success state, use `Button` with `loading`.
 * @param props - Labels, the action, its error handler, the reset delay and `Button` props except `onClick`.
 * @returns The button followed by its visually hidden status region.
 */
function ActionButton({
  label,
  onAction,
  pendingLabel = "Guardando",
  successLabel = "Guardado",
  resetAfterMs = ACTION_BUTTON_DEFAULT_RESET_AFTER_MS,
  onActionError,
  ...props
}: ActionButtonProps) {
  const [state, setState] = useState<ActionButtonState>(ACTION_BUTTON_STATE.idle)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // A ref, not the state, guards re-entry: a second press can land before React re-renders with `pending`.
  const isRunning = useRef(false)
  const reduceMotion = usePrefersReducedMotion()
  const isPending = state === ACTION_BUTTON_STATE.pending
  const text = isPending ? pendingLabel : state === ACTION_BUTTON_STATE.success ? successLabel : label

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    [],
  )

  async function runAction() {
    if (isRunning.current) return
    isRunning.current = true
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setState(ACTION_BUTTON_STATE.pending)
    try {
      await onAction()
      setState(ACTION_BUTTON_STATE.success)
      if (resetAfterMs > 0) resetTimer.current = setTimeout(() => setState(ACTION_BUTTON_STATE.idle), resetAfterMs)
    } catch (error) {
      setState(ACTION_BUTTON_STATE.idle)
      if (onActionError) onActionError(error)
      else console.error(`ActionButton:onAction failed for "${label}"; pass onActionError to handle it.`, error)
    } finally {
      isRunning.current = false
    }
  }

  return (
    <>
      <Button
        {...props}
        data-slot="action-button"
        // Not `data-state`: the press feedback and the button recipe read it as a popup trigger and skip the scale.
        data-action-state={state}
        aria-label={label}
        aria-busy={isPending || undefined}
        aria-disabled={isPending || props["aria-disabled"] || undefined}
        onClick={runAction}
      >
        <ActionButtonContent state={state} text={text} reduceMotion={reduceMotion} />
      </Button>
      <span className="sr-only" role="status">
        {isPending ? pendingLabel : state === ACTION_BUTTON_STATE.success ? successLabel : ""}
      </span>
    </>
  )
}

export { ActionButton }
