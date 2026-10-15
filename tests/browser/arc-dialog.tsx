/** Mounts Dialog and AlertDialog from the public barrel, so Arc's surface layout and text swap run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  BeezUIProvider,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "beez-ui";
import "./styles.css";

/** A title long enough to wrap, so the spec can check it never runs under the close button. */
const LONG_TITLE = "Confirmá los datos de facturación de tu tribu antes de publicar la nueva suscripción mensual";

/** A dialog whose title the spec rewords while it is open, to watch Arc's text swap. */
function SwappingDialog() {
  const [step, setStep] = useState(1);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir pasos</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Paso ${step}`}</DialogTitle>
          <DialogDescription>Completá cada paso para continuar.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setStep((current) => current + 1)}>Siguiente paso</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Renders the dialogs the spec opens one at a time. */
function App() {
  return (
    <BeezUIProvider>
      <main>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Abrir datos</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{LONG_TITLE}</DialogTitle>
              <DialogDescription>Revisá el nombre y el correo antes de guardar.</DialogDescription>
            </DialogHeader>
            <p>Los cambios se aplican al próximo cobro.</p>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
        <SwappingDialog />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>Abrir confirmación</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar el evento?</AlertDialogTitle>
              <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
