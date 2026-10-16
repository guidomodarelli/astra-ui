"use client"

/**
 * Internal composition behind Arc's Dialog (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): Radix's
 * dialog parts on Arc's overlay, raised panel, title and description type and bordered close button, with Arc's swap
 * of a title or description changed while open, beez-ui's center morph entrance and the viewport close button
 * placement. Not exported from the package: the public `Dialog` in `../dialog.tsx` builds Arc's API on these parts.
 */
import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { MotionSlot } from "../../motion/motion-slot.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../../motion/presence.js"
import { cn } from "../../lib/utils.js"
import { keepOpenOnToastInteraction } from "../../lib/toast-layer.js"
import {
  DialogSurfaceCloseButton,
  withDialogSwapText,
  dialogDescriptionClassName,
  dialogFooterClassName,
  dialogOverlayClassName,
  dialogSurfaceClassName,
  dialogTitleClassName,
  type DialogCloseButtonPlacement,
} from "../dialog-surface.js"

/**
 * Root that keeps the open state so the content can animate out. Controlled or uncontrolled, as Radix.
 * @param props - Radix root props.
 * @returns The dialog root.
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const [motionOpen, setMotionOpen] = useMotionOpenState(props)

  return <MotionOpenProvider scope="dialog" open={motionOpen}><DialogPrimitive.Root data-slot="dialog" {...props} open={motionOpen} onOpenChange={setMotionOpen} /></MotionOpenProvider>
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(dialogOverlayClassName, className)}
      {...props}
    />
  )
}

/**
 * Renders compact dialog content with viewport-safe scrolling. The panel unfolds from its
 * exact center toward every edge and folds back the same way when it closes.
 * @param props - Primitive properties and optional consumer overrides.
 * @param props.showCloseButton - Whether the dialog renders its own close button.
 * @param props.closeButtonPlacement - `viewport` pins the close button to the viewport corner
 * and shows it only once the panel has settled; `content` (default) keeps it in the panel.
 * @param props.closeLabel - Accessible name of the close button.
 * @returns The styled primitive with its original interaction contract.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeButtonPlacement = "content",
  closeLabel,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  closeButtonPlacement?: DialogCloseButtonPlacement
  closeLabel?: string
}) {
  return (
    <DialogPortal forceMount><MotionPresence scope="dialog" forceMount={props.forceMount}><React.Fragment>
      <MotionSlot kind="overlay"><DialogOverlay forceMount /></MotionSlot>
      <MotionSlot kind="center-morph"><DialogPrimitive.Content forceMount
        data-slot="dialog-content"
        data-close-button-placement={showCloseButton ? closeButtonPlacement : undefined}
        className={cn(
          dialogSurfaceClassName,
          "fixed grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100svh-2rem)] overflow-y-auto overscroll-contain sm:max-w-[440px]",
          // A resting `translate` would make the panel the containing block of the
          // viewport-pinned close button, so that placement centers with margins instead.
          closeButtonPlacement === "viewport"
            ? "inset-0 m-auto h-fit"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          className
        )}
        {...props}
        onInteractOutside={keepOpenOnToastInteraction(props.onInteractOutside)}
      >
        {children}
        {showCloseButton && (
          <DialogSurfaceCloseButton kind="dialog" placement={closeButtonPlacement} label={closeLabel} />
        )}
      </DialogPrimitive.Content></MotionSlot>
    </React.Fragment></MotionPresence></DialogPortal>
  )
}

/**
 * Stacks the title and description. While the panel shows its own close button, the header keeps Arc's gap to it so
 * long copy never runs under the button.
 * @param props - Native div properties and optional consumer overrides.
 * @returns The header block.
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-(--space-2) in-data-[close-button-placement=content]:pr-[calc(var(--space-8)+var(--space-5))]",
        className
      )}
      {...props}
    />
  )
}

/**
 * Separates dialog actions with an edge-to-edge footer under a hairline, bleeding through the panel padding.
 * @param props - Native div properties and optional consumer overrides.
 * @returns The footer block.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(dialogFooterClassName, className)}
      {...props}
    />
  )
}

/**
 * Renders the dialog heading in Arc's title type. Plain text that changes while open swaps with Arc's rise.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function DialogTitle({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(dialogTitleClassName, className)}
      {...props}
    >
      {withDialogSwapText(children, props.asChild)}
    </DialogPrimitive.Title>
  )
}

/**
 * Renders the dialog description in Arc's secondary text. Plain text that changes while open swaps with Arc's rise.
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function DialogDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(dialogDescriptionClassName, className)}
      {...props}
    >
      {withDialogSwapText(children, props.asChild)}
    </DialogPrimitive.Description>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
