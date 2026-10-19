"use client"

import { cn } from "../lib/utils.js"
import { Toaster } from "./toaster.js"
import type { ToasterProps } from "sonner"
import { useTheme } from "next-themes"
import { CircleCheck, Info, TriangleAlert, OctagonAlert, Loader } from "lucide-react"

/**
 * Renders shared notification styling using the consumer's resolved theme, on top of @golfo/ui's `Toaster`, so its
 * toasts stay usable from an open `Dialog` (also in `alert` mode) or `Sheet`.
 */
const ThemedToaster = ({ theme, className, ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  const activeTheme = theme ?? (resolvedTheme === "dark" ? "dark" : "light")

  return (
    <Toaster
      theme={activeTheme}
      className={cn("toaster group", className)}
      icons={{
        success: (
          <CircleCheck className="size-4" />
        ),
        info: (
          <Info className="size-4" />
        ),
        warning: (
          <TriangleAlert className="size-4" />
        ),
        error: (
          <OctagonAlert className="size-4" />
        ),
        loading: (
          <Loader className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { ThemedToaster }
