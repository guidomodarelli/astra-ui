"use client"

/**
 * Arc's Dialog surface (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md), shared by `Dialog` and
 * its `alert` mode: the dimmed, blurred overlay, the raised panel with Arc's surface radius, border and floating shadow,
 * the title and description type, the bordered close button and the text swap that animates a title or description
 * changed while the dialog is open. Internal: the entrance stays beez-ui's center morph, not Arc's rise.
 */
import { XIcon } from "lucide-react"
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import { AlertDialog as AlertDialogPrimitive, Dialog as DialogPrimitive } from "radix-ui"
import type { ReactNode, Ref } from "react"

import { DIALOG_DEFAULT_COPY, DIALOG_TEXT_SWAP_OFFSET_EM } from "../constants/dialog.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE } from "../motion/arc-tokens.js"
import { MotionSlot } from "../motion/motion-slot.js"
import { ControlButton } from "./control-button.js"

/** Arc's overlay: a near-black scrim at 46% with a 7px backdrop blur where the engine supports it. */
export const dialogOverlayClassName =
  "fixed inset-0 isolate z-50 bg-[oklch(10%_0_0/0.46)] supports-backdrop-filter:backdrop-blur-[7px]"

/**
 * Arc's panel: raised surface, hairline border, surface radius and floating shadow, padded on Arc's 24px step.
 * Placement, width and scrolling stay with each dialog.
 */
export const dialogSurfaceClassName =
  "z-50 gap-(--space-5) rounded-(--radius-surface) border border-border bg-surface-raised p-(--space-6) text-sm leading-(--leading-body) text-foreground shadow-(--shadow-floating) outline-none"

/** Edge-to-edge action row: bleeds through the panel padding and sits under a hairline like Arc's header divider. */
export const dialogFooterClassName =
  "-mx-(--space-6) -mb-(--space-6) flex flex-col-reverse gap-(--space-2) rounded-b-[calc(var(--radius-surface)-1px)] border-t border-border bg-surface-muted/50 px-(--space-6) py-(--space-4) sm:flex-row sm:justify-end"

/** Arc's title: body font at 18px, medium weight, body leading so a heading reset never shrinks it. */
export const dialogTitleClassName =
  "font-sans text-lg leading-(--leading-body) font-medium tracking-(--tracking-body) [overflow-wrap:anywhere]"

/** Arc's description: secondary text at 14px on body leading. */
export const dialogDescriptionClassName =
  "text-sm leading-(--leading-body) text-text-secondary [overflow-wrap:anywhere] *:[a]:underline *:[a]:underline-offset-3 hover-fine:*:[a]:text-foreground"

/**
 * Arc's compact close button: 32px, bordered, half-tinted, quiet until a fine pointer hovers it. Press feedback comes
 * from `ControlButton`.
 */
export const dialogCloseButtonClassName =
  "size-(--space-8) rounded-(--radius-control) border-border bg-surface-muted/50 text-text-secondary hover-fine:bg-surface-muted hover-fine:text-foreground [&_svg:not([class*='size-'])]:size-4"

/** Where the dialog close button sits: inside the panel or pinned to the viewport corner. */
export type DialogCloseButtonPlacement = "content" | "viewport"

/** Which Radix family owns the close button: a regular dialog closes, an alert dialog cancels. */
export type DialogSurfaceKind = "dialog" | "alert"

/** Classes of a close button pinned to the viewport corner while the panel unfolds and closes. */
const viewportCloseButtonClassName =
  "fixed top-4 right-4 transition-opacity duration-200 ease-out in-data-motion-entering:invisible in-data-motion-entering:opacity-0 in-data-motion-entering:transition-none in-data-[state=closed]:invisible in-data-[state=closed]:opacity-0 in-data-[state=closed]:transition-none motion-reduce:transition-none"

