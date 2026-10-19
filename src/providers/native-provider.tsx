"use client";

/** Keeps the default image integration separate from optional framework entrypoints. */
import { useMemo } from "react";
import { GolfoUIProvider as BaseGolfoUIProvider, type GolfoUIProviderProps } from "./golfo-ui-provider.js";
import { UnpicImageAdapter } from "../adapters/unpic-image.js";

export type { GolfoUIProviderProps } from "./golfo-ui-provider.js";

/** Combines native navigation, responsive Unpic images and the shared theme provider. */
export function GolfoUIProvider({ components, ...props }: GolfoUIProviderProps) {
  const nativeComponents = useMemo(() => ({ Image: UnpicImageAdapter, ...components }), [components]);
  return <BaseGolfoUIProvider {...props} components={nativeComponents} />;
}
