/** Checks in real engines that ButtonLink and buttonClassName paint exactly like Button, so links never look different. */
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { NEXT_ORIGIN } from "./ports";

/** Computed properties that make up the button look, compared between Button and its link and label twins. */
const PAINTED_PROPERTIES = [
  "height",
  "padding-left",
  "padding-right",
  "border-top-width",
  "border-top-color",
  "border-top-left-radius",
  "background-color",
  "color",
  "font-size",
  "font-weight",
  "line-height",
  "display",
  "align-items",
  "justify-content",
  "text-decoration-line",
  "cursor",
] as const;

/** Every variant and size row the fixture renders. */
const ROWS = ["primary", "secondary", "ghost", "danger"].flatMap((variant) => ["sm", "md", "lg"].map((size) => `${variant}-${size}`));

/**
 * Reads the painted properties of an element.
 * @param locator - Element to read.
 * @returns Property name to computed value.
 */
async function readPaint(locator: Locator): Promise<Record<string, string>> {
  return locator.evaluate((element, properties) => {
    const style = getComputedStyle(element);
    return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
  }, [...PAINTED_PROPERTIES]);
}

test.describe("Vite fixture", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/button-links.html");
  });

  for (const row of ROWS) {
    test(`should paint the ${row} link and label exactly like the ${row} button`, async ({ page }) => {
      const section = page.locator(`[data-row="${row}"]`);
      const button = section.getByRole("button", { name: "Botón" });
      const link = section.getByRole("link", { name: "Botón" });
      const label = section.locator("label");
      const buttonPaint = await readPaint(button);
      expect(await readPaint(link)).toEqual(buttonPaint);
      expect(await readPaint(label)).toEqual(buttonPaint);
    });
  }

  test("should navigate as a link and keep the href, so it can open in a new tab", async ({ page }) => {
    const link = page.locator('[data-row="primary-md"]').getByRole("link", { name: "Botón" });
    await expect(link).toHaveAttribute("href", "#destino");
    await expect(link).toHaveAttribute("data-slot", "button-link");
    await link.click();
    await expect(page).toHaveURL(/#destino$/);
  });
});

/**
 * Starts from the blank page of the fresh test page instead of the Vite fixture: in WebKit on Linux, a `page.goto` that
 * leaves a page served by the Vite dev server fails with "WebKit encountered an internal error" (a WebKit loader bug)
 * in about 1 of 75 navigations, while the same navigation from about:blank never failed in 1,800 CI runs.
 */
test("should build button classes and render ButtonLink from a Next Server Component", async ({ page }) => {
  const response = await page.goto(`${NEXT_ORIGIN}/button-recipe`);
  expect(response?.status()).toBe(200);
  const label = page.locator("label", { hasText: "Adjuntar comprobante" });
  await expect(label).toHaveCSS("border-top-style", "solid");
  await expect(label).toHaveCSS("cursor", "pointer");
  const link = page.getByRole("link", { name: "Ir al destino" });
  await expect(link).toHaveAttribute("data-slot", "button-link");
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${NEXT_ORIGIN}/destination$`));
});
