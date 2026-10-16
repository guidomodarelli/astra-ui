"use client"

/**
 * Arc's Avatar and Avatar group (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). The avatar is a round
 * portrait named once for assistive technology, with the first two initials standing in until the photo loads or when
 * it fails, and a presence dot that pops in and out. The group overlaps several avatars, collapses the rest into a +N
 * chip whose count rolls the way it moved, opens and closes the slot of members who join or leave, and on fine
 * pointers fans apart while the pointed-at person lifts and shows their name.
 */
import { useState } from "react"
import type { ComponentProps, CSSProperties, ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import type { Variants } from "motion/react"

import {
  AVATAR_GROUP_COUNT_OFFSET_EM,
  AVATAR_GROUP_DEFAULT_LABEL,
  AVATAR_GROUP_DEFAULT_MAX,
  AVATAR_GROUP_OVERFLOW_SUFFIX,
  AVATAR_GROUP_SLOT_HIDDEN_SCALE,
  AVATAR_LABEL_SEPARATOR,
  AVATAR_SIZE_PX,
  AVATAR_STATUS_LABEL,
} from "../constants/avatar.js"
import type { AvatarGroupSize, AvatarSize, AvatarStatus } from "../constants/avatar.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { getNameInitials } from "../lib/name-initials.js"
import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE, ARC_SPRING_MORPH } from "../motion/arc-tokens.js"
import { AvatarBadge, AvatarFallback, AvatarImage, AvatarRoot } from "./primitives/avatar.js"

export type { AvatarGroupSize, AvatarSize, AvatarStatus }

export type AvatarProps = Omit<ComponentProps<"span">, "children"> & {
  /** Full name: the accessible name of the avatar and the source of its first two initials. */
  name: string
  /** Photo URL, rendered through the provider's `Image` adapter. Falls back to the initials if it fails to load. */
  src?: string | null
  /** Diameter: 24px (`sm`), 32px (`md`, default), 40px (`lg`) or Arc's 88px profile size (`xl`). */
  size?: AvatarSize
  /** Adds a presence dot and appends the presence to the accessible name. */
  status?: AvatarStatus
  /** Presence text appended to the accessible name; defaults to "En línea" or "Desconectado". */
  statusLabel?: string
  /** Replaces the initials, for example with an icon. */
  fallback?: ReactNode
  /** A custom corner badge; the presence dot moves to the top corner while it is shown. */
  badge?: ReactNode
  /** Accessible text to use instead of `name`, when the photo needs a different description. */
  alt?: string
}

/**
 * Builds the avatar's accessible name: the person plus, when shown, their presence.
 * @param name - Text that names the person.
 * @param presence - Presence text, if any.
 * @returns The accessible name.
 */
function buildAvatarLabel(name: string, presence: string | undefined): string {
  return presence ? `${name}${AVATAR_LABEL_SEPARATOR}${presence}` : name
}

/**
 * A round portrait for one person, with initials as fallback and an optional presence dot.
 * @param props - Name, photo, size, presence, optional fallback and badge, plus native span attributes for the root.
 * @returns The avatar, announced as one image.
 */
function Avatar({ name, src, size = "md", status, statusLabel, fallback, badge, alt, ...props }: AvatarProps) {
  const presence = status ? (statusLabel ?? AVATAR_STATUS_LABEL[status]) : undefined
  return (
    <AvatarRoot role="img" aria-label={buildAvatarLabel(alt ?? name, presence)} size={size} status={status} {...props}>
      {/* The image and initials are decorative: the root already names the person once. */}
      {src ? <AvatarImage src={src} alt="" sizes={`${AVATAR_SIZE_PX[size]}px`} /> : null}
      <AvatarFallback aria-hidden="true">{fallback ?? getNameInitials(name)}</AvatarFallback>
      {badge ? <AvatarBadge>{badge}</AvatarBadge> : null}
    </AvatarRoot>
  )
}

