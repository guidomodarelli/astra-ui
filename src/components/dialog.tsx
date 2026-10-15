"use client"

/**
 * Arc's Dialog (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a focused surface for decisions that need
 * attention, on Arc's overlay, raised panel, title and description type and bordered close button, with Arc's swap of
 * a title or description changed while open. It keeps beez-ui's composable parts, the center morph entrance and the
 * viewport close button placement instead of Arc's single `title`/`description` content and rise entrance.
 */
import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { MotionSlot } from "../motion/motion-slot.js"
import { MotionPresence, MotionOpenProvider, useMotionOpenState } from "../motion/presence.js"
import { cn } from "../lib/utils.js"
import { Button } from "./button.js"
import { ControlButton } from "./control-button.js"
import { XIcon } from "lucide-react"
import {
  withDialogSwapText,
  dialogCloseButtonClassName,
  dialogDescriptionClassName,
  dialogFooterClassName,
  dialogOverlayClassName,
  dialogSurfaceClassName,
  dialogTitleClassName,
} from "./dialog-surface.js"

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

/** Where the dialog close button sits: inside the panel or pinned to the viewport corner. */
type DialogCloseButtonPlacement = "content" | "viewport"

/**
 * Renders a close button pinned to the viewport corner. It stays hidden while the panel
 * unfolds, because the entrance clip would otherwise cut it with the panel, and
 * fades in once the panel settles. It hides at once when the dialog starts closing.
 * While hidden it is also `visibility: hidden`, so the dialog's initial focus and the
 * keyboard can never land on a control that cannot be seen.
 * @returns The close control for wide layouts that keep the panel clear of controls.
 */
function DialogViewportCloseButton() {
  return (
    <DialogPrimitive.Close data-slot="dialog-close" asChild>
      <ControlButton
        variant="ghost"
        className={cn(dialogCloseButtonClassName, "fixed top-4 right-4 transition-opacity duration-200 ease-out in-data-motion-entering:invisible in-data-motion-entering:opacity-0 in-data-motion-entering:transition-none in-data-[state=closed]:invisible in-data-[state=closed]:opacity-0 in-data-[state=closed]:transition-none motion-reduce:transition-none")}
        size="icon-sm"
      >
        <XIcon />
        <span className="sr-only">Cerrar</span>
      </ControlButton>
    </DialogPrimitive.Close>
  )
}

/**
 * Renders compact dialog content with viewport-safe scrolling. The panel unfolds from its
 * exact center toward every edge and folds back the same way when it closes.
 * @param props - Primitive properties and optional consumer overrides.
 * @param props.showCloseButton - Whether the dialog renders its own close button.
 * @param props.closeButtonPlacement - `viewport` pins the close button to the viewport corner
 * and shows it only once the panel has settled; `content` (default) keeps it in the panel.
 * @returns The styled primitive with its original interaction contract.
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeButtonPlacement = "content",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  closeButtonPlacement?: DialogCloseButtonPlacement
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
      >
        {children}
        {showCloseButton && closeButtonPlacement === "viewport" && <DialogViewportCloseButton />}
        {showCloseButton && closeButtonPlacement === "content" && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <MotionSlot kind="delayed-pop"><ControlButton
              variant="ghost"
              className={cn(
                dialogCloseButtonClassName,
                // Centred on the first line of an 18px title, as in Arc's header row.
                "absolute top-[calc(var(--space-6)+(var(--text-lg)*var(--leading-body)-var(--space-8))/2)] right-(--space-6)"
              )}
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Cerrar</span>
            </ControlButton></MotionSlot>
          </DialogPrimitive.Close>
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
 * @param props - Primitive properties and optional consumer overrides.
 * @returns The styled primitive with its original interaction contract.
 */
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(dialogFooterClassName, className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="secondary">Cerrar</Button>
        </DialogPrimitive.Close>
      )}
    </div>
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
