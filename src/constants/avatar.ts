/** Copy and options of Arc's Avatar and Avatar group. */
import type { HTMLAttributeReferrerPolicy } from "react"

/** Presence an avatar can show with Arc's status dot. */
export type AvatarStatus = "online" | "offline"

/** Avatar diameters: 24px (`sm`), 32px (`md`), 40px (`lg`) and Arc's 88px profile size (`xl`). */
export type AvatarSize = "sm" | "md" | "lg" | "xl"

/** Sizes an avatar group accepts for its avatars and overflow chip. */
export type AvatarGroupSize = "sm" | "md" | "lg"

/**
 * Referrer policy of avatar photos. They are usually hosted by an identity provider (Google, GitHub), and Google rejects
 * some photos requested with a cross-site `Referer`, which left the avatar on its initials. Omitting the referrer also
 * keeps the consumer's page private. A consumer can still pass its own `referrerPolicy`.
 */
export const AVATAR_IMAGE_REFERRER_POLICY = "no-referrer" satisfies HTMLAttributeReferrerPolicy

/** Default Spanish labels read by assistive technology for each presence. */
export const AVATAR_STATUS_LABEL = {
  online: "En línea",
  offline: "Desconectado",
} as const satisfies Record<AvatarStatus, string>

/** Separator between the name and the presence in the avatar's accessible name, as in "Ana, En línea". */
export const AVATAR_LABEL_SEPARATOR = ", "

/** Scale the status dot grows from and shrinks back to. */
export const AVATAR_STATUS_HIDDEN_SCALE = 0.6

/** Diameter of each size in CSS pixels, passed to image adapters as the `sizes` hint. */
export const AVATAR_SIZE_PX = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 88,
} as const satisfies Record<AvatarSize, number>

/** Default Spanish accessible name of an avatar group, also used in its overflow label. */
export const AVATAR_GROUP_DEFAULT_LABEL = "Integrantes"

/** Avatars an avatar group shows before the rest collapse into the overflow chip. */
export const AVATAR_GROUP_DEFAULT_MAX = 4

/** Word that closes the overflow chip's accessible name, as in "2 integrantes más". */
export const AVATAR_GROUP_OVERFLOW_SUFFIX = "más"

/** Vertical travel, in em, of the overflow count rolling in the direction it moved. */
export const AVATAR_GROUP_COUNT_OFFSET_EM = 0.4

/** Scale a joining or leaving member's slot opens from and closes to. */
export const AVATAR_GROUP_SLOT_HIDDEN_SCALE = 0.9
