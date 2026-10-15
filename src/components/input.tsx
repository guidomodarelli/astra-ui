"use client"

/**
 * Arc's Input (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a single-line field on Arc's tokens whose
 * focus answers with the border colour alone. With a `label`, `description` or `error` it renders Arc's labelled field
 * with animated helper and error rows; without them it renders the bare control, for input groups, tables and forms
 * that place their own label.
 */
import type { ComponentProps } from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { MotionSlot } from "../motion/motion-slot.js"
import { cn } from "../lib/utils.js"
import { Field, hasFieldCopy, useFieldAria } from "./field.js"
import type { FieldCopyProps } from "./field.js"

/**
 * Arc's control recipe. Text stays at 16px on small screens so iOS does not zoom on focus, hover only answers on
 * hover-capable fine pointers, and the field never changes size on focus or error.
 */
const inputClassName =
  "min-h-(--control-height-md) w-full min-w-0 rounded-(--radius-control) border border-border-strong bg-surface px-(--space-3) font-sans text-base leading-(--leading-body) tracking-(--tracking-body) text-foreground outline-none transition-[color,background-color,border-color] duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-text-muted hover-fine:not-disabled:not-aria-invalid:border-foreground focus-visible:border-foreground aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50 md:text-sm"

export type InputProps = ComponentProps<"input"> & FieldCopyProps

/**
 * A single-line text value, controlled or uncontrolled like a native input.
 * @param props - Optional field copy plus every native input attribute, including `ref`, `name` and `type`.
 * @returns The labelled field, or the bare control when there is no field copy.
 */
function Input({ className, type, label, description, error, id, ...props }: InputProps) {
  const aria = useFieldAria({ id, description, error, ...props })
  const isField = hasFieldCopy({ label, description, error })
  const control = (
    <MotionSlot kind="field">
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(inputClassName, className)}
        {...props}
        id={isField ? aria.controlId : id}
        aria-describedby={aria["aria-describedby"]}
        aria-invalid={aria["aria-invalid"]}
      />
    </MotionSlot>
  )
  if (!isField) return control
  return (
    <Field label={label} description={description} error={error} aria={aria}>
      {control}
    </Field>
  )
}

export { Input }
