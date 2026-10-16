"use client"

/**
 * Arc's Select (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a labelled choice field whose trigger
 * answers hover, press and open in color only, so the anchored list never shifts, and whose raised list matches the
 * trigger width, with option rows and an end check. It follows Arc's closed API (`label`, `options`, `placeholder`,
 * `description` and Radix's root props) and shares the label, helper and error rows of `Input`.
 */
import type { AriaAttributes, ComponentProps, Ref } from "react"

import { SELECT_DEFAULT_PLACEHOLDER } from "../constants/select.js"
import { cn } from "../lib/utils.js"
import { Field, useFieldAria } from "./field.js"
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./primitives/select.js"

/** One choice of a `Select`. */
export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

/** Height of the trigger: `default` matches `Input` and `Button`, `sm` their small size. */
export type SelectSize = "default" | "sm"

export type SelectProps = Omit<ComponentProps<typeof SelectRoot>, "children"> & {
  /** Visible label, tied to the trigger with `htmlFor`. */
  label: string
  /** Choices, in list order. */
  options: SelectOption[]
  /** Shown while no option is chosen. Defaults to "Seleccioná una opción". */
  placeholder?: string
  /** Helper copy under the trigger, linked through `aria-describedby`. */
  description?: string
  /** Error copy: marks the trigger invalid and renders in a `role="alert"` row, as in `Input`. */
  error?: string
  /** Trigger id, so an external `<label htmlFor>` can point at it. Generated when omitted. */
  id?: string
  /** Class on the field that wraps the label, the trigger and the helper rows. */
  className?: string
  /** Keeps `label` for assistive technology only, for layouts that already show their own label. */
  hideLabel?: boolean
  /** Height of the trigger. Defaults to `default`. */
  size?: SelectSize
  /** Class on the trigger. */
  triggerClassName?: string
  /** Marks the trigger invalid without an error message. `error` sets it too. */
  "aria-invalid"?: AriaAttributes["aria-invalid"]
  /** The trigger button. */
  ref?: Ref<HTMLButtonElement>
}

/**
 * A compact choice field with a keyboard friendly list, controlled with `value` and `onValueChange` or uncontrolled
 * with `defaultValue`; pass `name` to submit it with a form.
 * @param props - Label, options, optional copy and layout, and Radix select root properties.
 * @returns The labelled field.
 */
function Select({
  label,
  options,
  placeholder = SELECT_DEFAULT_PLACEHOLDER,
  description,
  error,
  id,
  className,
  hideLabel = false,
  size,
  triggerClassName,
  "aria-invalid": ariaInvalid,
  ref,
  ...rootProps
}: SelectProps) {
  const aria = useFieldAria({ id, description, error, "aria-invalid": ariaInvalid })
  return (
    <Field
      label={label}
      hideLabel={hideLabel}
      description={description}
      error={error}
      aria={aria}
      className={className}
    >
      <SelectRoot {...rootProps}>
        <SelectTrigger
          ref={ref}
          id={aria.controlId}
          size={size}
          className={cn("w-full min-w-0", triggerClassName)}
          aria-describedby={aria["aria-describedby"]}
          aria-invalid={aria["aria-invalid"]}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </Field>
  )
}

export { Select }
