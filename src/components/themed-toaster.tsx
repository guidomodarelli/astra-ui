"use client"

import { MotionSlot } from "../motion/motion-slot.js"
import { cn } from "../lib/utils.js"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "next-themes"
import { CircleCheck, Info, TriangleAlert, OctagonAlert, Loader } from "lucide-react"

/**
 * Renders shared notification styling using the consumer's resolved theme. Toasts take pointer input even while a
 * modal overlay (which disables pointer events on the page) is open, so their actions stay usable from a dialog.
 */
const ThemedToaster = ({ theme, className, ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  const activeTheme = theme ?? (resolvedTheme === "dark" ? "dark" : "light")

  return (
    <Sonner
      theme={activeTheme}
      className={cn("toaster group pointer-events-auto", className)}
      icons={{
        success: (
          <MotionSlot kind="selection"><CircleCheck className="size-4" /></MotionSlot>
        ),
        info: (
          <MotionSlot kind="selection"><Info className="size-4" /></MotionSlot>
        ),
        warning: (
          <MotionSlot kind="selection"><TriangleAlert className="size-4" /></MotionSlot>
        ),
        error: (
          <MotionSlot kind="selection"><OctagonAlert className="size-4" /></MotionSlot>
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
