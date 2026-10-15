/** Verifies motion and its accessible fallback in real browser layout and interactions. */
import { expect, test, type Page } from "@playwright/test";
import { recordMotion } from "./motion-recorder.js";

test("should animate menus and dialogs while preserving keyboard dismissal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  // Record native animations when created: sampling frames can miss short playback
  // entirely when WebKit is busy. Delegate unchanged to the real browser API.
  const animatedRoles = await page.evaluateHandle(() => {
    const observed = new Set<string>();
    const nativeAnimate = Element.prototype.animate;

    /** Observes real animations without replacing their effects, timing or controls. */
    Element.prototype.animate = function (...args) {
      const animation = nativeAnimate.apply(this, args);
      const role = this.getAttribute("role");
      if ((role === "menu" || role === "dialog") && animation.effect) {
        observed.add(role);
      }
      return animation;
    };
    return {
      observed,
      stop: () => {
        Element.prototype.animate = nativeAnimate;
      },
    };
  });
  try {
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect
      .poll(() => animatedRoles.evaluate(({ observed }) => observed.has("menu")))
      .toBe(true);
    await page.getByRole("menuitem", { name: "Editar" }).click();
    await expect(page.getByLabel("Acción")).toHaveText("Edición seleccionada");
    await expect(page.getByRole("menu")).not.toBeVisible();
    // Exit presence must release the menu's focus scope before opening another modal.
    await expect(page.getByRole("menu", { includeHidden: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Abrir diálogo" }).click();
    const dialog = page.getByRole("dialog");
    await expect
      .poll(() => animatedRoles.evaluate(({ observed }) => observed.has("dialog")))
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Abrir diálogo" }),
    ).toBeFocused();
  } finally {
    await animatedRoles.evaluate(({ stop }) => stop());
    await animatedRoles.dispose();
  }
});

test("should press buttons by their width, keep menu triggers still and not animate disabled actions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const button = page.getByRole("button", {
    name: "Acción principal",
    exact: true,
  });
  await button.hover();
  // Arc answers hover with color only; the scale is reserved for the press.
  await expect(button).toHaveCSS("transform", "none");
  const width = (await button.boundingBox())!.width;
  // Wide buttons press a little less so large surfaces don't feel spongy.
  const pressScale = width > 220 ? 0.985 : 0.97;
  await page.mouse.down();
  await expect(button).toHaveCSS("transform", `matrix(${pressScale}, 0, 0, ${pressScale}, 0, 0)`);
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await expect(button).toHaveCSS("transform", "none");

  // Menu triggers never scale, so the menu never measures a shrunken anchor.
  // The open menu hides the rest of the page from the accessibility tree, so keep a handle to the node.
  const trigger = await page.getByRole("button", { name: "Abrir menú", exact: true }).elementHandle();
  await trigger!.hover();
  await page.mouse.down();
  const triggerTransforms = await trigger!.evaluate(async (element: HTMLElement) => {
    const samples: string[] = [];
    for (let frame = 0; frame < 15; frame += 1) {
      await new Promise(requestAnimationFrame);
      samples.push(getComputedStyle(element).transform);
    }
    return samples;
  });
  expect(triggerTransforms.every((transform) => transform === "none")).toBe(true);
  await page.mouse.up();
  await page.keyboard.press("Escape");
  const disabled = page.getByRole("button", {
    name: "Acción deshabilitada",
    exact: true,
  });
  const bounds = (await disabled.boundingBox())!;
  // Disabled buttons deliberately reject pointer events; move the real pointer over their bounds.
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await expect(disabled).toBeDisabled();
  await page.mouse.down();
  await expect(disabled).toHaveCSS("transform", "none");
  await page.mouse.up();
});
test("should glide the tab indicator and hand the highlight back to the active tab", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const detail = page.getByRole("tab", { name: "Detalle" });
  const activeBackground = await page
    .getByRole("tab", { name: "Resumen" })
    .evaluate((tab) => getComputedStyle(tab).backgroundColor);
  await detail.click();
  await expect.poll(motion.glides).toContain("tabs-list");
  await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  await expect(detail).toHaveAttribute("aria-selected", "true");
  await expect(detail).not.toHaveAttribute("data-glide-target");
  await expect(detail).toHaveCSS("background-color", activeBackground);
  await expect(page.getByText("Contenido del detalle")).toBeVisible();
  await expect
    .poll(() => motion.properties({ role: "tabpanel" }))
    .toContain("transform");
});

