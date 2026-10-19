/** Copy and tuning of Arc's UsageMeter, adapted from Arc (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** How full the allowance is: under the warning share, close to the limit, or past it. */
export type UsageMeterStatus = "ok" | "near" | "over"

/** Values the meter's copy is built from. Amounts arrive already formatted with their unit, such as "8,4 GB". */
export type UsageMeterCopyValues = {
  /** What is measured, from `label`. */
  label: string
  /** The `unit` prop, possibly empty. */
  unit: string
  /** Formatted plan limit with its unit. */
  limit: string
  /** Formatted total used with its unit. */
  total: string
  /** Formatted space left with its unit. */
  free: string
  /** Formatted overage with its unit. */
  over: string
}

/**
 * Every visible and announced string of a `UsageMeter`. The Spanish defaults can be replaced one by one through the
 * `messages` prop. The legend labels of the remaining space keep their own props, `freeLabel` and `overLabel`.
 */
export type UsageMeterMessages = {
  /** Caption beside the total, after the rolling number: "GB de 50 GB usados". */
  usedCaption: (values: UsageMeterCopyValues) => string
  /** Caption while the remaining space is highlighted: "GB libres". */
  freeCaption: (values: UsageMeterCopyValues) => string
  /** Caption while the overage is highlighted: "GB por encima del límite". */
  overCaption: (values: UsageMeterCopyValues) => string
  /** Caption while a category is highlighted, with its share of the plan in percent. */
  segmentCaption: (values: UsageMeterCopyValues & { segment: string; share: number }) => string
  /** Status badge under the warning share. */
  freeBadge: (values: UsageMeterCopyValues) => string
  /** Status badge close to the limit. */
  nearBadge: (values: UsageMeterCopyValues) => string
  /** Status badge past the limit. */
  overBadge: (values: UsageMeterCopyValues) => string
  /** Screen-reader copy of the total. */
  usedSummary: (values: UsageMeterCopyValues) => string
  /** Text alternative of the bar: the total, every category and the status. */
  barSummary: (values: UsageMeterCopyValues & { status: UsageMeterStatus; segments: string }) => string
  /** Accessible name of the legend. */
  legendLabel: (values: UsageMeterCopyValues) => string
  /** Announcement when usage drops back under the warning share. */
  okAnnouncement: (values: UsageMeterCopyValues) => string
  /** Announcement when usage gets close to the limit. */
  nearAnnouncement: (values: UsageMeterCopyValues) => string
  /** Announcement when usage passes the limit or the overage grows. */
  overAnnouncement: (values: UsageMeterCopyValues) => string
}

/** Spanish copy of the meter. */
export const USAGE_METER_DEFAULT_MESSAGES = {
  usedCaption: ({ unit, limit }) => `${unit} de ${limit} usados`.trim(),
  freeCaption: ({ unit }) => `${unit} libres`.trim(),
  overCaption: ({ unit }) => `${unit} por encima del límite`.trim(),
  segmentCaption: ({ unit, segment, share }) => `${unit} en ${segment} · ${share} % del plan`.trim(),
  freeBadge: ({ free }) => `${free} libres`,
  nearBadge: () => "Casi lleno",
  overBadge: ({ over }) => `${over} de más`,
  usedSummary: ({ total, limit }) => `${total} de ${limit} usados`,
  barSummary: ({ label, total, limit, segments, status, free, over }) =>
    `${label}: ${total} de ${limit} usados. ${segments}. ${
      status === "over" ? `Supera el límite por ${over}.` : `${free} libres${status === "near" ? ", casi lleno" : ""}.`
    }`,
  legendLabel: ({ label }) => `${label} por categoría`,
  okAnnouncement: ({ free }) => `Por debajo del límite. ${free} libres.`,
  nearAnnouncement: ({ free }) => `Casi lleno. ${free} libres.`,
  overAnnouncement: ({ over }) => `Supera el límite del plan por ${over}.`,
} as const satisfies UsageMeterMessages

/** Legend label of the remaining space when none is passed. */
export const USAGE_METER_DEFAULT_FREE_LABEL = "Libre"

/** Legend label of the overage when none is passed. */
export const USAGE_METER_DEFAULT_OVER_LABEL = "Excedente"

/** Locale that formats the amounts when none is passed. */
export const USAGE_METER_DEFAULT_LOCALE = "es-AR"

/** Digits after the decimal separator when none is passed. */
export const USAGE_METER_DEFAULT_DECIMALS = 1

/** Share of the limit at which the badge warns that it is almost full, when none is passed. */
export const USAGE_METER_DEFAULT_WARN_AT = 0.9

/** Share of the meter, from 0 to 1, that must be visible before its segments grow in. */
export const USAGE_METER_REVEAL_AMOUNT = 0.4

/** Delay, in seconds, between segments growing in one after another on first view. */
export const USAGE_METER_REVEAL_STAGGER_S = 0.07

/** Gap, in pixels, a segment stops short of the next one, so neighbours read apart without an outline. */
export const USAGE_METER_SEGMENT_GAP_PX = 2

/** Category colours are steps of the accent, strongest first; up to this many read clearly. */
export const USAGE_METER_SEGMENT_COLOR_COUNT = 4

/** Legend id of the remaining space, or of the overage once usage passes the limit. */
export const USAGE_METER_FREE_ID = "free"
