/** Hosts the integration fixture in a real App Router application. */
import type { ReactNode } from "react";
import { Skeleton } from "@golfo/ui";
import "./globals.css";

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="es" suppressHydrationWarning><body><Skeleton label="Carga del servidor" lines={1} className="server-skeleton" />{children}</body></html>;
}