test("should glide the menu highlight between items with the keyboard", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menuitem", { name: "Duplicar" })).toBeFocused();
  await expect.poll(motion.glides).toContain("dropdown-menu-content");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Acción")).toHaveText("Copia seleccionada");
  await expect
    .poll(() => motion.properties({ role: "menu" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "clipPath"]));
});

test("should pop and draw the checkbox mark and blur it out when unchecked", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const checkbox = page.getByRole("checkbox", { name: "Recibir novedades" });
  const mark = page.locator("[data-slot=checkbox-indicator] path");
  // Arc's fill: the square behind the mark that springs in when the box is checked.
  const fill = page.locator("[data-slot=checkbox-visual] > span");
  /** Fraction of the mark's stroke drawn, from the first length of Motion's normalised dash pattern. */
  const drawnLength = () => mark.evaluate((path) => Number.parseFloat(path.getAttribute("stroke-dasharray") ?? "0"));
  /** Scale the fill renders with: `1` when it has no transform. */
  const fillScale = () =>
    fill.evaluate((element) => {
      const transform = getComputedStyle(element).transform;
      return transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
    });
  await expect(mark).toHaveCSS("opacity", "0");
  await expect(fill).toHaveCSS("opacity", "0");

  // Samples the fill's scale on every frame from the check on, inside the page so test latency skips none.
  await fill.evaluate((element) => {
    const scales: number[] = [];
    const sample = () => {
      const transform = getComputedStyle(element).transform;
      scales.push(transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a);
      if (scales.length < 120) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    Object.assign(window, { __fillScales: scales });
  });
  await checkbox.check();
  await expect(mark).toHaveCSS("opacity", "1");
  await expect(fill).toHaveCSS("opacity", "1");
  await expect.poll(drawnLength).toBeCloseTo(1, 2);
  await expect.poll(fillScale).toBe(1);
  // The fill pops up from a smaller square instead of appearing at full size.
  const fillScales = await page.evaluate(() => (window as unknown as { __fillScales: number[] }).__fillScales);
  expect(fillScales.some((scale) => scale > 0.65 && scale < 0.99)).toBe(true);

  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
  await expect(mark).toHaveCSS("opacity", "0");
  await expect(fill).toHaveCSS("opacity", "0");
  await expect.poll(drawnLength).toBeCloseTo(0, 2);

  // Re-checking after the exit, and toggling faster than the stroke draws, must still
  // settle on a fully drawn mark over a full fill.
  await checkbox.check();
  await checkbox.click();
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(mark).toHaveCSS("opacity", "1");
  await expect(fill).toHaveCSS("opacity", "1");
  await expect.poll(drawnLength).toBeCloseTo(1, 2);
  await expect.poll(fillScale).toBe(1);
});

