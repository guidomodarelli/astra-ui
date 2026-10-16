/**
 * Checks the mobile sidebar's page scroll lock against a classic desktop scrollbar, the kind a narrow desktop window
 * shows.
 */
import { expect, test } from "@playwright/test";

/** Width of a classic desktop scrollbar, which takes layout room unlike overlay scrollbars. */
const CLASSIC_SCROLLBAR_WIDTH_PX = 15;

test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "the sidebar is a sheet only below 768px");

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("should lock the page scroll without shifting the page under the sheet", async ({ page }) => {
  await page.goto("/sidebar.html");
  // A styled scrollbar takes layout room in every engine, as a classic desktop scrollbar does.
  await page.addStyleTag({ content: `::-webkit-scrollbar { width: ${CLASSIC_SCROLLBAR_WIDTH_PX}px; }` });
  const scrollbarWidth = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
  // Chromium's headless shell keeps every scrollbar as an overlay even when styled; WebKit gives it layout room.
  test.skip(scrollbarWidth === 0, "this engine only draws overlay scrollbars headless");
  expect(scrollbarWidth).toBe(CLASSIC_SCROLLBAR_WIDTH_PX);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const content = page.getByRole("status", { name: "Sección activa" });
  const before = await content.boundingBox();
  // A synthetic click: a real one would first scroll the trigger back into view and move the page by itself.
  await page.getByRole("button", { name: "Alternar navegación" }).dispatchEvent("click");
  const sidebar = page.getByRole("dialog", { name: "Navegación principal" });
  await expect(sidebar).toHaveAttribute("data-state", "expanded");
  expect(await content.boundingBox()).toEqual(before);

  // The scrim's uncovered strip, right of the sheet.
  const viewport = page.viewportSize()!;
  await page.mouse.click(viewport.width - 8, viewport.height / 2);
  await expect(sidebar).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.paddingRight)).toBe("");
  expect(await content.boundingBox()).toEqual(before);
});
