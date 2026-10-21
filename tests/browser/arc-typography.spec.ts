/** Checks the typography components against Arc's type rules in real engines, where fonts and tokens resolve. */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Arc's type scale in pixels, as each heading level renders by default. */
const HEADING_SIZES_PX = { 1: 36, 2: 28, 3: 22, 4: 18, 5: 16, 6: 14 } as const;

/** Smallest size Arc sets in its display face. */
const DISPLAY_THRESHOLD_PX = 30;

/** Arc's display face, used from 30px up. */
const DISPLAY_FAMILY = /Golfo Geist/;

/** Arc's text face, used below 30px and for running text. */
const BODY_FAMILY = /Golfo Inter/;

/** Heaviest weight Arc allows. */
const MAX_FONT_WEIGHT = 500;

/** Arc's key cap heights in pixels. */
const KBD_HEIGHT_PX = { md: 26, sm: 22 } as const;

/** Computed value of a fully transparent background. */
const TRANSPARENT = "rgba(0, 0, 0, 0)";

/**
 * Reads a computed style property of an element.
 * @param locator - Element to inspect.
 * @param property - CSS property name.
 * @returns The computed value.
 */
async function computedStyle(locator: Locator, property: string): Promise<string> {
  return locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
}

/**
 * Resolves a colour token the way the engine paints it, so assertions compare like with like.
 * @param page - Page under test.
 * @param token - Custom property name, such as `--text-muted`.
 * @returns The computed colour.
 */
async function tokenColour(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  }, token);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/arc-typography.html");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
});

test("should size each heading level from Arc's scale and switch to Geist from 30px up", async ({ page }) => {
  for (const [level, sizePx] of Object.entries(HEADING_SIZES_PX)) {
    const heading = page.getByRole("heading", { level: Number(level) }).first();
    expect(await computedStyle(heading, "font-size")).toBe(`${sizePx}px`);
    expect(await computedStyle(heading, "font-family")).toMatch(sizePx >= DISPLAY_THRESHOLD_PX ? DISPLAY_FAMILY : BODY_FAMILY);
    expect(Number(await computedStyle(heading, "font-weight"))).toBe(MAX_FONT_WEIGHT);
  }
  const cover = page.getByRole("heading", { name: "Portada" });
  expect(await computedStyle(cover, "font-size")).toBe("72px");
  expect(await computedStyle(cover, "font-family")).toMatch(DISPLAY_FAMILY);
  const fontsLoaded = await page.evaluate(
    () => document.fonts.check('500 36px "Golfo Geist"') && document.fonts.check('400 16px "Golfo Inter"'),
  );
  expect(fontsLoaded).toBe(true);
});

test("should never go past weight 500 in any typography component", async ({ page }) => {
  const weights = await page.locator("main [data-slot]").evaluateAll((elements) =>
    elements.map((element) => Number(getComputedStyle(element).fontWeight)),
  );
  expect(weights.length).toBeGreaterThan(20);
  expect(Math.max(...weights)).toBeLessThanOrEqual(MAX_FONT_WEIGHT);
});

test("should set running text in Inter with Arc's sizes and colour roles", async ({ page }) => {
  const paragraph = page.getByTestId("paragraph");
  const muted = page.getByText("Actualizado hace 2 horas.");
  const lead = page.getByText("Encontrá a la gente que comparte lo que te gusta.");

  expect(await computedStyle(paragraph, "font-family")).toMatch(BODY_FAMILY);
  expect(await computedStyle(paragraph, "font-size")).toBe("16px");
  expect(await computedStyle(lead, "font-size")).toBe("18px");
  expect(await computedStyle(muted, "font-size")).toBe("14px");
  expect(await computedStyle(paragraph, "color")).toBe(await tokenColour(page, "--foreground"));
  expect(await computedStyle(lead, "color")).toBe(await tokenColour(page, "--text-secondary"));
  expect(await computedStyle(muted, "color")).toBe(await tokenColour(page, "--text-muted"));
});

test("should set code in the platform monospace and drop the chip inside a pre block", async ({ page }) => {
  const inlineCode = page.getByText("pnpm dev");
  const pre = page.getByTestId("pre");
  const blockCode = pre.locator('[data-slot="code"]');

  expect(await computedStyle(inlineCode, "font-family")).toMatch(/ui-monospace/);
  expect(await computedStyle(inlineCode, "border-top-width")).toBe("1px");
  expect(await computedStyle(pre, "font-family")).toMatch(/ui-monospace/);
  expect(await computedStyle(blockCode, "border-top-width")).toBe("0px");
  expect(await computedStyle(blockCode, "background-color")).toBe(TRANSPARENT);
  expect(await computedStyle(blockCode, "font-size")).toBe(await computedStyle(pre, "font-size"));
});

test("should keep long code inside its block without scrolling the page sideways", async ({ page }) => {
  const pre = page.getByTestId("pre");
  const { clientWidth, scrollWidth } = await pre.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));

  expect(scrollWidth).toBeGreaterThan(clientWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("should draw key caps at Arc's two heights with a heavier bottom edge", async ({ page }) => {
  const control = page.getByText("Ctrl", { exact: true });
  const letter = page.getByText("K", { exact: true });

  expect((await control.boundingBox())!.height).toBeCloseTo(KBD_HEIGHT_PX.md, 0);
  expect((await letter.boundingBox())!.height).toBeCloseTo(KBD_HEIGHT_PX.sm, 0);
  expect(await computedStyle(control, "border-bottom-width")).toBe("2px");
  expect(await computedStyle(control, "border-top-width")).toBe("1px");
});

test("should show list markers in the muted colour", async ({ page }) => {
  const list = page.getByRole("list", { name: "Requisitos" });
  const steps = page.getByRole("list", { name: "Pasos", exact: true });
  const letteredSteps = page.getByRole("list", { name: "Pasos con letras" });
  const stages = page.getByRole("list", { name: "Etapas" });
  const markerColour = await list
    .getByRole("listitem")
    .first()
    .evaluate((element) => getComputedStyle(element, "::marker").color);

  expect(await computedStyle(list, "list-style-type")).toBe("disc");
  expect(await computedStyle(steps, "list-style-type")).toBe("decimal");
  expect(await computedStyle(letteredSteps, "list-style-type")).toBe("lower-alpha");
  expect(await computedStyle(stages, "list-style-type")).toBe("upper-roman");
  expect(markerColour).toBe(await tokenColour(page, "--text-muted"));
});

test("should repaint text from the dark theme tokens", async ({ page }) => {
  const heading = page.getByRole("heading", { level: 1 });
  const lightColour = await computedStyle(heading, "color");

  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.classList.add("dark");
  });

  expect(await computedStyle(heading, "color")).not.toBe(lightColour);
  expect(await computedStyle(heading, "color")).toBe(await tokenColour(page, "--foreground"));
  expect(await computedStyle(page.getByText("novedades"), "background-color")).not.toBe(TRANSPARENT);
});
