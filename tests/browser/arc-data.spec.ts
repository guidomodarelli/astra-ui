/** Exercises Arc's Calendar and Carousel in real engines, where layout, pointer media queries and animation frames exist. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Frames sampled after a click; enough to catch a spring in flight. */
const SAMPLED_FRAMES = 8;
/** Frames sampled while a carousel scrolls; enough to cover Embla's whole scroll. */
const SCROLL_FRAMES = 40;
/** Today, pinned through the page clock so the calendar never depends on the real date. */
const NOW = new Date(2026, 8, 10, 12);
/** Carousels on the fixture page, nested one included. */
const CAROUSEL_COUNT = 4;

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
});

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

/**
 * Distance, in px, between the centre of a carousel's active slide and the centre of its viewport.
 * @param carousel - The carousel region.
 * @returns How far the active slide sits off centre.
 */
async function activeSlideOffCentre(carousel: Locator): Promise<number> {
  return carousel.evaluate((root) => {
    const viewport = root.querySelector<HTMLElement>('[data-slot="carousel-content"]')!.getBoundingClientRect();
    // Nested carousels have slides of their own; only this carousel's slides count.
    const slide = Array.from(root.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]:not([inert])'))
      .find((item) => item.closest('[data-slot="carousel"]') === root)!
      .getBoundingClientRect();
    return Math.abs(slide.left + slide.width / 2 - (viewport.left + viewport.width / 2));
  });
}

/**
 * Opens the fixture page and waits until Embla has measured every carousel, which enables each next arrow.
 * @param page - Page to load.
 */
