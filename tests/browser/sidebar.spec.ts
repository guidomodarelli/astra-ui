/** Verifies the animated sidebar layout and motion that jsdom cannot reproduce. */
import { expect, test, type Page } from "@playwright/test";

import { waitForSettledLayout } from "./motion-recorder.js";

/** Desktop rail width in pixels: `16rem` expanded and `4.25rem` collapsed at a 16px root size. */
const EXPANDED_WIDTH_PX = 256;
const COLLAPSED_WIDTH_PX = 68;
/** Mobile sheet width in pixels: `18rem`, declared by the provider although the sheet is portaled. */
const MOBILE_SHEET_WIDTH_PX = 288;

/** How long the rail is sampled after a toggle: the morph plus room for a slow first frame. */
const RAIL_SAMPLING_WINDOW_MS = 1500;
/** Sub-pixel rounding allowed when comparing painted widths and edges. */
const LAYOUT_TOLERANCE_PX = 0.5;
/**
 * Bounds of the morph duration, from its first moving frame to the first frame at the target width. Arc's smooth
 * spring (`visualDuration` 0.4 s, no bounce) reaches the target within half a pixel in about 0.7 s; the bounds leave room for frame timing in
 * each engine while rejecting an instant jump and the slower drawer tween.
 */
const RAIL_MORPH_MIN_DURATION_MS = 250;
const RAIL_MORPH_MAX_DURATION_MS = 900;
/** Fewest in-between frames a real morph paints; a jump paints none. */
const RAIL_MORPH_MIN_INTERMEDIATE_FRAMES = 5;
/**
 * Fastest the rail width may change between two painted frames, in pixels per millisecond: about three times the
 * spring's peak speed of roughly 1 px/ms, measured against the time between frames so a late frame or WebKit's
 * uneven frame timestamps are not mistaken for a jump, while a snap across the rail in one frame still is.
 */
const RAIL_MAX_SPEED_PX_PER_MS = 3;
/** Width the rail crosses halfway through a morph, where an interrupted toggle reverses it. */
const RAIL_MIDPOINT_WIDTH_PX = (EXPANDED_WIDTH_PX + COLLAPSED_WIDTH_PX) / 2;

const SIDEBAR_TOGGLE_NAME = "Alternar navegación";

/** Horizontal edges of an element in one painted frame. */
type HorizontalBox = { left: number; right: number; width: number };

/** Layout of the desktop rail and what it holds or pushes, captured on one painted frame. */
type RailFrame = {
  /** Frame timestamp, in milliseconds. */
  time: number;
  rail: HorizontalBox;
  panel: HorizontalBox;
  inset: HorizontalBox;
  menuIcon: HorizontalBox;
  brandIcon: HorizontalBox;
};

/**
 * Samples the desktop rail on every painted frame, starting at once so a toggle fired right after the call is seen
 * from its first frame.
 * @param page - Page that renders the sidebar fixture.
 * @param reverseBelowWidthPx - When set, toggles the rail again on the first frame its width drops below this value,
 * interrupting a collapse halfway through.
 * @returns One frame per animation frame during the sampling window.
 */
function sampleRailFrames(page: Page, reverseBelowWidthPx?: number): Promise<RailFrame[]> {
  return page.evaluate(
    ({ durationMs, reverseBelowWidthPx, toggleName }) =>
      new Promise<RailFrame[]>((resolve) => {
        const measure = (selector: string) => {
          const { left, right, width } = document.querySelector(selector)!.getBoundingClientRect();
          return { left, right, width };
        };
        const toggle = [...document.querySelectorAll("button")].find(
          (button) => button.getAttribute("aria-label") === toggleName,
        )!;
        const frames: RailFrame[] = [];
        let hasReversed = false;
        let start: number | null = null;
        const tick = (time: number) => {
          start ??= time;
          const frame = {
            time,
            rail: measure('[data-slot="sidebar"]'),
            panel: measure('[data-slot="sidebar-inner"]'),
            inset: measure('[data-slot="sidebar-inset"]'),
            menuIcon: measure('[data-slot="sidebar-menu-button"] > span[aria-hidden="true"]'),
            brandIcon: measure('[data-slot="sidebar-brand-icon"]'),
          };
          frames.push(frame);
          if (reverseBelowWidthPx !== undefined && !hasReversed && frame.rail.width < reverseBelowWidthPx) {
            hasReversed = true;
            toggle.click();
          }
          if (time - start < durationMs) requestAnimationFrame(tick);
          else resolve(frames);
        };
        requestAnimationFrame(tick);
      }),
    { durationMs: RAIL_SAMPLING_WINDOW_MS, reverseBelowWidthPx, toggleName: SIDEBAR_TOGGLE_NAME },
  );
}

