/** Exercises Arc's EmptyState, MetricCard, UsageMeter, Timeline and Stepper in real engines, where layout, observers and springs exist. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Time springs get to settle: headless CI engines can stall animation frames for seconds. */
const SETTLE_TIMEOUT_MS = 15_000;
/** Frames sampled after a change; enough to catch a spring in flight. */
const SAMPLED_FRAMES = 12;
/** Pixels of tolerance when comparing rendered sizes with their targets. */
const SIZE_TOLERANCE_PX = 2;
/** Frames a reduced-motion change may take to reach the screen, far fewer than a spring needs. */
const REDUCED_MOTION_FRAMES = 4;
/** Gap, in pixels, a segment stops short of the next one. */
const SEGMENT_GAP_PX = 2;

/**
 * Opens the fixture page with the given motion preference.
 * @param page - Page to load.
 * @param reducedMotion - Motion preference to emulate.
 */
async function openPage(page: Page, reducedMotion: "reduce" | "no-preference" = "no-preference"): Promise<void> {
  await page.emulateMedia({ reducedMotion });
  await page.goto("/arc-admissions.html");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/**
 * Rendered widths of the meter's segments and of its track.
 * @param meter - The usage meter group.
 * @returns Segment widths in order and the track width.
 */
async function segmentWidths(meter: Locator): Promise<{ segments: number[]; track: number }> {
  return meter.evaluate((root) => ({
    segments: Array.from(root.querySelectorAll<HTMLElement>('[data-slot="usage-meter-segment"]')).map((segment) => segment.getBoundingClientRect().width),
    track: root.querySelector<HTMLElement>('[data-slot="usage-meter-track"]')!.clientWidth,
  }));
}

/**
 * Reads the digits an odometer currently shows: the glyph of each wheel that sits fully in its window.
 * @param container - Element holding the odometer.
 * @returns The visible number, separators included.
 */
async function visibleOdometerText(container: Locator): Promise<string> {
  return container.evaluate((root) => {
    const odometer = root.querySelector<HTMLElement>('[data-slot="odometer"]')!;
    return Array.from(odometer.children)
      .map((part) => {
        const glyphs = Array.from(part.children).filter((child) => !child.classList.contains("invisible"));
        if (glyphs.length === 0) return part.textContent ?? "";
        const shown = glyphs.find((glyph) => Number(getComputedStyle(glyph).opacity) > 0.99 && getComputedStyle(glyph).visibility === "visible");
        return shown?.textContent ?? "?";
      })
      .join("");
  });
}

/**
 * Samples an element's height on the following animation frames.
 * @param target - Element to measure.
 * @param frames - Number of frames to sample.
 * @returns Heights per frame.
 */
async function sampleHeights(target: Locator, frames: number): Promise<number[]> {
  return target.evaluate(async (element, count) => {
    const heights: number[] = [];
    for (let frame = 0; frame < count; frame += 1) {
      await new Promise(requestAnimationFrame);
      heights.push(element.getBoundingClientRect().height);
    }
    return heights;
  }, frames);
}

test("should grow the segments to their share of the limit once the meter is seen", async ({ page }) => {
  await openPage(page);
  const meter = page.getByRole("group", { name: "Envíos de hoy", exact: true });
  await meter.scrollIntoViewIfNeeded();

  await expect
    .poll(async () => {
      const { segments, track } = await segmentWidths(meter);
      return Math.abs(segments[0]! - (120 / 200) * track + SEGMENT_GAP_PX) <= SIZE_TOLERANCE_PX && Math.abs(segments[1]! - (40 / 200) * track + SEGMENT_GAP_PX) <= SIZE_TOLERANCE_PX;
    }, { timeout: SETTLE_TIMEOUT_MS })
    .toBe(true);
  await expect(meter).toHaveAttribute("data-status", "ok");
  await expect(meter.locator('[data-slot="usage-meter-limit"]')).toHaveCSS("opacity", "0");
});

test("should strike the overage through and show the limit marker once usage passes the limit", async ({ page }) => {
  await openPage(page);
  const meter = page.getByRole("group", { name: "Envíos de hoy", exact: true });
  await meter.scrollIntoViewIfNeeded();

  await page.getByRole("button", { name: "Superar el límite" }).click();

  await expect(meter).toHaveAttribute("data-status", "over");
  await expect(meter.locator('[data-slot="usage-meter-status"]')).toContainText("40 de más");
  await expect(meter.locator('[data-slot="usage-meter-limit"]')).toHaveCSS("opacity", "1", { timeout: SETTLE_TIMEOUT_MS });
  await expect(meter.getByRole("button", { name: "Excedente, 40" })).toBeVisible();
  await expect
    .poll(async () => {
      const { segments, track } = await segmentWidths(meter);
      return Math.abs(segments.reduce((sum, width) => sum + width, 0) + SEGMENT_GAP_PX - track) <= SIZE_TOLERANCE_PX * 2;
    }, { timeout: SETTLE_TIMEOUT_MS })
    .toBe(true);

  await page.getByRole("button", { name: "Bajar el uso" }).click();
  await expect(meter).toHaveAttribute("data-status", "ok");
  await expect(meter.locator('[data-slot="usage-meter-limit"]')).toHaveCSS("opacity", "0", { timeout: SETTLE_TIMEOUT_MS });
});

test("should jump the meter straight to its values with reduced motion", async ({ page }) => {
  await openPage(page, "reduce");
  const meter = page.getByRole("group", { name: "Envíos de hoy", exact: true });

  await expect
    .poll(async () => {
      const { segments, track } = await segmentWidths(meter);
      return Math.abs(segments[0]! - (120 / 200) * track + SEGMENT_GAP_PX) <= SIZE_TOLERANCE_PX;
    })
    .toBe(true);
  await page.getByRole("button", { name: "Superar el límite" }).click();
  await expect(meter).toHaveAttribute("data-status", "over");
  // No spring runs: a few frames later (a spring needs about 25) the bar already shows the new share.
  const widths = await meter.evaluate(async (root, frames) => {
    for (let frame = 0; frame < frames; frame += 1) await new Promise(requestAnimationFrame);
    return {
      first: root.querySelector<HTMLElement>('[data-slot="usage-meter-segment"]')!.getBoundingClientRect().width,
      track: root.querySelector<HTMLElement>('[data-slot="usage-meter-track"]')!.clientWidth,
    };
  }, REDUCED_MOTION_FRAMES);
  expect(Math.abs(widths.first - (200 / 240) * widths.track + SEGMENT_GAP_PX)).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
});

test("should highlight a legend category on keyboard focus and dim the rest", async ({ page }) => {
  await openPage(page);
  const legend = page.getByRole("group", { name: "Envíos de hoy por categoría" });
  const codes = legend.getByRole("button", { name: "Códigos, 120" });

  await codes.focus();
  await page.keyboard.press("ArrowRight");

  const notices = legend.getByRole("button", { name: "Avisos, 40" });
  await expect(notices).toBeFocused();
  await expect(notices).toHaveAttribute("data-highlight", "on");
  await expect(codes).toHaveAttribute("data-highlight", "off");
  await expect(page.locator('[data-slot="usage-meter-caption"]')).toContainText("en Avisos · 20 % del plan");
});

test("should roll the metric digits to the new value", async ({ page }) => {
  await openPage(page);
  const value = page.locator('[data-slot="metric-card-value"]');
  await value.scrollIntoViewIfNeeded();
  await expect.poll(() => visibleOdometerText(value), { timeout: SETTLE_TIMEOUT_MS }).toBe("128");

  await page.getByRole("button", { name: "Actualizar métrica" }).click();

  await expect.poll(() => visibleOdometerText(value), { timeout: SETTLE_TIMEOUT_MS }).toBe("1.543");
  await expect(value).toContainText("1.543");
  await expect(page.locator('[data-slot="metric-card-change"]')).toHaveAttribute("data-trend", "up");
});

test("should spring the empty state to the height of longer copy without overflowing", async ({ page }) => {
  await openPage(page);
  const copy = page.getByRole("region", { name: "Bandeja vacía" }).locator('[data-slot="empty-state-copy"]');
  await copy.scrollIntoViewIfNeeded();
  const initialHeight = (await copy.boundingBox())!.height;

  await page.getByRole("button", { name: "Alternar filtros" }).click();
  const heights = await sampleHeights(copy, SAMPLED_FRAMES);

  await expect(page.getByRole("heading", { name: "Sin coincidencias" })).toBeVisible();
  await expect.poll(async () => (await copy.boundingBox())!.height, { timeout: SETTLE_TIMEOUT_MS }).toBeGreaterThan(initialHeight);
  const finalHeight = await copy.evaluate((element) => element.firstElementChild!.getBoundingClientRect().height);
  await expect.poll(async () => Math.abs((await copy.boundingBox())!.height - finalHeight), { timeout: SETTLE_TIMEOUT_MS }).toBeLessThanOrEqual(1);
  // Some frame sits between the two heights: the block springs instead of jumping.
  expect(heights.some((height) => height > initialHeight + 1 && height < finalHeight - 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("should show step labels on wide screens and fold into a caption on narrow ones", async ({ page }) => {
  await openPage(page);
  const stepper = page.getByRole("navigation", { name: "Importación CSV" });
  const caption = stepper.locator('[data-slot="stepper-caption"]');
  const stepperWidth = (await stepper.boundingBox())!.width;
  const labelText = stepper.locator('[data-slot="stepper-text"]').first();

  if (stepperWidth > 480) {
    await expect(caption).toBeHidden();
    expect((await labelText.boundingBox())!.width).toBeGreaterThan(SIZE_TOLERANCE_PX);
  } else {
    await expect(caption).toBeVisible();
    await expect(caption).toContainText("Revisar filas");
    expect((await labelText.boundingBox())!.width).toBeLessThanOrEqual(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("should fill the connector, move the ring and let people go back to a completed step", async ({ page }) => {
  await openPage(page);
  const stepper = page.getByRole("navigation", { name: "Importación CSV" });
  const steps = stepper.getByRole("listitem");

  await page.getByRole("button", { name: "Avanzar paso" }).click();

  await expect(steps.nth(2)).toHaveAttribute("data-status", "current");
  await expect(steps.nth(1)).toHaveAttribute("data-status", "complete");
  const fill = steps.nth(1).locator('[data-slot="stepper-connector"] > span');
  await expect
    .poll(() => fill.evaluate((element) => element.getBoundingClientRect().width / element.parentElement!.getBoundingClientRect().width), { timeout: SETTLE_TIMEOUT_MS })
    .toBeGreaterThan(0.99);
  await expect(page.getByText("Paso 3 de 3: Activar acceso")).toBeAttached();

  await stepper.getByRole("button", { name: /Subir archivo/ }).click();
  await expect(steps.nth(0)).toHaveAttribute("data-status", "current");
  await expect(stepper.getByRole("button", { name: /Subir archivo/ })).toHaveAttribute("aria-current", "step");
});

test("should reveal the markers in view, feather the bottom edge and keep the day label pinned", async ({ page }) => {
  await openPage(page);
  const feed = page.getByRole("region", { name: "Historial de la solicitud" });
  const scroller = feed.locator('[data-slot="timeline-scroller"]');
  await feed.scrollIntoViewIfNeeded();

  await expect(feed.locator('[data-slot="timeline-marker"]').first()).toHaveCSS("opacity", "1", { timeout: SETTLE_TIMEOUT_MS });
  await expect(scroller).toHaveAttribute("data-more", "");
  await scroller.evaluate((element) => element.scrollTo({ top: 60 }));
  const pinned = feed.getByRole("heading", { level: 3 }).first();
  await expect.poll(async () => Math.abs((await pinned.boundingBox())!.y - (await scroller.boundingBox())!.y)).toBeLessThanOrEqual(1);

  await scroller.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await expect(scroller).not.toHaveAttribute("data-more", "");
});

test("should expand a row in place on a spring and slide new updates in at the top", async ({ page }) => {
  await openPage(page);
  const feed = page.getByRole("region", { name: "Historial de la solicitud" });
  const trigger = feed.getByRole("button", { name: /aprobó la solicitud/ });
  await feed.scrollIntoViewIfNeeded();

  await trigger.click();

  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const detail = feed.locator('[data-slot="timeline-detail"]');
  await expect(detail).toContainText("Se asignó un lugar en la cohorte.");
  await expect.poll(async () => (await detail.boundingBox())!.height, { timeout: SETTLE_TIMEOUT_MS }).toBeGreaterThan(10);

  await page.getByRole("button", { name: "Agregar actualización" }).click();
  await expect(feed.getByRole("status")).toHaveText("Nueva actualización: Lucía agregó una nota interna");
  await expect(feed.locator('[data-slot="timeline-title"]').first()).toHaveText("Lucía agregó una nota interna");
});

test("should repaint the displays from the dark theme tokens", async ({ page }) => {
  await openPage(page);
  const track = page.locator('[data-slot="usage-meter-track"]');
  const card = page.locator('[data-slot="metric-card"]');
  const lightTrack = await track.evaluate((element) => getComputedStyle(element).backgroundColor);
  const lightCard = await card.evaluate((element) => getComputedStyle(element).backgroundColor);

  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.add("dark");
  });

  await expect.poll(() => track.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightTrack);
  await expect.poll(() => card.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightCard);
});
