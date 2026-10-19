/** Exercises the Arc-styled DropdownMenu and Select in real engines, where layout, transitions and media queries exist. */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Frames sampled right after the menu opens; enough to catch the staggered entrance before it settles. */
const SAMPLED_FRAMES = 4;

/** Distance Arc keeps between a menu and the viewport edges. */
const COLLISION_PADDING_PX = 12;

/** Time a transition gets to settle: headless CI engines can stall animation frames for seconds. */
const SETTLE_TIMEOUT_MS = 15_000;

/** Lead the frozen clock is paused at; it never reaches it, so no timer or animation frame runs past this point. */
const FROZEN_CLOCK_LEAD_MS = 1000;

/**
 * Resolves a CSS color expression against the page theme.
 * @param page - Page that holds the theme.
 * @param expression - Any CSS color, such as `var(--surface-muted)`.
 * @returns The computed `rgb()`/`oklch()` string the engine paints.
 */
async function resolveColor(page: Page, expression: string): Promise<string> {
  return page.evaluate((color) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = color;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return resolved;
  }, expression);
}

/**
 * Opens the document menu and samples the opacity of its first and fifth rows on the following frames.
 * @param page - Page that holds the menu.
 * @returns One pair of opacities per frame.
 */
async function openAndSampleRows(page: Page): Promise<{ first: number; fifth: number }[]> {
  const trigger = page.getByRole("button", { name: "Acciones del documento" });
  await trigger.focus();
  return trigger.evaluate(async (element, frames) => {
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    const samples: { first: number; fifth: number }[] = [];
    for (let frame = 0; frame < frames; frame++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const rows = document.querySelectorAll('[data-slot="dropdown-menu-item"]');
      samples.push({
        first: rows[0] ? Number(getComputedStyle(rows[0]).opacity) : -1,
        fifth: rows[4] ? Number(getComputedStyle(rows[4]).opacity) : -1,
      });
    }
    return samples;
  }, SAMPLED_FRAMES);
}

