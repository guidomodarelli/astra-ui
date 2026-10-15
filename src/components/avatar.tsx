"use client"

/**
 * Arc's Avatar (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a compact identity marker on Arc's
 * tokens, with a hairline border, a muted fill behind the initials and an optional presence dot that pops in and out.
 * Loading, failure and fallback stay on the Base UI avatar primitive.
 */
import type { ComponentProps } from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { AnimatePresence, motion } from "motion/react"

import { AVATAR_STATUS_HIDDEN_SCALE, AVATAR_STATUS_LABEL } from "../constants/avatar.js"
import type { AvatarStatus } from "../constants/avatar.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_DURATION, ARC_SPRING_SNAPPY } from "../motion/arc-tokens.js"
import { MotionSlot } from "../motion/motion-slot.js"
import { useBeezUIComponents } from "../providers/beez-ui-provider.js"

export type { AvatarStatus }

/** Avatar diameters: 24px (`sm`), 32px (`default`), 40px (`lg`) and Arc's 88px profile size (`xl`). */
export type AvatarSize = "default" | "sm" | "lg" | "xl"

/** Accepts native image props and nullable image sources from application results. */
export type AvatarImageProps = Omit<ComponentProps<"img">, "src"> & {
  src?: string | null
}

export type AvatarProps = AvatarPrimitive.Root.Props & {
  size?: AvatarSize
  /** Shows Arc's presence dot in the bottom corner and adds the presence to the accessible text. */
  status?: AvatarStatus
  /** Accessible presence text; defaults to "En línea" or "Desconectado". */
  statusLabel?: string
}

/** The presence ring: a surface-coloured gap plus a faint hairline, so the dot reads on photos and fills alike. */
const presenceRingClassName =
  "shadow-[0_0_0_2px_var(--surface),0_0_0_3px_color-mix(in_oklab,var(--border)_70%,transparent)]"

/**
 * A person or account, as a photo with initials as fallback.
 * @param props - Size, optional presence and the Base UI avatar root props.
 * @returns The avatar root.
 */
function Avatar({ className, size = "default", status, statusLabel, children, ...props }: AvatarProps) {
  const reduceMotion = usePrefersReducedMotion()
  return (
    <MotionSlot kind="fade">
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
        {status ? <span className="sr-only">{statusLabel ?? AVATAR_STATUS_LABEL[status]}</span> : null}
        <AnimatePresence initial={false}>
          {status ? (
            <motion.span
              key={status}
              data-slot="avatar-status"
              data-status={status}
              aria-hidden="true"
              className={cn(
                "absolute right-0 bottom-0 z-10 size-2.5 rounded-(--radius-pill) data-[status=offline]:bg-text-muted data-[status=online]:bg-success group-data-[size=lg]/avatar:size-3 group-data-[size=sm]/avatar:size-2 group-data-[size=xl]/avatar:right-1 group-data-[size=xl]/avatar:bottom-1 group-data-[size=xl]/avatar:size-3.5",
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
    </MotionSlot>
  )
}

/** Delegates loading, failure and fallback synchronization to the avatar primitive; loaded images develop in place. */
function AvatarImage({
  alt = "",
  className,
  src,
  ...props
}: AvatarImageProps) {
  const { Image: ImageComponent = "img" } = useBeezUIComponents()
  return (
    <MotionSlot kind="reveal"><AvatarPrimitive.Image
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
      {...props}
    /></MotionSlot>
  )
}

function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
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

/** A custom corner badge, drawn with the same ring as Arc's presence dot. Prefer `status` for presence. */
function AvatarBadge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color select-none",
        presenceRingClassName,
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        "group-data-[size=xl]/avatar:right-1 group-data-[size=xl]/avatar:bottom-1 group-data-[size=xl]/avatar:size-3.5 group-data-[size=xl]/avatar:[&>svg]:size-2.5",
        className
      )}
      {...props}
    />
  )
}

/** Overlaps avatars; the hovered one lifts slightly above its neighbours. */
function AvatarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:transition-[translate] *:data-[slot=avatar]:duration-200 *:data-[slot=avatar]:ease-out *:data-[slot=avatar]:hover:z-10 *:data-[slot=avatar]:hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted text-xs font-medium text-text-secondary ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
