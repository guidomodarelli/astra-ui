/** Exercises ActionButton and SplitButton in real engines, where layout, the label width spring and the press exist. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/**
 * Reads the rendered width of an element.
 * @param locator - Element to measure.
 * @returns Its width in CSS pixels.
 */
async function readWidth(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getBoundingClientRect().width);
}

/**
 * Reads the horizontal scale an element currently renders with.
 * @param locator - Element to measure.
 * @returns `1` when it has no transform, otherwise the scale of its computed matrix.
 */
async function readScale(locator: Locator): Promise<number> {
  return locator.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
}

/**
 * Presses the pointer on an element without releasing it, so no click fires.
 * @param locator - Element to press.
 */
async function pressDown(locator: Locator): Promise<void> {
  await locator.hover();
  await locator.page().mouse.down();
}

/** What happened on the page from the moment a press trace starts. */
type PressTrace = {
  /** Pointer events in order, with whether they landed on the traced button. */
  pointerEvents: string[];
  /** Inline `style` values the button went through, in order. */
  styleChanges: string[];
  /** Frames painted since the trace started, and the longest wait between two of them. */
  frames: { count: number; longestGapMs: number };
  /** State that makes the press feedback skip the scale. */
  attributes: Record<string, string | null>;
  computedTransform: string;
};

/** Window property holding the active press trace; only one press is traced at a time. */
const PRESS_TRACE_PROPERTY = "golfoPressTrace";
/** Attributes the press feedback reads to decide whether an element scales. */
const PRESS_GATE_ATTRIBUTES = ["aria-busy", "aria-disabled", "data-disabled", "disabled", "data-state", "aria-haspopup"];

/**
 * Starts recording pointer events, style changes and painted frames for a button, so a press that never scales says
 * whether the pointer missed it, the frames stalled or the animation never started.
 * @param locator - Button about to be pressed.
 * @returns Reads the trace recorded so far.
 */
async function tracePress(locator: Locator): Promise<() => Promise<PressTrace>> {
  await locator.evaluate((element, { property, gateAttributes }) => {
    const startedAt = performance.now();
    const trace = { pointerEvents: [] as string[], styleChanges: [] as string[], frames: { count: 0, longestGapMs: 0 } };
    const elapsed = () => Math.round(performance.now() - startedAt);
    const recordPointer = (event: Event) => {
      const pointer = event as PointerEvent;
      trace.pointerEvents.push(
        `${elapsed()}ms ${event.type} onButton=${element.contains(event.target as Node)} primary=${pointer.isPrimary} button=${pointer.button} at=${pointer.clientX},${pointer.clientY}`,
      );
    };
    const pointerTypes = ["pointerdown", "pointerup", "pointercancel"];
    for (const type of pointerTypes) window.addEventListener(type, recordPointer, { capture: true });
    const styleObserver = new MutationObserver(() => trace.styleChanges.push(`${elapsed()}ms ${element.getAttribute("style")}`));
    styleObserver.observe(element, { attributes: true, attributeFilter: ["style"] });
    let lastFrameAt = performance.now();
    let frameRequest = requestAnimationFrame(function countFrame(time) {
      trace.frames.count += 1;
      trace.frames.longestGapMs = Math.max(trace.frames.longestGapMs, Math.round(time - lastFrameAt));
      lastFrameAt = time;
      frameRequest = requestAnimationFrame(countFrame);
    });
    const read = () => ({
      ...trace,
      attributes: Object.fromEntries(gateAttributes.map((name) => [name, element.getAttribute(name)])),
      computedTransform: getComputedStyle(element).transform,
    });
    const stop = () => {
      for (const type of pointerTypes) window.removeEventListener(type, recordPointer, { capture: true });
      styleObserver.disconnect();
      cancelAnimationFrame(frameRequest);
    };
    Object.assign(window, { [property]: { read, stop } });
  }, { property: PRESS_TRACE_PROPERTY, gateAttributes: PRESS_GATE_ATTRIBUTES });
  return () =>
    locator.page().evaluate((property) => (window as unknown as Record<string, { read: () => PressTrace }>)[property]!.read(), PRESS_TRACE_PROPERTY);
}

