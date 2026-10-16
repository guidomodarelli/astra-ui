"use client";

/**
 * Exposes the shared notification implementation and its public types. `Toaster` is beez-ui's own, which keeps
 * Sonner's look and props but lets toasts work while a modal is open; this local export takes precedence over the
 * one `export *` would bring from Sonner.
 */
export * from "sonner";
export { Toaster } from "./components/toaster.js";
