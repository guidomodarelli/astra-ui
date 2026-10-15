"use client"

/**
 * Arc's Switch (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a pill track that crossfades between its
 * two fills while the thumb glides on a critically damped spring. Held down, the thumb widens toward the other side
 * with its far edge anchored, like a finger on it. With a `label` the text sits inside the control; without it the
 * switch renders the bare track, for rows that place their own label.
 */
import { useEffect, useRef, useState } from "react"
import type { ComponentProps } from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { animate, motion, useMotionValue } from "motion/react"

import {
  SWITCH_CHANGE_STRETCH,
  SWITCH_PRESS_RELEASE_WINDOW_MS,
  SWITCH_PRESS_STRETCH_PX,
  SWITCH_PRIMARY_POINTER_BUTTON,
  SWITCH_THUMB_GEOMETRY_PX,
  SWITCH_THUMB_GLIDE_SPRING,
  SWITCH_TOGGLE_KEY,
} from "../constants/switch.js"
import type { SwitchSize } from "../constants/switch.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"

export type SwitchProps = ComponentProps<typeof SwitchPrimitive.Root> & {
  /** Track size: Arc's 42 by 24 track (`default`) or a compact one for dense rows (`sm`). */
  size?: SwitchSize
  /** Visible text rendered inside the control, after the track; it also names the switch. */
  label?: string
}

/**
 * Arc's control recipe. The bare switch keeps the track's own box and widens its hit area with a pseudo-element, so
 * rows that already lay it out do not grow; with a label it takes Arc's full control height. Hover only answers on
 * hover-capable fine pointers, and keyboard focus uses the theme's focus outline.
 */
const switchClassName =
  "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center gap-(--space-3) rounded-(--radius-pill) border-0 bg-transparent p-0 font-sans text-sm text-foreground [-webkit-tap-highlight-color:transparent] after:absolute after:-inset-x-2 after:-inset-y-2.5 disabled:cursor-not-allowed disabled:opacity-50 data-[labelled]:min-h-(--control-height-md) data-[labelled]:rounded-(--radius-control) data-[labelled]:after:hidden hover-fine:data-[state=unchecked]:not-disabled:[&_[data-slot=switch-track]]:bg-(--control-track-hover)"

/** Fixed box: the thumb moves inside it with transforms, so nothing around the switch shifts. */
const trackClassName =
  "relative isolate box-border flex flex-none items-center rounded-(--radius-pill) bg-(--control-track) transition-[background-color] duration-(--duration-fast) ease-(--ease-standard) before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:bg-(--control-on) before:opacity-0 before:transition-opacity before:duration-(--duration-standard) before:ease-(--ease-standard) group-data-[state=checked]/switch:before:opacity-100 group-aria-invalid/switch:shadow-[0_0_0_1px_var(--danger)] group-data-[size=default]/switch:h-6 group-data-[size=default]/switch:w-[42px] group-data-[size=default]/switch:p-[3px] group-data-[size=sm]/switch:h-[18px] group-data-[size=sm]/switch:w-8 group-data-[size=sm]/switch:p-[2px] motion-reduce:transition-none motion-reduce:before:transition-none"

const thumbClassName =
  "pointer-events-none block flex-none rounded-(--radius-pill) bg-(--control-thumb) shadow-(--control-thumb-shadow) will-change-transform transition-[background-color] duration-(--duration-standard) ease-(--ease-standard) group-data-[state=checked]/switch:bg-(--control-thumb-on) group-data-[size=default]/switch:h-[18px] group-data-[size=sm]/switch:h-[14px] motion-reduce:transition-none"

/**
 * A binary setting that applies at once, controlled or uncontrolled like Radix's switch.
 * @param switchProps - Every Radix switch prop, including `ref`, plus the Arc `size` and `label`.
 * @returns The switch button, with its label inside when one is passed.
 */
function Switch({
  className,
  size = "default",
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: SwitchProps) {
  const reduceMotion = usePrefersReducedMotion()
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false)
  const [isPressed, setIsPressed] = useState(false)
  const isChecked = checked ?? uncontrolledChecked
  const scaleX = useMotionValue(1)
  const shownChecked = useRef(isChecked)
  // A pointer or Space press already stretched the thumb, so its release should not add a second stretch on top.
  const releasedAt = useRef(-Infinity)

  useEffect(() => {
    if (shownChecked.current === isChecked) return
    shownChecked.current = isChecked
    const isFromPress = performance.now() - releasedAt.current < SWITCH_PRESS_RELEASE_WINDOW_MS
    if (reduceMotion || isFromPress) return
    const { scaleX: keyframes, ...transition } = SWITCH_CHANGE_STRETCH
    const controls = animate(scaleX, [...keyframes], { ...transition, times: [...transition.times], ease: [...transition.ease] })
    return () => controls.stop()
  }, [isChecked, reduceMotion, scaleX])

  const geometry = SWITCH_THUMB_GEOMETRY_PX[size]
  const stretch = isPressed && !reduceMotion && !disabled ? SWITCH_PRESS_STRETCH_PX[size] : 0
  const release = () => {
    if (isPressed && !disabled) releasedAt.current = performance.now()
    setIsPressed(false)
  }

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      data-labelled={label ? "" : undefined}
      className={cn(switchClassName, className)}
      {...props}
      disabled={disabled}
      checked={isChecked}
      aria-label={ariaLabel ?? label}
      onCheckedChange={(nextChecked) => {
        if (checked === undefined) setUncontrolledChecked(nextChecked)
        onCheckedChange?.(nextChecked)
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.button === SWITCH_PRIMARY_POINTER_BUTTON) setIsPressed(true)
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event)
        release()
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event)
        setIsPressed(false)
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event)
        setIsPressed(false)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.key === SWITCH_TOGGLE_KEY) setIsPressed(true)
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event)
        release()
      }}
      onBlur={(event) => {
        onBlur?.(event)
        setIsPressed(false)
      }}
    >
      <span data-slot="switch-track" className={trackClassName}>
        <SwitchPrimitive.Thumb asChild>
          {/* The thumb stretches like a held finger and keeps its far edge anchored, then travels on a spring. */}
          <motion.span
            data-slot="switch-thumb"
            className={thumbClassName}
            style={{ scaleX }}
            initial={false}
            animate={{ x: isChecked ? geometry.travel - stretch : 0, width: geometry.size + stretch }}
            transition={reduceMotion ? { duration: 0 } : { x: SWITCH_THUMB_GLIDE_SPRING, width: ARC_SPRING_SNAPPY }}
          />
        </SwitchPrimitive.Thumb>
      </span>
      {label ? (
        <span data-slot="switch-label" className="leading-(--leading-body)">
          {label}
        </span>
      ) : null}
    </SwitchPrimitive.Root>
  )
}

export { Switch }
