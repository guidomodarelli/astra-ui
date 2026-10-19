/**
 * A Server Component (no client directive) that calls buttonClassName while rendering and mounts a ButtonLink, as an
 * App Router page would: if the helper were a client reference, rendering this page on the server would fail.
 */
import { ButtonLink, buttonClassName } from "@astra-kit/ui";

export default function ButtonRecipePage() {
  return (
    <main>
      <h1>Receta de botón en el servidor</h1>
      <label className={buttonClassName({ variant: "secondary", size: "sm" })}>
        Adjuntar comprobante
        <input type="file" hidden />
      </label>
      <ButtonLink href="/destination" variant="ghost">Ir al destino</ButtonLink>
    </main>
  );
}