/**
 * Asserts that, on every frame, the rail holds its visible content: the panel fills the rail, the inset never slides
 * under it, and the icons stay inside it.
 * @param frames - Sampled rail frames.
 */
function expectUnclippedRail(frames: RailFrame[]) {
  for (const { rail, panel, inset, menuIcon, brandIcon } of frames) {
    expect(Math.abs(panel.width - rail.width)).toBeLessThanOrEqual(LAYOUT_TOLERANCE_PX);
    expect(inset.left).toBeGreaterThanOrEqual(rail.right - LAYOUT_TOLERANCE_PX);
    for (const icon of [menuIcon, brandIcon]) {
      expect(icon.left).toBeGreaterThanOrEqual(rail.left - LAYOUT_TOLERANCE_PX);
      expect(icon.right).toBeLessThanOrEqual(rail.right + LAYOUT_TOLERANCE_PX);
    }
  }
}

/**
 * Asserts that the rail width never jumps between two painted frames.
 * @param frames - Sampled rail frames.
 */
function expectContinuousRail(frames: RailFrame[]) {
  for (let index = 1; index < frames.length; index++) {
    const step = Math.abs(frames[index].rail.width - frames[index - 1].rail.width);
    const elapsedMs = frames[index].time - frames[index - 1].time;
    expect(step).toBeLessThanOrEqual(RAIL_MAX_SPEED_PX_PER_MS * elapsedMs + LAYOUT_TOLERANCE_PX);
  }
}

/**
 * Asserts that the rail morphs from one width to the other along a single direction, without overshoot, at the pace
 * of Arc's smooth spring.
 * @param frames - Sampled rail frames.
 * @param fromWidthPx - Width before the toggle.
 * @param toWidthPx - Width the rail settles at.
 */
function expectSpringMorph(frames: RailFrame[], fromWidthPx: number, toWidthPx: number) {
  const widths = frames.map((frame) => frame.rail.width);
  const direction = Math.sign(toWidthPx - fromWidthPx);
  for (const width of widths) {
    expect(width).toBeGreaterThanOrEqual(COLLAPSED_WIDTH_PX - LAYOUT_TOLERANCE_PX);
    expect(width).toBeLessThanOrEqual(EXPANDED_WIDTH_PX + LAYOUT_TOLERANCE_PX);
  }
  for (let index = 1; index < widths.length; index++) {
    expect((widths[index] - widths[index - 1]) * direction).toBeGreaterThanOrEqual(-LAYOUT_TOLERANCE_PX);
  }
  expectContinuousRail(frames);
  const isAt = (width: number, target: number) => Math.abs(width - target) <= LAYOUT_TOLERANCE_PX;
  const firstMovingIndex = widths.findIndex((width) => !isAt(width, fromWidthPx));
  const settledIndex = widths.findIndex((width) => isAt(width, toWidthPx));
  expect(firstMovingIndex).toBeGreaterThan(0);
  expect(settledIndex).toBeGreaterThan(firstMovingIndex);
  expect(widths.slice(settledIndex).every((width) => isAt(width, toWidthPx))).toBe(true);
  expect(settledIndex - firstMovingIndex).toBeGreaterThanOrEqual(RAIL_MORPH_MIN_INTERMEDIATE_FRAMES);
  const durationMs = frames[settledIndex].time - frames[firstMovingIndex - 1].time;
  expect(durationMs).toBeGreaterThanOrEqual(RAIL_MORPH_MIN_DURATION_MS);
  expect(durationMs).toBeLessThanOrEqual(RAIL_MORPH_MAX_DURATION_MS);
}

/**
 * Opens the sidebar fixture and waits until the expanded rail and its fonts have settled.
 * @param page - Page to load the fixture in.
 */