test.describe("Arc dropdown menu", () => {
  test("should stagger its rows in when it opens", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/arc-menus.html");
    const samples = (await openAndSampleRows(page)).filter((sample) => sample.first >= 0);

    expect(samples.length).toBeGreaterThan(0);
    expect(samples.some((sample) => sample.first < 1)).toBe(true);
    // Later rows start later, so they are never ahead of the first one.
    for (const sample of samples) expect(sample.fifth).toBeLessThanOrEqual(sample.first);
    await expect(page.getByRole("menuitem", { name: "Descargar" })).toHaveCSS("opacity", "1", {
      timeout: SETTLE_TIMEOUT_MS,
    });
  });

  test("should show every row at once with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/arc-menus.html");
    const samples = (await openAndSampleRows(page)).filter((sample) => sample.first >= 0);

    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) expect(sample).toEqual({ first: 1, fifth: 1 });
  });

  test("should paint the destructive highlight in the danger tone", async ({ page }) => {
    await page.goto("/arc-menus.html");
    await page.getByRole("button", { name: "Acciones del documento" }).click();
    const rename = page.getByRole("menuitem", { name: "Renombrar" });
    const remove = page.getByRole("menuitem", { name: "Eliminar" });
    const mutedFill = await resolveColor(page, "var(--surface-muted)");
    const dangerFill = await resolveColor(page, "color-mix(in oklab, var(--danger) 8%, var(--surface))");
    const dangerText = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "var(--danger)";
      document.body.append(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    });

    await rename.focus();
    await expect(rename).toHaveAttribute("data-highlighted", "");
    await expect(rename).toHaveCSS("background-color", mutedFill, { timeout: SETTLE_TIMEOUT_MS });

    await remove.focus();
    await expect(remove).toHaveAttribute("data-highlighted", "");
    await expect(remove).toHaveCSS("background-color", dangerFill, { timeout: SETTLE_TIMEOUT_MS });
    await expect(remove).toHaveCSS("color", dangerText);

    await remove.press("Enter");
    await expect(page.getByLabel("Última acción")).toHaveText("Eliminar");
  });

  test("should keep its distance from the viewport edges", async ({ page }) => {
    await page.goto("/arc-menus.html");
    await page.getByRole("button", { name: "Acciones del documento" }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Eliminar" })).toHaveCSS("opacity", "1", {
      timeout: SETTLE_TIMEOUT_MS,
    });
    // The surface grows from a slightly smaller scale; measure once its entrance has settled.
    await expect(menu).toHaveCSS("transform", "none", { timeout: SETTLE_TIMEOUT_MS });

    const bounds = (await menu.boundingBox())!;
    const viewportWidth = page.viewportSize()!.width;
    expect(bounds.x).toBeGreaterThanOrEqual(COLLISION_PADDING_PX - 1);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewportWidth - COLLISION_PADDING_PX + 1);
    expect(bounds.width).toBeGreaterThanOrEqual(Math.min(192, viewportWidth - 2 * COLLISION_PADDING_PX));
  });

  test("should keep the menu closed while its custom trigger is disabled and open it once enabled", async ({ page }) => {
    await page.goto("/arc-menus.html");
    const trigger = page.getByRole("button", { name: "Más acciones de la fila" });
    await expect(trigger).toBeDisabled();
    // The engine still delivers `pointerdown` to a disabled button, and that is what opens a Radix menu; `force` skips
    // Playwright's wait for an enabled element so the real pointer sequence reaches it.
    await trigger.click({ force: true });
    await expect(page.getByRole("menu")).toHaveCount(0);
    await page.getByRole("button", { name: "Habilitar fila" }).click();
    await trigger.click();
    await expect(page.getByRole("menu", { name: "Acciones de la fila" })).toBeVisible();
  });

  test("should keep the menu closed while a fieldset disables its trigger and open it once the fieldset is enabled", async ({
    page,
  }) => {
    await page.goto("/arc-menus.html");
    const trigger = page.getByRole("button", { name: "Más acciones de la sección" });
    await expect(trigger).toBeDisabled();
    await trigger.click({ force: true });
    await expect(page.getByRole("menu")).toHaveCount(0);
    await page.getByRole("button", { name: "Habilitar sección" }).click();
    await trigger.click();
    await expect(page.getByRole("menu", { name: "Acciones de la sección" })).toBeVisible();
  });

  test("should not open from an aria-disabled trigger with the keyboard and let Tab leave it", async ({ page }) => {
    await page.goto("/arc-menus.html");
    const trigger = page.getByRole("button", { name: "Acciones en curso" });
    await expect(trigger).toHaveAttribute("aria-disabled", "true");
    await trigger.focus();
    for (const key of ["Enter", "Space", "ArrowDown"]) await page.keyboard.press(key);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Después del menú" })).toBeFocused();
  });

  test("should name the menu after its label and return focus to Arc's trigger on Escape", async ({ page }) => {
    await page.goto("/arc-menus.html");
    const trigger = page.getByRole("button", { name: "Acciones del documento" });
    await trigger.click();
    await expect(page.getByRole("menu", { name: "Acciones del documento" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("should check one radio row of a single selection and toggle a checkbox row", async ({ page }) => {
    await page.goto("/arc-menus.html");
    const trigger = page.getByRole("button", { name: "Vista" });
    await trigger.click();
    await expect(page.getByRole("menuitemradio", { name: "Recientes" })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("menuitemradio", { name: "Por nombre" }).click();
    await expect(page.getByLabel("Orden elegido")).toHaveText("name");

    await trigger.click();
    await expect(page.getByRole("menuitemradio", { name: "Por nombre" })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("menuitemcheckbox", { name: "Mostrar archivados" }).click();
    await trigger.click();
    await expect(page.getByRole("menuitemcheckbox", { name: "Mostrar archivados" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("should unmount at once with reduced motion, so the page is reachable right after choosing an item", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.clock.install();
    await page.goto("/arc-menus.html");
    await page.getByRole("button", { name: "Acciones del documento" }).click();
    const menu = page.getByRole("menu", { name: "Acciones del documento" });
    await expect(menu).toHaveCSS("opacity", "1", { timeout: SETTLE_TIMEOUT_MS });
    // From here no timer or animation frame runs: a menu that still faded out on close would stay mounted, and with it
    // the modal guard that hides the rest of the page from assistive technology.
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + FROZEN_CLOCK_LEAD_MS);

    await menu.getByRole("menuitem", { name: "Renombrar" }).click();

    await expect(page.getByLabel("Última acción")).toHaveText("Renombrar");
    await expect(page.locator("[data-slot='dropdown-menu-content']")).toHaveCount(0);
    // getByRole only finds a control outside the menu once nothing hides it from the accessibility tree.
    await expect(page.getByRole("button", { name: "Vista" })).toHaveCount(1);
    await expect(page.locator("#root")).not.toHaveAttribute("aria-hidden", "true");
  });
});

test.describe("Arc select", () => {
  test("should match the input height and use the small control height for sm", async ({ page }) => {
    await page.goto("/arc-menus.html");
    const inputHeight = await page.getByRole("textbox", { name: "Monto" }).evaluate(
      (element) => element.getBoundingClientRect().height,
    );
    const smallHeight = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.height = "var(--control-height-sm)";
      document.body.append(probe);
      const height = probe.getBoundingClientRect().height;
      probe.remove();
      return height;
    });

    const currency = await page.getByRole("combobox", { name: "Moneda" }).boundingBox();
    const frequency = await page.getByRole("combobox", { name: "Frecuencia" }).boundingBox();
    expect(Math.abs(currency!.height - inputHeight)).toBeLessThanOrEqual(1);
    expect(Math.abs(frequency!.height - smallHeight)).toBeLessThanOrEqual(1);
  });

  test("should answer hover with the muted fill only on fine pointers", async ({ page }) => {
    await page.goto("/arc-menus.html");
    const canHover = await page.evaluate(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    test.skip(!canHover, "Touch viewports have no hover state by design.");
    const trigger = page.getByRole("combobox", { name: "Moneda" });
    const surface = await resolveColor(page, "var(--surface)");
    const mutedFill = await resolveColor(page, "var(--surface-muted)");

    await expect(trigger).toHaveCSS("background-color", surface);
    await trigger.hover();
    await expect(trigger).toHaveCSS("background-color", mutedFill, { timeout: SETTLE_TIMEOUT_MS });
  });

  test("should open a popper list as wide as the trigger and mark the chosen option", async ({ page }) => {
    await page.goto("/arc-menus.html");
    const trigger = page.getByRole("combobox", { name: "Moneda" });
    // Measured before opening: the open list hides the rest of the page from the accessibility tree.
    const triggerBounds = (await trigger.boundingBox())!;
    await trigger.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveCSS("transform", "none", { timeout: SETTLE_TIMEOUT_MS });

    const listBounds = (await listbox.boundingBox())!;
    expect(listBounds.width).toBeGreaterThanOrEqual(Math.min(triggerBounds.width, 192) - 1);
    await expect(page.getByRole("option", { name: "Pesos" })).toHaveAttribute("aria-selected", "true");

    await page.getByRole("option", { name: "Dólares" }).click();
    await expect(trigger).toHaveText("Dólares");
    await expect(listbox).not.toBeVisible();
  });

  test("should keep a hidden label out of the layout while it names the trigger", async ({ page }) => {
    await page.goto("/arc-menus.html");
    const trigger = page.getByRole("combobox", { name: "Moneda" });
    const label = page.locator("label", { hasText: "Moneda" });
    const labelBounds = (await label.boundingBox())!;
    expect(labelBounds.width).toBeLessThanOrEqual(1);
    expect(labelBounds.height).toBeLessThanOrEqual(1);
    await expect(trigger).toBeVisible();
  });

  test("should show the visible label above a full-width trigger and clear the error once a value is chosen", async ({
    page,
  }) => {
    await page.goto("/arc-menus.html");
    const trigger = page.getByRole("combobox", { name: "Plan" });
    const label = page.locator("label", { hasText: "Plan" });
    const field = page.locator("[data-slot=field]", { has: trigger });
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toContainText("Elegí un plan para continuar.");
    await expect(trigger).toHaveAccessibleDescription(/Elegí un plan para continuar\./);
    const labelBounds = (await label.boundingBox())!;
    const triggerBounds = (await trigger.boundingBox())!;
    const fieldBounds = (await field.boundingBox())!;
    expect(labelBounds.y + labelBounds.height).toBeLessThanOrEqual(triggerBounds.y + 1);
    expect(Math.abs(triggerBounds.width - fieldBounds.width)).toBeLessThanOrEqual(1);

    await trigger.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toHaveCSS("transform", "none", { timeout: SETTLE_TIMEOUT_MS });
    const listBounds = (await listbox.boundingBox())!;
    const viewportWidth = page.viewportSize()!.width;
    // As wide as the trigger, at least 12rem and at most min(24rem, 100vw minus 20px).
    const expectedWidth = Math.min(Math.max(triggerBounds.width, 192), 384, viewportWidth - 20);
    expect(Math.abs(listBounds.width - expectedWidth)).toBeLessThanOrEqual(1);
    await page.getByRole("option", { name: "Profesional" }).click();
    await expect(trigger).toHaveText("Profesional");
    await expect(trigger).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toHaveCount(0, { timeout: SETTLE_TIMEOUT_MS });
  });
});
