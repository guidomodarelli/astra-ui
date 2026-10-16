"use client";

/** Exercises actual Next navigation and image loading through the optional provider. */
import { AnimatedThemeToggler, Avatar, Button, Link, Pagination, ThemedToaster, toast } from "beez-ui";
import { BeezUIProvider } from "beez-ui/next";

export default function Page() {
  return <BeezUIProvider><main><h1>Integración opcional</h1><Avatar name="Avatar Next" src="/avatar.svg" fallback="GH" /><Link href="/destination">Abrir destino</Link><Pagination page={1} pageCount={2} getHref={() => "/destination"} /><AnimatedThemeToggler /><Button onClick={() => toast.success("Tema aplicado")}>Notificar</Button><ThemedToaster /></main></BeezUIProvider>;
}
