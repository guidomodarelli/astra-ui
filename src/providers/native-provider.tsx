"use client";

/** Keeps the default image integration separate from optional framework entrypoints. */
import { useMemo } from "react";
import { AstraUIProvider as BaseAstraUIProvider, type AstraUIProviderProps } from "./astra-ui-provider.js";
import { UnpicImageAdapter } from "../adapters/unpic-image.js";

export type { AstraUIProviderProps } from "./astra-ui-provider.js";

/** Combines native navigation, responsive Unpic images and the shared theme provider. */
export function AstraUIProvider({ components, ...props }: AstraUIProviderProps) {
  const nativeComponents = useMemo(() => ({ Image: UnpicImageAdapter, ...components }), [components]);
  return <BaseAstraUIProvider {...props} components={nativeComponents} />;
}
