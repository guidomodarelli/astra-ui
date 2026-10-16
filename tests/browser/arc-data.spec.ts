/** Exercises Arc's Calendar and Carousel in real engines, where layout, pointer media queries and animation frames exist. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Frames sampled after a click; enough to catch a spring in flight. */
const SAMPLED_FRAMES = 8;

/**
 * Clicks an element and records, on each following animation frame, the horizontal offset of the selected disc.
 * @param page - Page holding the calendar.
 * @param target - Element to click.
 * @returns The disc's left edge, relative to its month, per frame.
 */
async function clickAndSampleDisc(page: Page, target: Locator): Promise<number[]> {
  await target.click();
  return page.evaluate(async (frames) => {
    const disc = document.querySelector<HTMLElement>('[data-slot="calendar-selection"]')!;
    const month = disc.parentElement!;
    const samples: number[] = [];
    for (let frame = 0; frame < frames; frame += 1) {
      await new Promise(requestAnimationFrame);
      samples.push(disc.getBoundingClientRect().left - month.getBoundingClientRect().left);
    }
    return samples;
  }, SAMPLED_FRAMES);
}

/**
 * Reads the left edge of an element relative to the calendar month.
 * @param page - Page holding the calendar.
 * @param target - Element to measure.
 * @returns The offset in CSS pixels.
 */
async function offsetInMonth(page: Page, target: Locator): Promise<number> {
  const box = await target.boundingBox();
  const monthBox = await page.locator('[data-slot="calendar-month"]').boundingBox();
  return box!.x - monthBox!.x;
}

test.describe("Calendar", () => {
  test("should glide the selected disc between two days and land on the new one", async ({ page }) => {
    await page.goto("/arc-data.html");
    const firstDay = page.getByRole("button", { name: /martes, 1 de septiembre/i });
    const secondDay = page.getByRole("button", { name: /sábado, 5 de septiembre/i });
    const disc = page.locator('[data-slot="calendar-selection"]');
    await firstDay.click();
    await expect(page.getByLabel("Día elegido")).toHaveText("1");
    await expect(disc).toHaveCSS("opacity", "1");
    const start = await offsetInMonth(page, firstDay);
    const end = await offsetInMonth(page, secondDay);

    const samples = await clickAndSampleDisc(page, secondDay);

    expect(samples.some((offset) => offset > start + 1 && offset < end - 1)).toBe(true);
    await expect.poll(() => offsetInMonth(page, disc).then(Math.round)).toBe(Math.round(end));
    await expect(secondDay).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  });

  test("should mark today with a dot in the colour of its number", async ({ page }) => {
    await page.goto("/arc-data.html");
    const today = page.getByRole("button", { name: /jueves, 10 de septiembre/i });

    const dot = await today.evaluate((element) => {
      const style = getComputedStyle(element, "::after");
      return { width: style.width, color: style.backgroundColor, text: getComputedStyle(element).color };
    });

    expect(dot.width).toBe("4px");
    expect(dot.color).toBe(dot.text);
  });

  test("should select today from the Today button and then rest dimmed", async ({ page }) => {
    await page.goto("/arc-data.html");
    await page.getByRole("button", { name: "Ir al mes siguiente" }).click();
    await expect(page.locator('[data-slot="calendar-month"]')).toContainText("octubre 2026");
    const todayButton = page.getByRole("button", { name: "Hoy", exact: true });

    await todayButton.click();

    await expect(page.locator('[data-slot="calendar-month"]')).toContainText("septiembre 2026");
    await expect(page.getByLabel("Día elegido")).toHaveText("10");
    await expect(todayButton).toHaveAttribute("aria-disabled", "true");
    await expect(todayButton).toHaveCSS("opacity", "0.35");
  });
});

