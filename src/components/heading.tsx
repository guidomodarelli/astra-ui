/**
 * Headings on Arc's type rules (https://uiarc.dev, MIT License, see THIRD_PARTY_NOTICES.md): sizes come from Arc's
 * scale, weight stays at 500, headings of 30px and up are set in Geist with display tracking and leading, and smaller
 * ones stay in Inter. The level sets the document outline and the size sets the look, so they can differ.
 * Free of client hooks, so it also renders in Server Components.
 */
import type { ComponentProps } from "react"

import { HEADING_DEFAULT_SIZE, HEADING_DISPLAY_SIZES } from "../constants/typography.js"
import type { HeadingLevel, HeadingSize } from "../constants/typography.js"
import { cn } from "../lib/utils.js"

export type { HeadingLevel, HeadingSize }

/** Font size of each step of Arc's scale. */
const headingSizeClassName: Record<HeadingSize, string> = {
  sm: "text-(length:--text-sm)",
  base: "text-(length:--text-base)",
  lg: "text-(length:--text-lg)",
  xl: "text-(length:--text-xl)",
  "2xl": "text-(length:--text-2xl)",
  "3xl": "text-(length:--text-3xl)",
  "4xl": "text-(length:--text-4xl)",
  "5xl": "text-(length:--text-5xl)",
}

/** Geist with Arc's display tracking (-0.03em) and leading (1.1). */
const displayFaceClassName =
  "font-(family-name:--font-display) leading-(--leading-display) tracking-(--tracking-display)"

/** Inter with Arc's body tracking (-0.01em) and leading (1.4). */
const bodyFaceClassName = "font-(family-name:--font-body) leading-(--leading-body) tracking-(--tracking-body)"

/**
 * Reports whether Arc sets a heading size in its display face.
 * @param size - Step of the type scale.
 * @returns Whether the size is 30px or larger.
 */
function isDisplaySize(size: HeadingSize): boolean {
  return (HEADING_DISPLAY_SIZES as readonly HeadingSize[]).includes(size)
}

export type HeadingProps = ComponentProps<"h2"> & {
  /** Level in the document outline, rendered as `h1` to `h6`. Defaults to 2. */
  level?: HeadingLevel
  /** Step of Arc's type scale. Defaults to the level's size: 3xl, 2xl, xl, lg, base and sm for levels 1 to 6. */
  size?: HeadingSize
}

/** Props of the fixed-level shortcuts `H1` to `H6`. */
export type HeadingLevelProps = Omit<HeadingProps, "level">

/**
 * A section heading on Arc's type scale.
 * @param props - Outline level, visual size and native heading attributes.
 * @returns The heading element of the given level.
 */
function Heading({ level = 2, size, className, ...props }: HeadingProps) {
  const HeadingTag = `h${level}` as const
  const resolvedSize = size ?? HEADING_DEFAULT_SIZE[level]
  return (
    <HeadingTag
      data-slot="heading"
      data-level={level}
      data-size={resolvedSize}
      className={cn(
        "m-0 font-medium text-balance text-foreground",
        headingSizeClassName[resolvedSize],
        isDisplaySize(resolvedSize) ? displayFaceClassName : bodyFaceClassName,
        className
      )}
      {...props}
    />
  )
}

/** A level 1 heading, 36px in Geist unless `size` says otherwise. */
function H1(props: HeadingLevelProps) {
  return <Heading level={1} {...props} />
}

/** A level 2 heading, 28px in Inter unless `size` says otherwise. */
function H2(props: HeadingLevelProps) {
  return <Heading level={2} {...props} />
}

/** A level 3 heading, 22px in Inter unless `size` says otherwise. */
function H3(props: HeadingLevelProps) {
  return <Heading level={3} {...props} />
}

/** A level 4 heading, 18px in Inter unless `size` says otherwise. */
function H4(props: HeadingLevelProps) {
  return <Heading level={4} {...props} />
}

/** A level 5 heading, 16px in Inter unless `size` says otherwise. */
function H5(props: HeadingLevelProps) {
  return <Heading level={5} {...props} />
}

/** A level 6 heading, 14px in Inter unless `size` says otherwise. */
function H6(props: HeadingLevelProps) {
  return <Heading level={6} {...props} />
}

export { Heading, H1, H2, H3, H4, H5, H6 }
