/**
 * Checks the mobile sidebar's page scroll lock against a classic desktop scrollbar, the kind a narrow desktop window
 * shows, including roots that keep its gutter reserved while the page is locked.
 */
import { expect, test } from "@playwright/test";

/** Width of a classic desktop scrollbar, which takes layout room unlike overlay scrollbars. */
const CLASSIC_SCROLLBAR_WIDTH_PX = 15;

/** Root styles a consumer may use around the scrollbar: with the last two, its gutter stays reserved under the lock. */
const ROOT_SCROLLBAR_SETUPS = [
  { name: "a scrollbar that disappears with the lock", rootStyles: "" },
  { name: "a gutter reserved with scrollbar-gutter: stable", rootStyles: "html { scrollbar-gutter: stable; }" },
  { name: "a scrollbar forced with overflow-y: scroll", rootStyles: "html { overflow-y: scroll; }" },
] as const;

test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "the sidebar is a sheet only below 768px");

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

for (const { name, rootStyles } of ROOT_SCROLLBAR_SETUPS) {
  test(`should lock the page scroll without shifting the page under the sheet with ${name}`, async ({ page }) => {
    // Styled in the served document, as a consumer's own stylesheet would be, the scrollbar is styled from its first
    // layout and takes layout room, as a classic desktop scrollbar does. Styling it later is not always picked up.
    const pageStyles = `<style>::-webkit-scrollbar { width: ${CLASSIC_SCROLLBAR_WIDTH_PX}px; } ${rootStyles}</style>`;
    await page.route("**/sidebar.html", async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()).replace("</head>", `${pageStyles}</head>`) });
    });
    await page.goto("/sidebar.html");
    const content = page.getByRole("status", { name: "Sección activa" });
    await expect(content).toBeVisible();
    const scrollbarWidth = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
    // Chromium's headless shell keeps every scrollbar as an overlay even when styled; WebKit gives it layout room.
    test.skip(scrollbarWidth === 0, "this engine only draws overlay scrollbars headless");
    expect(scrollbarWidth).toBe(CLASSIC_SCROLLBAR_WIDTH_PX);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const before = await content.boundingBox();
    // A synthetic click: a real one would first scroll the trigger back into view and move the page by itself.
    await page.getByRole("button", { name: "Alternar navegación" }).dispatchEvent("click");
    const sidebar = page.getByRole("dialog", { name: "Navegación principal" });
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    // Same position and width: the page neither shifts nor narrows while it is locked.
    expect(await content.boundingBox()).toEqual(before);

    // The scrim's uncovered strip, right of the sheet and clear of a gutter the root may keep.
    const viewport = page.viewportSize()!;
    await page.mouse.click(viewport.width - scrollbarWidth - 8, viewport.height / 2);
    await expect(sidebar).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.paddingRight)).toBe("");
    expect(await content.boundingBox()).toEqual(before);
  });
}
