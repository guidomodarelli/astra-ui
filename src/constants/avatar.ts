/** Copy and options of Arc's Avatar presence dot. */

/** Presence an avatar can show with Arc's status dot. */
export type AvatarStatus = "online" | "offline"

/** Default Spanish labels read by assistive technology for each presence. */
export const AVATAR_STATUS_LABEL = {
  online: "En línea",
  offline: "Desconectado",
} as const satisfies Record<AvatarStatus, string>

/** Scale the status dot grows from and shrinks back to. */
export const AVATAR_STATUS_HIDDEN_SCALE = 0.6
