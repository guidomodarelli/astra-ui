/** Exercises ActionButton and SplitButton in real engines, where layout, the label width spring and the press exist. */
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

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

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/action-buttons.html");
});

test("should spring the action button to each label and return to idle after the reset delay", async ({ page }) => {
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
  await expect.poll(() => readWidth(labelSlot)).toBeLessThan(idleWidth);

  await expect(button).toHaveAttribute("data-action-state", "idle");
  await expect.poll(() => readWidth(labelSlot)).toBeCloseTo(idleWidth, 0);
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
  await expect(trigger).toBeFocused();
});

test("should scale the action button and the split main action on press but keep the menu trigger still", async ({ page }) => {
  for (const name of ["Publicar", "Copiar página"]) {
    const button = page.getByRole("button", { name, exact: true });
    await pressDown(button);
    await expect.poll(() => readScale(button)).toBeLessThan(1);
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
