/** Mounts Dialog, also in `alert` mode, from the public barrel, so Arc's surface layout and text swap run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AstraUIProvider, Button, Dialog, DialogClose, DialogContent, DialogTrigger } from "@astra-kit/ui";
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
      <DialogContent
        title={`Paso ${step}`}
        description="Completá cada paso para continuar."
        footer={<Button onClick={() => setStep((current) => current + 1)}>Siguiente paso</Button>}
      />
    </Dialog>
  );
}

/** Renders the dialogs the spec opens one at a time. */
function App() {
  return (
    <AstraUIProvider>
      <main>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Abrir datos</Button>
          </DialogTrigger>
          <DialogContent
            title={LONG_TITLE}
            description="Revisá el nombre y el correo antes de guardar."
            footer={
              <DialogClose asChild>
                <Button variant="secondary">Cerrar</Button>
              </DialogClose>
            }
          >
            <p>Los cambios se aplican al próximo cobro.</p>
          </DialogContent>
        </Dialog>
        <SwappingDialog />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Abrir galería</Button>
          </DialogTrigger>
          <DialogContent title="Galería de la ronda" hideTitle>
            <p>Fotos de la ronda.</p>
          </DialogContent>
        </Dialog>
        <Dialog alert>
          <DialogTrigger asChild>
            <Button>Abrir confirmación</Button>
          </DialogTrigger>
          <DialogContent
            title="¿Eliminar el evento?"
            description="Esta acción no se puede deshacer."
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button variant="danger">Eliminar</Button>
              </>
            }
          />
        </Dialog>
      </main>
    </AstraUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
