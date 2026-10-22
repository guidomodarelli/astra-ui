/** Exercises Arc's floating layers in real engines, where placement, Web Animations and media queries exist. */
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Time a layer gets to settle: headless CI engines can stall animation frames for seconds. */
const SETTLE_TIMEOUT_MS = 15_000;

/** Arc's tooltip open delay, minus a margin for timer and frame jitter. */
const TOOLTIP_MINIMUM_WAIT_MS = 180;

/** Distance the hover card keeps from the viewport edges. */
const COLLISION_PADDING_PX = 12;

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
  const panel = page.getByRole("dialog", { name: "Filtros" });
  await expectSettled(panel);
  // The fade gives the panel's inline styles back once it settles.
  await expect
    .poll(() => panel.evaluate((element) => [element.style.transform, element.style.opacity]))
    .toEqual(["", ""]);
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

test("should align the popover with the start of its trigger", async ({ page }) => {
  await page.goto("/arc-overlays.html");
  const trigger = page.getByRole("button", { name: "Ver filtros" });
  const triggerBounds = (await trigger.boundingBox())!;
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Filtros" });
  await expectSettled(panel);
  const panelBounds = (await panel.boundingBox())!;
  expect(Math.abs(panelBounds.x - triggerBounds.x)).toBeLessThanOrEqual(1);
  expect(panelBounds.y).toBeGreaterThanOrEqual(triggerBounds.y + triggerBounds.height);
});

/**
 * Scrolls an element by a fixed distance and reports its scroll metrics.
 * @param element - Element expected to scroll.
 * @returns Its scroll and client heights and the scroll offset before and after the scroll.
 */
async function scrollAndMeasure(element: Locator) {
  return element.evaluate((node) => {
    const before = node.scrollTop;
    node.scrollTop += 80;
    return { scrollHeight: node.scrollHeight, clientHeight: node.clientHeight, before, after: node.scrollTop };
  });
}

test("should let a child marked data-popover-shrink fit the panel and scroll its own list", async ({ page }) => {
  await page.goto("/arc-overlays.html");
  await page.getByRole("button", { name: "Ver avisos" }).click();
  const panel = page.getByRole("dialog", { name: "Avisos" });
  await expectSettled(panel);
  const list = page.getByTestId("inbox-list");
  const panelBounds = (await panel.boundingBox())!;
  const childBounds = (await panel.locator("[data-popover-shrink]").boundingBox())!;
  // The child shrinks to the panel instead of keeping its content height.
  expect(childBounds.height).toBeLessThanOrEqual(panelBounds.height);
  const metrics = await scrollAndMeasure(list);
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.after).toBeGreaterThan(metrics.before);
  // The fixed header stays in view while the list scrolls.
  await expect(panel.getByRole("heading", { name: "Avisos recientes" })).toBeInViewport();
});

test("should scroll the whole panel when its children have no scroll of their own", async ({ page }) => {
  await page.goto("/arc-overlays.html");
  await page.getByRole("button", { name: "Ver ayuda" }).click();
  const panel = page.getByRole("dialog", { name: "Ayuda" });
  await expectSettled(panel);
  // Children that clip their overflow keep their content height instead of being squashed.
  const firstEntry = panel.getByText("Aviso 1", { exact: true });
  const entryHeights = await firstEntry.evaluate((node) => ({ client: node.clientHeight, scroll: node.scrollHeight }));
  expect(entryHeights.client).toBe(entryHeights.scroll);
  const metrics = await scrollAndMeasure(panel);
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  expect(metrics.after).toBeGreaterThan(metrics.before);
});

test("should open the hover card below its trigger, aligned with its start", async ({ page }) => {
  await page.goto("/arc-overlays.html");
  const trigger = page.getByRole("link", { name: "Ana Pérez" });
  const triggerBounds = (await trigger.boundingBox())!;
  await trigger.focus();
  const card = page.locator("[data-slot=hover-card-content]");
  await expectSettled(card);
  const cardBounds = (await card.boundingBox())!;
  const viewportWidth = page.viewportSize()!.width;
  expect(cardBounds.y).toBeGreaterThanOrEqual(triggerBounds.y + triggerBounds.height);
  // Collision handling may shift a card that would overflow a narrow viewport.
  if (triggerBounds.x + cardBounds.width <= viewportWidth - COLLISION_PADDING_PX) {
    expect(Math.abs(cardBounds.x - triggerBounds.x)).toBeLessThanOrEqual(1);
  }
  expect(cardBounds.x + cardBounds.width).toBeLessThanOrEqual(viewportWidth);
});

test("should place a tooltip on the requested side", async ({ page }) => {
  await page.goto("/arc-overlays.html");
  const trigger = page.getByRole("button", { name: "Historial" });
  const triggerBounds = (await trigger.boundingBox())!;
  await trigger.focus();
  const bubble = page.locator("[data-slot=tooltip-content]", { hasText: "Abre el historial" });
  await expectSettled(bubble);
  const side = await bubble.getAttribute("data-side");
  const bubbleBounds = (await bubble.boundingBox())!;
  // Radix flips the bubble when the requested side has no room, as on narrow phones.
  if (side === "right") expect(bubbleBounds.x).toBeGreaterThanOrEqual(triggerBounds.x + triggerBounds.width);
  else expect(side).toBe("left");
});

test.describe("with reduced motion", () => {
  /** Lead the frozen clock is paused at; it never reaches it, so no timer or animation frame runs past this point. */
  const FROZEN_CLOCK_LEAD_MS = 1000;

  /**
   * Opens a layer, waits for it to settle and freezes the page clock, so a layer that still faded out on close would
   * stay mounted for the rest of the test.
   * @param layer - Layer to wait for.
   * @param open - How the layer opens.
   */
  async function openAndFreeze(layer: Locator, open: () => Promise<void>) {
    const page = layer.page();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install();
    await page.goto("/arc-overlays.html");
    await open();
    await expectSettled(layer);
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + FROZEN_CLOCK_LEAD_MS);
  }

  test("should unmount the popover at once on Escape", async ({ page }) => {
    const panel = page.locator("[data-slot=popover-content]");
    await openAndFreeze(panel, () => page.getByRole("button", { name: "Ver filtros" }).click());
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
  });

  test("should unmount the tooltip at once on Escape", async ({ page }) => {
    const bubble = page.locator("[data-slot=tooltip-content]");
    await openAndFreeze(bubble, () => page.getByRole("button", { name: "Guardar" }).focus());
    await page.keyboard.press("Escape");
    await expect(bubble).toHaveCount(0);
  });

  test("should unmount the hover card at once on Escape", async ({ page }) => {
    const card = page.locator("[data-slot=hover-card-content]");
    await openAndFreeze(card, () => page.getByRole("link", { name: "Ana Pérez" }).focus());
    await page.keyboard.press("Escape");
    await expect(card).toHaveCount(0);
  });
});
