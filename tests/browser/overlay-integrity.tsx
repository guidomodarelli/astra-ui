/**
 * Mounts overlays inside the contexts consumers put them in (a dialog, a sheet, a scrolling and transformed container,
 * next to toasts) from the public barrel, so stacking, dismissal and placement run in real engines.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  GolfoUIProvider,
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  DropdownMenu,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  ThemedToaster,
  Tooltip,
} from "@golfo/ui";
import { toast } from "@golfo/ui/sonner";
import "./styles.css";

/** Options of the selects the spec opens inside overlays. */
const FREQUENCIES = ["Diaria", "Semanal", "Mensual"] as const;

/** The floating layers the spec opens inside each container. */
function FloatingLayers({ prefix }: { prefix: string }) {
  return (
    <div className="controls">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary">{`${prefix}: filtros`}</Button>
        </PopoverTrigger>
        <PopoverContent aria-label={`${prefix}: panel de filtros`}>Filtros disponibles</PopoverContent>
      </Popover>
      <DropdownMenu label={`${prefix}: acciones`} items={[{ label: "Duplicar" }, { label: "Archivar" }]} />
      <Select
        label={`${prefix}: frecuencia`}
        hideLabel
        placeholder="Frecuencia"
        className="overlay-select"
        options={FREQUENCIES.map((frequency) => ({ value: frequency, label: frequency }))}
      />
      <Tooltip content={`${prefix}: ayuda`}>
        <Button variant="secondary">{`${prefix}: info`}</Button>
      </Tooltip>
    </div>
  );
}

/** A dialog whose form reports a failure with a toast that offers a retry, as a save flow does. */
function DialogWithToast() {
  const [retries, setRetries] = useState(0);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir edición</Button>
      </DialogTrigger>
      <DialogContent title="Editar evento" description="Los cambios se guardan al confirmar.">
        <FloatingLayers prefix="Diálogo" />
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
        <output aria-label="Reintentos">{retries}</output>
      </DialogContent>
    </Dialog>
  );
}

/** Renders every context the spec checks. */
function App() {
  return (
    <GolfoUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}>
      <main>
        <h1>Capas en contexto</h1>
        <section>
          <DialogWithToast />
        </section>
        <section>
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
                <FloatingLayers prefix="Panel" />
                <Button
                  onClick={() =>
                    toast("Opciones guardadas", { duration: Number.POSITIVE_INFINITY, closeButton: true })
                  }
                >
                  Aplicar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </section>
        <section className="clipping-scroller" aria-label="Contenedor con scroll">
          <div className="clipping-scroller-content">
            <FloatingLayers prefix="Contenedor" />
          </div>
        </section>
        <section className="edge-controls" aria-label="Controles en el borde">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Borde: filtros</Button>
            </PopoverTrigger>
            <PopoverContent aria-label="Borde: panel de filtros">
              <div className="tall-popover-content">Filtros con mucho contenido</div>
            </PopoverContent>
          </Popover>
        </section>
      </main>
      <ThemedToaster />
    </GolfoUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