/** Classes of a close button centred on the first line of an 18px title, as in Arc's header row. */
const contentCloseButtonClassName =
  "absolute top-[calc(var(--space-6)+(var(--text-lg)*var(--leading-body)-var(--space-8))/2)] right-(--space-6)"

/**
 * Arc's bordered close button for both dialog families. Pinned to the viewport corner it stays hidden while the panel
 * unfolds, because the entrance clip would otherwise cut it with the panel, fades in once the panel settles and hides
 * at once when the dialog starts closing; while hidden it is also `visibility: hidden`, so the initial focus and the
 * keyboard never land on a control that cannot be seen. Inside the panel it pops in after the panel.
 * @param props - The Radix family, the placement and the accessible name.
 * @param props.kind - `alert` renders Radix's `AlertDialog.Cancel`, `dialog` its `Dialog.Close`.
 * @param props.placement - `viewport` pins it to the viewport corner; `content` keeps it in the panel.
 * @param props.label - Accessible name of the icon-only button.
 * @returns The close control.
 */
export function DialogSurfaceCloseButton({
  kind,
  placement,
  label = DIALOG_DEFAULT_COPY.closeLabel,
}: {
  kind: DialogSurfaceKind
  placement: DialogCloseButtonPlacement
  label?: string
}) {
  const Close = kind === "alert" ? AlertDialogPrimitive.Cancel : DialogPrimitive.Close
  const button = (
    <ControlButton
      variant="ghost"
      size="icon-sm"
      className={cn(
        dialogCloseButtonClassName,
        placement === "viewport" ? viewportCloseButtonClassName : contentCloseButtonClassName
      )}
    >
      <XIcon aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </ControlButton>
  )
  return (
    <Close data-slot="dialog-close" asChild>
      {placement === "viewport" ? button : <MotionSlot kind="delayed-pop">{button}</MotionSlot>}
    </Close>
  )
}

/**
 * One version of the copy. While it lifts out it turns inert and hidden from assistive technology, so the dialog's
 * accessible name never reads the old and the new copy together.
 * @param props - The copy to render and the ref `AnimatePresence` injects to pop the leaving copy out of layout.
 * @returns The animated copy.
 */
function DialogSwapTextItem({ children, ref }: { children: ReactNode; ref?: Ref<HTMLSpanElement> }) {
  const isPresent = useIsPresent()
  const shouldReduceMotion = usePrefersReducedMotion()
  return (
    <motion.span
      ref={ref}
      data-slot="dialog-swap-text"
      className="block"
      aria-hidden={isPresent ? undefined : true}
      inert={!isPresent || undefined}
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: `${DIALOG_TEXT_SWAP_OFFSET_EM.enter}em`, filter: `blur(${ARC_BLUR.soft}px)` }
      }
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={
        shouldReduceMotion
          ? { opacity: 0, transition: { duration: 0 } }
          : {
              opacity: 0,
              y: `${DIALOG_TEXT_SWAP_OFFSET_EM.exit}em`,
              filter: `blur(${ARC_BLUR.subtle}px)`,
              transition: { duration: ARC_DURATION.fast, ease: [...ARC_EASE.standard] },
            }
      }
      transition={{ duration: ARC_DURATION.standard, ease: [...ARC_EASE.enter] }}
    >
      {children}
    </motion.span>
  )
}

/**
 * Arc's text swap: when a dialog's title or description text changes while it is open, the new copy rises in and the
 * old copy lifts out. The first render is static, so server HTML and the opening frame never animate the copy.
 * @param children - Copy of the title or description. Only plain text and numbers animate when they change.
 * @param asChild - Whether the primitive renders the consumer's element, which must then receive it untouched.
 * @returns The copy, wrapped for the swap when it is plain text.
 */
export function withDialogSwapText(children: ReactNode, asChild = false): ReactNode {
  if (asChild || (typeof children !== "string" && typeof children !== "number")) return children
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <DialogSwapTextItem key={String(children)}>{children}</DialogSwapTextItem>
    </AnimatePresence>
  )
}