test("should spring the switch thumb, blur in tooltips and shake invalid fields", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const toggle = page.getByRole("switch", { name: "Modo compacto" });
  const thumb = page.locator("[data-slot=switch-thumb]");
  const uncheckedLeft = (await thumb.boundingBox())!.x;
  // Samples the thumb's left edge on every frame from the press on, inside the page so test latency skips none.
  await thumb.evaluate((element) => {
    const lefts: number[] = [];
    const sample = () => {
      lefts.push(element.getBoundingClientRect().left);
      if (lefts.length < 120) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    Object.assign(window, { __thumbLefts: lefts });
  });
  await toggle.click();
  await expect(toggle).toBeChecked();
  // Arc's thumb springs to the far end of the track and rests there: 18px of travel, held by its transform.
  await expect
    .poll(() => thumb.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).e))
    .toBeCloseTo(18, 0);
  const lefts = await page.evaluate(() => (window as unknown as { __thumbLefts: number[] }).__thumbLefts);
  expect(lefts.some((left) => left - uncheckedLeft > 1 && left - uncheckedLeft < 17)).toBe(true);

  // Arc's tooltip enters with transform and opacity only, without a blur.
  await page.getByRole("button", { name: "Ayuda" }).focus();
  await expect(page.getByRole("tooltip")).toHaveText("Explicación breve");
  await expect
    .poll(() => motion.properties({ slot: "tooltip-content" }))
    .toEqual(expect.arrayContaining(["transform", "opacity"]));
  expect(await motion.properties({ slot: "tooltip-content" })).not.toContain("filter");

  await page.getByRole("button", { name: "Validar correo" }).click();
  const email = page.getByRole("textbox", { name: "Correo" });
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect
    .poll(() => motion.properties({ slot: "input" }))
    .toContain("transform");
  await expect(email).toHaveCSS("transform", "none");
});

test("should switch tabs and toggle marks without gliding when motion is reduced", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  await page.getByRole("tab", { name: "Detalle" }).click();
  await expect(page.getByText("Contenido del detalle")).toBeVisible();
  await page.getByRole("checkbox", { name: "Recibir novedades" }).check();
  await expect(page.locator("[data-slot=checkbox-indicator]")).toHaveCSS("opacity", "1");
  expect(await motion.glides()).toEqual([]);
});

test("should honor reduced motion and show readable text immediately", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motion.html");
  await expect(
    page.getByText("Lectura sin esperas", { exact: true }),
  ).toBeVisible({ timeout: 2000 });
  expect(
    await page
      .locator('[data-slot="skeleton"]')
      .evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await page.getByRole("button", { name: "Abrir menú" }).click();
  expect(
    await page
      .getByRole("menu")
      .evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await page.getByRole("menuitem", { name: "Editar" }).click();
  await expect(page.getByLabel("Acción")).toHaveText("Edición seleccionada");
  await page.getByRole("button", { name: "Actualizar texto" }).click();
  await expect(
    page.getByText("Texto actualizado", { exact: true }),
  ).toBeVisible({ timeout: 2000 });
  await page.getByRole("checkbox", { name: "Recibir novedades" }).check();
  await expect(
    page.getByRole("checkbox", { name: "Recibir novedades" }),
  ).toBeChecked();
});

test("should respond when the system motion preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  await expect(
    page.getByRole("heading", { name: "Movimiento compartido" }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByText("Lectura sin esperas", { exact: true }),
  ).toBeVisible({ timeout: 2000 });
});

test("should turn the select chevron and stagger its options in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const trigger = page.getByRole("combobox", { name: "Moneda" });
  // An open Select hides everything outside its listbox from the accessibility tree.
  const chevron = page.locator("[data-slot=select-icon]");
  await expect(chevron).toHaveCSS("rotate", "none");
  await trigger.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(chevron).toHaveCSS("rotate", "180deg");
  await expect
    .poll(() => motion.properties({ slot: "select-icon" }))
    .toContain("transform");
  await expect
    .poll(() => motion.properties({ slot: "select-item" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "filter"]));
  await page.getByRole("option", { name: "Dólares" }).click();
  await expect(page.locator("[data-slot=select-trigger]")).toHaveText("Dólares");
  await expect(chevron).toHaveCSS("rotate", "none");
  await expect(chevron).toHaveCSS("transform", "none");
});

test("should pop the check of a menu checkbox item", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  await page.getByRole("button", { name: "Abrir menú" }).click();
  const archived = page.getByRole("menuitemcheckbox", { name: "Mostrar archivados" });
  await archived.click();
  await expect(archived).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(() =>
      motion.properties({ parentSlot: "dropdown-menu-checkbox-item-indicator" }),
    )
    .toEqual(expect.arrayContaining(["opacity", "transform"]));
});