async function openSettledSidebar(page: Page) {
  await page.goto("/sidebar.html");
  const sidebar = page.getByRole("complementary", { name: "Navegación principal" });
  await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(EXPANDED_WIDTH_PX);
  await waitForSettledLayout(sidebar);
  return sidebar;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("should ignore keydown events without a key while preserving native Control and Meta shortcuts", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.name));
  await page.goto("/sidebar.html");
  const trigger = page.getByRole("button", { name: "Alternar navegación" });
  await expect(trigger).toBeVisible();
  const originalExpanded = await trigger.getAttribute("aria-expanded");
  await page.keyboard.press("Control+b");
  await expect(trigger).toHaveAttribute("aria-expanded", originalExpanded === "true" ? "false" : "true");
  await page.keyboard.press("Meta+Shift+B");
  await expect(trigger).toHaveAttribute("aria-expanded", originalExpanded!);
  await page.evaluate(() => { window.dispatchEvent(new Event("keydown")); });
  expect(pageErrors).toEqual([]);
  await expect(trigger).toHaveAttribute("aria-expanded", originalExpanded!);
});

test.describe("desktop", () => {
  test.skip(({ isMobile, viewport }) => isMobile || (viewport?.width ?? 0) < 768, "desktop-only layout");

  test("should morph the rail between its expanded and icon widths", async ({ page }) => {
    await page.goto("/sidebar.html");
    const sidebar = page.getByRole("complementary", { name: "Navegación principal" });
    await expect.poll(async () => (await sidebar.boundingBox())?.width).toBe(EXPANDED_WIDTH_PX);
    await page.getByRole("button", { name: "Alternar navegación" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await expect.poll(async () => Math.round((await sidebar.boundingBox())?.width ?? 0)).toBe(COLLAPSED_WIDTH_PX);
    await expect(page.getByRole("button", { name: "Ajustes" })).toHaveAttribute("title", "Ajustes");
  });

  test("should collapse and expand the rail along Arc's smooth spring without overshoot or clipping", async ({ page }) => {
    const sidebar = await openSettledSidebar(page);
    const toggle = page.getByRole("button", { name: SIDEBAR_TOGGLE_NAME });

    const collapseFrames = sampleRailFrames(page);
    await toggle.click();
    const collapse = await collapseFrames;
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    expectSpringMorph(collapse, EXPANDED_WIDTH_PX, COLLAPSED_WIDTH_PX);
    expectUnclippedRail(collapse);

    const expandFrames = sampleRailFrames(page);
    await toggle.click();
    const expand = await expandFrames;
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    expectSpringMorph(expand, COLLAPSED_WIDTH_PX, EXPANDED_WIDTH_PX);
    expectUnclippedRail(expand);
  });

  test("should reverse an interrupted collapse from the rail's current width", async ({ page }) => {
    const sidebar = await openSettledSidebar(page);
    const framesPromise = sampleRailFrames(page, RAIL_MIDPOINT_WIDTH_PX);
    await page.getByRole("button", { name: SIDEBAR_TOGGLE_NAME }).click();
    const frames = await framesPromise;
    await expect(sidebar).toHaveAttribute("data-state", "expanded");

    expectContinuousRail(frames);
    const widths = frames.map((frame) => frame.rail.width);
    const narrowestIndex = widths.indexOf(Math.min(...widths));
    expect(widths[narrowestIndex]).toBeLessThan(RAIL_MIDPOINT_WIDTH_PX);
    expect(widths[narrowestIndex]).toBeGreaterThan(COLLAPSED_WIDTH_PX + LAYOUT_TOLERANCE_PX);
    expectSpringMorph(frames.slice(narrowestIndex), widths[narrowestIndex], EXPANDED_WIDTH_PX);
    expectUnclippedRail(frames);
  });

  test("should switch the rail width without in-between frames under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const sidebar = await openSettledSidebar(page);
    const toggle = page.getByRole("button", { name: SIDEBAR_TOGGLE_NAME });
    const isRestingWidth = (width: number) =>
      [EXPANDED_WIDTH_PX, COLLAPSED_WIDTH_PX].some((target) => Math.abs(width - target) <= LAYOUT_TOLERANCE_PX);

    for (const [state, targetWidth] of [["collapsed", COLLAPSED_WIDTH_PX], ["expanded", EXPANDED_WIDTH_PX]] as const) {
      const framesPromise = sampleRailFrames(page);
      await toggle.click();
      const frames = await framesPromise;
      await expect(sidebar).toHaveAttribute("data-state", state);
      expect(frames.every((frame) => isRestingWidth(frame.rail.width))).toBe(true);
      expect(Math.abs(frames.at(-1)!.rail.width - targetWidth)).toBeLessThanOrEqual(LAYOUT_TOLERANCE_PX);
      expectUnclippedRail(frames);
    }
  });

  test("should line up the brand tile and the account avatar with the menu icons in the icon rail", async ({ page }) => {
    await page.goto("/sidebar.html");
    await page.getByRole("button", { name: "Alternar navegación" }).click();
    const sidebar = page.getByRole("complementary", { name: "Navegación principal" });
    await expect.poll(async () => Math.round((await sidebar.boundingBox())?.width ?? 0)).toBe(COLLAPSED_WIDTH_PX);
    const centerX = async (selector: string) => {
      const box = await page.locator(selector).first().boundingBox();
      return box ? Math.round(box.x + box.width / 2) : Number.NaN;
    };
    const menuIconCenter = await centerX('[data-slot="sidebar-menu-button"] > span[aria-hidden="true"]');
    expect(Math.abs((await centerX('[data-slot="sidebar-brand-icon"]')) - menuIconCenter)).toBeLessThanOrEqual(1);
    expect(Math.abs((await centerX('[data-slot="account-menu-trigger"] [data-slot="avatar"]')) - menuIconCenter)).toBeLessThanOrEqual(1);
    await expect(page.getByText("Elegí una sección para empezar.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Menú de cuenta" })).not.toContainText("ana@example.com");
  });

  test("should toggle the sidebar from its edge rail", async ({ page }) => {
    await page.goto("/sidebar.html");
    const sidebar = page.getByRole("complementary", { name: "Navegación principal" });
    await page.getByRole("button", { name: "Borde de la navegación" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "collapsed");
    await page.getByRole("button", { name: "Borde de la navegación" }).click();
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
  });

  test("should glide the active indicator to the selected entry", async ({ page }) => {
    await page.goto("/sidebar.html");
    const settings = page.getByRole("button", { name: "Ajustes" });
    await settings.click();
    await expect(page.getByLabel("Sección activa")).toHaveText("Ajustes");
    await expect(page.locator('[data-slot="sidebar-menu-active-indicator"]')).toHaveCount(1);
    await expect(settings.locator('[data-slot="sidebar-menu-active-indicator"]')).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });

  test("should open the rail when a group is selected from the icon rail", async ({ page }) => {
    await page.goto("/sidebar.html");
    await page.getByRole("button", { name: "Alternar navegación" }).click();
    await page.getByRole("button", { name: "Proyectos" }).click();
    await expect(page.getByRole("complementary", { name: "Navegación principal" })).toHaveAttribute("data-state", "expanded");
    await page.getByRole("button", { name: "Agenda" }).click();
    await expect(page.getByLabel("Sección activa")).toHaveText("Agenda");
  });
});

test.describe("mobile", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "small-screen sheet only");

  test("should open a focus-trapped sheet, lock scrolling and return focus on Escape", async ({ page }) => {
    await page.goto("/sidebar.html");
    const trigger = page.getByRole("button", { name: "Alternar navegación" });
    await trigger.click();
    const sheet = page.getByRole("dialog", { name: "Navegación principal" });
    await expect(sheet).toBeVisible();
    await expect.poll(async () => Math.round((await sheet.boundingBox())?.width ?? 0)).toBe(MOBILE_SHEET_WIDTH_PX);
    await expect(page.getByRole("button", { name: "Beez" })).toBeFocused();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  test("should close the sheet after choosing a section", async ({ page }) => {
    await page.goto("/sidebar.html");
    await page.getByRole("button", { name: "Alternar navegación" }).click();
    await page.getByRole("button", { name: "Ajustes" }).click();
    await expect(page.getByLabel("Sección activa")).toHaveText("Ajustes");
    await expect(page.getByRole("dialog", { name: "Navegación principal" })).toBeHidden();
  });
});
