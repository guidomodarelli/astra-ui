/** Protects compact defaults and reachable actions across browser engines. */
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => { await page.goto("/agenda-defaults.html"); });

test("should retain compact controls and disabled textarea feedback", async ({ page }) => {
  // Arc sizes the select trigger like Input and Button: the medium control height (44px).
  await expect(page.getByRole("combobox", { name: "Frecuencia" })).toHaveCSS("height", "44px");
  await page.getByRole("combobox", { name: "Frecuencia" }).click();
  await expect(page.getByRole("listbox")).toHaveCSS("min-width", "192px");
  await page.getByRole("option", { name: "Semanal" }).click();
  await expect(page.getByRole("combobox", { name: "Frecuencia" })).toHaveText("Semanal");
  // Arc segmented track: 36px triggers inside a 4px padding and a 1px border.
  await expect(page.getByRole("tablist")).toHaveCSS("height", "46px");
  await page.getByRole("tab", { name: "Segunda" }).click();
  await expect(page.getByRole("tabpanel")).toHaveText("Segundo contenido");
  const disabled = page.getByRole("textbox", { name: "Mensaje deshabilitado" });
  await expect(disabled).toBeDisabled();
  const editableBackground = await page.getByRole("textbox", { name: "Mensaje editable" }).evaluate(element => getComputedStyle(element).backgroundColor);
  await expect(disabled).not.toHaveCSS("background-color", editableBackground);
  await page.getByRole("button", { name: "Abrir detalle" }).click();
  // Arc popover panel padding (--space-4).
  await expect(page.getByRole("dialog", { name: "Detalle" })).toHaveCSS("padding", "16px");
});

test("should render compact, readable action menus", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir acciones" }).click();
  // Arc menu rows are 36px tall with the text 11px from the edge, instead of padding-driven compact rows.
  const editItem = page.getByRole("menuitem", { name: "Editar", exact: true });
  await expect(editItem).toHaveCSS("min-height", "36px");
  await expect(editItem).toHaveCSS("padding-left", "11px");
  expect(await editItem.evaluate(element => (element as HTMLElement).offsetHeight)).toBe(36);
  await expect(page.getByRole("menu", { name: "Abrir acciones" })).toHaveCSS("min-width", "192px");
});

for (const kind of ["dialog", "alert-dialog"] as const) {
  test(`should separate the ${kind} footer from compact content`, async ({ page }) => {
    await page.getByRole("button", { name: kind === "dialog" ? "Abrir diálogo" : "Abrir confirmación" }).click();
    const content = page.locator(`[data-slot="${kind}-content"]`);
    const footer = page.locator(`[data-slot="${kind}-footer"]`);
    await expect(content).toHaveCSS("padding", "24px");
    await expect(footer).toHaveCSS("border-top-width", "1px");
    await expect(footer).toHaveCSS("margin-bottom", "-24px");
    await expect(footer).toHaveCSS("padding", "16px 24px");
    await footer.getByRole("button", { name: kind === "dialog" ? "Cerrar" : "Cancelar", exact: true }).click();
    await expect(content).not.toBeVisible();
  });
}

for (const side of ["top", "bottom"] as const) {
  test(`should keep long ${side} sheets inside the viewport`, async ({ page }) => {
    await page.getByRole("button", { name: `Abrir panel ${side}` }).click();
    const panel = page.getByRole("dialog", { name: `Panel ${side}`, exact: true });
    await expect(panel).toBeVisible();
    // Measure layout height independently of fractional opening-animation transforms.
    expect(await panel.evaluate(element => (element as HTMLElement).offsetHeight))
      .toBeLessThanOrEqual(page.viewportSize()!.height);
    await panel.getByRole("button", { name: "Inicio del panel" }).scrollIntoViewIfNeeded();
    await expect(panel.getByRole("button", { name: "Inicio del panel" })).toBeInViewport();
    await panel.getByRole("button", { name: "Fin del panel" }).scrollIntoViewIfNeeded();
    await expect(panel.getByRole("button", { name: "Fin del panel" })).toBeInViewport();
  });
}
