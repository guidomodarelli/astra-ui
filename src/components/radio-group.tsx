"use client";

/**
 * Arc's RadioGroup (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md) on Radix's radio group: a fieldset
 * whose legend names the choice and whose options render as Arc's rows. The mark dips on press, previews a faint dot
 * while held, and the new dot springs in while the old one shrinks away; one highlight travels to the chosen row on
 * the morph spring, so a change reads as a single physical move. Arrow keys take the same path.
 */
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { animate, motion } from "motion/react";

import {
  RADIO_GROUP_DOT_HIDDEN_SCALE,
  RADIO_GROUP_OPTION_ID_SUFFIX,
  RADIO_GROUP_READY_ATTRIBUTE,
} from "../constants/radio-group.js";
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js";
import { cn } from "../lib/utils.js";
import { ARC_DURATION, ARC_SPRING_MORPH, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js";

/** Selector of the option row that holds the checked radio. */
const CHECKED_OPTION_SELECTOR = '[data-slot="radio-group-option"]:has([data-slot="radio-group-item"][data-state="checked"])';

/** Selector of every option row, observed so the highlight follows rows that resize. */
const OPTION_SELECTOR = '[data-slot="radio-group-option"]';

/** The value chosen in the enclosing group, read by each option to spring its dot in or out. */
const RadioGroupValueContext = createContext<string | undefined>(undefined);

/** The geometry the highlight was last placed at, or an empty string while it is hidden. */
type PlacedGeometry = { current: string };

/**
 * Sizes the highlight to the chosen row. A new choice glides on the morph spring; the first paint and resizes place it
 * at once, and a group without a chosen row hides it.
 * @param highlight - The travelling highlight element.
 * @param row - The checked option row, if any.
 * @param placedAt - Geometry the highlight was last placed at; updated in place.
 * @param shouldGlide - Whether this change should travel instead of jumping.
 */
function placeHighlight(highlight: HTMLElement | null, row: HTMLElement | null, placedAt: PlacedGeometry, shouldGlide: boolean) {
  const nextGeometry = row ? `${row.offsetLeft} ${row.offsetTop} ${row.offsetWidth} ${row.offsetHeight}` : "";
  if (!highlight || nextGeometry === placedAt.current) return;
  const wasVisible = placedAt.current !== "";
  placedAt.current = nextGeometry;
  if (!row) {
    animate(highlight, { opacity: 0 }, { duration: 0 });
    return;
  }
  const target = { x: row.offsetLeft, y: row.offsetTop, width: row.offsetWidth, height: row.offsetHeight, opacity: 1 };
  if (shouldGlide && wasVisible) {
    animate(highlight, target, { ...ARC_SPRING_MORPH, opacity: { duration: 0 } });
    return;
  }
  // Written to the element too, so the paint that drops the static fallback already shows the highlight in place.
  Object.assign(highlight.style, {
    transform: `translateX(${target.x}px) translateY(${target.y}px)`,
    width: `${target.width}px`,
    height: `${target.height}px`,
    opacity: "1",
  });
  animate(highlight, target, { duration: 0 });
}

/** One choice of a radio group. */
export type RadioGroupOption = {
  /** Value reported to `onValueChange` and submitted with the form. */
  value: string;
  /** Visible option label, which also names the radio. */
  label: string;
  /** Helper copy under the label, linked through `aria-describedby`. */
  description?: string;
  /** Keeps the option visible but not selectable. */
  disabled?: boolean;
};

export type RadioGroupProps = {
  /** Visible legend of the fieldset, which names the group. */
  label: string;
  /** Rows in order. Values double as keys, so keep them unique. */
  options: RadioGroupOption[];
  /** Selected value when controlled. */
  value?: string;
  /** Initial value when uncontrolled; a form reset restores it. */
  defaultValue?: string;
  /** Called with the chosen value. */
  onValueChange?: (value: string) => void;
  /** Name the chosen value is submitted under. Generated when omitted. */
  name?: string;
  /** Classes for the fieldset. */
  className?: string;
};

/**
 * Arc's mark recipe: the faint preview dot and the press dip answer the whole row.
 */
const radioGroupItemClassName =
  "peer group/radio-group-item relative z-2 grid aspect-square size-[17px] shrink-0 cursor-pointer place-items-center rounded-full border border-border-strong bg-transparent p-0 [-webkit-tap-highlight-color:transparent] [transition:border-color_var(--duration-fast)_var(--ease-standard),background-color_var(--duration-fast)_var(--ease-standard),scale_var(--duration-spring)_var(--ease-spring)] before:size-[7px] before:rounded-full before:bg-foreground before:opacity-0 before:transition-opacity before:duration-(--duration-instant) before:ease-(--ease-standard) before:[grid-area:1/1] before:content-[''] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-(--control-on) data-[state=checked]:bg-(--control-on) aria-invalid:data-[state=unchecked]:border-danger hover-fine:data-[state=unchecked]:not-disabled:border-text-muted active:not-disabled:scale-[.88] active:not-disabled:[transition:border-color_var(--duration-fast)_var(--ease-standard),background-color_var(--duration-fast)_var(--ease-standard),scale_100ms_var(--ease-standard)] active:not-disabled:data-[state=unchecked]:before:opacity-[.22] group-active/radio-group-option:not-disabled:scale-[.88] group-active/radio-group-option:not-disabled:data-[state=unchecked]:before:opacity-[.22] motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:before:transition-none";

/** Arc's option row: answers a press with color only, while the mark is what moves. */
const optionClassName =
  "group/radio-group-option relative flex cursor-pointer items-center gap-(--space-3) rounded-(--radius-control) border border-border p-(--space-3) [-webkit-tap-highlight-color:transparent] transition-[background-color,border-color] duration-(--duration-fast) ease-(--ease-standard) hover-fine:bg-surface-muted active:bg-surface-muted has-disabled:cursor-not-allowed has-disabled:opacity-50 [[data-slot=radio-group]:not([data-ready])_&]:has-data-[state=checked]:border-(--control-on) [[data-slot=radio-group]:not([data-ready])_&]:has-data-[state=checked]:bg-[color-mix(in_oklab,var(--control-on)_5%,transparent)] motion-reduce:transition-none";

/**
 * One option row: the radio mark and its copy.
 * @param option - The option to render.
 * @returns The row, a label that activates its radio.
 */
function RadioGroupOptionRow({ value, label, description, disabled }: RadioGroupOption) {
  const rowId = useId();
  const labelId = `${rowId}-${RADIO_GROUP_OPTION_ID_SUFFIX.label}`;
  const descriptionId = `${rowId}-${RADIO_GROUP_OPTION_ID_SUFFIX.description}`;
  const reduceMotion = usePrefersReducedMotion();
  const isChecked = useContext(RadioGroupValueContext) === value;

  return (
    <label
      data-slot="radio-group-option"
      className={optionClassName}
      onClick={(event) => {
        // A click on the row copy activates the radio without focusing it in Chromium; focus it like a native radio
        // row so the arrow keys keep moving the choice from there.
        const radio = event.currentTarget.querySelector<HTMLButtonElement>('[data-slot="radio-group-item"]');
        if (radio && !radio.disabled && event.target !== radio) radio.focus({ preventScroll: true });
      }}
    >
      <RadioGroupPrimitive.Item
        data-slot="radio-group-item"
        className={radioGroupItemClassName}
        value={value}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <RadioGroupPrimitive.Indicator forceMount asChild>
          <motion.span
            data-slot="radio-group-indicator"
            className="pointer-events-none block size-[7px] rounded-full bg-(--control-glyph) [grid-area:1/1]"
            initial={false}
            animate={isChecked ? { scale: 1, opacity: 1 } : { scale: RADIO_GROUP_DOT_HIDDEN_SCALE, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { ...ARC_SPRING_SNAPPY, opacity: { duration: isChecked ? ARC_DURATION.fast : ARC_DURATION.instant } }
            }
          />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {/* Rows are not stacking contexts, so their mark and copy rise above the highlight while their border stays below. */}
      <span className="relative z-2 min-w-0">
        <span
          id={labelId}
          data-slot="radio-group-option-label"
          className="block text-sm font-medium text-text-secondary transition-colors duration-(--duration-standard) ease-(--ease-standard) group-has-data-[state=checked]/radio-group-option:text-foreground motion-reduce:transition-none"
        >
          {label}
        </span>
        {description ? (
          <span id={descriptionId} data-slot="radio-group-option-description" className="mt-0.5 block text-xs text-text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/**
 * A choice of one option from a visible set, controlled with `value` or uncontrolled with `defaultValue`.
 * @param props - Legend, options, value, change handler, form name and classes.
 * @returns The fieldset with its legend and option rows.
 */
function RadioGroup({ label, options, value, defaultValue, onValueChange, name, className }: RadioGroupProps) {
  const reduceMotion = usePrefersReducedMotion();
  const generatedId = useId();
  const legendId = `${generatedId}-legend`;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  const groupRef = useRef<HTMLFieldSetElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const shownValue = useRef<string | undefined | null>(null);
  const placedAt = useRef("");

  const findCheckedRow = () => optionsRef.current?.querySelector<HTMLElement>(CHECKED_OPTION_SELECTOR) ?? null;

  useLayoutEffect(() => {
    const hasChanged = shownValue.current !== null && shownValue.current !== selectedValue;
    placeHighlight(highlightRef.current, findCheckedRow(), placedAt, hasChanged && !reduceMotion);
    shownValue.current = selectedValue;
    groupRef.current?.setAttribute(RADIO_GROUP_READY_ATTRIBUTE, "");
  }, [selectedValue, reduceMotion]);

  useEffect(() => {
    const list = optionsRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => placeHighlight(highlightRef.current, findCheckedRow(), placedAt, false));
    observer.observe(list);
    list.querySelectorAll(OPTION_SELECTOR).forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  });

  return (
    <RadioGroupValueContext.Provider value={selectedValue}>
      <RadioGroupPrimitive.Root
        asChild
        name={name ?? generatedId}
        value={selectedValue}
        onValueChange={(nextValue) => {
          if (value === undefined) setUncontrolledValue(nextValue);
          onValueChange?.(nextValue);
        }}
      >
        <fieldset
          ref={groupRef}
          data-slot="radio-group"
          aria-labelledby={legendId}
          className={cn("m-0 grid min-w-0 border-0 p-0", className)}
        >
          <legend id={legendId} data-slot="radio-group-label" className="mb-(--space-2) p-0 text-sm font-medium text-foreground">
            {label}
          </legend>
          <div ref={optionsRef} data-slot="radio-group-options" className="relative grid w-full gap-(--space-2)">
            {/* Above the rows' borders and fills, below their copy, so it never crosses a label. */}
            <span
              ref={highlightRef}
              data-slot="radio-group-highlight"
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 z-1 box-border rounded-(--radius-control) border border-(--control-on) bg-[color-mix(in_oklab,var(--control-on)_5%,transparent)] opacity-0"
            />
            {options.map((option) => (
              <RadioGroupOptionRow key={option.value} {...option} />
            ))}
          </div>
        </fieldset>
      </RadioGroupPrimitive.Root>
    </RadioGroupValueContext.Provider>
  );
}

export { RadioGroup };
