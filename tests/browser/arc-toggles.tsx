/** Mounts Arc's Switch, Checkbox and RadioGroup from the public barrel, so their layout and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AstraUIProvider, Checkbox, RadioGroup, Switch } from "@astra-kit/ui";
import "./styles.css";

/** A select-all checkbox that starts indeterminate, as a table header would render it. */
function SelectAllCheckbox() {
  const [state, setState] = useState<boolean | "indeterminate">("indeterminate");
  return <Checkbox label="Seleccionar todo" checked={state} onCheckedChange={setState} />;
}

/** Renders each control in the variants the spec drives. */
function ArcToggles() {
  return <AstraUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Interruptores y selecciones</h1>
    <section className="controls">
      <span data-testid="bare-switch-row" className="controls"><Switch id="bare-switch" /><label htmlFor="bare-switch">Modo compacto</label></span>
      <Switch label="Avisos por correo" />
    </section>
    <section className="controls">
      <span data-testid="bare-checkbox-row" className="controls"><Checkbox id="bare-checkbox" /><label htmlFor="bare-checkbox">Termina otro día</label></span>
      <Checkbox label="Recibir novedades" description="Un correo por semana como máximo." />
      <SelectAllCheckbox />
    </section>
    <section className="narrow-field">
      <RadioGroup
        label="Facturación"
        defaultValue="monthly"
        options={[
          { value: "monthly", label: "Mensual", description: "Se renueva cada mes." },
          { value: "quarterly", label: "Trimestral" },
          { value: "yearly", label: "Anual", description: "Dos meses sin cargo." },
        ]}
      />
    </section>
  </main></AstraUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ArcToggles />);
