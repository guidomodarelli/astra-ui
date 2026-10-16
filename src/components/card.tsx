/**
 * Arc's Card (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a contained group of related content on
 * Arc's surface, panel radius and spacing. A card holding a link or button floats a little on fine-pointer hover,
 * and `CardMedia` drifts its photo in slowly while the card is pointed at. The compound shadcn structure is kept;
 * Arc's quick look is not part of it.
 */
import * as React from "react"

import { MotionSlot } from "../motion/motion-slot.js"
import { cn } from "../lib/utils.js"

/**
 * Card surface. The outline is a 1px ring in the border token, so the hover shadow can stack on it, and isolation
 * keeps the rounded clip on media while the card lifts (Safari drops it otherwise).
 */
function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <MotionSlot kind="card"><div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card isolate flex min-w-0 flex-col gap-(--space-4) overflow-hidden rounded-(--radius-panel) bg-surface py-(--space-5) text-sm text-foreground ring-1 ring-border has-[>img:first-child]:pt-0 has-[>[data-slot=card-media]:first-child]:pt-0 data-[size=sm]:gap-(--space-3) data-[size=sm]:py-(--space-4) motion-safe:transition-[translate] motion-safe:duration-(--duration-spring) motion-safe:ease-(--ease-spring) hover-fine:has-[a,button]:motion-safe:-translate-y-0.5",
        className
      )}
      {...props}
    /></MotionSlot>
  )
}

/**
 * Arc's card media: a muted frame for a photo or illustration that zooms in slowly while the card is pointed at
 * and eases back a little faster. Place it first to sit flush with the top edge.
 */
function CardMedia({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-media"
      className={cn("relative overflow-hidden bg-surface-muted", className)}
      {...props}
    >
      <div className="grid min-h-28 place-items-center transition-transform duration-(--duration-considered) ease-(--ease-standard) motion-reduce:transition-none pointer-fine:group-hover/card:scale-[1.04] pointer-fine:group-hover/card:duration-[calc(var(--duration-considered)*2)] motion-reduce:scale-100! [&>img]:size-full [&>img]:object-cover">
        {children}
      </div>
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-(--space-2) px-(--space-5) group-data-[size=sm]/card:px-(--space-4) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--space-5) group-data-[size=sm]/card:[.border-b]:pb-(--space-4)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-sans text-lg leading-[1.3] font-medium tracking-(--tracking-body) text-balance group-data-[size=sm]/card:text-base",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-(--leading-body) text-pretty text-text-secondary", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "relative z-1 col-start-2 row-span-2 row-start-1 flex flex-wrap gap-(--space-3) self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--space-5) group-data-[size=sm]/card:px-(--space-4)", className)}
      {...props}
    />
  )
}

/** Arc's footer row: a byline or meta on the start side and actions on the end, without a tinted band. */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between gap-(--space-3) px-(--space-5) group-data-[size=sm]/card:px-(--space-4)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardMedia,
}
