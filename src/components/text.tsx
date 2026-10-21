/**
 * Block text on Arc's type rules (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): Inter with body tracking
 * and leading, sizes from Arc's scale, weights 400 and 500, and hierarchy through Arc's colour roles instead of bold.
 * Free of client hooks, so it also renders in Server Components.
 */
import type { ComponentProps } from "react"

import { TEXT_DEFAULT_SIZE, TEXT_DEFAULT_TONE } from "../constants/typography.js"
import type { TextSize, TextTone } from "../constants/typography.js"
import { cn } from "../lib/utils.js"

export type { TextSize, TextTone }

/** Font size of each step of Arc's scale used for running text. */
const textSizeClassName: Record<TextSize, string> = {
  xs: "text-(length:--text-xs)",
  sm: "text-(length:--text-sm)",
  base: "text-(length:--text-base)",
  lg: "text-(length:--text-lg)",
}

/** Colour of each of Arc's text roles. */
const textToneClassName: Record<TextTone, string> = {
  default: "text-foreground",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
}

/** Inter with Arc's body tracking (-0.01em) and leading (1.4). */
const bodyTextClassName =
  "m-0 font-(family-name:--font-body) font-normal leading-(--leading-body) tracking-(--tracking-body)"

/** Size and colour role shared by the block text components. */
type TextStyleProps = {
  /** Step of Arc's type scale: `xs` (12px), `sm` (14px), `base` (16px) or `lg` (18px). */
  size?: TextSize
  /** Arc's colour role: `default` (foreground), `secondary` or `muted`. */
  tone?: TextTone
}

export type TextProps = ComponentProps<"p"> & TextStyleProps

/**
 * A paragraph of running text.
 * @param props - Size, colour role and native paragraph attributes.
 * @returns The paragraph.
 */
function Text({ size = TEXT_DEFAULT_SIZE, tone = TEXT_DEFAULT_TONE, className, ...props }: TextProps) {
  return (
    <p
      data-slot="text"
      data-size={size}
      data-tone={tone}
      className={cn(bodyTextClassName, "text-pretty", textSizeClassName[size], textToneClassName[tone], className)}
      {...props}
    />
  )
}

export type LeadProps = ComponentProps<"p">

/**
 * The introductory paragraph under a page or section title: 18px in Arc's secondary text colour.
 * @param props - Native paragraph attributes.
 * @returns The paragraph.
 */
function Lead({ className, ...props }: LeadProps) {
  return (
    <p
      data-slot="lead"
      className={cn(bodyTextClassName, "text-pretty", textSizeClassName.lg, textToneClassName.secondary, className)}
      {...props}
    />
  )
}

export type SmallProps = ComponentProps<"small"> & TextStyleProps

/**
 * Side comments and fine print, such as a hint or a legal note: 14px in the secondary colour by default.
 * @param props - Size, colour role and native `small` attributes.
 * @returns The `small` element.
 */
function Small({ size = "sm", tone = "secondary", className, ...props }: SmallProps) {
  return (
    <small
      data-slot="small"
      data-size={size}
      data-tone={tone}
      className={cn("leading-(--leading-body)", textSizeClassName[size], textToneClassName[tone], className)}
      {...props}
    />
  )
}

export type BlockquoteProps = ComponentProps<"blockquote">

/**
 * A quotation set off from the text by a hairline on its leading edge, in the secondary colour.
 * @param props - Native blockquote attributes, including `cite`.
 * @returns The blockquote.
 */
function Blockquote({ className, ...props }: BlockquoteProps) {
  return (
    <blockquote
      data-slot="blockquote"
      className={cn(
        bodyTextClassName,
        "border-s-2 border-border-strong ps-(--space-4) text-pretty",
        textSizeClassName.base,
        textToneClassName.secondary,
        className
      )}
      {...props}
    />
  )
}

export type PreProps = ComponentProps<"pre">

/**
 * Preformatted text, such as a code sample or command output, set like Arc's code block: the platform monospace at
 * 14px with roomy leading, on a muted surface that scrolls sideways instead of wrapping.
 * @param props - Native `pre` attributes.
 * @returns The `pre` element.
 */
function Pre({ className, ...props }: PreProps) {
  return (
    <pre
      data-slot="pre"
      className={cn(
        "m-0 overflow-auto rounded-(--radius-control) border border-border bg-surface-muted p-(--space-4) font-(family-name:--font-code) text-(length:--text-sm) leading-[1.7] whitespace-pre text-foreground [font-variant-ligatures:none] [tab-size:2]",
        className
      )}
      {...props}
    />
  )
}

export type AddressProps = ComponentProps<"address">

/**
 * Contact information for the page or the nearest article, upright instead of the browser's italics.
 * @param props - Native address attributes.
 * @returns The address element.
 */
function Address({ className, ...props }: AddressProps) {
  return (
    <address
      data-slot="address"
      className={cn(bodyTextClassName, "not-italic", textSizeClassName.base, textToneClassName.default, className)}
      {...props}
    />
  )
}

export { Text, Lead, Small, Blockquote, Pre, Address }