test("should rotate the group chevron of the data table instead of swapping icons", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const group = page.getByRole("button", { name: "ARS (2)" });
  const chevron = group.locator("svg");
  await expect(group).toHaveAttribute("aria-expanded", "true");
  await expect(chevron).toHaveCSS("rotate", "90deg");
  await group.click();
  await expect(group).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("cell", { name: "Luz" })).toHaveCount(0);
  await expect(chevron).toHaveCSS("rotate", "none");
  await expect
    .poll(() => motion.properties({ buttonText: "ARS (2)" }))
    .toContain("transform");
  await expect(chevron).toHaveCSS("transform", "none");
});

test("should blur-swap the theme icon and pop in the dialog close button", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await page.getByRole("menuitemradio", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect
    .poll(() => motion.properties({ buttonText: "Alternar tema" }))
    .toEqual(expect.arrayContaining(["opacity", "transform", "filter"]));
  await expect(
    page.getByRole("button", { name: "Alternar tema" }).locator("svg"),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Abrir diálogo" }).click();
  const close = page.locator("[data-slot=dialog-close]");
  await expect
    .poll(() => motion.properties({ buttonText: "Cerrar" }))
    .toEqual(expect.arrayContaining(["opacity", "scale"]));
  await expect(close).toHaveCSS("opacity", "1");
  await expect(close).toHaveCSS("transform", "none");
  await close.click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

/** Clip keyframes and duration Motion handed to the browser for one dialog animation. */
type DialogClipPlayback = { clipPath: string[]; otherProperties: string[]; durationMs: number };

/** One painted frame of a closing dialog: whether its layers still take input, and the page does. */
type FoldSample = { isContentInert: boolean; isOverlayInert: boolean; bodyPointerEvents: string };

/**
 * Records the keyframes of every native dialog animation as it is created, delegating unchanged
 * to the real browser API so the playback itself is never altered.
 */
async function recordDialogClips(page: Page) {
  const handle = await page.evaluateHandle(() => {
    const recorded: DialogClipPlayback[] = [];
    const nativeAnimate = Element.prototype.animate;
    const timingKeys = ["clipPath", "offset", "easing", "composite", "computedOffset"];

    /** Observes real dialog animations without replacing their effects, timing or controls. */
    Element.prototype.animate = function (...args) {
      const animation = nativeAnimate.apply(this, args);
      if (this.getAttribute("role") === "dialog" && animation.effect instanceof KeyframeEffect) {
        const frames = animation.effect.getKeyframes();
        recorded.push({
          clipPath: frames.map((frame) => String(frame.clipPath ?? "")).filter(Boolean),
          otherProperties: frames.flatMap((frame) =>
            Object.keys(frame).filter((property) => !timingKeys.includes(property)),
          ),
          durationMs: Number(animation.effect.getTiming().duration),
        });
      }
      return animation;
    };
    return {
      recorded,
      stop: () => {
        Element.prototype.animate = nativeAnimate;
      },
    };
  });
  return {
    /** Waits for the animation recorded at a position and returns it. */
    at: async (index: number) => {
      await expect
        .poll(() => handle.evaluate(({ recorded }, position) => recorded.length > position, index))
        .toBe(true);
      return handle.evaluate(({ recorded }, position) => recorded[position]!, index);
    },
    stop: async () => {
      await handle.evaluate(({ stop }) => stop());
      await handle.dispose();
    },
  };
}

/** Matches an `inset()` clip that keeps the given share of the surface hidden on every side. */
const insetOnEverySide = (percent: number) =>
  new RegExp(`^inset\\(${percent}%( ${percent}%){0,3} round `);

test("should unfold the dialog from its center and fold it back when it closes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const playback = await recordDialogClips(page);

  try {
    await page.getByRole("button", { name: "Abrir diálogo" }).click();
    const dialog = page.getByRole("dialog");
    const opening = await playback.at(0);
    expect(opening.clipPath[0]).toMatch(insetOnEverySide(48));
    expect(opening.clipPath.at(-1)).not.toMatch(insetOnEverySide(48));
    // The surface unfolds in place: it neither fades nor travels while it opens.
    expect(opening.otherProperties).toEqual([]);
    await expect(dialog).toHaveCSS("clip-path", "none");
    await expect(dialog).toHaveCSS("opacity", "1");
    await expect(dialog).toHaveCSS("transform", "none");

    // Samples every frame of the fold, started before Escape so the first one is never missed.
    const foldSamples = page.evaluate(
      () =>
        new Promise<FoldSample[]>((resolve) => {
          const samples: FoldSample[] = [];
          let sawDialog = false;
          const tick = () => {
            const content = document.querySelector("[data-slot=dialog-content]");
            const overlay = document.querySelector("[data-slot=dialog-overlay]");
            if (content && content.getAttribute("data-state") === "closed") {
              samples.push({
                isContentInert: content.hasAttribute("inert"),
                isOverlayInert: overlay?.hasAttribute("inert") ?? true,
                bodyPointerEvents: getComputedStyle(document.body).pointerEvents,
              });
            }
            if (content) sawDialog = true;
            if (sawDialog && !content) resolve(samples);
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
    );
    await page.keyboard.press("Escape");
    const closing = await playback.at(1);
    expect(closing.clipPath.at(-1)).toMatch(insetOnEverySide(48));
    expect(closing.otherProperties).toEqual([]);
    // Folding is brief, so focus and the rest of the page come back sooner than the unfold took.
    expect(closing.durationMs).toBeLessThan(opening.durationMs);
    // While it folds, the dialog no longer takes input and the page already does.
    const samples = await foldSamples;
    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample).toEqual({
        isContentInert: true,
        isOverlayInert: true,
        bodyPointerEvents: expect.not.stringMatching(/^none$/),
      });
    }
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir diálogo" })).toBeFocused();
  } finally {
    await playback.stop();
  }
});

test("should keep every corner of a custom dialog shape while it unfolds", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const playback = await recordDialogClips(page);

  try {
    await page.getByRole("button", { name: "Abrir ficha" }).click();
    const opening = await playback.at(0);
    const unfolded = opening.clipPath.at(-1)!;
    // Square left corners and rounded right ones must reach the clip as different radii.
    const horizontalRadii = unfolded
      .slice(unfolded.indexOf(" round ") + " round ".length, -1)
      .split(" / ")[0]!
      .match(/calc\([^)]*\)|\S+/g)!;
    // Browsers serialize the shortest equivalent list, so expand it like the CSS shorthand.
    const [topLeft, topRight = topLeft, bottomRight = topLeft, bottomLeft = topRight] = horizontalRadii;
    expect(topLeft).toBe(bottomLeft);
    expect(topRight).toBe(bottomRight);
    expect(topLeft).not.toBe(topRight);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    await playback.stop();
  }
});

/** One painted frame of the dialog close button. */
type CloseButtonSample = {
  opacity: number;
  top: number;
  right: number;
  viewportWidth: number;
  isFocused: boolean;
};
/** Viewport inset of the corner-pinned close button (Tailwind `top-4`/`right-4`). */
const CLOSE_BUTTON_CORNER_INSET_PX = 16;

test("should only show a viewport-placed dialog close button at the viewport corner", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  /** Samples every frame the close button paints with, while the panel opens or closes. */
  const sampleCloseButton = (durationMs: number) =>
    page.evaluate(
      (duration) =>
        new Promise<CloseButtonSample[]>(
          (resolve) => {
            const samples: CloseButtonSample[] = [];
            const start = performance.now();
            const tick = () => {
              const close = document.querySelector<HTMLElement>("[data-slot=dialog-close]");
              if (close) {
                const box = close.getBoundingClientRect();
                samples.push({
                  opacity: Number(getComputedStyle(close).opacity),
                  top: box.top,
                  right: box.right,
                  viewportWidth: document.documentElement.clientWidth,
                  isFocused: document.activeElement === close,
                });
              }
              if (performance.now() - start < duration) requestAnimationFrame(tick);
              else resolve(samples);
            };
            requestAnimationFrame(tick);
          },
        ),
      durationMs,
    );
  const expectOnlyVisibleAtCorner = (samples: CloseButtonSample[]) => {
    const visible = samples.filter((sample) => sample.opacity > 0);
    for (const sample of visible) {
      expect(sample.top).toBeCloseTo(CLOSE_BUTTON_CORNER_INSET_PX, 0);
      expect(sample.viewportWidth - sample.right).toBeCloseTo(CLOSE_BUTTON_CORNER_INSET_PX, 0);
    }
    return visible;
  };

  await page.getByRole("button", { name: "Abrir detalle" }).click();
  const opening = await sampleCloseButton(1200);
  expect(expectOnlyVisibleAtCorner(opening).length).toBeGreaterThan(0);
  // The dialog's initial focus must never land on the close button while it is hidden,
  // or keyboard users would act on a control they cannot see.
  expect(opening.filter((sample) => sample.isFocused && sample.opacity === 0)).toEqual([]);
  const close = page.getByRole("button", { name: "Cerrar" });
  await expect(close).toHaveCSS("opacity", "1");

  await close.click();
  const closing = await sampleCloseButton(400);
  expectOnlyVisibleAtCorner(closing);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("should keep chevrons in their final orientation without animating when motion is reduced", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const trigger = page.getByRole("combobox", { name: "Moneda" });
  await trigger.click();
  await expect(page.locator("[data-slot=select-icon]")).toHaveCSS("rotate", "180deg");
  await expect(page.getByRole("option", { name: "Pesos" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "ARS (2)" }).click();
  await expect(
    page.getByRole("button", { name: "ARS (2)" }).locator("svg"),
  ).toHaveCSS("rotate", "none");
  expect(await motion.properties({ slot: "select-icon" })).toEqual([]);
  expect(await motion.properties({ slot: "select-item" })).toEqual([]);
  expect(await motion.properties({ buttonText: "ARS (2)" })).toEqual([]);
});

test("should spring the button width to a new label instead of jumping", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const button = page.getByRole("button", { name: "Guardar", exact: true });

  // Measure the starting width in the same task as the click, after the first measurement settled.
  const { startWidth, widths } = await button.evaluate(async (element: HTMLElement) => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    const startWidth = element.getBoundingClientRect().width;
    const samples: number[] = [];
    element.click();
    const startedAt = performance.now();
    // Sample every frame while the morph spring runs.
    while (performance.now() - startedAt < 600) {
      await new Promise(requestAnimationFrame);
      samples.push(element.getBoundingClientRect().width);
    }
    return { startWidth, widths: samples };
  });

  const endWidth = widths.at(-1)!;
  expect(endWidth).toBeGreaterThan(startWidth);
  expect(widths.some((width) => width > startWidth + 1 && width < endWidth - 1)).toBe(true);
  await expect(page.getByRole("button", { name: "Borrador guardado en tu cuenta", exact: true })).toBeVisible();
});

test("should swap a button label without animating its width when motion is reduced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motion.html");
  const button = page.getByRole("button", { name: "Guardar", exact: true });

  // Measure the starting width in the same task as the click, after the first measurement settled.
  const { startWidth, widths } = await button.evaluate(async (element: HTMLElement) => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    const startWidth = element.getBoundingClientRect().width;
    const samples: number[] = [];
    element.click();
    for (let frame = 0; frame < 20; frame += 1) {
      await new Promise(requestAnimationFrame);
      samples.push(element.getBoundingClientRect().width);
    }
    return { startWidth, widths: samples };
  });

  const endWidth = widths.at(-1)!;
  expect(endWidth).toBeGreaterThan(startWidth);
  // The new width is reached at once: every sample after the first resize is already final.
  const firstResized = widths.findIndex((width) => width !== startWidth);
  expect(widths.slice(firstResized).every((width) => Math.abs(width - endWidth) < 1)).toBe(true);
});
