/** TEMPORARY diagnostics for the WebKit mobile flakes; removed before merge. */
import { expect, test } from "@playwright/test";

const REPEATS = 15;

for (let iteration = 0; iteration < REPEATS; iteration += 1) {
  test(`diag press ${iteration}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "webkit-mobile");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const navStart = Date.now();
    await page.goto("/action-buttons.html");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const log: string[] = [`goto+fonts ${Date.now() - navStart}ms`];
    for (const name of ["Publicar", "Copiar página"]) {
      const button = page.getByRole("button", { name, exact: true });
      await button.evaluate((element) => {
        const state = { events: [] as string[], styles: [] as string[] };
        (window as unknown as { __diag: typeof state }).__diag = state;
        for (const type of ["pointerdown", "pointerup", "pointercancel", "mousedown"]) {
          document.addEventListener(type, (event) => {
            const pointer = event as PointerEvent;
            state.events.push(`${Math.round(performance.now())} ${type} target=${(event.target as HTMLElement).tagName}.${(event.target as HTMLElement).getAttribute("data-slot")} primary=${pointer.isPrimary} xy=${pointer.clientX},${pointer.clientY} inButton=${element.contains(event.target as Node)}`);
          }, { capture: true });
        }
        new MutationObserver(() => state.styles.push(`${Math.round(performance.now())} style=${element.getAttribute("style")}`)).observe(element, { attributes: true, attributeFilter: ["style"] });
      });
      const box = await button.boundingBox();
      const hoverStart = Date.now();
      await button.hover();
      const hovered = Date.now() - hoverStart;
      const boxAfterHover = await button.boundingBox();
      await page.mouse.down();
      const downAt = Date.now();
      let samples: number[] = [];
      let passed = false;
      for (let attempt = 0; attempt < 50 && !passed; attempt += 1) {
        const scale = await button.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
        samples.push(scale);
        passed = scale < 1;
        if (!passed) await page.waitForTimeout(100);
      }
      const dump = await button.evaluate((element) => {
        const state = (window as unknown as { __diag: { events: string[]; styles: string[] } }).__diag;
        return {
          now: Math.round(performance.now()),
          events: state.events,
          styles: state.styles,
          attrs: Array.from(element.attributes).map((attribute) => `${attribute.name}=${attribute.value}`).join(" "),
          inert: element.matches(':disabled, [data-disabled], [aria-disabled="true"], [aria-busy="true"]'),
          anchor: element.matches('[aria-haspopup]:not([aria-haspopup="false"]), [data-state], [role="combobox"]'),
          computed: getComputedStyle(element).transform,
          rect: JSON.stringify(element.getBoundingClientRect()),
        };
      });
      log.push(`${name}: hover ${hovered}ms box=${JSON.stringify(box)} afterHover=${JSON.stringify(boxAfterHover)} passed=${passed} after ${Date.now() - downAt}ms samples=${samples.slice(0, 8).join(",")} dump=${JSON.stringify(dump)}`);
      samples = [];
      await page.mouse.up();
      await page.mouse.move(0, 0);
      if (!passed) {
        console.log(`DIAG-PRESS-FAIL ${testInfo.title}\n${log.join("\n")}`);
        throw new Error(`press did not scale ${name}`);
      }
    }
  });

  test(`diag empty state ${iteration}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "webkit-mobile");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/arc-admissions.html");
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const copy = page.getByRole("region", { name: "Bandeja vacía" }).locator('[data-slot="empty-state-copy"]');
    await copy.scrollIntoViewIfNeeded();
    const initialHeight = (await copy.boundingBox())!.height;
    await copy.evaluate((element) => {
      const frames: string[] = [];
      (window as unknown as { __frames: string[] }).__frames = frames;
      const started = performance.now();
      document.addEventListener("click", () => frames.push(`${Math.round(performance.now())} click`), { capture: true });
      new MutationObserver(() => frames.push(`${Math.round(performance.now())} style=${element.getAttribute("style")}`)).observe(element, { attributes: true, attributeFilter: ["style"] });
      const tick = (time: number) => {
        frames.push(`${Math.round(time)} raf h=${element.getBoundingClientRect().height.toFixed(1)}`);
        if (performance.now() - started < 8000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.getByRole("button", { name: "Alternar filtros" }).click();
    const heights = await copy.evaluate(async (element) => {
      const list: number[] = [];
      for (let frame = 0; frame < 12; frame += 1) {
        await new Promise(requestAnimationFrame);
        list.push(element.getBoundingClientRect().height);
      }
      return list;
    });
    await expect(page.getByRole("heading", { name: "Sin coincidencias" })).toBeVisible();
    await expect.poll(async () => (await copy.boundingBox())!.height, { timeout: 15000 }).toBeGreaterThan(initialHeight);
    const finalHeight = await copy.evaluate((element) => element.firstElementChild!.getBoundingClientRect().height);
    await page.waitForTimeout(1500);
    const sprang = heights.some((height) => height > initialHeight + 1 && height < finalHeight - 1);
    if (!sprang) {
      const frames = await page.evaluate(() => (window as unknown as { __frames: string[] }).__frames);
      console.log(`DIAG-EMPTY-FAIL ${testInfo.title} initial=${initialHeight} final=${finalHeight} heights=${heights.join(",")}\n${frames.slice(Math.max(0, frames.findIndex((line) => line.endsWith("click")) - 5)).slice(0, 120).join("\n")}`);
    }
    expect(sprang).toBe(true);
  });
}
