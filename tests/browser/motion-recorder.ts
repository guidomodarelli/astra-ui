/** Records animation effects and glide indicators as a page creates them, without altering them. */
import { expect, type Locator, type Page } from "@playwright/test";

type MotionRecord = {
  slot: string | null;
  role: string | null;
  parentSlot: string | null;
  /** Accessible text of the closest button, to identify decorative icons inside it. */
  buttonText: string | null;
  properties: string[];
};
type MotionTarget = { slot?: string; role?: string; parentSlot?: string; buttonText?: string };
type MotionWindow = Window & { __motionRecords: MotionRecord[]; __glides: string[] };

/** Painted box of an element in one frame, transforms included. */
export type PaintedBox = { x: number; y: number; width: number; height: number };

/**
 * Where sampled boxes are measured from: the document, so scrolling the page to reach a control never reads as the
 * element moving, or the viewport, for fixed layers such as dialogs.
 */
export type BoxOrigin = "document" | "viewport";

/**
 * Waits until the page has finished laying out around an element: fonts are loaded and its box holds still across
 * two painted frames, so later measurements only see what an interaction changes.
 * @param locator - Element whose box must settle.
 */
export async function waitForSettledLayout(locator: Locator) {
  await locator.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect
    .poll(() =>
      locator.evaluate(async (element) => {
        const before = JSON.stringify(element.getBoundingClientRect());
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return before === JSON.stringify(element.getBoundingClientRect());
      }),
    )
    .toBe(true);
}

/** Options of `samplePaintedBoxes`. */
export type SampleOptions = {
  /** Where positions are measured from; `document` by default. */
  origin?: BoxOrigin;
  /** Selector whose first match opens the sampling window; the watched element itself by default. */
  from?: string;
};

/**
 * Samples the painted box of the first element matching a selector on every frame, starting at once, so an action
 * fired right after the call is observed from its first frame. Sampling ends `durationMs` after the `from` selector
 * first matches, so a slow action before the change never eats the window.
 * @param page - Page that holds the element.
 * @param selector - CSS selector of the element to watch.
 * @param durationMs - How long to keep sampling once the window opens.
 * @param options - Origin of the positions and the selector that opens the window.
 * @returns One box per frame in which the element existed.
 */
export function samplePaintedBoxes(
  page: Page,
  selector: string,
  durationMs: number,
  { origin = "document", from = selector }: SampleOptions = {},
): Promise<PaintedBox[]> {
  return page.evaluate(
    ({ selector, durationMs, origin, from }) =>
      new Promise<PaintedBox[]>((resolve) => {
        const boxes: PaintedBox[] = [];
        let start: number | null = null;
        const tick = () => {
          const element = document.querySelector(selector);
          if (element) {
            const { x, y, width, height } = element.getBoundingClientRect();
            const scrollX = origin === "document" ? window.scrollX : 0;
            const scrollY = origin === "document" ? window.scrollY : 0;
            boxes.push({ x: x + scrollX, y: y + scrollY, width, height });
          }
          if (start === null && document.querySelector(from)) start = performance.now();
          if (start === null || performance.now() - start < durationMs) requestAnimationFrame(tick);
          else resolve(boxes);
        };
        tick();
      }),
    { selector, durationMs, origin, from },
  );
}

/** Records animation effects and glide indicators as the page creates them, without altering them. */
export async function recordMotion(page: Page) {
  await page.addInitScript(() => {
    const records: MotionRecord[] = [];
    const glides: string[] = [];
    const nativeAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const [keyframes] = args;
      const frames = Array.isArray(keyframes) ? keyframes : keyframes ? [keyframes] : [];
      records.push({
        slot: this.getAttribute("data-slot"),
        parentSlot: this.parentElement?.getAttribute("data-slot") ?? null,
        buttonText: this.closest("button")?.textContent?.trim() ?? null,
        role: this.getAttribute("role"),
        properties: frames.flatMap((keyframe) => Object.keys(keyframe ?? {})),
      });
      return nativeAnimate.apply(this, args);
    };
    new MutationObserver((mutations) => {
      for (const mutation of mutations)
        for (const node of mutation.addedNodes)
          if (node instanceof HTMLElement && node.hasAttribute("data-glide-indicator"))
            glides.push(node.parentElement?.getAttribute("data-slot") ?? "");
    }).observe(document, { childList: true, subtree: true });
    Object.assign(window, { __motionRecords: records, __glides: glides });
  });
  return {
    /** Returns the animated CSS properties recorded for elements matching a slot or role. */
    properties: (target: MotionTarget) =>
      page.evaluate(
        ({ slot, role, parentSlot, buttonText }) =>
          (window as unknown as MotionWindow).__motionRecords
            .filter(
              (record) =>
                (slot === undefined || record.slot === slot) &&
                (parentSlot === undefined || record.parentSlot === parentSlot) &&
                (buttonText === undefined || record.buttonText === buttonText) &&
                (role === undefined || record.role === role),
            )
            .flatMap((record) => record.properties),
        target,
      ),
    /** Returns the containers in which a glide indicator travelled. */
    glides: () =>
      page.evaluate(() => [...(window as unknown as MotionWindow).__glides]),
  };
}
