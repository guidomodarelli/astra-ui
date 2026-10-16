"use client"

/**
 * Arc's Dialog (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): a focused surface for decisions that need
 * attention. Arc's API (`Dialog`, `DialogTrigger`, `DialogContent` with its `title`, `description` and built-in close
 * button, `DialogClose`) on Arc's overlay, raised panel, text swap and dialog transition. beez-ui
 * extends it with a footer slot, a hidden title, the viewport close button placement, Spanish copy and an `alert` mode
 * that replaces the former `AlertDialog`.
 */
import { createContext, useContext, type ComponentProps, type ReactNode, type Ref } from "react"
import { AlertDialog as AlertDialogPrimitive, type Dialog as DialogRadix } from "radix-ui"

import { cn } from "../lib/utils.js"
import type { DialogCloseButtonPlacement } from "./dialog-surface.js"
import {
  AlertDialog as AlertDialogRoot,
  AlertDialogContent as AlertDialogContentPrimitive,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./primitives/alert-dialog.js"
import {
  Dialog as DialogRoot,
  DialogClose as DialogClosePrimitive,
  DialogContent as DialogContentPrimitive,
  DialogDescription as DialogDescriptionPrimitive,
  DialogFooter as DialogFooterPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
  DialogTrigger as DialogTriggerPrimitive,
} from "./primitives/dialog.js"

export type { DialogCloseButtonPlacement } from "./dialog-surface.js"

/** Marks the consumer's close controls, so an alert dialog can focus the first one when it opens. */
const DIALOG_CLOSE_ACTION_ATTRIBUTE = "data-dialog-close-action"

/** Whether the surrounding `Dialog` runs in `alert` mode. */
const DialogAlertContext = createContext(false)

/** Props of `Dialog`: Radix's root contract plus beez-ui's `alert` mode. */
export type DialogProps = ComponentProps<typeof DialogRadix.Root> & {
  /**
   * Gives the dialog alert dialog semantics: `role="alertdialog"`, a press outside never closes it, it opens with the
   * focus on the first `DialogClose` (the least destructive answer) and `DialogContent` hides its close button by
   * default. `Escape` still cancels it. `modal` does not apply: an alert dialog is always modal.
   */
  alert?: boolean
}

/**
 * Root that tracks the open state so the content can animate out. Controlled (`open`, `onOpenChange`) or uncontrolled
 * (`defaultOpen`).
 * @param props - Radix root props and `alert`.
 * @returns The dialog root.
 */
function Dialog({ alert = false, modal, ...props }: DialogProps) {
  return (
    <DialogAlertContext.Provider value={alert}>
      {alert ? <AlertDialogRoot {...props} /> : <DialogRoot modal={modal} {...props} />}
    </DialogAlertContext.Provider>
  )
}

/** Props of `DialogTrigger`: Radix's trigger contract, including `asChild`. */
export type DialogTriggerProps = ComponentProps<typeof DialogRadix.Trigger>

/**
 * Opens the dialog. Use `asChild` to render your own button.
 * @param props - Radix trigger props.
 * @returns The trigger.
 */
function DialogTrigger(props: DialogTriggerProps) {
  return useContext(DialogAlertContext) ? <AlertDialogTrigger {...props} /> : <DialogTriggerPrimitive {...props} />
}

/** Props of `DialogClose`: Radix's close contract, including `asChild`. */
export type DialogCloseProps = ComponentProps<typeof DialogRadix.Close>

/**
 * Closes the dialog from a custom control, such as a cancel button. In `alert` mode it cancels the confirmation, and
 * the first one receives the focus when the dialog opens.
 * @param props - Radix close props.
 * @returns The close control.
 */
function DialogClose(props: DialogCloseProps) {
  const closeActionProps = { [DIALOG_CLOSE_ACTION_ATTRIBUTE]: "" }
  return useContext(DialogAlertContext) ? (
    <AlertDialogPrimitive.Cancel data-slot="dialog-close" {...closeActionProps} {...props} />
  ) : (
    <DialogClosePrimitive {...closeActionProps} {...props} />
  )
}

/** Props of `DialogContent`: Arc's titled panel, beez-ui's extensions and Radix's content props. */
export type DialogContentProps = Omit<ComponentProps<typeof DialogRadix.Content>, "title" | "children"> & {
  /** Heading of the dialog and its accessible name. Plain text that changes while open crossfades in place. */
  title: ReactNode
  /** Supporting line under the title, wired to `aria-describedby`. */
  description?: ReactNode
  /** Body of the dialog, usually a form or actions. */
  children?: ReactNode
  /** Edge-to-edge action row under a hairline at the bottom of the panel, usually the dialog's buttons. */
  footer?: ReactNode
  /** Keeps the title as the accessible name but shows it only to screen readers. */
  hideTitle?: boolean
  /** Whether the panel renders its close button. Defaults to `true`, or `false` in `alert` mode. */
  showCloseButton?: boolean
  /**
   * `content` (default) places the close button in the panel header; `viewport` pins it to the viewport corner and
   * shows it once the panel has settled.
   */
  closeButtonPlacement?: DialogCloseButtonPlacement
  /** Accessible name of the close button. Defaults to "Cerrar diálogo". */
  closeLabel?: string
  /**
   * Ref of the built-in close button, while it is rendered. To open the dialog with the focus on it, call
   * `event.preventDefault()` in `onOpenAutoFocus` and focus `closeButtonRef.current`.
   */
  closeButtonRef?: Ref<HTMLButtonElement>
  /**
   * Extra content of the header, rendered after the title and before the description but outside the title, such as
   * type or status badges. The dialog keeps the title alone as its accessible name.
   */
  headerContent?: ReactNode
  /** Classes of the block that holds the title, the header content and the description. */
  headerClassName?: string
  /** Classes of the title. */
  titleClassName?: string
  /** Classes of the description. */
  descriptionClassName?: string
  /** Classes of the footer. */
  footerClassName?: string
}

/**
 * Focuses the first consumer close control of an alert dialog when it opens, or the panel when there is none.
 * @param event - Radix's open auto-focus event, already handed to the consumer's handler.
 */
function focusFirstCloseAction(event: Event) {
  if (event.defaultPrevented) return
  const panel = event.currentTarget ?? event.target
  if (!(panel instanceof HTMLElement)) return
  event.preventDefault()
  const firstCloseAction = panel.querySelector<HTMLElement>(`[${DIALOG_CLOSE_ACTION_ATTRIBUTE}]`)
  ;(firstCloseAction ?? panel).focus({ preventScroll: true })
}

/**
 * The portaled overlay and panel with a titled header, the body, an optional footer and the built-in close button.
 * @param props - Title, header content, description, body, footer, close button options and ref, part classes and
 *   Radix content props.
 * @returns The dialog panel.
 */
function DialogContent({
  title,
  description,
  children,
  footer,
  hideTitle = false,
  showCloseButton,
  closeButtonPlacement = "content",
  closeLabel,
  closeButtonRef,
  headerContent,
  headerClassName,
  titleClassName,
  descriptionClassName,
  footerClassName,
  onOpenAutoFocus,
  ...props
}: DialogContentProps) {
  const alert = useContext(DialogAlertContext)
  const Content = alert ? AlertDialogContentPrimitive : DialogContentPrimitive
  const Header = alert ? AlertDialogHeader : DialogHeaderPrimitive
  const Title = alert ? AlertDialogTitle : DialogTitlePrimitive
  const Description = alert ? AlertDialogDescription : DialogDescriptionPrimitive
  const Footer = alert ? AlertDialogFooter : DialogFooterPrimitive
  const hasDescription = description !== undefined && description !== null && description !== false
  const hasHeaderContent = headerContent !== undefined && headerContent !== null && headerContent !== false
  // Without a description, Radix would point `aria-describedby` at a missing element and warn about it.
  const describedBy = hasDescription || "aria-describedby" in props ? {} : { "aria-describedby": undefined }

  const titleElement = <Title className={cn(hideTitle && "sr-only", titleClassName)}>{title}</Title>
  const descriptionElement = hasDescription ? (
    <Description className={descriptionClassName}>{description}</Description>
  ) : null

  return (
    <Content
      {...describedBy}
      {...props}
      showCloseButton={showCloseButton ?? !alert}
      closeButtonPlacement={closeButtonPlacement}
      closeLabel={closeLabel}
      closeButtonRef={closeButtonRef}
      onOpenAutoFocus={(event: Event) => {
        onOpenAutoFocus?.(event)
        if (alert) focusFirstCloseAction(event)
      }}
    >
      {hideTitle ? titleElement : null}
      {!hideTitle || descriptionElement || hasHeaderContent ? (
        <Header className={headerClassName}>
          {hideTitle ? null : titleElement}
          {hasHeaderContent ? headerContent : null}
          {descriptionElement}
        </Header>
      ) : null}
      {children}
      {footer === undefined || footer === null || footer === false ? null : <Footer className={footerClassName}>{footer}</Footer>}
    </Content>
  )
}

export { Dialog, DialogClose, DialogContent, DialogTrigger }
