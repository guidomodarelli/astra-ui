/** Mounts ActionButton and SplitButton from the public barrel, so their layout and press motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ActionButton, BeezUIProvider, SplitButton } from "beez-ui";
import "./styles.css";

/** Time the fixture action takes to settle, and the success state to stay before returning to idle. */
const ACTION_STEP_MS = 900;

/**
 * Settles after a delay, like a request.
 * @returns A promise that resolves after `ACTION_STEP_MS`.
 */
function simulateRequest(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ACTION_STEP_MS));
}

/** Confirms the copy on the main action and keeps that label, so the spec reads a stable state. */
function CopyPageSplitButton() {
  const [isCopied, setIsCopied] = useState(false);
  return (
    <SplitButton
      label={isCopied ? "Copiado" : "Copiar página"}
      onClick={() => setIsCopied(true)}
      actions={[{ label: "Copiar como Markdown" }, { label: "Abrir en otra pestaña" }]}
    />
  );
}

/** Renders one of each component with the labels the spec drives. */
function ActionButtons() {
  return <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Botones de acción</h1>
    <section><ActionButton label="Publicar" pendingLabel="Publicando cambios" successLabel="Listo" resetAfterMs={ACTION_STEP_MS} onAction={simulateRequest} /></section>
    <section><CopyPageSplitButton /></section>
  </main></BeezUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ActionButtons />);
