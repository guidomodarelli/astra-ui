/**
 * Mounts the plain `Toaster` beez-ui exports (Sonner's look, not `ThemedToaster`) with the props TuTribu uses, next to
 * a dialog and a sheet that raise toasts, so pointer input and keyboard focus run through real modal overlays.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BeezUIProvider,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Toaster,
  toast,
} from "beez-ui";
import "./styles.css";

/**
 * A modal-hosted form whose save fails with a toast that offers a retry, as a save flow does.
 * @param props.label - Accessible name of the counter the retries go to.
 */
function SaveWithRetry({ label }: { label: string }) {
  const [retries, setRetries] = useState(0);
  return (
    <>
      <Button
        onClick={() =>
          toast.error("No se pudo guardar", {
            duration: Number.POSITIVE_INFINITY,
            action: { label: "Reintentar", onClick: () => setRetries((count) => count + 1) },
          })
        }
      >
        Guardar
      </Button>
      <output aria-label={label}>{retries}</output>
    </>
  );
}

/** Renders the modals and the consumer's toaster. */
function App() {
  return (
    <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}>
      <main>
        <h1>Toaster con modales</h1>
        <section className="controls">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir edición</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar evento</DialogTitle>
                <DialogDescription>Los cambios se guardan al confirmar.</DialogDescription>
              </DialogHeader>
              <SaveWithRetry label="Reintentos del diálogo" />
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Abrir panel</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Panel lateral</SheetTitle>
                <SheetDescription>Opciones del evento.</SheetDescription>
              </SheetHeader>
              <div className="sheet-body">
                <SaveWithRetry label="Reintentos del panel" />
              </div>
            </SheetContent>
          </Sheet>
        </section>
      </main>
      <Toaster closeButton position="top-center" richColors theme="light" />
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
