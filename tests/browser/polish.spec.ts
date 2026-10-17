/** Verifies the polished motion and the fixed behaviors in real browser layout and input. */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { recordMotion } from "./motion-recorder.js";

type TimingRecord = { slot: string | null; duration: unknown; easing: unknown };
type TimingWindow = Window & { __timings: TimingRecord[] };

/** Asserts that playback left no visual residue on the element. */
async function expectSettled(target: Locator) {
  await expect(target).toHaveCSS("opacity", "1");
  await expect(target).toHaveCSS("transform", "none");
  await expect(target).toHaveCSS("filter", "none");
}

/** Records the timing options each native animation is created with, delegating unchanged. */
async function recordTimings(page: Page) {
  await page.addInitScript(() => {
    const timings: TimingRecord[] = [];
    const nativeAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const [, options] = args;
      if (options && typeof options === "object") {
        timings.push({
          slot: this.getAttribute("data-slot"),
          duration: options.duration,
          easing: options.easing,
        });
      }
      return nativeAnimate.apply(this, args);
    };
    Object.assign(window, { __timings: timings });
  });
  return (slot: string) =>
    page.evaluate(
      (target) => (window as unknown as TimingWindow).__timings.filter((record) => record.slot === target),
      slot,
    );
}

test.describe("with motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("should glide the current page highlight and hand it back to the selected page", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    const firstPage = page.getByRole("link", { name: "Página 1" });
    const thirdPage = page.getByRole("link", { name: "Página 3" });
    const activeBackground = await firstPage.evaluate((link) => getComputedStyle(link).backgroundColor);
    await expect(firstPage).toHaveAttribute("aria-current", "page");
    await thirdPage.click();
    await expect(thirdPage).toHaveAttribute("aria-current", "page");
    await expect(firstPage).not.toHaveAttribute("aria-current");
    await expect.poll(motion.glides).toContain("pagination-content");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
    await expect(thirdPage).not.toHaveAttribute("data-glide-target");
    // The pointer still rests on the link after the click; hover paints its own background.
    await page.mouse.move(0, 0);
    await thirdPage.blur();
    await expect(thirdPage).toHaveCSS("background-color", activeBackground);
    await expect(page).toHaveURL(/#pagina-3$/);
  });

  test("should move the filter suggestion highlight with the keyboard without a travelling copy", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    const input = page.getByRole("combobox", { name: "Filtrar movimientos" });
    await input.click();
    const options = page.getByRole("option");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await input.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    // Arc's combobox has no sliding highlight: the option answers in color only.
    expect(await motion.glides()).not.toContain("filter-query-bar-suggestions");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-activedescendant", (await options.nth(1).getAttribute("id"))!);
    await input.press("Enter");
    await expect(input).toHaveValue("tiene:");
  });

  test("should slide the next calendar month in from the navigation side and settle", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    const month = page.locator('[data-slot="calendar-month"]');
    await expect(month).toContainText("enero 2026");
    expect(await motion.properties({ slot: "calendar-month" })).toEqual([]);
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(month).toContainText("febrero 2026");
    await expect.poll(() => motion.properties({ slot: "calendar-month" })).toContain("transform");
    await expectSettled(month);
    await page.getByRole("button", { name: /anterior/i }).click();
    await expect(month).toContainText("enero 2026");
    await expectSettled(month);
  });

  test("should sharpen a freshly loaded avatar image out of a blur, without a zoom", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    await expect(page.getByText("AN", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Cargar foto" }).click();
    const image = page.getByRole("img", { name: "Foto de Ana" }).locator("img");
    await expect(image).toBeVisible();
    await expect.poll(() => motion.properties({ slot: "avatar-image" })).toEqual(
      expect.arrayContaining(["opacity", "filter"]),
    );
    expect(await motion.properties({ slot: "avatar-image" })).not.toContain("transform");
    await expectSettled(image);
  });

  test("should pulse the skeleton a finite number of times and rest fully opaque", async ({ page }) => {
    await page.goto("/polish.html");
    const skeleton = page.getByRole("status", { name: "Cargando resumen" }).locator('[data-slot="skeleton"]');
    // Arc's pulse dims the box itself on the compositor, then rests: it never loops forever.
    await expect
      .poll(() =>
        skeleton.evaluate((element) =>
          element.getAnimations().map((animation) => ({
            pseudoElement: (animation.effect as KeyframeEffect).pseudoElement,
            iterations: animation.effect?.getTiming().iterations,
          })),
        ),
      )
      .toEqual([{ pseudoElement: null, iterations: 11 }]);
    const opacities = new Set<string>();
    await expect
      .poll(async () => {
        opacities.add(await skeleton.evaluate((element) => getComputedStyle(element).opacity));
        return opacities.size;
      })
      .toBeGreaterThan(1);
    // Jumps to the end of the pulse instead of waiting about 20 seconds for it to rest.
    await skeleton.evaluate((element) => element.getAnimations().forEach((animation) => animation.finish()));
    await expectSettled(skeleton);
  });

  test("should blink an idle typing cursor that assistive technology ignores", async ({ page }) => {
    await page.goto("/polish.html");
    const typing = page.locator('[data-slot="typing-animation"]');
    await expect(typing).toContainText("Hola");
    const cursor = page.locator('[data-slot="typing-animation-cursor"]');
    await expect(cursor).toHaveAttribute("aria-hidden", "true");
    // Paused after the first word, the caret blinks. Sampling every frame for a cycle and a half
    // (not with a backing-off poll, whose interval can match the blink period) must see it both
    // shown and hidden.
    const { lowest, highest } = await cursor.evaluate(
      (element) =>
        new Promise<{ lowest: number; highest: number }>((resolve) => {
          const startedAt = performance.now();
          let lowest = 1;
          let highest = 0;
          const sample = () => {
            const opacity = Number.parseFloat(getComputedStyle(element).opacity);
            lowest = Math.min(lowest, opacity);
            highest = Math.max(highest, opacity);
            if (performance.now() - startedAt < 1500) requestAnimationFrame(sample);
            else resolve({ lowest, highest });
          };
          requestAnimationFrame(sample);
        }),
    );
    expect(highest).toBeGreaterThan(0.9);
    expect(lowest).toBeLessThan(0.1);
  });

  test("should close the sheet on Arc's drawer tween without popping its close button in", async ({ page }) => {
    const timings = await recordTimings(page);
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    await page.getByRole("button", { name: "Abrir ajustes" }).click();
    const sheet = page.getByRole("dialog", { name: "Ajustes" });
    await expect(sheet).toBeVisible();
    await expectSettled(sheet);
    expect(await motion.properties({ buttonText: "Close" })).not.toContain("scale");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Motion creates the exit on its next frame; the entrance is the first record.
    await expect.poll(async () => (await timings("sheet-content")).length).toBeGreaterThan(1);
    const exit = (await timings("sheet-content")).at(-1);
    expect(exit).toMatchObject({ duration: 240 });
    expect(String(exit?.easing).replaceAll(" ", "")).not.toBe("cubic-bezier(0.32,0.72,0,1)");
    await expect(page.getByRole("button", { name: "Abrir ajustes" })).toBeFocused();
  });

  test("should never clip the menu outline or shadow while it opens", async ({ page }) => {
    await page.goto("/polish.html");
    await page.evaluate(() => {
      const clips: string[] = [];
      const sample = () => {
        const menu = document.querySelector('[role="menu"]');
        if (menu) clips.push(getComputedStyle(menu).clipPath);
        if (clips.length < 60) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      Object.assign(window, { __clips: clips });
    });
    await page.getByRole("button", { name: "Más acciones" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __clips: string[] }).__clips.length)).toBeGreaterThanOrEqual(60);
    // Arc's menu grows from the trigger with a scale and a fade, never with a clip.
    const clips = await page.evaluate(() => (window as unknown as { __clips: string[] }).__clips);
    expect(new Set(clips)).toEqual(new Set(["none"]));
  });

  test("should glide the menu highlight for the pointer and jump it for the keyboard", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    await page.getByRole("button", { name: "Más acciones" }).click();
    const rename = page.getByRole("menuitem", { name: "Renombrar" });
    const duplicate = page.getByRole("menuitem", { name: "Duplicar" });
    const archive = page.getByRole("menuitem", { name: "Archivar" });
    await rename.focus();
    await page.keyboard.press("ArrowDown");
    await expect(duplicate).toHaveAttribute("data-highlighted", "");
    await page.keyboard.press("ArrowDown");
    await expect(archive).toHaveAttribute("data-highlighted", "");
    expect(await motion.glides()).not.toContain("dropdown-menu-content");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
    await rename.hover();
    await duplicate.hover();
    await expect(duplicate).toHaveAttribute("data-highlighted", "");
    await expect.poll(motion.glides).toContain("dropdown-menu-content");
    await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  });

  test("should lift an interactive card with Arc's raised shadow and keep its outline", async ({ page }) => {
    await page.goto("/polish.html");
    const canHover = await page.evaluate(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    test.skip(!canHover, "Touch viewports have no hover lift by design.");
    const card = page.getByLabel("Resumen del mes");
    const restingShadow = await card.evaluate((element) => getComputedStyle(element).boxShadow);
    expect(restingShadow).toContain("0px 0px 0px 1px");
    await card.hover();
    await expect
      .poll(() => card.evaluate((element) => getComputedStyle(element).translate))
      .toBe("0px -2px");
    await expect
      .poll(() => card.evaluate((element) => getComputedStyle(element).boxShadow))
      .toMatch(/0px 0px 0px 1px.*0px 6px 18px/);
    expect(await card.evaluate((element) => element.style.boxShadow)).toBe("");
    await page.mouse.move(0, 0);
    await expect.poll(() => card.evaluate((element) => getComputedStyle(element).boxShadow)).toBe(restingShadow);
  });

  test("should lift the hovered avatar of a group and name it on real hover pointers", async ({ page }) => {
    await page.goto("/polish.html");
    const canHover = await page.evaluate(() => window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    test.skip(!canHover, "Touch viewports have no hover lift by design.");
    const avatar = page.getByRole("group", { name: "Equipo" }).getByRole("img", { name: "Lucía Uriarte" });
    const lift = avatar.locator("xpath=..");
    await avatar.hover();
    await expect
      .poll(() => lift.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).f))
      .toBeCloseTo(-2, 1);
    await expect(lift.getByText("Lucía Uriarte", { exact: true })).toHaveCSS("opacity", "1");
  });
});

