"use client"

/**
 * Internal composition behind Arc's Avatar (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a compact
 * identity marker on Arc's tokens, with a hairline border, a muted fill behind the initials and an optional presence
 * dot that pops in and out. Loading, failure and fallback stay on the Base UI avatar primitive. Not part of the public
 * API: consumers use the closed `Avatar` from `../avatar.js`, while beez-ui components such as the account menu compose
 * these parts directly.
 */
import type { ComponentProps } from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { AnimatePresence, motion } from "motion/react"

import { AVATAR_IMAGE_REFERRER_POLICY, AVATAR_STATUS_HIDDEN_SCALE } from "../../constants/avatar.js"
import type { AvatarSize, AvatarStatus } from "../../constants/avatar.js"
import { usePrefersReducedMotion } from "../../hooks/use-prefers-reduced-motion.js"
import { cn } from "../../lib/utils.js"
import { ARC_DURATION, ARC_SPRING_SNAPPY } from "../../motion/arc-tokens.js"
import { MotionSlot } from "../../motion/motion-slot.js"
import { useBeezUIComponents } from "../../providers/beez-ui-provider.js"

/** Accepts native image props and nullable image sources from application results. */
export type AvatarImageProps = Omit<ComponentProps<"img">, "src"> & {
  src?: string | null
}

export type AvatarRootProps = AvatarPrimitive.Root.Props & {
  /** Diameter: 24px (`sm`), 32px (`md`, default), 40px (`lg`) or Arc's 88px profile size (`xl`). */
  size?: AvatarSize
  /** Shows Arc's presence dot in the bottom corner, or the top corner when an `AvatarBadge` holds the bottom one. */
  status?: AvatarStatus
}

/** The presence ring: a surface-coloured gap plus a faint hairline, so the dot reads on photos and fills alike. */
const presenceRingClassName =
  "shadow-[0_0_0_2px_var(--surface),0_0_0_3px_color-mix(in_oklab,var(--border)_70%,transparent)]"

/**
 * The avatar circle with its optional presence dot.
 * @param props - Size, optional presence and the Base UI avatar root props.
 * @returns The avatar root.
 */
function AvatarRoot({ className, size = "md", status, children, ...props }: AvatarRootProps) {
  const reduceMotion = usePrefersReducedMotion()
  return (
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-size={size}
        className={cn(
          "group/avatar relative inline-grid size-8 shrink-0 place-items-center rounded-(--radius-pill) border border-border bg-surface-muted text-xs font-medium text-foreground select-none data-[size=lg]:size-10 data-[size=lg]:text-sm data-[size=sm]:size-6 data-[size=sm]:text-[10px] data-[size=xl]:size-22 data-[size=xl]:text-xl",
          className
        )}
        {...props}
      >
        {children}
        <AnimatePresence initial={false}>
          {status ? (
            <motion.span
              key={status}
              data-slot="avatar-status"
              data-status={status}
              aria-hidden="true"
              className={cn(
                "absolute right-0 bottom-0 z-10 size-2.5 rounded-(--radius-pill) data-[status=offline]:bg-text-muted data-[status=online]:bg-success group-data-[size=lg]/avatar:size-3 group-data-[size=sm]/avatar:size-2 group-data-[size=xl]/avatar:right-1 group-data-[size=xl]/avatar:bottom-1 group-data-[size=xl]/avatar:size-3.5 group-has-data-[slot=avatar-badge]/avatar:top-0 group-has-data-[slot=avatar-badge]/avatar:bottom-auto group-data-[size=xl]/avatar:group-has-data-[slot=avatar-badge]/avatar:top-1",
                presenceRingClassName
              )}
              initial={{ opacity: 0, scale: AVATAR_STATUS_HIDDEN_SCALE }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: AVATAR_STATUS_HIDDEN_SCALE,
                transition: { duration: reduceMotion ? 0 : ARC_DURATION.fast },
              }}
              transition={reduceMotion ? { duration: 0 } : ARC_SPRING_SNAPPY}
            />
          ) : null}
        </AnimatePresence>
      </AvatarPrimitive.Root>
  )
}

/**
 * The photo. Delegates loading, failure and fallback synchronization to the avatar primitive and renders through the
 * provider's `Image` adapter; loaded images develop in place.
 * @param props - Native image props with a nullable source.
 * @returns The image, mounted while it loads so the fallback can stay until it is ready.
 */
function AvatarImage({ alt = "", className, src, ...props }: AvatarImageProps) {
  const { Image: ImageComponent = "img" } = useBeezUIComponents()
  return (
    <MotionSlot kind="reveal">
      <AvatarPrimitive.Image
        render={<ImageComponent />}
        keepMounted
        alt={alt}
        data-slot="avatar-image"
        className={cn(
          "pointer-events-none absolute inset-0 aspect-square size-full rounded-full object-cover data-[loading]:opacity-0 data-[error]:hidden",
          className
        )}
        src={src ?? undefined}
        loading="lazy"
        decoding="async"
        referrerPolicy={AVATAR_IMAGE_REFERRER_POLICY}
        {...props}
      />
    </MotionSlot>
  )
}

/**
 * Initials or another stand-in, shown until the photo loads or when it fails.
 * @param props - Base UI fallback props.
 * @returns The fallback.
 */
function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-surface-muted text-[length:inherit] font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * A custom corner badge, drawn with the same ring as Arc's presence dot.
 * @param props - Native span props.
 * @returns The badge.
 */
function AvatarBadge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color select-none",
        presenceRingClassName,
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=md]/avatar:size-2.5 group-data-[size=md]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        "group-data-[size=xl]/avatar:right-1 group-data-[size=xl]/avatar:bottom-1 group-data-[size=xl]/avatar:size-3.5 group-data-[size=xl]/avatar:[&>svg]:size-2.5",
        className
      )}
      {...props}
    />
  )
}

export { AvatarRoot, AvatarImage, AvatarFallback, AvatarBadge }
