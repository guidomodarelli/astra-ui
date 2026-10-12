"use client";

/**
 * Press feedback adapted from Arc (https://uiarc.dev), Copyright (c) 2026 Elia Kuratli, MIT License.
 * The full license text ships in THIRD_PARTY_NOTICES.md. Works on whatever node a Slot or Base UI
 * renders, so `asChild` links press exactly like native buttons.
 */
import { useEffect } from "react";
import { animate, press } from "motion/react";

import {
  BUTTON_DEFAULT_PRESS_SCALE,
  BUTTON_ICON_PRESS_SCALE,
  BUTTON_ICON_THRESHOLD_PX,
  BUTTON_WIDE_PRESS_SCALE,
  BUTTON_WIDE_THRESHOLD_PX,
} from "../constants/button.js";
import { ARC_DURATION, ARC_EASE, ARC_SPRING_SNAPPY } from "./arc-tokens.js";

/** Matches triggers of menus, popovers and dialogs, which never scale: Radix measures them on pointerdown. */
const LAYER_ANCHOR_SELECTOR = '[aria-haspopup]:not([aria-haspopup="false"]), [data-state], [role="combobox"]';
/** Matches elements that ignore presses: disabled, busy or marked unavailable. */
const INERT_SELECTOR = ':disabled, [data-disabled], [aria-disabled="true"], [aria-busy="true"]';

/** Icon buttons press a little deeper and wide buttons a little less, so every size reads as the same push. */
function getPressScale(width: number): number {
  if (width > BUTTON_WIDE_THRESHOLD_PX) return BUTTON_WIDE_PRESS_SCALE;
  if (width && width <= BUTTON_ICON_THRESHOLD_PX) return BUTTON_ICON_PRESS_SCALE;
  return BUTTON_DEFAULT_PRESS_SCALE;
}

/**
 * Scales the element down while pressed and springs it back on release.
 * @param element - Rendered button, link or Slot child; nothing happens until it is attached.
 * @param isEnabled - False skips the feedback, for reduced motion or variants that should not press.
 */
export function useArcPress(element: HTMLElement | null, isEnabled: boolean): void {
  useEffect(() => {
    if (!element || !isEnabled) return;
    return press(element, () => {
      if (element.matches(INERT_SELECTOR) || element.matches(LAYER_ANCHOR_SELECTOR)) return;
      animate(
        element,
        { scale: getPressScale(element.offsetWidth) },
        { duration: ARC_DURATION.instant, ease: [...ARC_EASE.standard] },
      );
      return () => {
        animate(element, { scale: 1 }, ARC_SPRING_SNAPPY);
      };
    });
  }, [element, isEnabled]);
}
