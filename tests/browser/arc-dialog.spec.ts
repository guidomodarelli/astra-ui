/** Exercises Arc's Dialog surface in real engines, where layout, computed styles and Web Animations exist. */
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Arc's minimum gap, in CSS pixels, between the header copy and the close button. */
const HEADER_CLOSE_GAP_PX = 20;

/** Arc's widest dialog panel, in CSS pixels. */
const DIALOG_MAX_WIDTH_PX = 440;

/** Frames sampled after the title changes; enough to see the new copy rise in. */
const SAMPLED_FRAMES = 4;

/**
 * Reads the layout box of an element, failing clearly when it is not rendered.
 * @param locator - Element to measure.
 * @returns Its bounding box in CSS pixels.
 */
async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, "the element must be laid out").not.toBeNull();
  return box!;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/arc-dialog.html");
});

test("should render the dialog on Arc's raised surface over a blurred scrim", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir datos" }).click();
  const dialog = page.getByRole("dialog");
  // The panel has settled: nothing clips it and its entrance transform is gone.
  await expect(dialog).toHaveCSS("clip-path", "none");
  await expect(dialog).toHaveCSS("transform", "none");
  await expect(dialog).toHaveCSS("padding", "24px");
  await expect(dialog).toHaveCSS("border-top-width", "1px");
  await expect(dialog).toHaveCSS("border-top-left-radius", "34px");
  await expect(dialog).not.toHaveCSS("box-shadow", "none");
  expect((await boxOf(dialog)).width).toBeLessThanOrEqual(DIALOG_MAX_WIDTH_PX);
  const overlay = page.locator("[data-slot=dialog-overlay]");
  await expect(overlay).toHaveCSS("backdrop-filter", "blur(7px)");
  await expect(overlay).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(dialog.getByRole("heading")).toHaveCSS("font-size", "18px");
});

test("should keep a wrapping title clear of the close button", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir datos" }).click();
  const dialog = page.getByRole("dialog");
  // The panel has settled: nothing clips it and its entrance transform is gone.
  await expect(dialog).toHaveCSS("clip-path", "none");
  await expect(dialog).toHaveCSS("transform", "none");
  const close = dialog.locator("[data-slot=dialog-close]").first();
  await expect(close).toHaveCSS("width", "32px");
  const title = await boxOf(dialog.getByRole("heading"));
  const closeBox = await boxOf(close);
  expect(title.x + title.width).toBeLessThanOrEqual(closeBox.x - HEADER_CLOSE_GAP_PX + 1);
  // The button sits on the title's first line.
  expect(closeBox.y).toBeLessThan(title.y + title.height / 2);
  await close.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("should swap a changed title with a rise while the old copy leaves the accessible name", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir pasos" }).click();
  const dialog = page.getByRole("dialog", { name: "Paso 1" });
  // The panel has settled: nothing clips it and its entrance transform is gone.
  await expect(dialog).toHaveCSS("clip-path", "none");
  await expect(dialog).toHaveCSS("transform", "none");
  const opacities = await page.evaluate(async (frames) => {
    const next = [...document.querySelectorAll("button")].find((button) => button.textContent === "Siguiente paso")!;
    next.click();
    const samples: number[] = [];
    for (let frame = 0; frame < frames; frame += 1) {
      await new Promise(requestAnimationFrame);
      const entering = [...document.querySelectorAll("[data-slot=dialog-swap-text]")].find(
        (copy) => copy.textContent === "Paso 2",
      );
      samples.push(entering ? Number(getComputedStyle(entering).opacity) : Number.NaN);
    }
    return samples;
  }, SAMPLED_FRAMES);
  expect(opacities.some((opacity) => opacity < 1)).toBe(true);
  await expect(page.getByRole("dialog", { name: "Paso 2" })).toBeVisible();
  await expect(page.getByRole("heading").locator("[data-slot=dialog-swap-text]")).toHaveCount(1);
});

test("should keep the title height while the old copy leaves", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir pasos" }).click();
  // The panel has settled: nothing clips it and its entrance transform is gone.
  await expect(page.getByRole("dialog", { name: "Paso 1" })).toHaveCSS("clip-path", "none");
  await expect(page.getByRole("dialog", { name: "Paso 1" })).toHaveCSS("transform", "none");
  const { restingHeight, swapHeights, sawBothCopies } = await page.evaluate(async (frames) => {
    const title = document.querySelector<HTMLElement>("[data-slot=dialog-title]")!;
    const height = () => title.getBoundingClientRect().height;
    const resting = height();
    const next = [...document.querySelectorAll("button")].find((button) => button.textContent === "Siguiente paso")!;
    next.click();
    const heights: number[] = [];
    let both = false;
    for (let frame = 0; frame < frames; frame += 1) {
      await new Promise(requestAnimationFrame);
      if (title.querySelectorAll("[data-slot=dialog-swap-text]").length > 1) both = true;
      heights.push(height());
    }
    return { restingHeight: resting, swapHeights: heights, sawBothCopies: both };
  }, SAMPLED_FRAMES);
  expect(sawBothCopies, "the old copy must still be leaving while the title is measured").toBe(true);
  expect(Math.max(...swapHeights)).toBeLessThanOrEqual(restingHeight + 0.5);
});

test("should show the new title at once under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Abrir pasos" }).click();
  await page.getByRole("button", { name: "Siguiente paso" }).click();
  const copy = page.locator("[data-slot=dialog-swap-text]", { hasText: "Paso 2" });
  await expect(copy).toHaveCSS("opacity", "1");
  await expect(page.getByRole("dialog", { name: "Paso 2" })).toBeVisible();
});

test("should share the dialog surface with the alert dialog", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir confirmación" }).click();
  const alert = page.getByRole("alertdialog");
  // The panel has settled: nothing clips it and its entrance transform is gone.
  await expect(alert).toHaveCSS("clip-path", "none");
  await expect(alert).toHaveCSS("transform", "none");
  await expect(alert).toHaveCSS("padding", "24px");
  await expect(alert).toHaveCSS("border-top-left-radius", "34px");
  await expect(page.locator("[data-slot=alert-dialog-overlay]")).toHaveCSS("backdrop-filter", "blur(7px)");
  await expect(alert.getByRole("heading")).toHaveCSS("font-size", "18px");
  await expect(page.locator("[data-slot=alert-dialog-footer]")).toHaveCSS("margin-bottom", "-24px");
  await alert.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
});
