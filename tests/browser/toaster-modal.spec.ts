/**
 * Checks the plain `Toaster` beez-ui exports while a modal is open: real hit testing through the modal's disabled
 * pointer events, Sonner's hotkey against the modal's focus trap, and focus return when the focused toast goes away,
 * none of which jsdom reproduces.
 */
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Modals that raise toasts, by the trigger that opens them, their ARIA role and the counter their retries go to. */
const MODALS = [
  { trigger: "Abrir edición", role: "dialog", name: "Editar evento", counter: "Reintentos del diálogo" },
  { trigger: "Abrir confirmación", role: "alertdialog", name: "Confirmar cambios", counter: "Reintentos de la confirmación" },
  { trigger: "Abrir panel", role: "dialog", name: "Panel lateral", counter: "Reintentos del panel" },
] as const;

/** Most Tab presses a toast control may take to reach from the toast list. */
const MAX_TABS_INTO_TOAST = 6;

/**
 * Asserts the control is what a pointer hits at its center, so the modal does not catch pointers above it.
 * @param control - The toast control.
 */
async function expectOnTop(control: Locator) {
  await expect
    .poll(() =>
      control.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return hit !== null && element.contains(hit);
      }),
    )
    .toBe(true);
}

/**
 * Presses Tab until the control holds focus, as a keyboard user walks the toast.
 * @param page - The page under test.
 * @param control - The toast control to reach.
 */
async function tabTo(page: Page, control: Locator) {
  for (let presses = 0; presses < MAX_TABS_INTO_TOAST; presses++) {
    if (await control.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(control).toBeFocused();
}

/**
 * Asserts keyboard focus sits inside the modal.
 * @param modal - The open modal.
 */
async function expectFocusInside(modal: Locator) {
  await expect.poll(() => modal.evaluate((element) => element.contains(document.activeElement))).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/toaster-modal.html");
});

for (const { trigger, role, name, counter } of MODALS) {
  test.describe(`from ${name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole("button", { name: trigger }).click();
      await page.getByRole(role, { name }).getByRole("button", { name: "Guardar" }).click();
    });

    test("should run the toast action on click and keep the modal open", async ({ page }) => {
      const modal = page.getByRole(role, { name });
      const retry = page.getByRole("button", { name: "Reintentar" });
      await expect(retry).toBeVisible();
      await expectOnTop(retry);
      await retry.click();
      await expect(modal.getByRole("status", { name: counter })).toHaveText("1");
      await expect(modal).toBeVisible();
    });

    test("should close the toast with its close button and keep the modal open", async ({ page }) => {
      const modal = page.getByRole(role, { name });
      const closeToast = page.getByRole("button", { name: "Close toast" });
      await expectOnTop(closeToast);
      await closeToast.click();
      await expect(page.getByText("No se pudo guardar")).toHaveCount(0);
      await expect(modal).toBeVisible();
    });

    test("should run the toast action with Alt+T, Tab and Enter and return focus to the modal", async ({ page }) => {
      const modal = page.getByRole(role, { name });
      const retry = page.getByRole("button", { name: "Reintentar" });
      await expect(retry).toBeVisible();
      // Sonner's hotkey moves focus to the toast list; the modal's focus trap must not pull it back.
      await page.keyboard.press("Alt+KeyT");
      await expect(page.locator("[data-sonner-toaster]")).toBeFocused();
      await tabTo(page, retry);
      await page.keyboard.press("Enter");
      await expect(modal.getByRole("status", { name: counter })).toHaveText("1");
      await expect(modal).toBeVisible();
      // The action dismisses its toast; focus must go back to the modal instead of falling to the body.
      await expect(retry).toHaveCount(0);
      await expectFocusInside(modal);
    });
  });
}

test("should return focus to the dialog when the focused toast closes while another stays", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir edición" }).click();
  const dialog = page.getByRole("dialog", { name: "Editar evento" });
  const save = dialog.getByRole("button", { name: "Guardar" });
  await save.click();
  await save.click();
  const closeToast = page.getByRole("button", { name: "Close toast" });
  await expect(closeToast).toHaveCount(2);
  await page.keyboard.press("Alt+KeyT");
  await tabTo(page, closeToast.first());
  await page.keyboard.press("Enter");
  // The toast list stays mounted, so only the removed control could have held focus.
  await expect(closeToast).toHaveCount(1);
  await expectFocusInside(dialog);
  await expect(dialog).toBeVisible();
});
