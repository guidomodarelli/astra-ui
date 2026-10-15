"use client"

/**
 * Arc's Textarea (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a multi-line field on Arc's tokens with
 * a 110px minimum height and a vertical resize handle. With a `label`, `description` or `error` it renders Arc's
 * labelled field, where a live count in the description rolls its digits; without them it renders the bare control.
 */
import type { ComponentProps } from "react"

import { MotionSlot } from "../motion/motion-slot.js"
import { cn } from "../lib/utils.js"
import { Field, usesFieldCopy, useFieldAria } from "./field.js"
import type { FieldCopyProps } from "./field.js"

/** Same focus language as `Input`: the border answers alone and the box never changes size. */
const textareaClassName =
  "flex min-h-[110px] w-full resize-y rounded-(--radius-control) border border-border-strong bg-surface p-(--space-3) font-sans text-base leading-(--leading-body) tracking-(--tracking-body) text-foreground outline-none transition-[color,background-color,border-color] duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none placeholder:text-text-muted hover-fine:not-disabled:not-aria-invalid:border-foreground focus-visible:border-foreground aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60 md:text-sm"

export type TextareaProps = ComponentProps<"textarea"> & FieldCopyProps

/**
 * Free-form multi-line text, controlled or uncontrolled like a native textarea.
 * @param textareaProps - Optional field copy plus every native textarea attribute, including `ref`, `rows` and `maxLength`.
 * @returns The labelled field when `label`, `description` or `error` is passed (even as `undefined`), otherwise the
 *   bare control.
 */
function Textarea(textareaProps: TextareaProps) {
  const { className, label, description, error, id, ...props } = textareaProps
  const aria = useFieldAria({ id, description, error, ...props })
  const isField = usesFieldCopy(textareaProps)
  const control = (
    <MotionSlot kind="field">
      <textarea
        data-slot="textarea"
        className={cn(textareaClassName, className)}
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

export { Textarea }
