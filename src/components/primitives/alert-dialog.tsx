"use client"

/**
 * Internal confirmation composition on Arc's Dialog surface (https://uiarc.dev, MIT License, see
 * THIRD_PARTY_NOTICES.md): Radix's alert dialog parts on the same overlay, raised panel, title and description type as
 * the dialog primitive, so both read as one family, with beez-ui's center morph entrance, media slot and Arc `Button`
 * actions. Not exported from the package: the public `Dialog` uses it for its `alert` mode.
 */
import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { MotionSlot } from "../../motion/motion-slot.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../../motion/presence.js"
import { cn } from "../../lib/utils.js"
import { Button } from "../button.js"
import {
  DialogSurfaceCloseButton,
  type DialogCloseButtonPlacement,
  withDialogSwapText,
  dialogDescriptionClassName,
  dialogFooterClassName,
  dialogOverlayClassName,
  dialogSurfaceClassName,
  dialogTitleClassName,
} from "../dialog-surface.js"

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)

  return <MotionOpenProvider scope="alert-dialog" open={motionOpen}><AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} open={motionOpen} onOpenChange={setMotionOpen} /></MotionOpenProvider>
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(dialogOverlayClassName, className)}
      {...props}
    />
  )
}

/**
 * Renders a compact confirmation while preserving the shared theme and viewport bound.
 * @param props - Primitive properties and optional consumer overrides.
 * @param props.showCloseButton - Whether the confirmation renders a close button, which cancels it. Off by default:
 * a confirmation is answered with its actions.
 * @param props.closeButtonPlacement - `viewport` pins the close button to the viewport corner; `content` (default)
 * keeps it in the panel.
 * @param props.closeLabel - Accessible name of the close button.
 * @returns The styled primitive with its original interaction contract.
 */
function AlertDialogContent({
  className,
  size = "default",
  children,
  showCloseButton = false,
  closeButtonPlacement = "content",
  closeLabel,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: "default" | "sm"
  showCloseButton?: boolean
  closeButtonPlacement?: DialogCloseButtonPlacement
  closeLabel?: string
}) {
  return (
    <AlertDialogPortal forceMount><MotionPresence scope="alert-dialog" forceMount={props.forceMount}><React.Fragment>
      <MotionSlot kind="overlay"><AlertDialogOverlay forceMount /></MotionSlot>
      <MotionSlot kind="center-morph"><AlertDialogPrimitive.Content forceMount
        data-slot="alert-dialog-content"
        data-size={size}
        data-close-button-placement={showCloseButton ? closeButtonPlacement : undefined}
        className={cn(
          dialogSurfaceClassName,
          "group/alert-dialog-content fixed grid max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-contain w-full data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm",
          // A resting `translate` would make the panel the containing block of the
          // viewport-pinned close button, so that placement centers with margins instead.
          showCloseButton && closeButtonPlacement === "viewport"
            ? "inset-0 m-auto h-fit"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogSurfaceCloseButton kind="alert" placement={closeButtonPlacement} label={closeLabel} />
        )}
      </AlertDialogPrimitive.Content></MotionSlot>
    </React.Fragment></MotionPresence></AlertDialogPortal>
  )
}

/**
 * Aligns confirmation headings and media with compact spacing.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-(--space-2) text-center in-data-[close-button-placement=content]:pr-[calc(var(--space-8)+var(--space-5))] has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Separates confirmation actions with an edge-to-edge footer under a hairline, bleeding through the panel padding.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        dialogFooterClassName,
        "group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders confirmation media at the compact default size.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-2 inline-flex size-10 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6",
        className
      )}
      {...props}
    />
  )
}

/**
 * Renders the confirmation heading in Arc's title type. Plain text that changes while open swaps with Arc's rise.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function AlertDialogTitle({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        dialogTitleClassName,
        "sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className
      )}
      {...props}
    >
      {withDialogSwapText(children, props.asChild)}
    </AlertDialogPrimitive.Title>
  )
}

/**
 * Renders the confirmation description in Arc's secondary text. Plain text that changes while open swaps with Arc's
 * rise.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function AlertDialogDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(dialogDescriptionClassName, "text-balance md:text-pretty", className)}
      {...props}
    >
      {withDialogSwapText(children, props.asChild)}
    </AlertDialogPrimitive.Description>
  )
}

/** Confirms the dialog with an Arc `Button`; Radix merges its behavior onto the button through `asChild`. */
function AlertDialogAction({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Action data-slot="alert-dialog-action" asChild {...props}>
      <Button variant={variant} size={size} className={cn(className)}>
        {children}
      </Button>
    </AlertDialogPrimitive.Action>
  )
}

/** Dismisses the dialog with an Arc secondary `Button` by default. */
function AlertDialogCancel({
  className,
  variant = "secondary",
  size = "md",
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" asChild {...props}>
      <Button variant={variant} size={size} className={cn(className)}>
        {children}
      </Button>
    </AlertDialogPrimitive.Cancel>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
