/** Exercises Arc's floating layers in real engines, where placement, Web Animations and media queries exist. */
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Time a layer gets to settle: headless CI engines can stall animation frames for seconds. */
const SETTLE_TIMEOUT_MS = 15_000;

/** Arc's tooltip open delay, minus a margin for timer and frame jitter. */
const TOOLTIP_MINIMUM_WAIT_MS = 180;

/** One animation frame of a floating layer. */
type LayerSample = { opacity: number; translateY: number; scale: number };

/**
 * Samples the first animation frames of the layer matching a selector, starting from the frame it mounts.
 * @param trigger - Element whose action opens the layer.
 * @param selector - Selector of the layer.
 * @param action - How the trigger opens the layer.
 * @returns One sample per frame, once the layer exists.
 */
async function openAndSample(trigger: Locator, selector: string, action: "click" | "focus"): Promise<LayerSample[]> {
  return trigger.evaluate(
    async (element, { layerSelector, openAction }) => {
      const samples: LayerSample[] = [];
      if (openAction === "click") (element as HTMLElement).click();
      else (element as HTMLElement).focus();
      for (let frameIndex = 0; frameIndex < 240 && samples.length < 4; frameIndex += 1) {
        await new Promise(requestAnimationFrame);
        const layer = document.querySelector(layerSelector);
        if (!layer) continue;
        const style = getComputedStyle(layer);
        const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
        samples.push({ opacity: Number(style.opacity), translateY: matrix.m42, scale: matrix.a });
      }
      return samples;
    },
    { layerSelector: selector, openAction: action },
  );
}

/** Asserts that playback left no residue on the layer. */
async function expectSettled(layer: Locator) {
  await expect(layer).toHaveCSS("opacity", "1", { timeout: SETTLE_TIMEOUT_MS });
  await expect(layer).toHaveCSS("transform", "none", { timeout: SETTLE_TIMEOUT_MS });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("should start the popover toward its trigger, settle in place and close from PopoverClose", async ({ page }) => {
  await page.goto("/arc-overlays.html");
  const trigger = page.getByRole("button", { name: "Ver filtros" });
  const samples = await openAndSample(trigger, "[data-slot=popover-content]", "click");
  expect(samples[0]!.opacity).toBeLessThan(1);
  // Placed below its trigger, the panel starts a few pixels up and scaled down.
  expect(samples[0]!.translateY).toBeLessThan(0);
  expect(samples[0]!.scale).toBeLessThan(1);
  const panel = page.getByRole("dialog", { name: "Filtros" });
  await expectSettled(panel);
  await expect(panel).toHaveCSS("border-top-left-radius", "26px");
  await page.getByRole("button", { name: "Listo" }).click();
  await expect(page.getByText("Filtros disponibles")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("should open the popover in place when motion is reduced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/arc-overlays.html");
  const samples = await openAndSample(
    page.getByRole("button", { name: "Ver filtros" }),
    "[data-slot=popover-content]",
    "click",
  );
  samples.forEach((sample) => {
    expect(sample.translateY).toBe(0);
    expect(sample.scale).toBe(1);
  });
  await expectSettled(page.getByRole("dialog", { name: "Filtros" }));
});

test("should wait before the first tooltip and open the next one at once, only fading", async ({ page }) => {
  await page.goto("/arc-overlays.html");
  const first = page.getByRole("button", { name: "Guardar" });
  const startedAt = Date.now();
  await first.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Guardá los cambios pendientes");
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(TOOLTIP_MINIMUM_WAIT_MS);
  await expectSettled(page.locator("[data-slot=tooltip-content]"));

  // Moving on to the next trigger within the skip window: the bubble mounts in place and only fades.
  const samplesPromise = page.evaluate(async () => {
    const samples: LayerSample[] = [];
    for (let frameIndex = 0; frameIndex < 600 && samples.length < 4; frameIndex += 1) {
      await new Promise(requestAnimationFrame);
      const bubble = [...document.querySelectorAll("[data-slot=tooltip-content]")].find(
        (element) => element.textContent === "Copiar enlace",
      );
      if (!bubble) continue;
      const style = getComputedStyle(bubble);
      const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
      samples.push({ opacity: Number(style.opacity), translateY: matrix.m42, scale: matrix.a });
    }
    return samples;
  });
  const next = await page.getByRole("button", { name: "Compartir" }).boundingBox();
  // Several pointer moves, as a real pointer makes: Radix keeps the first bubble open while a single jump lands inside
  // the grace area between the first trigger and its bubble.
  await page.mouse.move(next!.x + next!.width / 2, next!.y + next!.height / 2, { steps: 10 });
  await expect(page.getByRole("tooltip")).toHaveText("Copiar enlace");
  const samples = await samplesPromise;
  expect(samples[0]!.opacity).toBeLessThan(1);
  samples.forEach((sample) => {
    expect(sample.translateY).toBe(0);
    expect(sample.scale).toBe(1);
  });
  await expectSettled(page.locator("[data-slot=tooltip-content]", { hasText: "Copiar enlace" }));
});

test("should grow the hover card from its trigger on keyboard focus and settle", async ({ page }) => {
  await page.goto("/arc-overlays.html");
  const samples = await openAndSample(
    page.getByRole("link", { name: "Ana Pérez" }),
    "[data-slot=hover-card-content]",
    "focus",
  );
  expect(samples[0]!.opacity).toBeLessThan(1);
  expect(samples[0]!.scale).toBeLessThan(1);
  const card = page.locator("[data-slot=hover-card-content]");
  await expect(card.getByText("Diseñadora de producto, Pagos")).toBeVisible();
  await expectSettled(card);
  await page.keyboard.press("Escape");
  await expect(card).toHaveCount(0);
});