async function openCarouselPage(page: Page): Promise<void> {
  await page.goto("/arc-data.html");
  await expect(page.locator('[data-slot="carousel-next"]:not([aria-disabled])')).toHaveCount(CAROUSEL_COUNT);
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

  test("should open on today's month and mark today with a dot in the colour of its number", async ({ page }) => {
    await page.goto("/arc-data.html");
    await expect(page.locator('[data-slot="calendar-month"]')).toContainText("septiembre 2026");
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
  test("should center the active slide and line the control row up with its edges", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    await expect(carousel.getByRole("tab", { name: "Diapositiva 1 de 4" })).toBeVisible();

    const layout = await carousel.evaluate((root) => {
      const slide = root.querySelector<HTMLElement>('[data-slot="carousel-item"]:not([inert])')!.getBoundingClientRect();
      const viewport = root.querySelector<HTMLElement>('[data-slot="carousel-content"]')!.getBoundingClientRect();
      const tabs = root.querySelector<HTMLElement>('[data-slot="carousel-indicators"]')!.getBoundingClientRect();
      const next = root.querySelector<HTMLElement>('[data-slot="carousel-next"]')!.getBoundingClientRect();
      return {
        offCentre: Math.abs(slide.left + slide.width / 2 - (viewport.left + viewport.width / 2)),
        slideRatio: slide.width / viewport.width,
        controlsStart: tabs.left - slide.left,
        controlsEnd: slide.right - next.right,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(layout.offCentre).toBeLessThan(1);
    expect(layout.slideRatio).toBeLessThan(0.81);
    expect(Math.abs(layout.controlsStart)).toBeLessThanOrEqual(1);
    expect(Math.abs(layout.controlsEnd)).toBeLessThanOrEqual(1);
    expect(layout.overflow).toBe(0);
  });

  test("should stretch the active indicator into a pill that follows the selected slide", async ({ page }) => {
    await openCarouselPage(page);
    const indicators = page.getByRole("tablist", { name: "Elegir una diapositiva" }).first();
    const first = indicators.getByRole("tab", { name: "Diapositiva 1 de 4" });
    const third = indicators.getByRole("tab", { name: "Diapositiva 3 de 4" });
    const pillWidth = (tab: Locator) =>
      tab.locator("span").first().evaluate((element) => Math.round(element.getBoundingClientRect().width));
    await expect(first).toHaveAttribute("aria-selected", "true");
    await expect.poll(() => pillWidth(first)).toBe(22);

    await third.click();

    await expect(third).toHaveAttribute("aria-selected", "true");
    await expect(first).toHaveAttribute("aria-selected", "false");
    await expect.poll(() => pillWidth(third)).toBe(22);
    await expect.poll(() => pillWidth(first)).toBe(6);
    const panelId = await third.getAttribute("aria-controls");
    await expect(page.locator(`[id="${panelId}"]`)).toHaveAttribute("aria-label", "Diapositiva 3 de 4");
    await expect(page.locator(`[id="${panelId}"]`)).not.toHaveAttribute("inert");
  });

  test("should report the new slide when the scroll starts and again once it settles", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    const next = carousel.getByRole("button", { name: "Diapositiva siguiente" }).last();

    const reports = await next.evaluate(async (button, frames) => {
      const active = document.querySelector('[aria-label="Índice activo"]')!;
      const settled = document.querySelector('[aria-label="Índice asentado"]')!;
      (button as HTMLButtonElement).click();
      const samples: string[] = [];
      for (let frame = 0; frame < frames; frame += 1) {
        await new Promise(requestAnimationFrame);
        samples.push(`${active.textContent}/${settled.textContent}`);
      }
      return samples;
    }, SCROLL_FRAMES);

    expect(reports).toContain("1/0");
    await expect(page.getByLabel("Índice asentado")).toHaveText("1");
    await expect(page.getByLabel("Índice activo")).toHaveText("1");
  });

  test("should announce the slide a viewer moves to", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    const liveRegion = carousel.locator('[aria-live="polite"]').last();
    await expect(liveRegion).toHaveText("");

    await carousel.getByRole("button", { name: "Diapositiva siguiente" }).last().click();

    await expect(liveRegion).toHaveText("Diapositiva 2 de 4");
  });

  test("should keep the arrows focusable at the edges and mark them unavailable", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    const previous = carousel.getByRole("button", { name: "Diapositiva anterior" }).last();
    const next = carousel.getByRole("button", { name: "Diapositiva siguiente" }).last();
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await next.focus();

    for (let step = 0; step < 3; step += 1) await page.keyboard.press("Enter");

    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toBeFocused();
    await expect(previous).not.toHaveAttribute("aria-disabled");
    await expect(page.getByLabel("Índice asentado")).toHaveText("3");
  });

  test("should select a neighbouring slide when it is clicked", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    const second = carousel.locator('[data-slot="carousel-item"][aria-label^="Diapositiva"]').nth(1);
    await expect(second).toHaveAttribute("inert", "");
    const box = await second.boundingBox();
    const viewport = await carousel.locator('[data-slot="carousel-content"]').first().boundingBox();
    const visibleRight = Math.min(box!.x + box!.width, viewport!.x + viewport!.width);

    await page.mouse.click((box!.x + visibleRight) / 2, box!.y + box!.height / 2);

    await expect(page.getByLabel("Índice activo")).toHaveText("1");
    await expect(second).not.toHaveAttribute("inert");
    await expect.poll(() => activeSlideOffCentre(carousel)).toBeLessThan(1);
  });

  test("should jump to the edges with Home and End and keep the indicator focus in step", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    const first = carousel.getByRole("tab", { name: "Diapositiva 1 de 4" });
    await first.focus();

    await page.keyboard.press("End");

    await expect(carousel.getByRole("button", { name: "Diapositiva siguiente" }).last()).toHaveAttribute("aria-disabled", "true");
    await expect(carousel.getByRole("tab", { name: "Diapositiva 4 de 4" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(carousel.getByRole("tab", { name: "Diapositiva 3 de 4" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(carousel.getByRole("button", { name: "Diapositiva anterior" }).last()).toHaveAttribute("aria-disabled", "true");
    await expect(first).toBeFocused();
  });

  test("should move the focus to the slide area when the slide holding it turns inert", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    await carousel.getByRole("link", { name: "Tarjeta 1" }).focus();

    await page.keyboard.press("ArrowRight");

    await expect(carousel.getByRole("group", { name: "Diapositivas" }).first()).toBeFocused();
    await expect(page.getByLabel("Índice activo")).toHaveText("1");
  });

  test("should leave arrow keys to a text field inside a slide", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    const field = carousel.getByLabel("Nota 1");
    await field.fill("hola");

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");

    await expect(carousel.getByRole("tab", { name: "Diapositiva 1 de 4" })).toHaveAttribute("aria-selected", "true");
    await expect(field).toBeFocused();
  });

  test("should leave arrow, Home and End keys to a composite widget inside a slide", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    const nestedTab = carousel.getByRole("tab", { name: "Resumen 1" });
    await nestedTab.focus();

    await page.keyboard.press("End");
    await page.keyboard.press("ArrowRight");

    await expect(carousel.getByRole("tab", { name: "Diapositiva 1 de 4" })).toHaveAttribute("aria-selected", "true");
    await expect(nestedTab).toBeFocused();
  });

  test("should leave Home and End inside a nested carousel to that carousel", async ({ page }) => {
    await openCarouselPage(page);
    const inner = page.getByRole("region", { name: "Fotos" });
    const innerNext = inner.getByRole("button", { name: "Foto siguiente" });
    await expect(innerNext).not.toHaveAttribute("aria-disabled");
    await innerNext.focus();

    await page.keyboard.press("End");

    await expect(innerNext).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("region", { name: "Destacados" }).getByRole("tab", { name: "Diapositiva 1 de 4" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("should show a grab cursor on fine pointers while the track can be dragged", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.endsWith("-mobile"), "Phone projects emulate a touch screen without a cursor");
    await openCarouselPage(page);

    await expect(page.getByRole("region", { name: "Destacados" }).locator('[data-slot="carousel-content"]').first()).toHaveCSS("cursor", "grab");
  });

  test("should scroll to a controlled index and report when it settles", async ({ page }) => {
    await openCarouselPage(page);
    const gallery = page.getByRole("region", { name: "Galería controlada" });

    await page.getByRole("button", { name: "Mostrar la imagen 3" }).click();

    await expect(gallery.getByRole("tab", { name: "Diapositiva 3 de 4" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByLabel("Índice controlado asentado")).toHaveText("2");
    await expect.poll(() => activeSlideOffCentre(gallery)).toBeLessThan(1);
  });

  test("should finish a scroll when its slides resize mid-flight and re-measure once it rests", async ({ page }) => {
    await openCarouselPage(page);
    const gallery = page.getByRole("region", { name: "Galería controlada" });
    await expect(gallery.getByRole("tab", { name: "Diapositiva 1 de 4" })).toBeVisible();

    const positions = await gallery.evaluate(async (root, frames) => {
      const track = root.querySelector<HTMLElement>('[data-slot="carousel-content"] > div')!;
      const next = root.querySelector<HTMLButtonElement>('[data-slot="carousel-next"]')!;
      const resize = Array.from(document.querySelectorAll("button")).find((button) => button.textContent === "Cambiar el tamaño")!;
      next.click();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      resize.click();
      const samples: string[] = [];
      for (let frame = 0; frame < frames; frame += 1) {
        await new Promise(requestAnimationFrame);
        samples.push(track.style.transform);
      }
      return samples;
    }, SCROLL_FRAMES);

    // The scroll keeps moving after the resize instead of jumping to its end, as a re-initialization would.
    expect(new Set(positions.slice(0, SAMPLED_FRAMES)).size).toBeGreaterThan(2);
    await expect(page.getByLabel("Índice controlado asentado")).toHaveText("1");
    await expect.poll(() => activeSlideOffCentre(gallery)).toBeLessThan(1);
    await expect(gallery.getByRole("tab", { name: "Diapositiva 2 de 4" })).toHaveAttribute("aria-selected", "true");
  });

  test("should rotate on its own, drain the pill, and stop when paused", async ({ page }) => {
    await openCarouselPage(page);
    const rotation = page.getByRole("region", { name: "Rotación" });
    // Rotation pauses offscreen, so the carousel is brought into view first.
    await rotation.scrollIntoViewIfNeeded();
    const pause = rotation.getByRole("button", { name: "Pausar la rotación de diapositivas" });
    await expect(pause).toBeVisible();
    await page.mouse.move(0, 0);

    await expect(rotation.getByRole("tab", { name: "Aviso 2 de 3" })).toHaveAttribute("aria-selected", "true");
    await expect(rotation.locator('[aria-live="polite"]')).toHaveText("");
    await pause.click();
    await page.mouse.move(0, 0);

    const start = rotation.getByRole("button", { name: "Iniciar la rotación de diapositivas" });
    await expect(start).toBeVisible();
    const selectedAfterPause = await rotation.locator('[role="tab"][aria-selected="true"]').getAttribute("aria-label");
    await page.waitForTimeout(1500);
    await expect(rotation.locator('[role="tab"][aria-selected="true"]')).toHaveAttribute("aria-label", selectedAfterPause!);
    await expect(rotation.locator('[data-slot="carousel-indicator-drain"]')).toHaveCSS("transform", /matrix\(0, 0, 0, 1, 0, 0\)|none/);
  });

  test("should pause rotation while a mouse rests on the slides", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.endsWith("-mobile"), "Phone projects emulate a touch screen without hover");
    await openCarouselPage(page);
    const rotation = page.getByRole("region", { name: "Rotación" });
    // Rotation pauses offscreen, so the carousel is brought into view first.
    await rotation.scrollIntoViewIfNeeded();
    const viewport = rotation.locator('[data-slot="carousel-content"]');
    await viewport.hover();
    const selected = await rotation.locator('[role="tab"][aria-selected="true"]').getAttribute("aria-label");

    await page.waitForTimeout(1500);

    await expect(rotation.locator('[role="tab"][aria-selected="true"]')).toHaveAttribute("aria-label", selected!);
  });
});

test.describe("with reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("should move the selected disc without gliding", async ({ page }) => {
    await openCarouselPage(page);
    await page.getByRole("button", { name: /martes, 1 de septiembre/i }).click();
    const secondDay = page.getByRole("button", { name: /sábado, 5 de septiembre/i });
    const end = await offsetInMonth(page, secondDay);

    const samples = await clickAndSampleDisc(page, secondDay);

    expect(samples.every((offset) => Math.abs(offset - end) < 1)).toBe(true);
  });

  test("should jump between slides and keep the rotation control disabled in place", async ({ page }) => {
    await openCarouselPage(page);
    const carousel = page.getByRole("region", { name: "Destacados" });
    const rotation = page.getByRole("region", { name: "Rotación" });
    // Rotation pauses offscreen, so the carousel is brought into view first.
    await rotation.scrollIntoViewIfNeeded();
    await expect(rotation.getByRole("button", { name: "Iniciar la rotación de diapositivas" })).toBeDisabled();

    const positions = await carousel.getByRole("button", { name: "Diapositiva siguiente" }).last().evaluate(async (button, frames) => {
      const track = button.closest('[data-slot="carousel"]')!.querySelector<HTMLElement>('[data-slot="carousel-content"] > div')!;
      (button as HTMLButtonElement).click();
      const samples: number[] = [];
      for (let frame = 0; frame < frames; frame += 1) {
        await new Promise(requestAnimationFrame);
        samples.push(new DOMMatrixReadOnly(getComputedStyle(track).transform).m41);
      }
      return samples;
    }, SAMPLED_FRAMES);

    // The track lands on the next slide before the first frame and never moves again.
    expect(new Set(positions.map(Math.round)).size).toBe(1);
    await expect(page.getByLabel("Índice asentado")).toHaveText("1");
    await expect.poll(() => activeSlideOffCentre(carousel)).toBeLessThan(1);
    await expect(rotation.getByRole("tab", { name: "Aviso 1 de 3" })).toHaveAttribute("aria-selected", "true");
  });
});
