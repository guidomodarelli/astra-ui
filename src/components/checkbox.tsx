"use client";

/**
 * Arc's Checkbox (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): an 18px square whose fill springs in
 * while the check draws itself, and whose check morphs into the dash of the indeterminate state instead of swapping.
 * Only the square answers a press, so the hit area and the label never move. With a `label` or `description` it renders
 * Arc's labelled field; without them it renders the bare control, for rows, tables and forms that place their own
 * label.
 */
import { useId, useState } from "react";
import type { ComponentProps } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { motion } from "motion/react";
import type { Transition } from "motion/react";

import {
  CHECKBOX_DESCRIPTION_ID_SUFFIX,
  CHECKBOX_FILL_HIDDEN_SCALE,
  CHECKBOX_MARK_PATH,
  CHECKBOX_MARK_STROKE_WIDTH,
  CHECKBOX_MARK_VIEW_BOX,
} from "../constants/checkbox.js";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { ARC_DURATION, ARC_EASE, ARC_SPRING_MORPH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js";

/** Checked state of a checkbox: on, off or indeterminate. */
type CheckedState = CheckboxPrimitive.CheckedState;

export type CheckboxProps = ComponentProps<typeof CheckboxPrimitive.Root> & {
  /** Visible label beside the box, tied to it with `htmlFor`. */
  label?: string;
  /** Helper copy under the label, linked through `aria-describedby`. */
  description?: string;
};

/**
 * Arc's control recipe. The bare box keeps its 18px layout box and widens its hit area to 44px with a pseudo-element,
 * so existing rows keep their spacing; the labelled field gives the box Arc's full control height instead. The square
 * dips on press, hover answers only on hover-capable fine pointers, and keyboard focus uses the theme's outline.
 */
const checkboxClassName =
  "peer group/checkbox relative grid shrink-0 cursor-pointer place-items-center rounded-(--radius-control) border-0 bg-transparent p-0 text-(--control-glyph) [-webkit-tap-highlight-color:transparent] group-has-disabled/field:opacity-50 disabled:cursor-not-allowed disabled:opacity-50 not-data-[labelled]:size-[18px] not-data-[labelled]:rounded-[5px] not-data-[labelled]:after:absolute not-data-[labelled]:after:-inset-[13px] data-[labelled]:size-(--control-height-md) hover-fine:data-[state=unchecked]:not-disabled:[&_[data-slot=checkbox-visual]]:border-text-muted active:not-disabled:[&_[data-slot=checkbox-visual]]:scale-95 active:not-disabled:[&_[data-slot=checkbox-visual]]:[transition:border-color_var(--duration-fast)_var(--ease-standard),scale_var(--duration-instant)_var(--ease-standard)] data-[state=checked]:[&_[data-slot=checkbox-visual]]:border-(--control-on) data-[state=indeterminate]:[&_[data-slot=checkbox-visual]]:border-(--control-on) aria-invalid:data-[state=unchecked]:[&_[data-slot=checkbox-visual]]:border-danger motion-reduce:[&_[data-slot=checkbox-visual]]:scale-100 motion-reduce:[&_[data-slot=checkbox-visual]]:transition-none";

/** The square: a border on the surface that the fill covers when checked. */
const visualClassName =
  "relative block size-[18px] rounded-[5px] border border-border-strong bg-surface [transition:border-color_var(--duration-fast)_var(--ease-standard),scale_var(--duration-spring)_var(--ease-spring)]";

/**
 * A choice that can be on, off or indeterminate, controlled or uncontrolled like Radix's checkbox.
 * @param checkboxProps - Every Radix checkbox prop, including `ref`, plus optional Arc `label` and `description`.
 * @returns The labelled field when `label` or `description` is passed, otherwise the bare control.
 */
function Checkbox({
  className,
  label,
  description,
  id,
  checked,
  defaultChecked,
  onCheckedChange,
  "aria-describedby": ariaDescribedBy,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const descriptionId = `${controlId}-${CHECKBOX_DESCRIPTION_ID_SUFFIX}`;
  const reduceMotion = usePrefersReducedMotion();
  const [uncontrolledState, setUncontrolledState] = useState<CheckedState>(defaultChecked ?? false);
  const state = checked ?? uncontrolledState;
  const isOn = state !== false;
  const isField = Boolean(label || description);
  const fade: Transition = {
    duration: isOn ? ARC_DURATION.instant : ARC_DURATION.fast,
    ease: [...ARC_EASE.standard],
  };
  const describedBy = [ariaDescribedBy, description ? descriptionId : undefined].filter(Boolean).join(" ") || undefined;

  const control = (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-labelled={isField ? "" : undefined}
      className={cn(checkboxClassName, className)}
      {...props}
      id={isField ? controlId : id}
      checked={state}
      aria-describedby={describedBy}
      onCheckedChange={(nextState) => {
        if (checked === undefined) setUncontrolledState(nextState);
        onCheckedChange?.(nextState);
      }}
    >
      <span data-slot="checkbox-visual" className={visualClassName} aria-hidden="true">
        <motion.span
          className="absolute -inset-px rounded-[inherit] bg-(--control-on)"
          initial={false}
          animate={{ opacity: isOn ? 1 : 0, scale: isOn ? 1 : CHECKBOX_FILL_HIDDEN_SCALE }}
          transition={reduceMotion ? { duration: 0 } : { scale: ARC_SPRING_SNAPPY, opacity: fade }}
        />
        <CheckboxPrimitive.Indicator forceMount asChild>
          <svg
            data-slot="checkbox-indicator"
            className="absolute -inset-px size-[18px] overflow-visible"
            viewBox={CHECKBOX_MARK_VIEW_BOX}
            fill="none"
            focusable="false"
          >
            <motion.path
              initial={false}
              animate={{
                d: state === "indeterminate" ? CHECKBOX_MARK_PATH.dash : CHECKBOX_MARK_PATH.check,
                pathLength: isOn ? 1 : 0,
                opacity: isOn ? 1 : 0,
              }}
              transition={reduceMotion ? { duration: 0 } : { d: ARC_SPRING_MORPH, pathLength: ARC_SPRING_SNAPPY, opacity: fade }}
              stroke="currentColor"
              strokeWidth={CHECKBOX_MARK_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );

  if (!isField) return control;
  return (
    <div data-slot="checkbox-field" className="inline-flex min-w-0 items-start">
      {control}
      {/* The label's first line centers on the 44px box: (box height - one line of small text) / 2. */}
      <div className="ml-px grid min-w-0 gap-0.5 pt-[calc((var(--control-height-md)-var(--text-sm)*var(--leading-body))/2)]">
        {label ? (
          <label
            htmlFor={controlId}
            data-slot="checkbox-label"
            className="cursor-pointer text-sm leading-(--leading-body) font-medium text-foreground"
          >
            {label}
          </label>
        ) : null}
        {description ? (
          <span id={descriptionId} data-slot="checkbox-description" className="text-xs leading-(--leading-body) text-text-muted">
            {description}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export { Checkbox };
