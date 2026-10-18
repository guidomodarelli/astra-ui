"use client";

/** Selects the configured routing adapter while keeping a native anchor fallback. */
import type { ComponentType } from "react";
import { useAstraUIComponents, type AstraLinkProps } from "../providers/astra-ui-provider.js";

/** Shares native link props and explicit per-link navigation overrides. */
export type LinkProps = AstraLinkProps & {
  component?: ComponentType<AstraLinkProps> | "a";
};

/** Uses the provider's adapter and excludes framework hints from native DOM attributes. */
export function Link({ component, prefetch, ...props }: LinkProps) {
  const adapters = useAstraUIComponents();
  const Component = component ?? adapters.Link;
  const link = !Component || Component === "a"
    ? <a data-slot="link" {...props} />
    : <Component data-slot="link" {...props} prefetch={prefetch} />;
  return link;
}
