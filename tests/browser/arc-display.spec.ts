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
  const avatar = page.getByRole("img", { name: /^Ana(, En línea)?$/ });
  const toggle = page.getByRole("button", { name: "Cambiar presencia" });

  await toggle.click();

  const dot = avatar.locator('[data-slot="avatar-status"]');
  await expect(dot).toBeVisible();
  await expect(avatar).toHaveAccessibleName("Ana, En línea");
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
  const zoom = page.getByRole("img", { name: "Foto de la tribu" }).locator("xpath=..");
  await expect(zoom).toHaveCSS("scale", "1.04", { timeout: SETTLE_TIMEOUT_MS });
});

test("should grow the quick look out of its card and hand focus back to the title when it closes", async ({ page }) => {
  const card = page.getByRole("article", { name: "Tarjeta con vista rápida" });
  const trigger = card.getByRole("button", { name: "Tribu de cocina" });
  await expect(card.getByRole("status").locator(".sr-only")).toHaveText("Actualizada hace 2 horas");
  const cardBox = (await card.boundingBox())!;

  await trigger.click();

  const quickLook = page.getByRole("dialog", { name: "Tribu de cocina" });
  await expect(quickLook).toBeVisible();
  await expect(quickLook).toHaveAccessibleDescription("Recetas de estación.");
  await expect(quickLook.getByText("Encuentros los sábados.")).toBeVisible();
  // The panel settles centered in the viewport, larger than the card it grew from and inside the viewport edges.
  await expect
    .poll(async () => {
      const box = (await quickLook.boundingBox())!;
      const viewport = page.viewportSize()!;
      return box.width >= cardBox.width - 1 && box.x >= 0 && box.x + box.width <= viewport.width + 1;
    }, { timeout: SETTLE_TIMEOUT_MS })
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="card-quick-look"]')).toHaveCount(0, { timeout: SETTLE_TIMEOUT_MS });
  await expect(trigger).toBeFocused();
  // The pointer leaves the card, so its hover lift does not count as a shift left behind by the morph.
  await page.mouse.move(0, 0);
  await expect.poll(async () => Math.abs((await card.boundingBox())!.y - cardBox.y), { timeout: SETTLE_TIMEOUT_MS }).toBeLessThan(1);
});

test("should open and close the quick look with a plain fade when motion is reduced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const trigger = page.getByRole("button", { name: "Tribu de cocina" });

  await trigger.click();

  const quickLook = page.getByRole("dialog", { name: "Tribu de cocina" });
  await expect(quickLook).toBeVisible();
  await quickLook.getByRole("button", { name: "Cerrar vista rápida" }).click();
  await expect(page.locator('[data-slot="card-quick-look"]')).toHaveCount(0, { timeout: SETTLE_TIMEOUT_MS });
  await expect(trigger).toBeFocused();
});

test("should collapse a dismissed alert so the content below closes the gap", async ({ page }) => {
  const marker = page.getByText("Debajo del aviso");
  const startTop = (await marker.boundingBox())!.y;

  await page.getByRole("button", { name: "Descartar aviso: Nueva versión disponible", exact: true }).click();

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

test("should size the group counter like its avatars and roll it up when someone joins", async ({ page }) => {
  const group = page.getByRole("group", { name: "Equipo destacado" });
  const avatar = group.locator('[data-slot="avatar"]').first();
  const counter = group.getByRole("img", { name: "2 equipo destacado más" });

  const [avatarBox, counterBox] = await Promise.all([avatar.boundingBox(), counter.boundingBox()]);

  expect(counterBox!.width).toBeCloseTo(avatarBox!.width, 0);
  expect(counterBox!.height).toBeCloseTo(avatarBox!.height, 0);
  const groupWidth = (await group.boundingBox())!.width;
  await page.getByRole("button", { name: "Sumar integrante" }).click();
  await expect(group.getByRole("img", { name: "3 equipo destacado más" })).toHaveText("+3", { timeout: SETTLE_TIMEOUT_MS });
  // Only the count changes: the stack keeps its width, since only `max` avatars render.
  expect((await group.boundingBox())!.width).toBeCloseTo(groupWidth, 0);
});

test("should hand height and opacity back to the consumer once an alert has opened", async ({ page }) => {
  await page.getByRole("button", { name: "Mostrar aviso alto" }).click();

  const alert = page.getByLabel("Aviso alto");
  await expect(alert).toHaveCSS("height", "112px", { timeout: SETTLE_TIMEOUT_MS });
  await expect(alert).toHaveCSS("opacity", "0.5", { timeout: SETTLE_TIMEOUT_MS });
});

test("should keep the consumer overflow on a reveal before and after it moves", async ({ page }) => {
  const reveal = page.getByTestId("scrolling-reveal").locator('[data-slot="skeleton-reveal"]');
  await expect(reveal).toHaveCSS("overflow-y", "auto");

  await page.getByRole("button", { name: "Alternar carga", exact: true }).click();

  await expect(page.getByText("Resumen listo para revisar.")).toBeVisible();
  await expect(reveal).toHaveCSS("overflow-y", "auto", { timeout: SETTLE_TIMEOUT_MS });
});

test("should keep a custom avatar badge and the presence dot in separate corners", async ({ page }) => {
  for (const size of ["sm", "md", "lg", "xl"]) {
    const avatar = page.getByRole("img", { name: `Avatar con insignia ${size}, En línea` });
    const [badgeBox, dotBox] = await Promise.all([
      avatar.locator('[data-slot="avatar-badge"]').boundingBox(),
      avatar.locator('[data-slot="avatar-status"]').boundingBox(),
    ]);
    const overlapsHorizontally = badgeBox!.x < dotBox!.x + dotBox!.width && dotBox!.x < badgeBox!.x + badgeBox!.width;
    const overlapsVertically = badgeBox!.y < dotBox!.y + dotBox!.height && dotBox!.y < badgeBox!.y + badgeBox!.height;
    expect(overlapsHorizontally && overlapsVertically, `${size} avatar`).toBe(false);
  }
});

test("should keep a fixed reveal height from its class before and after loading", async ({ page }) => {
  const reveal = page.getByTestId("fixed-reveal").locator('[data-slot="skeleton-reveal"]');
  await expect(reveal).toHaveCSS("height", "160px");

  await page.getByRole("button", { name: "Alternar carga fija" }).click();

  await expect(page.getByText("Resumen de alto fijo listo.")).toBeVisible();
  await expect.poll(() => reveal.evaluate((element) => element.style.height), { timeout: SETTLE_TIMEOUT_MS }).toBe("");
  await expect(reveal).toHaveCSS("height", "160px");
});
