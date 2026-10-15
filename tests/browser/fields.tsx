/** Mounts labelled Input and Textarea fields from the public barrel, so their layout and message motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BeezUIProvider, Button, Input, Textarea } from "beez-ui";
import "./styles.css";

/** Characters the bio accepts; the count starts with three digits so a keystroke rolls only the last ones. */
const BIO_MAX_LENGTH = 120;

/** Helper copy long enough to wrap onto more lines on a phone than on a desktop. */
const LONG_DESCRIPTION =
  "Usamos este correo para enviarte los recibos de cada pago, los avisos de renovación y los cambios importantes de tu tribu, nunca para publicidad.";

/** A field inside a horizontal flex row, where it must fill the row like the bare control does. */
function FlexRowField() {
  return (
    <div className="controls" data-testid="flex-row">
      <Input label="Ciudad" description="Donde se encuentra la tribu." />
    </div>
  );
}

/** An email field whose error and helper copy the spec shows and rewords, narrow enough for the long helper copy to wrap. */
function EmailField() {
  const [error, setError] = useState<string>();
  const [hasLongDescription, setHasLongDescription] = useState(false);
  return (
    <>
      <div className="narrow-field">
        <Input
          label="Correo"
          type="email"
          description={hasLongDescription ? LONG_DESCRIPTION : "Solo para recibos."}
          error={error}
        />
      </div>
      <div className="controls">
        <Button variant="secondary" onClick={() => setError("Ingresá un correo válido")}>
          Validar correo
        </Button>
        <Button variant="secondary" onClick={() => setError("Ese correo ya está registrado")}>
          Cambiar error
        </Button>
        <Button variant="secondary" onClick={() => setHasLongDescription(true)}>
          Mostrar ayuda larga
        </Button>
      </div>
    </>
  );
}

/** A bio field with a live character count in its description. */
function BioField() {
  const [bio, setBio] = useState("");
  return (
    <Textarea
      label="Biografía"
      maxLength={BIO_MAX_LENGTH}
      value={bio}
      onChange={(event) => setBio(event.target.value)}
      description={`Quedan ${BIO_MAX_LENGTH - bio.length} caracteres`}
    />
  );
}

/** Renders the fields the spec drives. */
function Fields() {
  return <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Campos</h1>
    <section><FlexRowField /></section>
    <section><EmailField /></section>
    <section><BioField /></section>
  </main></BeezUIProvider>;
}

createRoot(document.getElementById("root")!).render(<Fields />);
