/** Exercises Arc's Tabs and Pagination in real engines, where layout, scrolling and motion exist. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

import { recordMotion } from "./motion-recorder.js";

/** Time a panel gets to settle: headless CI engines can stall animation frames for seconds. */
const SETTLE_TIMEOUT_MS = 15_000;

/**
 * Reads the horizontal translation and height of a panel on the next animation frame.
 * @param panel - Panel to sample.
 * @returns Its painted x offset and height in CSS pixels.
 */
async function samplePanel(panel: Locator): Promise<{ x: number; height: number }> {
  return panel.evaluate(
    (element) =>
      new Promise<{ x: number; height: number }>((resolve) => {
        requestAnimationFrame(() => {
          resolve({
            x: new DOMMatrix(getComputedStyle(element).transform).m41,
            height: element.getBoundingClientRect().height,
          });
        });
      }),
  );
}

/** One painted frame of the panel exposed to assistive technology. */
type PanelFrame = { text: string; x: number; height: number };

/**
 * Starts sampling, on every animation frame, the visible panel of the panel tabs. Sampling inside the page catches the
 * whole entrance even when the round trips of the test runner take longer than the spring itself.
 * @param page - Page that holds the tabs; a previous recording is discarded.
 */
async function recordPanelFrames(page: Page): Promise<void> {
  await page.evaluate(() => {
    const recorder = window as unknown as { __panelFrames?: PanelFrame[]; __panelFrameId?: number };
    if (recorder.__panelFrameId !== undefined) cancelAnimationFrame(recorder.__panelFrameId);
    const frames: PanelFrame[] = [];
    recorder.__panelFrames = frames;
    const sample = () => {
      const panel = document.querySelector<HTMLElement>(
        '[data-testid="panel-tabs"] [role="tabpanel"]:not([aria-hidden="true"])',
      );
      if (panel)
        frames.push({
          text: panel.textContent ?? "",
          x: new DOMMatrix(getComputedStyle(panel).transform).m41,
          height: panel.getBoundingClientRect().height,
        });
      recorder.__panelFrameId = requestAnimationFrame(sample);
    };
    recorder.__panelFrameId = requestAnimationFrame(sample);
  });
}

/**
 * Returns the frames recorded since the last call to `recordPanelFrames`.
 * @param page - Page that holds the tabs.
 * @returns The sampled frames, oldest first.
 */
async function readPanelFrames(page: Page): Promise<PanelFrame[]> {
  return page.evaluate(() => [...((window as unknown as { __panelFrames?: PanelFrame[] }).__panelFrames ?? [])]);
}

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("should slide the panel in from the side of the chosen tab and morph its height", async ({ page }) => {
    await page.goto("/arc-navigation.html");
    const tabs = page.getByTestId("panel-tabs");
    const initialHeight = (await tabs.getByRole("tabpanel").boundingBox())!.height;
    await recordPanelFrames(page);

    await tabs.getByRole("tab", { name: "Actividad" }).click();
    await expect(tabs.getByRole("tabpanel")).toHaveText("Actividad reciente de la tribu.");
    // Waits until the entrance has settled, both the slide and the height, before judging the recorded frames.
    await expect
      .poll(
        async () => {
          const last = (await readPanelFrames(page)).at(-1);
          return last?.text.startsWith("Actividad") === true && last.x === 0 && last.height >= 239;
        },
        { timeout: SETTLE_TIMEOUT_MS },
      )
      .toBe(true);
    const forward = (await readPanelFrames(page)).filter((frame) => frame.text.startsWith("Actividad"));
    // The panel enters from the right of the previous one and grows from its height, never jumping to the end:
    // its first painted frame still has the previous panel's height.
    expect(forward[0]!.height).toBeLessThanOrEqual(initialHeight + 1);
    expect(Math.max(...forward.map((frame) => frame.x))).toBeGreaterThan(0);
    expect(Math.min(...forward.map((frame) => frame.height))).toBeGreaterThanOrEqual(initialHeight - 1);
    expect(
      forward.some((frame) => frame.height > initialHeight + 1 && frame.height < 239),
    ).toBe(true);

    await recordPanelFrames(page);
    await tabs.getByRole("tab", { name: "Resumen" }).click();
    await expect(tabs.getByRole("tabpanel")).toHaveText("Resumen breve.");
    await expect
      .poll(async () => (await samplePanel(tabs.getByRole("tabpanel"))).x, { timeout: SETTLE_TIMEOUT_MS })
      .toBe(0);
    const backward = (await readPanelFrames(page)).filter((frame) => frame.text.startsWith("Resumen"));
    expect(Math.min(...backward.map((frame) => frame.x))).toBeLessThan(0);
  });

  test("should glide the tab highlight and hand it back to the active tab", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/arc-navigation.html");
    const tabs = page.getByTestId("panel-tabs");
    const members = tabs.getByRole("tab", { name: "Miembros" });
    const activeBackground = await tabs
      .getByRole("tab", { name: "Resumen" })
      .evaluate((tab) => getComputedStyle(tab).backgroundColor);

    await members.click();
    await expect.poll(motion.glides).toContain("tabs-list");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0, { timeout: SETTLE_TIMEOUT_MS });
    await expect(members).toHaveCSS("background-color", activeBackground);
  });

  test("should glide the current page mark and move it with the arrows", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/arc-navigation.html");
    const navigation = page.getByRole("navigation", { name: "Paginación" });

    await navigation.getByRole("link", { name: "Ir a la página siguiente" }).click();
    await expect(navigation.getByRole("link", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(navigation.getByRole("link", { name: "1", exact: true })).not.toHaveAttribute("aria-current");
    await expect.poll(motion.glides).toContain("pagination-content");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0, { timeout: SETTLE_TIMEOUT_MS });

    await navigation.getByRole("link", { name: "4", exact: true }).click();
    await expect(navigation.getByRole("link", { name: "4", exact: true })).toHaveAttribute("aria-current", "page");
    expect(page.url()).not.toContain("#pagina-4");
  });
});

test("should scroll an overflowing tab list to keep the active tab in view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/arc-navigation.html");
  const list = page.getByRole("tablist", { name: "Secciones largas" });
  await expect.poll(() => list.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

  await list.getByRole("tab", { name: "Sección 1", exact: true }).click();
  await page.keyboard.press("End");
  const last = list.getByRole("tab", { name: "Sección 12" });
  await expect(last).toHaveAttribute("aria-selected", "true");
  await expect
    .poll(
      async () => {
        const [listBox, tabBox] = await Promise.all([list.boundingBox(), last.boundingBox()]);
        return tabBox!.x + tabBox!.width <= listBox!.x + listBox!.width + 1;
      },
      { timeout: SETTLE_TIMEOUT_MS },
    )
    .toBe(true);
  // The page itself never scrolls sideways to reveal the tab.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("should switch panels and pages without sliding or gliding when motion is reduced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await recordMotion(page);
  await page.goto("/arc-navigation.html");
  const tabs = page.getByTestId("panel-tabs");

  await tabs.getByRole("tab", { name: "Actividad" }).click();
  expect((await samplePanel(tabs.getByRole("tabpanel"))).x).toBe(0);
  await expect(tabs.getByRole("tabpanel")).toHaveText("Actividad reciente de la tribu.");

  await page.getByRole("link", { name: "3", exact: true }).click();
  await expect(page.getByRole("link", { name: "3", exact: true })).toHaveAttribute("aria-current", "page");
  expect(await motion.glides()).toEqual([]);
});
