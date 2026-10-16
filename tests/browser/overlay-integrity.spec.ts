/**
 * Checks overlays inside the contexts consumers put them in: real hit testing for stacking, real viewport bounds for
 * placement, and real dismissal and focus return, none of which jsdom lays out.
 */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Containers the spec opens floating layers in, by the prefix their controls carry. */
const CONTAINERS = [
  { prefix: "Diálogo", open: (page: Page) => page.getByRole("button", { name: "Abrir edición" }).click(), surface: "dialog" },
  { prefix: "Panel", open: (page: Page) => page.getByRole("button", { name: "Abrir panel" }).click(), surface: "dialog" },
  { prefix: "Contenedor", open: async () => undefined, surface: null },
] as const;

/** Pixels a layer may sit past the viewport edge to absorb subpixel rounding. */
const EDGE_TOLERANCE_PX = 1;

/**
 * Asserts the layer is what a pointer hits at its center, so nothing paints or catches pointers above it.
 * @param layer - The floating layer.
 */
async function expectOnTop(layer: Locator) {
  await expect
    .poll(() =>
      layer.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return hit !== null && element.contains(hit);
      }),
    )
    .toBe(true);
}

/**
 * Asserts the layer fits inside the viewport once it settles.
 * @param page - The page under test.
 * @param layer - The floating layer.
 */
async function expectInsideViewport(page: Page, layer: Locator) {
  const viewport = page.viewportSize()!;
  await expect
    .poll(async () => {
      const box = await layer.boundingBox();
      if (!box) return false;
      return (
        box.x >= -EDGE_TOLERANCE_PX &&
        box.y >= -EDGE_TOLERANCE_PX &&
        box.x + box.width <= viewport.width + EDGE_TOLERANCE_PX &&
        box.y + box.height <= viewport.height + EDGE_TOLERANCE_PX
      );
    })
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/overlay-integrity.html");
});

for (const { prefix, open, surface } of CONTAINERS) {
  test.describe(`inside ${prefix}`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page);
    });

    test("should stack the popover above its container, keep it in the viewport and close only the popover", async ({
      page,
    }) => {
      const trigger = page.getByRole("button", { name: `${prefix}: filtros` });
      await trigger.click();
      const panel = page.getByRole("dialog", { name: `${prefix}: panel de filtros` });
      await expectOnTop(panel);
      await expectInsideViewport(page, panel);
      await page.keyboard.press("Escape");
      await expect(panel).toHaveCount(0);
      await expect(trigger).toBeFocused();
      if (surface) await expect(page.getByRole(surface).first()).toBeVisible();
    });

    test("should stack the dropdown menu above its container and close only the menu", async ({ page }) => {
      const trigger = page.getByRole("button", { name: `${prefix}: acciones` });
      await trigger.click();
      const menu = page.getByRole("menu");
      await expectOnTop(menu);
      await expectInsideViewport(page, menu);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();
      if (surface) await expect(page.getByRole(surface).first()).toBeVisible();
    });

    test("should stack the select list above its container and pick an option", async ({ page }) => {
      const trigger = page.getByRole("combobox", { name: `${prefix}: frecuencia` });
      await trigger.click();
      const list = page.getByRole("listbox");
      await expectOnTop(list);
      await expectInsideViewport(page, list);
      await page.getByRole("option", { name: "Semanal" }).click();
      await expect(trigger).toHaveText("Semanal");
      if (surface) await expect(page.getByRole(surface).first()).toBeVisible();
    });

    test("should stack the tooltip above its container on keyboard focus", async ({ page }) => {
      const trigger = page.getByRole("button", { name: `${prefix}: info` });
      // Radix closes a tooltip when its trigger scrolls, so the focus must not be what scrolls it into view.
      await trigger.scrollIntoViewIfNeeded();
      // Engines dispatch the resulting `scroll` events on a later frame; let them fire before the tooltip opens.
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await trigger.focus();
      const bubble = page.locator("[data-slot=tooltip-content]", { hasText: `${prefix}: ayuda` });
      await expect(bubble).toBeVisible();
      await expectOnTop(bubble);
      await expectInsideViewport(page, bubble);
    });
  });
}

test("should run a toast action from an open dialog without closing the dialog", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir edición" }).click();
  const dialog = page.getByRole("dialog", { name: "Editar evento" });
  await dialog.getByRole("button", { name: "Guardar" }).click();
  const retry = page.getByRole("button", { name: "Reintentar" });
  await expect(retry).toBeVisible();
  await expectOnTop(retry);
  await retry.click();
  await expect(dialog.getByRole("status", { name: "Reintentos" })).toHaveText("1");
  await expect(dialog).toBeVisible();
});

test("should close a toast from an open sheet without closing the sheet", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir panel" }).click();
  const sheet = page.getByRole("dialog", { name: "Panel lateral" });
  await sheet.getByRole("button", { name: "Aplicar" }).click();
  const toastMessage = page.getByText("Opciones guardadas");
  await expect(toastMessage).toBeVisible();
  const closeToast = page.getByRole("button", { name: "Close toast" });
  await expectOnTop(closeToast);
  await closeToast.click();
  await expect(toastMessage).toHaveCount(0);
  await expect(sheet).toBeVisible();
});

test("should keep a popover taller than the viewport inside it and scroll its content", async ({ page }) => {
  await page.getByRole("button", { name: "Borde: filtros" }).click();
  const panel = page.getByRole("dialog", { name: "Borde: panel de filtros" });
  await expectInsideViewport(page, panel);
  await expect.poll(() => panel.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
});

test.describe("mobile sidebar", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "the sidebar is a sheet only below 768px");

  test("should close only the account menu on Escape and keep the sidebar open", async ({ page }) => {
    await page.goto("/sidebar.html");
    await page.getByRole("button", { name: "Alternar navegación" }).click();
    const sidebar = page.getByRole("dialog", { name: "Navegación principal" });
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    const accountTrigger = page.getByRole("button", { name: "Menú de cuenta" });
    await accountTrigger.click();
    const menu = page.getByRole("menu");
    await expectOnTop(menu);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await expect(accountTrigger).toBeFocused();
  });
});
