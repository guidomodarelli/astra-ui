"use client"

/**
 * Arc's Dialog surface (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md), shared by `Dialog` and
 * `AlertDialog`: the dimmed, blurred overlay, the raised panel with Arc's surface radius, border and floating shadow,
 * the title and description type, the bordered close button and the text swap that animates a title or description
 * changed while the dialog is open. Internal: the entrance stays beez-ui's center morph, not Arc's rise.
 */
import { AnimatePresence, motion, useIsPresent } from "motion/react"
import type { ReactNode, Ref } from "react"

import { DIALOG_TEXT_SWAP_OFFSET_EM } from "../constants/dialog.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { ARC_BLUR, ARC_DURATION, ARC_EASE } from "../motion/arc-tokens.js"

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