test.describe("Carousel", () => {
  test("should stretch the active indicator into a pill that follows the selected slide", async ({ page }) => {
    await page.goto("/arc-data.html");
    const indicators = page.getByRole("group", { name: "Elegir una diapositiva" });
    const first = indicators.getByRole("button", { name: "Diapositiva 1 de 4" });
    const third = indicators.getByRole("button", { name: "Diapositiva 3 de 4" });
    const pillWidth = (tab: Locator) =>
      tab.locator("span").first().evaluate((element) => Math.round(element.getBoundingClientRect().width));
    await expect(first).toHaveAttribute("aria-current", "true");
    await expect.poll(() => pillWidth(first)).toBe(22);

    await third.click();

    await expect(third).toHaveAttribute("aria-current", "true");
    await expect(first).not.toHaveAttribute("aria-current");
    await expect.poll(() => pillWidth(third)).toBe(22);
    await expect.poll(() => pillWidth(first)).toBe(6);
  });

  test("should jump to the edges with Home and End and keep the indicator focus in step", async ({ page }) => {
    await page.goto("/arc-data.html");
    const carousel = page.getByRole("region", { name: "Destacados" });
    const first = carousel.getByRole("button", { name: "Diapositiva 1 de 4" });
    await first.focus();

    await page.keyboard.press("End");

    await expect(carousel.getByRole("button", { name: "Next slide" })).toBeDisabled();
    await expect(carousel.getByRole("button", { name: "Diapositiva 4 de 4" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(carousel.getByRole("button", { name: "Previous slide" })).toBeDisabled();
    await expect(first).toBeFocused();
  });

  test("should leave arrow keys to a text field inside a slide", async ({ page }) => {
    await page.goto("/arc-data.html");
    const carousel = page.getByRole("region", { name: "Destacados" });
    const field = carousel.getByLabel("Nota 1");
    await field.fill("hola");

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");

    await expect(carousel.getByRole("button", { name: "Diapositiva 1 de 4" })).toHaveAttribute("aria-current", "true");
    await expect(field).toBeFocused();
  });

  test("should leave arrow, Home and End keys to a composite widget inside a slide", async ({ page }) => {
    await page.goto("/arc-data.html");
    const carousel = page.getByRole("region", { name: "Destacados" });
    const nestedTab = carousel.getByRole("tab", { name: "Resumen 1" });
    await nestedTab.focus();

    await page.keyboard.press("End");
    await page.keyboard.press("ArrowRight");

    await expect(carousel.getByRole("button", { name: "Diapositiva 1 de 4" })).toHaveAttribute("aria-current", "true");
    await expect(nestedTab).toBeFocused();
  });

  test("should leave Home and End inside a nested carousel to that carousel", async ({ page }) => {
    await page.goto("/arc-data.html");
    const outer = page.getByRole("region", { name: "Destacados" });
    const inner = page.getByRole("region", { name: "Fotos" });
    const innerNext = inner.getByRole("button", { name: "Foto siguiente" });
    await expect(innerNext).toBeEnabled();
    await innerNext.focus();

    await page.keyboard.press("End");

    await expect(innerNext).toBeDisabled();
    await expect(outer.getByRole("button", { name: "Diapositiva 1 de 4" })).toHaveAttribute("aria-current", "true");
  });

  test("should show a grab cursor on fine pointers while the track can be dragged", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.endsWith("-mobile"), "Phone projects emulate a touch screen without a cursor");
    await page.goto("/arc-data.html");

    await expect(page.getByRole("region", { name: "Destacados" }).locator('[data-slot="carousel-content"]').first()).toHaveCSS("cursor", "grab");
  });
});

test.describe("with reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("should move the selected disc without gliding", async ({ page }) => {
    await page.goto("/arc-data.html");
    await page.getByRole("button", { name: /martes, 1 de septiembre/i }).click();
    const secondDay = page.getByRole("button", { name: /sábado, 5 de septiembre/i });
    const end = await offsetInMonth(page, secondDay);

    const samples = await clickAndSampleDisc(page, secondDay);

    expect(samples.every((offset) => Math.abs(offset - end) < 1)).toBe(true);
  });
});
