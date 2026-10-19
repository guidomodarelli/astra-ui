"use client";

/** Shares optional rendering adapters without importing a framework into the core. */
import { createContext, useContext, useMemo, useSyncExternalStore, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { ThemeProvider, type ThemeProviderProps } from "next-themes";

/** Defines the native link contract accepted by routing adapters. */
export type GolfoLinkProps = ComponentProps<"a"> & {
  href: string;
  /** Optional navigation hint consumed by framework adapters, never by native anchors. */
  prefetch?: boolean;
};
/** Defines the native image contract accepted by image adapters. */
export type GolfoImageProps = ComponentProps<"img">;
/** Lets each application select only the adapters it needs. */
export interface GolfoUIComponents {
  Link?: ComponentType<GolfoLinkProps>;
  Image?: ComponentType<GolfoImageProps>;
}
/** Configures descendants while leaving theme and application state to the consumer. */
export interface GolfoUIProviderProps {
  children: ReactNode;
  components?: GolfoUIComponents;
  /** Shares light/dark/system behavior; the theme is written as a class and as Arc's `data-theme` attribute. */
  themeOptions?: Omit<ThemeProviderProps, "children" | "attribute">;
}

/**
 * Arc's foundation selects dark tokens with `data-theme`; the class keeps Tailwind's `dark` variant and
 * consumer styles written for it.
 */
const THEME_ATTRIBUTES: ThemeProviderProps["attribute"] = ["class", "data-theme"];

/**
 * next-themes renders an inline script that applies the stored theme before hydration. It only
 * runs when it arrives in server HTML; a script created by a client render never executes, and
 * React 19 warns about it. Client-only renders mark it as a data block, which React accepts.
 */
const CLIENT_RENDER_THEME_SCRIPT_PROPS = { type: "application/json" } as const;

/** Nothing to subscribe to: the value only distinguishes server/hydration from client renders. */
function subscribeToRenderEnvironment(): () => void {
  return () => {};
}

/** Native elements remain the implicit fallback for unconfigured adapters. */
const EMPTY_COMPONENTS: GolfoUIComponents = {};
const AdapterContext = createContext<GolfoUIComponents>(EMPTY_COMPONENTS);

/** Merges nested overrides while preserving stable adapter identities. */
export function GolfoUIProvider({ children, components = EMPTY_COMPONENTS, themeOptions }: GolfoUIProviderProps) {
  const parent = useContext(AdapterContext);
  const value = useMemo(() => ({ ...parent, ...components }), [parent, components]);
  // Server renders and hydration read `false`, keeping the executable script the server sent;
  // renders that start on the client read `true`, where the script could never run anyway.
  const isClientOnlyRender = useSyncExternalStore(
    subscribeToRenderEnvironment,
    () => true,
    () => false,
  );
  const scriptProps = isClientOnlyRender
    ? { ...CLIENT_RENDER_THEME_SCRIPT_PROPS, ...themeOptions?.scriptProps }
    : themeOptions?.scriptProps;
  return <ThemeProvider attribute={THEME_ATTRIBUTES} {...themeOptions} scriptProps={scriptProps}><MotionConfig reducedMotion="user"><AdapterContext.Provider value={value}>{children}</AdapterContext.Provider></MotionConfig></ThemeProvider>;
}

/** Reads adapters internally; native components work without a provider. */
export function useGolfoUIComponents(): GolfoUIComponents {
  return useContext(AdapterContext);
}