/**
 * Stops the active press trace.
 * @param page - Page holding the trace.
 */
async function stopPressTrace(page: Page): Promise<void> {
  await page.evaluate((property) => (window as unknown as Record<string, { stop: () => void }>)[property]!.stop(), PRESS_TRACE_PROPERTY);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/action-buttons.html");
  // Widths measured before the web font swaps in would not match the label the button settles on.
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
});

/** Time a spring or a press gets to reach the screen: headless CI engines can stall animation frames for seconds. */
const SETTLE_TIMEOUT_MS = 15_000;

test("should spring the action button label slot to each label", async ({ page }) => {
  const button = page.getByRole("button", { name: "Publicar", exact: true });
  const labelSlot = button.locator('[data-slot="action-button-label"]');
  await expect(button).toHaveAttribute("data-action-state", "idle");
  const idleWidth = await readWidth(labelSlot);

  await button.click();

  await expect(button).toHaveAttribute("data-action-state", "pending");
  await expect(page.getByRole("status")).toHaveText("Publicando cambios");
  await expect.poll(() => readWidth(labelSlot)).toBeGreaterThan(idleWidth);
  await expect(button).toBeEnabled();

  await expect(button).toHaveAttribute("data-action-state", "success");
  await expect(page.getByRole("status")).toHaveText("Listo");
  // The slot follows the natural width of its letters. When the outgoing letters leave the row is up to the motion
  // engine (headless WebKit desktop on CI keeps them longer), so the spec checks the slot tracks the row instead of
  // a fixed width.
  const labelRow = labelSlot.locator(":scope > span");
  await expect
    .poll(async () => Math.abs((await readWidth(labelSlot)) - (await readWidth(labelRow))), {
      timeout: SETTLE_TIMEOUT_MS,
    })
    .toBeLessThan(1);
  await expect(button).toHaveAttribute("data-action-state", "success");
});

test("should confirm the main action in place and open the split button menu from its own half", async ({ page }) => {
  const main = page.getByRole("button", { name: "Copiar página", exact: true });
  // Located by its popup role: an open Radix menu hides everything outside it, the trigger included, from the
  // accessibility tree, and the trigger's name follows the main label.
  const trigger = page.locator('[data-slot="split-button"] [aria-haspopup="menu"]');
  await expect(trigger).toHaveAccessibleName("Más acciones de Copiar página");

  await main.click();

  await expect(page.getByRole("button", { name: "Copiado", exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="split-button"] [aria-live="polite"]')).toHaveText("Copiado");
  await expect(trigger).toHaveAccessibleName("Más acciones de Copiado");

  await trigger.click();

  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menuitem", { name: "Copiar como Markdown" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();

  // Focus returns to the trigger when the menu was opened from the keyboard; WebKit does not focus buttons on click.
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Copiar como Markdown" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("should scale the action button and the split main action on press but keep the menu trigger still", async ({ page }) => {
  for (const name of ["Publicar", "Copiar página"]) {
    const button = page.getByRole("button", { name, exact: true });
    const readPressTrace = await tracePress(button);
    await pressDown(button);
    try {
      await expect.poll(() => readScale(button), { timeout: SETTLE_TIMEOUT_MS }).toBeLessThan(1);
    } catch (error) {
      throw new Error(`"${name}" did not scale while pressed. Press trace: ${JSON.stringify(await readPressTrace(), null, 2)}`, { cause: error });
    }
    await stopPressTrace(page);
    await page.mouse.up();
    await page.mouse.move(0, 0);
  }

  // Radix measures the trigger on pointerdown, so it never scales; sample frames while it is held down.
  const trigger = page.locator('[data-slot="split-button"] [aria-haspopup="menu"]');
  await pressDown(trigger);
  const triggerTransforms = await trigger.evaluate(async (element) => {
    const samples: string[] = [];
    for (let frame = 0; frame < 15; frame += 1) {
      await new Promise(requestAnimationFrame);
      samples.push(getComputedStyle(element).transform);
    }
    return samples;
  });
  expect(triggerTransforms.every((transform) => transform === "none")).toBe(true);
  await page.mouse.up();
});
