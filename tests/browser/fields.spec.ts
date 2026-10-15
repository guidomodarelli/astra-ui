/** Exercises the labelled Input and Textarea fields in real engines, where layout, ResizeObserver and media queries exist. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Frames sampled after a message row mounts; enough to see an opening spring start. */
const SAMPLED_FRAMES = 6;

/** Time a row gets to settle: headless CI engines can stall animation frames for seconds. */
const ROW_SETTLE_TIMEOUT_MS = 15_000;

/** Selector of the clipped slot that animates the height of a message row. */
const messageSlot = (copySlot: string) => `span:has(> [data-slot="${copySlot}"])`;

/**
 * Reads the rendered height of an element.
 * @param locator - Element to measure.
 * @returns Its height in CSS pixels.
 */
async function readHeight(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getBoundingClientRect().height);
}

/** One animation frame of a message row. */
type RowSample = { slotHeight: number; copyHeight: number; wordOpacity: number };

/**
 * Clicks a button and samples, on each following animation frame, the height of a message slot and the opacity of
 * one of its words.
 * @param page - Page that holds the field.
 * @param buttonName - Accessible name of the button that changes the message.
 * @param copySlot - `data-slot` of the message copy to sample.
 * @param word - Visible word whose opacity is sampled.
 * @returns One sample per frame.
 */
async function clickAndSampleRow(page: Page, buttonName: string, copySlot: string, word: string): Promise<RowSample[]> {
  const button = page.getByRole("button", { name: buttonName, exact: true });
  return button.evaluate(
    async (element, { frames, slotSelector, copySelector, sampledWord }) => {
      (element as HTMLButtonElement).click();
      const samples: RowSample[] = [];
      for (let frame = 0; frame < frames; frame++) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const slot = document.querySelector(slotSelector);
        const copy = document.querySelector(copySelector);
        const wordElement = [...(copy?.querySelectorAll('[aria-hidden="true"] > span') ?? [])].find(
          (candidate) => candidate.textContent?.trim() === sampledWord,
        );
        samples.push({
          slotHeight: slot?.getBoundingClientRect().height ?? -1,
          copyHeight: copy?.getBoundingClientRect().height ?? -1,
          wordOpacity: wordElement ? Number(getComputedStyle(wordElement).opacity) : -1,
        });
      }
      return samples;
    },
    { frames: SAMPLED_FRAMES, slotSelector: messageSlot(copySlot), copySelector: `[data-slot="${copySlot}"]`, sampledWord: word },
  );
}

/**
 * Waits until a message slot is exactly as tall as its copy.
 * @param slot - The clipped slot.
 * @param copy - The copy it holds.
 */
async function expectSlotToFitCopy(slot: Locator, copy: Locator): Promise<void> {
  await expect
    .poll(async () => Math.abs((await readHeight(slot)) - (await readHeight(copy))), { timeout: ROW_SETTLE_TIMEOUT_MS })
    .toBeLessThan(1);
}

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/fields.html");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
  });

  test("should fill a horizontal flex row like the bare control", async ({ page }) => {
    const row = page.getByTestId("flex-row");
    const control = page.getByRole("textbox", { name: "Ciudad" });

    const rowWidth = await row.evaluate((element) => element.getBoundingClientRect().width);

    await expect.poll(() => control.evaluate((element) => element.getBoundingClientRect().width)).toBeCloseTo(rowWidth, 0);
  });

  test("should open the error row from a collapsed height and settle on its copy", async ({ page }) => {
    const samples = await clickAndSampleRow(page, "Validar correo", "field-error", "correo");
    const error = page.locator('[data-slot="field-error"]');

    expect(samples[0]!.slotHeight).toBeLessThan(samples[0]!.copyHeight);
    await expectSlotToFitCopy(page.locator(messageSlot("field-error")), error);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Correo" })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("textbox", { name: "Correo" })).toHaveAccessibleDescription(/Ingresá un correo válido$/);
  });

  test("should grow the helper row when a longer message wraps onto more lines", async ({ page }) => {
    const description = page.locator('[data-slot="field-description"]').filter({ hasText: "Solo para recibos." });
    const slot = page.locator(messageSlot("field-description")).filter({ has: description });
    await expectSlotToFitCopy(slot, description);
    const oneLineHeight = await readHeight(slot);

    await page.getByRole("button", { name: "Mostrar ayuda larga", exact: true }).click();

    const longDescription = page.locator('[data-slot="field-description"]').filter({ hasText: "nunca para publicidad" });
    const longSlot = page.locator(messageSlot("field-description")).filter({ has: longDescription });
    await expect.poll(() => readHeight(longDescription)).toBeGreaterThan(oneLineHeight);
    await expectSlotToFitCopy(longSlot, longDescription);
  });

  test("should roll only the digits of the count that changed", async ({ page }) => {
    const bio = page.getByRole("textbox", { name: "Biografía" });
    const columns = page.locator('[data-slot="field-description"] [aria-hidden="true"] .tabular-nums');
    await expect(columns).toHaveCount(3);
    await columns.nth(0).evaluate((column) => {
      (column.firstElementChild as HTMLElement).dataset.marked = "hundreds";
    });

    await bio.pressSequentially("a");

    await expect(bio).toHaveAccessibleDescription("Quedan 119 caracteres");
    await expect(columns.nth(0).locator('[data-marked="hundreds"]')).toHaveText("1");
    await expect.poll(() => columns.evaluateAll((items) => items.map((item) => item.lastElementChild?.textContent).join(""))).toBe("119");
  });
});

test.describe("with reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/fields.html");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
  });

  test("should show the error row at full height and reword it without fading", async ({ page }) => {
    const opened = await clickAndSampleRow(page, "Validar correo", "field-error", "correo");

    expect(Math.abs(opened[0]!.slotHeight - opened[0]!.copyHeight)).toBeLessThan(1);

    const reworded = await clickAndSampleRow(page, "Cambiar error", "field-error", "registrado");

    expect(reworded[0]!.wordOpacity).toBe(1);
    await expect(page.getByRole("textbox", { name: "Correo" })).toHaveAccessibleDescription(/Ese correo ya está registrado$/);
  });
});
