/** Tuning shared by Button's Arc press feedback and label width morph. */

/** Buttons wider than this press a little less so large surfaces don't feel spongy. */
export const BUTTON_WIDE_THRESHOLD_PX = 220;
/** Buttons up to this width are icon-sized and press a little deeper. */
export const BUTTON_ICON_THRESHOLD_PX = 48;
/** Press scale for wide buttons. */
export const BUTTON_WIDE_PRESS_SCALE = 0.985;
/** Press scale for icon-sized buttons. */
export const BUTTON_ICON_PRESS_SCALE = 0.96;
/** Press scale for every other button. */
export const BUTTON_DEFAULT_PRESS_SCALE = 0.97;
/**
 * After the label changes, resizes inside this window spring to the new width; later resizes
 * (late web fonts, parent reflows) jump so nothing wobbles on first paint.
 */
export const BUTTON_MORPH_WINDOW_MS = 700;
