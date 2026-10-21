/**
 * Inline text semantics on Arc's type rules (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md). Emphasis
 * never goes past weight 500, accent tints only highlight, code uses the platform monospace like Arc's code block, and
 * `Kbd` is the key cap of Arc's shortcut recorder. Each component inherits the size of the text around it.
 * Free of client hooks, so it also renders in Server Components.
 */
import type { ComponentProps, ElementType, JSX } from "react"

import { KBD_DEFAULT_SIZE } from "../constants/typography.js"
import type { KbdSize } from "../constants/typography.js"
import { cn } from "../lib/utils.js"

export type { KbdSize }

/** HTML elements that carry inline text semantics. */
type InlineTextTag = keyof JSX.IntrinsicElements

/**
 * Builds a component that renders one inline element with Arc's styling and a stable `data-slot`.
 * @param tag - HTML element to render.
 * @param slot - Value of `data-slot`, so consumers and tests can find the part.
 * @param baseClassName - Arc's styling for the element; the consumer's `className` is merged after it.
 * @param displayName - Name shown by React DevTools.
 * @returns The component.
 */
function createInlineText<Tag extends InlineTextTag>(
  tag: Tag,
  slot: string,
  baseClassName: string,
  displayName: string
) {
  function InlineText({ className, ...props }: ComponentProps<Tag>) {
    const Element = tag as ElementType
    return <Element data-slot={slot} className={cn(baseClassName, className)} {...props} />
  }
  InlineText.displayName = displayName
  return InlineText
}

/** Code-like content in the platform monospace, a little smaller so it sits on the line of the surrounding text. */
const monospaceClassName = "font-(family-name:--font-code) text-[.875em] tracking-normal [font-variant-ligatures:none]"

/** Strong importance at Arc's medium weight (500), never bold. */
const Strong = createInlineText("strong", "strong", "font-medium text-foreground", "Strong")

/** Text set apart without extra importance, at the same medium weight as `Strong`. */
const B = createInlineText("b", "b", "font-medium", "B")

/** Stress emphasis in italics. */
const Em = createInlineText("em", "em", "italic", "Em")

/** An alternate voice, such as a term or a foreign phrase, in italics. */
const I = createInlineText("i", "i", "italic", "I")

/** An unarticulated annotation, such as a misspelling, with a wavy underline that does not read as a link. */
const U = createInlineText(
  "u",
  "u",
  "underline decoration-text-muted decoration-wavy decoration-1 underline-offset-[3px]",
  "U"
)

/** Content that is no longer accurate, struck through in the muted colour. */
const S = createInlineText("s", "s", "line-through text-text-muted", "S")

/** A removal from the document, struck through in the muted colour. */
const Del = createInlineText("del", "del", "line-through text-text-muted", "Del")

/** An addition to the document, underlined with Arc's strong border colour. */
const Ins = createInlineText(
  "ins",
  "ins",
  "underline decoration-border-strong decoration-1 underline-offset-[3px]",
  "Ins"
)

/** Highlighted text on Arc's subtle accent tint, with the strong accent for contrast. */
const Mark = createInlineText(
  "mark",
  "mark",
  "rounded-[.25em] bg-(--accent-subtle) px-[.15em] text-(--accent-strong) [box-decoration-break:clone]",
  "Mark"
)

/** An inline fragment of code on a muted chip with a hairline border. */
const Code = createInlineText(
  "code",
  "code",
  cn(
    monospaceClassName,
    "rounded-[.375em] border border-border-subtle bg-surface-muted px-[.35em] py-[.1em] text-foreground [box-decoration-break:clone] in-data-[slot=pre]:rounded-none in-data-[slot=pre]:border-0 in-data-[slot=pre]:bg-transparent in-data-[slot=pre]:p-0 in-data-[slot=pre]:text-[1em]"
  ),
  "Code"
)

/** Sample output from a program, in the platform monospace. */
const Samp = createInlineText("samp", "samp", cn(monospaceClassName, "text-text-secondary"), "Samp")

/** A variable in a mathematical expression or program, in italics. */
const Var = createInlineText("var", "var", "italic", "Var")

/**
 * An abbreviation. With a `title`, a dotted underline and the help cursor show that it expands; the title is also the
 * expansion assistive technology reads.
 */
const Abbr = createInlineText(
  "abbr",
  "abbr",
  "no-underline [&[title]]:cursor-help [&[title]]:underline [&[title]]:decoration-text-muted [&[title]]:decoration-dotted [&[title]]:underline-offset-[3px]",
  "Abbr"
)

/** The title of a cited work, upright in the secondary colour. */
const Cite = createInlineText("cite", "cite", "not-italic text-text-secondary", "Cite")

/** The defining instance of a term, in italics at the medium weight. */
const Dfn = createInlineText("dfn", "dfn", "italic font-medium", "Dfn")

/** A short inline quotation; the browser adds the quotation marks of the document language. */
const Q = createInlineText("q", "q", "", "Q")

/** A subscript, smaller and lowered without stretching the line. */
const Sub = createInlineText("sub", "sub", "relative bottom-[-.25em] align-baseline text-[.75em] leading-none", "Sub")

/** A superscript, smaller and raised without stretching the line. */
const Sup = createInlineText("sup", "sup", "relative top-[-.5em] align-baseline text-[.75em] leading-none", "Sup")

/** A date or time, with tabular figures so changing values do not shift. Pass `dateTime` for a machine-readable value. */
const Time = createInlineText("time", "time", "tabular-nums", "Time")

export type StrongProps = ComponentProps<"strong">
export type BProps = ComponentProps<"b">
export type EmProps = ComponentProps<"em">
export type IProps = ComponentProps<"i">
export type UProps = ComponentProps<"u">
export type SProps = ComponentProps<"s">
export type DelProps = ComponentProps<"del">
export type InsProps = ComponentProps<"ins">
export type MarkProps = ComponentProps<"mark">
export type CodeProps = ComponentProps<"code">
export type SampProps = ComponentProps<"samp">
export type VarProps = ComponentProps<"var">
export type AbbrProps = ComponentProps<"abbr">
export type CiteProps = ComponentProps<"cite">
export type DfnProps = ComponentProps<"dfn">
export type QProps = ComponentProps<"q">
export type SubProps = ComponentProps<"sub">
export type SupProps = ComponentProps<"sup">
export type TimeProps = ComponentProps<"time">

export type KbdProps = ComponentProps<"kbd"> & {
  /** Arc's key cap height: `md` (26px, default) or `sm` (22px). */
  size?: KbdSize
}

/**
 * A key or key combination, drawn as Arc's raised key cap with a heavier bottom edge. Render one per key.
 * @param props - Key cap size and native `kbd` attributes.
 * @returns The key cap.
 */
function Kbd({ size = KBD_DEFAULT_SIZE, className, ...props }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      data-size={size}
      className={cn(
        "box-border inline-grid place-items-center border border-b-2 border-border-strong bg-surface-raised pb-px font-(family-name:--font-body) text-(length:--text-xs) leading-none font-medium tracking-normal whitespace-nowrap text-foreground tabular-nums",
        size === "sm" ? "h-[22px] min-w-[22px] rounded-[7px] px-[5px]" : "h-[26px] min-w-[26px] rounded-[8px] px-[7px]",
        className
      )}
      {...props}
    />
  )
}

export { Strong, B, Em, I, U, S, Del, Ins, Mark, Code, Kbd, Samp, Var, Abbr, Cite, Dfn, Q, Sub, Sup, Time }
