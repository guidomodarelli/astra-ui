/** Exercises a long Today label and a looping carousel in real engines, where layout and animation frames exist. */
import { expect, test } from "@playwright/test";

/** Frames sampled after a wrap; enough to cover the indicator spring. */
const SAMPLED_FRAMES = 30;

/** Width, in px, an indicator may reach while it stays a resting dot, allowing for sub-pixel rounding. */
const RESTING_DOT_MAX_WIDTH_PX = 6.5;

test.beforeEach(async ({ page }) => {
  // Today in September, the month with the longest Spanish name, so the title competes with the controls for room.
  await page.clock.setFixedTime(new Date(2026, 8, 10, 12));
});

test("should keep the month title clear of a long Today label and the arrows", async ({ page }) => {
  await page.goto("/arc-data-variants.html");
  const title = page.locator('[data-slot="calendar-month"] [role="status"]');
  const todayButton = page.getByRole("button", { name: "Volver a la fecha actual", exact: true });
  await expect(title).toContainText("septiembre 2026");

  const titleBox = await title.boundingBox();
  const todayBox = await todayButton.boundingBox();

  expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(todayBox!.x + 0.5);
  expect(Math.abs(titleBox!.y + titleBox!.height / 2 - (todayBox!.y + todayBox!.height / 2))).toBeLessThan(2);
});

for (const { direction, from, to } of [
  { direction: "Diapositiva anterior", from: 0, to: 4 },
  { direction: "Diapositiva siguiente", from: 4, to: 0 },
]) {
  test(`should hand the pill straight across the loop boundary with ${direction}`, async ({ page }) => {
    await page.goto("/arc-data-variants.html");
    const carousel = page.getByRole("region", { name: "Galería en bucle" });
    const indicators = carousel.locator('[data-slot="carousel-indicator"]');
    await expect(indicators).toHaveCount(5);
    if (from !== 0) {
      await indicators.nth(from).click();
      await expect(indicators.nth(from)).toHaveAttribute("aria-selected", "true");
      await expect
        .poll(() => indicators.nth(from).locator("span").first().evaluate((element) => Math.round(element.getBoundingClientRect().width)))
        .toBe(22);
    }

    const middleWidths = await carousel.getByRole("button", { name: direction }).evaluate(async (button, frames) => {
      const dots = Array.from(
        button.closest('[data-slot="carousel"]')!.querySelectorAll<HTMLElement>('[data-slot="carousel-indicator"] > span'),
      );
      (button as HTMLButtonElement).click();
      const widths: number[] = [];
      for (let frame = 0; frame < frames; frame += 1) {
        await new Promise(requestAnimationFrame);
        widths.push(...dots.slice(1, -1).map((dot) => dot.getBoundingClientRect().width));
      }
      return widths;
    }, SAMPLED_FRAMES);

    expect(Math.max(...middleWidths)).toBeLessThanOrEqual(RESTING_DOT_MAX_WIDTH_PX);
    await expect(indicators.nth(to)).toHaveAttribute("aria-selected", "true");
  });
}