/** One person of an avatar group. */
export type AvatarGroupMember = {
  /** Full name, shown on hover and used as the avatar's accessible name. */
  name: string
  /** Photo URL. */
  src?: string | null
  /** Presence dot of the avatar. */
  status?: AvatarStatus
  /** Stable key for members that share a name; defaults to `name`. */
  key?: string
}

export type AvatarGroupProps = {
  /** People in display order. Pass the whole list and let `max` collapse the rest. */
  members: AvatarGroupMember[]
  /** Avatars shown before the rest collapse into the overflow count. */
  max?: number
  /** Size of each avatar and of the overflow chip. */
  size?: AvatarGroupSize
  /** Accessible name of the group, also used in the overflow label; defaults to "Integrantes". */
  label?: string
  /** Classes for the group. */
  className?: string
}

/** The overflow count rolls the way it moved: more people rise in from below, fewer drop in from above. */
const countRoll: Variants = {
  hidden: (direction: number) => ({
    opacity: 0,
    y: `${AVATAR_GROUP_COUNT_OFFSET_EM * direction}em`,
    filter: `blur(${ARC_BLUR.subtle}px)`,
  }),
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] },
  },
  gone: (direction: number) => ({
    opacity: 0,
    y: `${-AVATAR_GROUP_COUNT_OFFSET_EM * direction}em`,
    filter: `blur(${ARC_BLUR.subtle}px)`,
    transition: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] },
  }),
}

