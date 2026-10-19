/** Mounts Arc's DropdownMenu and Select from the public barrel, so their layout and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AstraUIProvider, Button, DropdownMenu, Input, Select, type DropdownItem } from "@astra-kit/ui";
import "./styles.css";

/** Labels of the document menu, enough rows to see the stagger reach its last step. */
const DOCUMENT_ACTIONS = ["Renombrar", "Duplicar", "Mover", "Compartir", "Descargar", "Imprimir"];

/** Options of the currency select. */
const CURRENCIES = [
  { value: "ars", label: "Pesos" },
  { value: "usd", label: "Dólares" },
  { value: "eur", label: "Euros" },
];

/** Options of the frequency select. */
const FREQUENCIES = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
];

/** A document menu with a destructive action, drawn by Arc's labelled trigger at the end of the row. */
function DocumentMenu() {
  const [lastAction, setLastAction] = useState("Ninguna");
  const items: DropdownItem[] = [
    ...DOCUMENT_ACTIONS.map((action) => ({ label: action, onSelect: () => setLastAction(action) })),
    { label: "Eliminar", destructive: true, separatorBefore: true, onSelect: () => setLastAction("Eliminar") },
  ];
  return (
    <div className="controls" style={{ justifyContent: "flex-end" }}>
      <output aria-label="Última acción">{lastAction}</output>
      <DropdownMenu label="Acciones del documento" items={items} />
    </div>
  );
}

/** A view menu with a single selection and a checkbox row. */
function ViewMenu() {
  const [order, setOrder] = useState("recent");
  const [showArchived, setShowArchived] = useState(false);
  return (
    <div className="controls">
      <DropdownMenu
        label="Vista"
        selection={{ value: order, onValueChange: setOrder }}
        items={[
          { label: "Recientes", value: "recent" },
          { label: "Por nombre", value: "name" },
          {
            label: "Mostrar archivados",
            checked: showArchived,
            separatorBefore: true,
            onSelect: () => setShowArchived(!showArchived),
          },
        ]}
      />
      <output aria-label="Orden elegido">{order}</output>
    </div>
  );
}

/** Selects in both sizes next to an input, so their heights can be compared with Arc's control heights. */
function CurrencySelects() {
  const [currency, setCurrency] = useState("ars");
  return (
    <div className="controls">
      <Input aria-label="Monto" defaultValue="100" />
      <Select label="Moneda" hideLabel value={currency} onValueChange={setCurrency} options={CURRENCIES} />
      <Select label="Frecuencia" hideLabel size="sm" defaultValue="monthly" options={FREQUENCIES} />
    </div>
  );
}

/** A select with its visible label, helper copy and error row, as in a form. */
function LabelledSelect() {
  const [plan, setPlan] = useState<string>();
  return (
    <div className="controls">
      <Select
        label="Plan"
        description="Podés cambiarlo cuando quieras."
        error={plan ? undefined : "Elegí un plan para continuar."}
        value={plan}
        onValueChange={setPlan}
        options={[
          { value: "basic", label: "Básico" },
          { value: "pro", label: "Profesional" },
        ]}
      />
    </div>
  );
}

/** A menu behind a custom trigger that can be disabled, as a row whose actions are not available yet. */
function LockedRowMenu() {
  const [locked, setLocked] = useState(true);
  return (
    <div className="controls">
      <DropdownMenu
        label="Acciones de la fila"
        trigger={<Button size="sm" disabled={locked} aria-label="Más acciones de la fila">⋮</Button>}
        items={[{ label: "Editar" }, { label: "Archivar" }]}
      />
      <Button variant="ghost" onClick={() => setLocked(!locked)}>{locked ? "Habilitar fila" : "Bloquear fila"}</Button>
    </div>
  );
}

/** A menu whose trigger is disabled by its fieldset, not by its own props, as a form section that is locked. */
function LockedSectionMenu() {
  const [locked, setLocked] = useState(true);
  return (
    <div className="controls">
      <fieldset disabled={locked} style={{ border: 0, margin: 0, padding: 0 }}>
        <DropdownMenu
          label="Acciones de la sección"
          trigger={<Button size="sm" aria-label="Más acciones de la sección">⋮</Button>}
          items={[{ label: "Duplicar" }]}
        />
      </fieldset>
      <Button variant="ghost" onClick={() => setLocked(!locked)}>{locked ? "Habilitar sección" : "Bloquear sección"}</Button>
    </div>
  );
}

/** A menu whose trigger is loading: it stays focusable with `aria-disabled`, so only the keyboard can reach it. */
function LoadingMenu() {
  return (
    <div className="controls">
      <DropdownMenu
        label="Acciones en curso"
        trigger={<Button size="sm" loading aria-label="Acciones en curso">⋮</Button>}
        items={[{ label: "Cancelar" }]}
      />
      <Button variant="ghost">Después del menú</Button>
    </div>
  );
}

/** Renders the menus the spec drives. */
function ArcMenus() {
  return <AstraUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Menús</h1>
    <section><DocumentMenu /></section>
    <section><ViewMenu /></section>
    <section><LockedRowMenu /></section>
    <section><LockedSectionMenu /></section>
    <section><LoadingMenu /></section>
    <section><CurrencySelects /></section>
    <section><LabelledSelect /></section>
  </main></AstraUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ArcMenus />);