test("should draw unstyled borders with the theme border token instead of the text color", async ({ page }) => {
  await page.goto("/polish.html");
  const footer = page.getByLabel("Resumen del mes").locator('[data-slot="card-footer"]');
  const [borderColor, tokenColor, textColor] = await footer.evaluate((element) => {
    const probe = document.createElement("div");
    probe.style.borderColor = "var(--border)";
    document.body.append(probe);
    const token = getComputedStyle(probe).borderTopColor;
    probe.remove();
    return [getComputedStyle(element).borderTopColor, token, getComputedStyle(element).color];
  });
  expect(borderColor).toBe(tokenColor);
  expect(borderColor).not.toBe(textColor);
});

test.describe("with reduced motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("should change months, reveal avatars and page without animating", async ({ page }) => {
    const motion = await recordMotion(page);
    await page.goto("/polish.html");
    await page.getByRole("button", { name: /siguiente/i }).click();
    await expect(page.locator('[data-slot="calendar-month"]')).toContainText("febrero 2026");
    await page.getByRole("button", { name: "Cargar foto" }).click();
    await expect(page.getByRole("img", { name: "Foto de Ana" })).toBeVisible();
    await page.getByRole("link", { name: "Página 2" }).click();
    await expect(page.getByRole("link", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
    expect(await motion.properties({ slot: "calendar-month" })).toEqual([]);
    expect(await motion.properties({ slot: "avatar-image" })).toEqual([]);
    expect(await motion.glides()).toEqual([]);
    expect(
      await page
        .getByLabel("Cargando resumen")
        .evaluate((element) => element.getAnimations({ subtree: true }).length),
    ).toBe(0);
    await expect(page.locator('[data-slot="typing-animation"]')).toHaveText("Hola · Chau");
  });
});
