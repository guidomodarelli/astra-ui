/** Tuning of Arc's RadioGroup, adapted from Arc (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). */

/** Scale the dot shrinks to when its option is cleared, and springs up from when it is chosen. */
export const RADIO_GROUP_DOT_HIDDEN_SCALE = 0.4

/** Attribute the group sets once its highlight is placed, which drops the static fallback look of the checked row. */
export const RADIO_GROUP_READY_ATTRIBUTE = "data-ready"

/** Suffixes of the ids that tie an option row's copy to its radio. */
export const RADIO_GROUP_OPTION_ID_SUFFIX = {
  label: "label",
  description: "description",
} as const
