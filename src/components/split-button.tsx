"use client"

/**
 * Arc's SplitButton (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md) built from @golfo/ui's `Button` and
 * `DropdownMenu`: a main action whose icon and label morph in place, joined to a menu of related actions. The menu
 * half never scales on press, so the menu opens from a still anchor.
 */
import { isValidElement, useRef } from "react"
import type { ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"

import { ChevronDown } from "lucide-react"

import { SPLIT_BUTTON_SIZE_BY_VARIANT } from "../constants/split-button.js"
import type { SplitButtonVariant } from "../constants/split-button.js"
import { usePrefersReducedMotion } from "../hooks/use-prefers-reduced-motion.js"
import { cn } from "../lib/utils.js"
import {
  ARC_ICON_ENTER as iconEnter,
  ARC_ICON_EXIT as iconExit,
  ARC_ICON_TRANSITION as iconTransition,
  ARC_REDUCED_ENTER as reducedEnter,
  ARC_REDUCED_EXIT as reducedExit,
  ARC_REDUCED_TRANSITION as reducedTransition,
  ARC_SWAP_REST as restState,
} from "../motion/arc-swap.js"
import { useMorphWidth } from "../motion/use-morph-width.js"
import { Button } from "./button.js"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./primitives/dropdown-menu.js"
import { MorphText } from "./morph-text.js"

export type { SplitButtonVariant } from "../constants/split-button.js"

/** One entry of the menu half. */
export type SplitButtonAction = {
  label: string
  onSelect?: () => void
  disabled?: boolean
  /** Marks an action that deletes or discards, drawn in the danger color. */
  destructive?: boolean
  icon?: ReactNode
}

export type SplitButtonProps = {
  /** Label of the main action and its accessible name; changing it morphs the letters in place. */
  label: string
  /** Actions of the menu half, in order. */
  actions: SplitButtonAction[]
  /** Runs the main action. */
  onClick?: () => void
  disabled?: boolean
  /** Icon before the label; swapping it for another element (such as Copy for Check) crossfades it. */
  icon?: ReactNode
  /** `primary` for the main action of a surface, `secondary` for a quieter, smaller one. */
  variant?: SplitButtonVariant
  /** Accessible name of the menu half; defaults to "Más acciones de {label}". */
  menuLabel?: string
  className?: string
}

/**
 * Names an icon element, so swapping Copy for Check morphs while a re-render of the same icon stays still.
 * @param icon - Icon node.
 * @returns Element name, the text of a text node, or an empty string.
 */
function getIconKey(icon: ReactNode): string {
  if (!isValidElement(icon)) return icon == null || typeof icon === "boolean" ? "" : String(icon)
  const elementType = icon.type as string | { displayName?: string; name?: string }
  return typeof elementType === "string" ? elementType : (elementType?.displayName ?? elementType?.name ?? "icon")
}

/**
 * Visible content of the main action: the icon and the morphing label, inside a slot whose width follows on a
 * spring when either changes.
 * @param props - Label, icon and whether the user prefers reduced motion.
 * @returns Content hidden from assistive tech; the button names itself through `aria-label`.
 */
function SplitButtonMainContent({ label, icon, reduceMotion }: { label: string; icon: ReactNode; reduceMotion: boolean }) {
  const contentRef = useRef<HTMLSpanElement>(null)
  const iconKey = getIconKey(icon)
  const width = useMorphWidth(contentRef, `${iconKey}|${label}`, reduceMotion)

  return (
    <motion.span
      data-slot="split-button-label"
      className="inline-flex min-w-0 items-center data-morphing:[clip-path:inset(-50%_calc(var(--spacing)*-2))]"
      style={{ width }}
      aria-hidden="true"
    >
      <span ref={contentRef} className="inline-flex flex-none items-center gap-2 whitespace-nowrap">
        {icon ? (
          <span className="inline-grid flex-none place-items-center">
            <AnimatePresence initial={false}>
              <motion.span
                key={iconKey}
                className="col-start-1 row-start-1 inline-flex items-center justify-center"
                initial={reduceMotion ? reducedEnter : iconEnter}
                animate={restState}
                exit={reduceMotion ? reducedExit : iconExit}
                transition={reduceMotion ? reducedTransition : iconTransition}
              >
                {icon}
              </motion.span>
            </AnimatePresence>
          </span>
        ) : null}
        <MorphText text={label} reduceMotion={reduceMotion} />
      </span>
    </motion.span>
  )
}

/**
 * A main action joined to a menu of related actions, such as Copy page with Copy as Markdown and Open in a new tab.
 * The main half announces label changes politely; the menu half opens a `DropdownMenu` aligned to its end.
 * @param props - Main action, its icon, the menu actions, the variant and accessible names.
 * @returns The joined pair of buttons and their menu.
 */
function SplitButton({
  label,
  actions,
  onClick,
  disabled,
  icon,
  variant = "primary",
  menuLabel,
  className,
}: SplitButtonProps) {
  const reduceMotion = usePrefersReducedMotion()
  const size = SPLIT_BUTTON_SIZE_BY_VARIANT[variant]

  return (
    <DropdownMenu>
      <div role="group" data-slot="split-button" data-variant={variant} className={cn("inline-flex items-stretch", className)}>
        <Button
          variant={variant}
          size={size}
          aria-label={label}
          className="rounded-r-none border-r-0"
          disabled={disabled}
          onClick={onClick}
        >
          <SplitButtonMainContent label={label} icon={icon} reduceMotion={reduceMotion} />
        </Button>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            variant={variant}
            size={size}
            aria-label={menuLabel ?? `Más acciones de ${label}`}
            className={cn(
              "w-(--control-height-md) rounded-l-none px-0 [&_svg]:transition-transform [&_svg]:duration-(--duration-fast) data-[state=open]:[&_svg]:rotate-180 motion-reduce:[&_svg]:transition-none",
              variant === "primary"
                ? "border-l-[color-mix(in_oklab,var(--background)_18%,var(--foreground))]"
                : "w-(--control-height-sm) border-l-border",
            )}
          >
            <ChevronDown strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <span className="sr-only" aria-live="polite">
          {label}
        </span>
      </div>
      <DropdownMenuContent align="end" sideOffset={4} collisionPadding={12} loop>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            variant={action.destructive ? "destructive" : "default"}
            disabled={action.disabled}
            onSelect={action.onSelect}
          >
            {action.icon ? <span aria-hidden="true">{action.icon}</span> : null}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { SplitButton }
