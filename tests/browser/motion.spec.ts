/** Verifies motion and its accessible fallback in real browser layout and interactions. */
import { expect, test, type Page } from "@playwright/test";
import { recordMotion, samplePaintedBoxes, waitForSettledLayout } from "./motion-recorder.js";

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
  // Arc slides the entering panel with Motion's `x`, driven per frame rather than through
  // Element.animate, so its painted offset is sampled on every frame from before the click.
  await page.evaluate(() => {
    const offsets: number[] = [];
    Object.assign(window, { __panelOffsets: offsets });
    const sample = () => {
      const panel = document.querySelector<HTMLElement>(
        '[role="tabpanel"]:not([aria-hidden="true"])',
      );
      if (panel) offsets.push(new DOMMatrix(getComputedStyle(panel).transform).m41);
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await detail.click();
  await expect.poll(motion.glides).toContain("tabs-list");
  await expect(page.locator("[data-glide-indicator]")).toHaveCount(0);
  await expect(detail).toHaveAttribute("aria-selected", "true");
  await expect(detail).not.toHaveAttribute("data-glide-target");
  await expect(detail).toHaveCSS("background-color", activeBackground);
  await expect(page.getByText("Contenido del detalle")).toBeVisible();
  // Moving to a later tab slides the panel in from the right and settles it in place.
  await expect
    .poll(() =>
      page.evaluate(() =>
        Math.max(...(window as unknown as { __panelOffsets: number[] }).__panelOffsets),
      ),
    )
    .toBeGreaterThan(0);
  await expect(page.getByRole("tabpanel")).toHaveCSS("transform", "none");
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
  // A loaded machine can take longer than an assertion's default wait to mount the page.
  await expect(checkbox).toBeVisible({ timeout: 15_000 });
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

  // Reads the fill's scale at the very moment the box reports the new state, before any frame can advance it.
  await fill.evaluate((element) => {
    const box = element.closest("[data-slot=checkbox]")!;
    const observer = new MutationObserver(() => {
      if (box.getAttribute("data-state") !== "checked") return;
      const transform = getComputedStyle(element).transform;
      Object.assign(window, { __fillScaleOnCheck: transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a });
      observer.disconnect();
    });
    observer.observe(box, { attributes: true, attributeFilter: ["data-state"] });
  });
  await checkbox.check();
  await expect(mark).toHaveCSS("opacity", "1");
  await expect(fill).toHaveCSS("opacity", "1");
  await expect.poll(drawnLength).toBeCloseTo(1, 2);
  await expect.poll(fillScale).toBe(1);
  // The fill pops up from its smaller hidden square to full size instead of appearing at full size.
  const fillScaleOnCheck = await page.evaluate(() => (window as unknown as { __fillScaleOnCheck: number }).__fillScaleOnCheck);
  expect(fillScaleOnCheck).toBeCloseTo(0.6, 2);

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

test("should spring the switch thumb, enter tooltips without blur and keep invalid fields in place", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const motion = await recordMotion(page);
  await page.goto("/motion.html");
  const toggle = page.getByRole("switch", { name: "Modo compacto" });
  const thumb = page.locator("[data-slot=switch-thumb]");
  // Positions are read against the track, so a page that still shifts around the switch cannot skew them.
  const offsetInTrack = () =>
    thumb.evaluate((element) => {
      const track = element.closest("[data-slot=switch-track]")!;
      return element.getBoundingClientRect().left - track.getBoundingClientRect().left;
    });
  const uncheckedOffset = await offsetInTrack();
  // Reads the thumb's offset at the very moment the switch reports the new state, before any frame can advance it.
  await thumb.evaluate((element) => {
    const track = element.closest("[data-slot=switch-track]")!;
    const observer = new MutationObserver(() => {
      if (element.getAttribute("data-state") !== "checked") return;
      Object.assign(window, { __thumbOffsetOnCheck: element.getBoundingClientRect().left - track.getBoundingClientRect().left });
      observer.disconnect();
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-state"] });
  });
  await toggle.click();
  await expect(toggle).toBeChecked();
  // Arc's thumb springs to the far end of the track and rests there: 18px of travel, held by its transform.
  await expect
    .poll(() => thumb.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).e))
    .toBeCloseTo(18, 0);
  await expect.poll(async () => (await offsetInTrack()) - uncheckedOffset).toBeCloseTo(18, 0);
  // The thumb travels there from where it was instead of jumping to the end with the new state.
  const offsetOnCheck = await page.evaluate(() => (window as unknown as { __thumbOffsetOnCheck: number }).__thumbOffsetOnCheck);
  expect(offsetOnCheck).toBeCloseTo(uncheckedOffset, 0);

  // Arc's tooltip enters with transform and opacity only, without a blur.
  await page.getByRole("button", { name: "Ayuda" }).focus();
  await expect(page.getByRole("tooltip")).toHaveText("Explicación breve");
  await expect
    .poll(() => motion.properties({ slot: "tooltip-content" }))
    .toEqual(expect.arrayContaining(["transform", "opacity"]));
  expect(await motion.properties({ slot: "tooltip-content" })).not.toContain("filter");

  // Turning invalid recolors the field without moving it: every frame paints it where it was.
  await waitForSettledLayout(page.getByRole("textbox", { name: "Correo" }));
  const emailBoxes = samplePaintedBoxes(page, '[aria-label="Correo"]', 600, {
    from: '[aria-label="Correo"][aria-invalid="true"]',
  });
  await page.getByRole("button", { name: "Validar correo" }).click();
  const email = page.getByRole("textbox", { name: "Correo" });
  await expect(email).toHaveAttribute("aria-invalid", "true");
  const boxes = await emailBoxes;
  expect(boxes.length).toBeGreaterThan(1);
  for (const box of boxes) {
    expect(box.x).toBeCloseTo(boxes[0]!.x, 1);
    expect(box.y).toBeCloseTo(boxes[0]!.y, 1);
  }
  expect(await motion.properties({ slot: "input" })).not.toContain("transform");
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

test("should turn the select chevron and fade its options in without blur", async ({ page }) => {
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
    .toEqual(expect.arrayContaining(["opacity", "transform"]));
  expect(await motion.properties({ slot: "select-item" })).not.toContain("filter");
  await expect(page.getByRole("option", { name: "Dólares" })).toHaveCSS("transform", "none");
  await expect(page.getByRole("option", { name: "Dólares" })).toHaveCSS("opacity", "1");
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

test("should swap the theme icon with a fade and scale and pop in the dialog close button", async ({
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
    .toEqual(expect.arrayContaining(["opacity", "transform"]));
  expect(await motion.properties({ buttonText: "Alternar tema" })).not.toContain("filter");
  const themeIcon = page.getByRole("button", { name: "Alternar tema" }).locator("svg");
  await expect(themeIcon).toHaveCount(1);
  await expect(themeIcon).toHaveCSS("transform", "none");
  await expect(themeIcon).toHaveCSS("opacity", "1");

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

/** One native animation Motion handed to the browser for a dialog panel. */
type DialogPlayback = {
  /** Animated properties, without timing keys. */
  properties: string[];
  /** Opacity of each keyframe, when the animation drives it. */
  opacity: number[];
  /** Vertical offset and scale of each transform keyframe, when the animation drives the transform. */
  transforms: { translateY: number; scale: number }[];
  durationMs: number;
};

/** One painted frame of a closing dialog: whether its layers still take input, and the page does. */
type LeaveSample = { isContentInert: boolean; isOverlayInert: boolean; bodyPointerEvents: string };

/** Arc's dialog: the panel rises 8px and scales from 0.96 on the way in, drops 4px to 0.98 on the way out. */
const DIALOG_ENTER = { translateY: 8, scale: 0.96 };
const DIALOG_EXIT = { translateY: 4, scale: 0.98 };
/** Arc's `duration.fast`, in ms: the panel fades in and leaves on it. */
const DIALOG_FAST_MS = 160;

/**
 * Records the keyframes of every native dialog animation as it is created, delegating unchanged
 * to the real browser API so the playback itself is never altered.
 */
async function recordDialogPlayback(page: Page) {
  const handle = await page.evaluateHandle(() => {
    const recorded: DialogPlayback[] = [];
    const nativeAnimate = Element.prototype.animate;
    const timingKeys = ["offset", "easing", "composite", "computedOffset"];

    /** Observes real dialog animations without replacing their effects, timing or controls. */
    Element.prototype.animate = function (...args) {
      const animation = nativeAnimate.apply(this, args);
      if (this.getAttribute("role") === "dialog" && animation.effect instanceof KeyframeEffect) {
        const frames = animation.effect.getKeyframes();
        recorded.push({
          properties: [
            ...new Set(frames.flatMap((frame) => Object.keys(frame).filter((key) => !timingKeys.includes(key)))),
          ],
          opacity: frames.filter((frame) => frame.opacity !== undefined).map((frame) => Number(frame.opacity)),
          transforms: frames
            .filter((frame) => typeof frame.transform === "string")
            .map((frame) => {
              const matrix = new DOMMatrixReadOnly(String(frame.transform));
              return { translateY: matrix.f, scale: matrix.a };
            }),
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
  /** Waits until a playback matching the predicate has been recorded after the given count, and returns it. */
  const find = async (after: number, matches: (playback: DialogPlayback) => boolean) => {
    let found: DialogPlayback | undefined;
    await expect
      .poll(async () => {
        const recorded = await handle.evaluate(({ recorded }) => recorded);
        found = recorded.slice(after).find(matches);
        return found !== undefined;
      })
      .toBe(true);
    return found!;
  };
  return {
    count: () => handle.evaluate(({ recorded }) => recorded.length),
    /** The transform playback recorded after the given count. */
    transformAfter: (after: number) => find(after, (playback) => playback.transforms.length > 0),
    /** The opacity playback recorded after the given count. */
    opacityAfter: (after: number) => find(after, (playback) => playback.opacity.length > 0),
    all: () => handle.evaluate(({ recorded }) => recorded),
    stop: async () => {
      await handle.evaluate(({ stop }) => stop());
      await handle.dispose();
    },
  };
}

test("should rise the dialog in on Arc's transition and let it leave quickly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const playback = await recordDialogPlayback(page);

  try {
    await page.getByRole("button", { name: "Abrir diálogo" }).click();
    const dialog = page.getByRole("dialog");
    const openingMove = await playback.transformAfter(0);
    const openingFade = await playback.opacityAfter(0);
    // The panel rises 8px and grows from 0.96 to rest while it fades in, all at once.
    expect(openingMove.transforms[0]!.translateY).toBeCloseTo(DIALOG_ENTER.translateY, 1);
    expect(openingMove.transforms[0]!.scale).toBeCloseTo(DIALOG_ENTER.scale, 2);
    expect(openingMove.transforms.at(-1)!.translateY).toBeCloseTo(0, 1);
    expect(openingMove.transforms.at(-1)!.scale).toBeCloseTo(1, 2);
    expect(openingFade.opacity[0]).toBe(0);
    expect(openingFade.opacity.at(-1)).toBe(1);
    expect(openingFade.durationMs).toBeCloseTo(DIALOG_FAST_MS, 0);
    // It no longer unfolds behind a clip.
    expect((await playback.all()).flatMap((recorded) => recorded.properties)).not.toContain("clipPath");
    await expect(dialog).toHaveCSS("clip-path", "none");
    await expect(dialog).toHaveCSS("opacity", "1");
    await expect(dialog).toHaveCSS("transform", "none");

    // Samples every frame of the exit, started before Escape so the first one is never missed.
    const leaveSamples = page.evaluate(
      () =>
        new Promise<LeaveSample[]>((resolve) => {
          const samples: LeaveSample[] = [];
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
    const openedCount = await playback.count();
    await page.keyboard.press("Escape");
    const closingMove = await playback.transformAfter(openedCount);
    // It drops 4px and shrinks to 0.98 while it fades out, in Arc's fast timing.
    expect(closingMove.transforms.at(-1)!.translateY).toBeCloseTo(DIALOG_EXIT.translateY, 1);
    expect(closingMove.transforms.at(-1)!.scale).toBeCloseTo(DIALOG_EXIT.scale, 2);
    expect(closingMove.durationMs).toBeCloseTo(DIALOG_FAST_MS, 0);
    // Leaving is brief, so focus and the rest of the page come back sooner than the entrance took.
    expect(closingMove.durationMs).toBeLessThan(openingMove.durationMs);
    // While it leaves, the dialog no longer takes input and the page already does.
    const samples = await leaveSamples;
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

test("should land the dialog where it rests, without a jump or a page shift", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const trigger = page.getByRole("button", { name: "Abrir diálogo" });
  // Held as a node: the open modal hides the page from the accessibility tree, so roles no longer find it.
  const triggerNode = (await trigger.elementHandle())!;
  // Brought into view first, so the click itself never has to scroll the page.
  await triggerNode.scrollIntoViewIfNeeded();
  await waitForSettledLayout(trigger);
  const triggerBefore = (await triggerNode.boundingBox())!;
  const boxes = samplePaintedBoxes(page, "[data-slot=dialog-content]", 900, { origin: "viewport" });
  await trigger.click();
  const painted = await boxes;
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCSS("transform", "none");
  const rest = (await dialog.boundingBox())!;
  expect(painted.length).toBeGreaterThan(1);
  // Every frame stays between the 8px rise and the resting place, centered on it: no overshoot, no drift sideways.
  for (const box of painted) {
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    expect(centerX).toBeCloseTo(rest.x + rest.width / 2, 0);
    expect(centerY).toBeGreaterThanOrEqual(rest.y + rest.height / 2 - 0.5);
    expect(centerY).toBeLessThanOrEqual(rest.y + rest.height / 2 + DIALOG_ENTER.translateY + 0.5);
    expect(box.width).toBeLessThanOrEqual(rest.width + 0.5);
  }
  // The last painted frame is the resting place, so settling never snaps.
  const last = painted.at(-1)!;
  expect(last.x).toBeCloseTo(rest.x, 0);
  expect(last.y).toBeCloseTo(rest.y, 0);
  // The page behind keeps its layout while the dialog is open.
  expect(await triggerNode.boundingBox()).toEqual(triggerBefore);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await triggerNode.boundingBox()).toEqual(triggerBefore);
});

test("should keep a custom dialog shape whole while it enters", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const radii = page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const samples: string[] = [];
        // The window opens once the panel exists, so a slow click never eats its entrance.
        let start: number | null = null;
        const tick = () => {
          const content = document.querySelector("[data-slot=dialog-content]");
          if (content) {
            start ??= performance.now();
            const style = getComputedStyle(content);
            samples.push(`${style.clipPath}|${style.borderTopLeftRadius}|${style.borderTopRightRadius}`);
          }
          if (start === null || performance.now() - start < 900) requestAnimationFrame(tick);
          else resolve(samples);
        };
        tick();
      }),
  );
  await page.getByRole("button", { name: "Abrir ficha" }).click();
  const samples = await radii;
  expect(samples.length).toBeGreaterThan(1);
  // Nothing clips the panel, and its square left and rounded right corners hold on every frame.
  const [first] = samples;
  const [clipPath, topLeft, topRight] = first!.split("|");
  expect(clipPath).toBe("none");
  expect(topLeft).not.toBe(topRight);
  expect(new Set(samples)).toEqual(new Set([first]));
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("should open and close the dialog without motion when it is reduced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motion.html");
  const playback = await recordDialogPlayback(page);
  try {
    await page.getByRole("button", { name: "Abrir diálogo" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS("opacity", "1");
    await expect(dialog).toHaveCSS("transform", "none");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Abrir diálogo" })).toBeFocused();
    expect(await playback.all()).toEqual([]);
  } finally {
    await playback.stop();
  }
});

test("should reverse a dialog closed mid-entrance from where it is", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/motion.html");
  const trigger = page.getByRole("button", { name: "Abrir diálogo" });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  // A reopen right after still lands at rest.
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCSS("opacity", "1");
  await expect(dialog).toHaveCSS("transform", "none");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
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
