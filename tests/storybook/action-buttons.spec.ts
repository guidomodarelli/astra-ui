/** Exercises ActionButton and SplitButton in real browsers, where layout and the label width spring exist. */
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

test("should spring the action button to each label and return to idle after the reset delay", async ({ page }) => {
  await page.goto(
    "/iframe.html?id=components-actionbutton--playground&viewMode=story&args=label:Publicar;pendingLabel:Publicando+cambios;successLabel:Listo;actionDurationMs:900;resetAfterMs:900",
  );
  const button = page.getByRole("button", { name: "Publicar", exact: true });
  const labelSlot = button.locator('[data-slot="action-button-label"]');
  await expect(button).toHaveAttribute("data-state", "idle");
  const idleWidth = await readWidth(labelSlot);

  await button.click();

  await expect(button).toHaveAttribute("data-state", "pending");
  await expect(page.getByRole("status")).toHaveText("Publicando cambios");
  await expect.poll(() => readWidth(labelSlot)).toBeGreaterThan(idleWidth);
  await expect(button).toBeEnabled();

  await expect(button).toHaveAttribute("data-state", "success");
  await expect(page.getByRole("status")).toHaveText("Listo");
  await expect.poll(() => readWidth(labelSlot)).toBeLessThan(idleWidth);

  await expect(button).toHaveAttribute("data-state", "idle");
  await expect.poll(() => readWidth(labelSlot)).toBeCloseTo(idleWidth, 0);
});

test("should confirm the main action in place and open the split button menu from its own half", async ({ page }) => {
  await page.goto("/iframe.html?id=components-splitbutton--playground&viewMode=story");
  const main = page.getByRole("button", { name: "Copiar página", exact: true });
  // Located by its popup role: an open Radix menu hides everything outside it, the trigger included, from the
  // accessibility tree, and the trigger's name follows the main label.
  const trigger = page.locator('[data-slot="split-button"] [aria-haspopup="menu"]');
  await expect(trigger).toHaveAccessibleName("Más acciones de Copiar página");

  await main.click();

  await expect(page.getByRole("button", { name: "Copiado", exact: true })).toBeVisible();
  await expect(trigger).toHaveAccessibleName("Más acciones de Copiado");
  await expect(page.getByRole("button", { name: "Copiar página", exact: true })).toBeVisible();

  await trigger.click();

  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menuitem", { name: "Copiar como Markdown" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(trigger).toBeFocused();
});
