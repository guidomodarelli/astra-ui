"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import type { ThemeMode, ResolvedTheme } from "../theme.js";
import { MotionSlot } from "../motion/motion-slot.js";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./primitives/dropdown-menu.js";
import { cn } from "../lib/utils.js";

const THEME_OPTIONS = [
  {
    icon: Sun,
    label: "Claro",
    value: "light",
  },
  {
    icon: Moon,
    label: "Oscuro",
    value: "dark",
  },
  {
    icon: Monitor,
    label: "Sistema",
    value: "system",
  },
] as const;



type ThemeOption = (typeof THEME_OPTIONS)[number]["value"];

export interface AnimatedThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  /**
   * @deprecated The trigger no longer turns when the theme changes: like Arc's theme switch, only its icon swaps.
   * The value is ignored.
   */
  duration?: number;
  theme?: ThemeMode;
  resolvedTheme?: ResolvedTheme;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const AnimatedThemeToggler = ({
  className,
  duration: _duration,
  disabled,
  theme: controlledTheme,
  resolvedTheme: controlledResolvedTheme,
  onThemeChange: controlledOnThemeChange,
  ...props
}: AnimatedThemeTogglerProps) => {
  const providerTheme = useTheme();
  const theme = controlledTheme ?? providerTheme.theme;
  const resolvedTheme = controlledResolvedTheme ?? providerTheme.resolvedTheme;
  const onThemeChange = controlledOnThemeChange ?? providerTheme.setTheme;
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const isThemeReady =
    isHydrated &&
    (resolvedTheme === "light" || resolvedTheme === "dark");
  const isDark = resolvedTheme === "dark";
  const selectedTheme: ThemeOption =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";
  const isDisabled = !isThemeReady || disabled;

  const selectTheme = useCallback((nextTheme: ThemeOption) => {
    if (isDisabled) return;
    onThemeChange(nextTheme);
  }, [isDisabled, onThemeChange]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          className={cn(className)}
          {...props}
        >
          {/* Keyed by theme, so each change remounts the icon and plays its swap-in. */}
          {!isThemeReady ? <SunMoon aria-hidden="true" /> : (
            <MotionSlot key={isDark ? "dark" : "light"} kind="icon-swap">
              {isDark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
            </MotionSlot>
          )}
          <span className="sr-only">Alternar tema</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        data-beez-theme-menu
        align="end"
        className="w-44 rounded-xl p-2"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuRadioGroup
          onValueChange={(nextTheme) => {
            selectTheme(nextTheme as ThemeOption);
          }}
          value={selectedTheme}
        >
          {THEME_OPTIONS.map(({ icon: Icon, label, value }) => (
            <DropdownMenuRadioItem
              key={value}
              className="h-11 gap-3 px-3 pr-9 text-base"
              value={value}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span>{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
