/** Verifies that content leaving through an exit animation can be neither clicked nor focused. */
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Clicks the centre of where a control was laid out with a real pointer, without Playwright's
 * actionability checks: an inert control never becomes a valid target, so the click must land
 * on whatever the browser hit-tests instead.
 */
async function clickAt(page: Page, box: { x: number; y: number; width: number; height: number }) {
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** Reads the layout box of a control, failing clearly when it is not rendered. */
async function boxOf(control: Locator) {
  const box = await control.boundingBox();
  expect(box, "the control must be laid out before its exit starts").not.toBeNull();
  return box!;
}

/** Tabs away from `start` and asserts the keyboard never reaches the leaving control. */
async function expectTabSkips(page: Page, start: Locator, leaving: Locator) {
  await start.focus();
  await page.keyboard.press("Tab");
  await expect(leaving).not.toBeFocused();
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("should ignore pointer and keyboard on a Button while a parent exit removes it", async ({ page }) => {
  await page.goto("/exit-inert.html");
  const button = page.getByRole("button", { name: "Confirmar" });
  const activations = page.getByLabel("Activaciones del botón");
  await button.click();
  await expect(activations).toHaveText("1");
  const box = await boxOf(button);

  const closePanel = page.getByRole("button", { name: "Cerrar panel" });
  await closePanel.click();
  // getByRole skips the aria-hidden button, so look it up by its markup while it fades out.
  const leavingButton = page.locator("button", { hasText: "Confirmar" });
  await expect(leavingButton).toHaveAttribute("inert", "");
  await expect(page.getByRole("button", { name: "Confirmar" })).toHaveCount(0);

  await clickAt(page, box);
  await expectTabSkips(page, closePanel, leavingButton);

  await expect(activations).toHaveText("1");
  await expect(leavingButton).toBeAttached();
});

test("should ignore pointer and keyboard inside an AnimatedCollapse while it closes", async ({ page }) => {
  // The collapse exit lasts a fraction of a second; a fake clock freezes its frame loop so the
  // interactions below provably happen while the region is still mounted and leaving.
  await page.clock.install();
  await page.goto("/exit-inert.html");
  const toggle = page.getByRole("button", { name: "Detalles" });
  await toggle.click();
  const action = page.getByRole("button", { name: "Acción interna" });
  const activations = page.getByLabel("Activaciones de la región");
  const region = page.locator("[data-slot='animated-collapse']");
  await expect(region).toHaveCSS("opacity", "1");
  await expect(region).toHaveCSS("overflow", "visible");
  await action.click();
  await expect(activations).toHaveText("1");
  const box = await boxOf(action);

  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await toggle.click();
  await expect(region).toHaveAttribute("inert", "");
  await expect(region).toHaveAttribute("aria-hidden", "true");

  await clickAt(page, box);
  const leavingAction = page.locator("button", { hasText: "Acción interna" });
  await expectTabSkips(page, toggle, leavingAction);

  await expect(activations).toHaveText("1");
  await expect(leavingAction).toBeAttached();

  await page.clock.resume();
  await expect(region).toHaveCount(0);
});
