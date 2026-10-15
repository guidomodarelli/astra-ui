/** Exercises Arc's display components in real engines, where layout, CSS animations and Motion springs exist. */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Time springs get to settle: headless CI engines can stall animation frames for seconds. */
const SETTLE_TIMEOUT_MS = 15_000;

/** Rounds the skeleton pulse runs before it rests. */
const SKELETON_PULSE_ROUNDS = 11;

/**
 * Reports whether the engine has a fine hover pointer, the only one that gets hover feedback.
 * @param page - Page under test.
 * @returns Whether hover styles apply.
 */
async function canHover(page: Page): Promise<boolean> {
  return page.evaluate(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/arc-display.html");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
});

test("should spring the badge to the width of a longer label", async ({ page }) => {
  const badge = page.getByLabel("Estado de la publicación");
  const content = badge.locator('[data-slot="badge-content"]');
  const initialWidth = await badge.evaluate((element) => element.getBoundingClientRect().width);

  await page.getByRole("button", { name: "Publicar" }).click();

  await expect(content).toHaveAttribute("data-morphing", "");
  await expect(badge.getByText("Publicado en la tribu")).toBeVisible();
  await expect(content).not.toHaveAttribute("data-morphing", "", { timeout: SETTLE_TIMEOUT_MS });
  const finalWidth = await badge.evaluate((element) => element.getBoundingClientRect().width);
  expect(finalWidth).toBeGreaterThan(initialWidth);
  await expect(badge.getByText("Listo")).toHaveCount(0);
});

test("should pop the presence dot in and out of the avatar corner", async ({ page }) => {
  const avatar = page.getByLabel("Ana");
  const toggle = page.getByRole("button", { name: "Cambiar presencia" });

  await toggle.click();

  const dot = avatar.locator('[data-slot="avatar-status"]');
  await expect(dot).toBeVisible();
  await expect(avatar.getByText("En línea")).toBeAttached();
  // The dot pops in from a smaller scale, so its box is only measured once the spring has settled.
  await expect(dot).toHaveCSS("transform", "none", { timeout: SETTLE_TIMEOUT_MS });
  const [avatarBox, dotBox] = await Promise.all([avatar.boundingBox(), dot.boundingBox()]);
  expect(Math.abs(dotBox!.x + dotBox!.width - (avatarBox!.x + avatarBox!.width))).toBeLessThan(2);
  await toggle.click();
  await expect(dot).toHaveCount(0, { timeout: SETTLE_TIMEOUT_MS });
});

test("should ripple a finite pulse down the skeleton blocks", async ({ page }) => {
  const placeholder = page.getByRole("status", { name: "Cargando miembros" });

  const timings = await placeholder.evaluate((element) =>
    [...element.querySelectorAll('[data-slot="skeleton"]')].map((block) => {
      const timing = block.getAnimations()[0]?.effect?.getTiming();
      return { delay: Number(timing?.delay), iterations: timing?.iterations };
    }),
  );

  expect(timings).toHaveLength(4);
  expect(timings.every((timing) => timing.iterations === SKELETON_PULSE_ROUNDS)).toBe(true);
  const delays = timings.map((timing) => timing.delay);
  expect(delays).toEqual([...delays].sort((first, second) => first - second));
  expect(delays[3]).toBeGreaterThan(delays[0]!);
});

test("should keep the skeleton still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const placeholder = page.getByRole("status", { name: "Cargando miembros" });

  await expect
    .poll(() => placeholder.evaluate((element) => element.getAnimations({ subtree: true }).length))
    .toBe(0);
});

test("should float only the interactive card and zoom its media on hover", async ({ page }) => {
  test.skip(!(await canHover(page)), "Touch viewports have no hover lift by design.");
  const interactiveCard = page.getByLabel("Tarjeta interactiva");
  const staticCard = page.getByLabel("Tarjeta estática");

  await staticCard.hover();
  await expect(staticCard).toHaveCSS("translate", "none");
  await interactiveCard.hover();

  await expect(interactiveCard).toHaveCSS("translate", "0px -2px", { timeout: SETTLE_TIMEOUT_MS });
  const zoom = page.getByLabel("Foto de la tribu").locator(":scope > div");
  await expect(zoom).toHaveCSS("scale", "1.04", { timeout: SETTLE_TIMEOUT_MS });
});

test("should collapse a dismissed alert so the content below closes the gap", async ({ page }) => {
  const marker = page.getByText("Debajo del aviso");
  const startTop = (await marker.boundingBox())!.y;

  await page.getByRole("button", { name: "Descartar aviso", exact: true }).click();

  await expect(page.getByText("Nueva versión disponible")).toHaveCount(0, { timeout: SETTLE_TIMEOUT_MS });
  const endTop = (await marker.boundingBox())!.y;
  expect(endTop).toBeLessThan(startTop);
});

test("should lay out an alert action beside the dismiss button without overlap", async ({ page }) => {
  const action = page.getByRole("button", { name: "Ampliar" });
  const dismiss = page.getByRole("button", { name: "Descartar aviso de cupo" });
  const title = page.getByText("Cupo casi completo");

  const [actionBox, dismissBox, titleBox] = await Promise.all([action.boundingBox(), dismiss.boundingBox(), title.boundingBox()]);

  expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(dismissBox!.x);
  expect(titleBox!.x + titleBox!.width).toBeLessThanOrEqual(actionBox!.x);
  await action.click({ trial: true });
  await dismiss.click({ trial: true });
});

test("should size the group counter like the profile-size avatars beside it", async ({ page }) => {
  const group = page.getByLabel("Equipo destacado");
  const avatar = group.locator('[data-slot="avatar"]').first();
  const counter = page.getByLabel("Tres personas más");

  const [avatarBox, counterBox] = await Promise.all([avatar.boundingBox(), counter.boundingBox()]);

  expect(counterBox!.width).toBeCloseTo(avatarBox!.width, 0);
  expect(counterBox!.height).toBeCloseTo(avatarBox!.height, 0);
});
