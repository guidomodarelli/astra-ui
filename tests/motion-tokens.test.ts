/** Verifies the public motion tokens keep their names and carry Arc's motion presets. */
import { describe, expect, it } from "vitest";
import * as rootExports from "beez-ui";
import * as motionTokens from "beez-ui/motion-tokens";

/** Arc's presets from `components/arc/lib/motion-tokens.ts`. */
const ARC_SNAPPY = { type: "spring", visualDuration: 0.26, bounce: 0.12 };
const ARC_SMOOTH = { type: "spring", visualDuration: 0.4, bounce: 0 };
const ARC_MORPH = { type: "spring", visualDuration: 0.42, bounce: 0.16 };

/** Public tokens, all of them Arc presets. */
const PUBLIC_TOKEN_NAMES = [
  "MOTION_TIMING",
  "MOTION_LIST_STAGGER_LIMIT",
  "MOTION_EASE",
  "MOTION_EASE_EXIT",
  "MOTION_EASE_STANDARD",
  "MOTION_EASE_IN_OUT",
  "SPRING_PRESS",
  "SPRING_PANEL",
  "SPRING_LAYOUT",
  "SPRING_CHEVRON",
  "SPRING_POP",
  "MOTION_PRESS_SCALE",
  "MOTION_MONTH_DISTANCE",
  "MOTION_SURFACE_SCALE",
  "MOTION_EXIT_SCALE",
  "MOTION_DIALOG_DISTANCE",
  "MOTION_DIALOG_EXIT_DISTANCE",
  "GLIDE_CONTINUITY_MS",
] as const;

/** Tokens removed in 4.0.0 because they carried motion Arc does not have. */
const REMOVED_TOKEN_NAMES = [
  "MOTION_EASE_DRAWER",
  "MOTION_EASE_UNFOLD",
  "SPRING_HIGHLIGHT",
  "SPRING_TABS",
  "SPRING_TOOLTIP",
  "SPRING_THUMB",
  "MOTION_HOVER_SCALE",
  "MOTION_CARD_SHADOW_LIFT",
  "MOTION_REVEAL_BLUR_PX",
  "MOTION_SHIMMER_TRANSLATE",
  "MOTION_SURFACE_CLIP_PERCENT",
  "MOTION_INVALID_SHAKE_PX",
  "MOTION_CENTER_MORPH_FOLDED_PERCENT",
] as const;

/** Timing keys consumers can read. */
const PUBLIC_TIMING_KEYS = [
  "instant",
  "fast",
  "enter",
  "standard",
  "considered",
  "panel",
  "overlay",
  "exit",
  "checkDraw",
  "listStagger",
  "sheetExit",
  "cursorBlink",
] as const;

describe("Motion tokens", () => {
  it("should expose every public token on both entry points and nothing beyond Arc's motion", () => {
    for (const name of PUBLIC_TOKEN_NAMES) {
      expect(motionTokens).toHaveProperty(name);
      expect(rootExports).toHaveProperty(name);
    }
    for (const name of REMOVED_TOKEN_NAMES) {
      expect(motionTokens).not.toHaveProperty(name);
      expect(rootExports).not.toHaveProperty(name);
    }
    expect(Object.keys(motionTokens.MOTION_TIMING).sort()).toEqual([...PUBLIC_TIMING_KEYS].sort());
  });

  it("should map every spring to Arc's snappy, smooth or morph preset", () => {
    expect(motionTokens.SPRING_PRESS).toEqual(ARC_SNAPPY);
    expect(motionTokens.SPRING_CHEVRON).toEqual(ARC_SNAPPY);
    expect(motionTokens.SPRING_POP).toEqual(ARC_SNAPPY);
    expect(motionTokens.SPRING_PANEL).toEqual(ARC_SMOOTH);
    expect(motionTokens.SPRING_LAYOUT).toEqual(ARC_MORPH);
  });

  it("should use Arc's durations and curves", () => {
    expect(motionTokens.MOTION_TIMING).toMatchObject({
      instant: 0.12,
      fast: 0.16,
      exit: 0.18,
      enter: 0.24,
      standard: 0.24,
      considered: 0.48,
      overlay: 0.24,
      checkDraw: 0.24,
      sheetExit: 0.24,
      listStagger: 0.035,
    });
    expect(motionTokens.MOTION_EASE).toEqual([0.16, 1, 0.3, 1]);
    expect(motionTokens.MOTION_EASE_EXIT).toEqual([0.7, 0, 0.84, 0]);
    expect(motionTokens.MOTION_EASE_STANDARD).toEqual([0.22, 1, 0.36, 1]);
    expect(motionTokens.MOTION_EASE_IN_OUT).toEqual([0.65, 0, 0.35, 1]);
  });

  it("should leave exits shorter than entrances", () => {
    expect(motionTokens.MOTION_TIMING.exit).toBeLessThan(motionTokens.MOTION_TIMING.enter);
  });

  it("should describe Arc's dialog, calendar and press distances and scales", () => {
    expect(motionTokens.MOTION_DIALOG_DISTANCE).toBe(8);
    expect(motionTokens.MOTION_DIALOG_EXIT_DISTANCE).toBe(4);
    expect(motionTokens.MOTION_SURFACE_SCALE).toBe(0.96);
    expect(motionTokens.MOTION_EXIT_SCALE).toBe(0.98);
    expect(motionTokens.MOTION_PRESS_SCALE).toBe(0.97);
    expect(motionTokens.MOTION_MONTH_DISTANCE).toBe(12);
    expect(motionTokens.MOTION_LIST_STAGGER_LIMIT).toBe(4);
  });
});