/** Same keys as `countRoll`, so the settled style is identical whichever branch renders on the server. */
const countFade: Variants = {
  hidden: { opacity: 0, y: 0, filter: "blur(0px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: ARC_DURATION.instant } },
  gone: { opacity: 0, y: 0, filter: "blur(0px)", transition: { duration: ARC_DURATION.instant } },
}

/** A person joining or leaving opens or closes their slot, so the rest of the stack slides instead of jumping. */
const slotPresence = {
  initial: { width: 0, opacity: 0, scale: AVATAR_GROUP_SLOT_HIDDEN_SCALE },
  animate: { width: "auto", opacity: 1, scale: 1 },
  exit: { width: 0, opacity: 0, scale: AVATAR_GROUP_SLOT_HIDDEN_SCALE },
}

/** Position of a slot in the stack and how many slots it has, read by the hover fan. */
type StackStyle = CSSProperties & { "--index"?: number; "--count"?: number }

/**
 * Each slot is the avatar's visible width, so a slot that opens or closes moves the rest of the stack smoothly. On fine
 * pointers it carries the hover moves as custom properties: the whole stack fans out from its center, the pointed-at
 * slot rises above its neighbours and they ease aside.
 */
const slotClassName =
  "group/avatar-group-slot peer/avatar-group-slot relative inline-flex flex-none items-center [--aside:0px] [--fan:0px] [--rise:0px] pointer-fine:group-hover/avatar-group:[--fan:calc((var(--index)-(var(--count)-1)/2)*4px)] hover-fine:z-1 hover-fine:[--rise:-2px] pointer-fine:peer-hover/avatar-group-slot:[--aside:3px] pointer-fine:has-[~[data-slot=avatar-group-slot]:hover]:[--aside:-3px]"

/** One wrapper per person carries every hover move as a single translate, so the stack never changes size. */
const liftClassName =
  "relative -ml-1.5 inline-flex rounded-(--radius-pill) [transform:translate(calc(var(--fan)+var(--aside)),var(--rise))] transition-transform duration-(--duration-standard) ease-(--ease-standard) motion-reduce:transform-none! motion-reduce:transition-none"

/** The surface ring that separates overlapping avatars, which sharpens on the pointed-at one. */
const ringClassName =
  "border-2 border-surface shadow-[0_0_0_1px_var(--border)] transition-shadow duration-(--duration-fast) ease-(--ease-standard) pointer-fine:group-hover/avatar-group-slot:shadow-[0_0_0_1px_var(--border-strong)]"

/**
 * Builds the overflow chip's accessible name, as in "2 integrantes más".
 * @param overflow - How many members are hidden.
 * @param label - Accessible name of the group.
 * @returns The chip's accessible name.
 */
function buildOverflowLabel(overflow: number, label: string): string {
  return `${overflow} ${label.toLowerCase()} ${AVATAR_GROUP_OVERFLOW_SUFFIX}`
}

/**
 * An overlapping stack of avatars with a +N overflow chip.
 * @param props - Members, how many to show, size, accessible label and classes.
 * @returns The group.
 */
function AvatarGroup({ members, max = AVATAR_GROUP_DEFAULT_MAX, size = "md", label = AVATAR_GROUP_DEFAULT_LABEL, className }: AvatarGroupProps) {
  const reduceMotion = usePrefersReducedMotion()
  const visibleMembers = members.slice(0, Math.max(0, max))
  const overflow = Math.max(0, members.length - visibleMembers.length)
  const slotTransition = reduceMotion ? { duration: 0 } : ARC_SPRING_MORPH
  const [shownCount, setShownCount] = useState({ overflow, direction: 1 })
  if (shownCount.overflow !== overflow) setShownCount({ overflow, direction: overflow < shownCount.overflow ? -1 : 1 })
  const groupStyle: StackStyle = { "--count": visibleMembers.length + (overflow > 0 ? 1 : 0) }

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="avatar-group"
      data-size={size}
      className={cn("group/avatar-group inline-flex items-center pl-1.5", className)}
      style={groupStyle}
    >
      <AnimatePresence initial={false}>
        {visibleMembers.map((member, index) => (
          <motion.span
            key={member.key ?? member.name}
            data-slot="avatar-group-slot"
            className={slotClassName}
            style={{ "--index": index } as StackStyle}
            {...slotPresence}
            transition={slotTransition}
          >
            <span className={liftClassName}>
              <Avatar className={ringClassName} name={member.name} src={member.src} status={member.status} size={size} />
              {/* The name floats above the stack, outside the layout, so showing it never moves anything. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-2 -translate-x-1/2 translate-y-[3px] rounded-(--radius-pill) bg-foreground px-2 py-1 text-xs leading-(--leading-body) font-medium whitespace-nowrap text-background opacity-0 transition-[opacity,translate] duration-(--duration-fast) ease-(--ease-standard) pointer-fine:group-hover/avatar-group-slot:translate-y-0 pointer-fine:group-hover/avatar-group-slot:opacity-100 pointer-fine:group-hover/avatar-group-slot:delay-60 motion-reduce:translate-y-0 motion-reduce:transition-none"
              >
                {member.name}
              </span>
            </span>
          </motion.span>
        ))}
        {overflow > 0 ? (
          <motion.span
            key="overflow"
            data-slot="avatar-group-slot"
            className={slotClassName}
            style={{ "--index": visibleMembers.length } as StackStyle}
            {...slotPresence}
            transition={slotTransition}
          >
            <span
              role="img"
              aria-label={buildOverflowLabel(overflow, label)}
              data-slot="avatar-group-count"
              data-size={size}
              className={cn(
                liftClassName,
                ringClassName,
                "relative grid size-8 place-items-center overflow-hidden bg-surface-muted text-xs font-medium text-text-secondary tabular-nums data-[size=lg]:size-10 data-[size=lg]:text-sm data-[size=sm]:size-6 data-[size=sm]:text-[10px]"
              )}
            >
              <AnimatePresence mode="popLayout" initial={false} custom={shownCount.direction}>
                <motion.span
                  key={overflow}
                  aria-hidden="true"
                  className="inline-block"
                  custom={shownCount.direction}
                  variants={reduceMotion ? countFade : countRoll}
                  initial="hidden"
                  animate="shown"
                  exit="gone"
                >
                  +{overflow}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export { Avatar, AvatarGroup }
