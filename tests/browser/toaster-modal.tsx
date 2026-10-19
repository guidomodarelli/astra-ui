/**
 * Mounts the plain `Toaster` @golfo/ui exports (Sonner's look, not `ThemedToaster`) with the props TuTribu uses, next to
 * a dialog, an alert dialog and a sheet that raise toasts, so pointer input and keyboard focus run through real modal
 * overlays.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  GolfoUIProvider,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Toaster,
  toast,
} from "@golfo/ui";
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
    <GolfoUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}>
      <main>
        <h1>Toaster con modales</h1>
        <section className="controls">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir edición</Button>
            </DialogTrigger>
            <DialogContent title="Editar evento" description="Los cambios se guardan al confirmar.">
              <SaveWithRetry label="Reintentos del diálogo" />
            </DialogContent>
          </Dialog>
          <Dialog alert>
            <DialogTrigger asChild>
              <Button>Abrir confirmación</Button>
            </DialogTrigger>
            <DialogContent
              title="Confirmar cambios"
              description="Los cambios se aplican a todo el evento."
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="secondary">Cancelar</Button>
                  </DialogClose>
                  <SaveWithRetry label="Reintentos de la confirmación" />
                </>
              }
            />
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
    </GolfoUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
