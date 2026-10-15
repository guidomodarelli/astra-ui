/** Mounts the Arc-styled DropdownMenu and Select from the public barrel, so their layout and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BeezUIProvider,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "beez-ui";
import "./styles.css";

/** Labels of the document menu, enough rows to see the stagger reach its last step. */
const DOCUMENT_ACTIONS = ["Renombrar", "Duplicar", "Mover", "Compartir", "Descargar", "Imprimir"];

/** A document menu with a destructive action, opened from a trigger at the end of the row. */
function DocumentMenu() {
  const [lastAction, setLastAction] = useState("Ninguna");
  return (
    <div className="controls" style={{ justifyContent: "flex-end" }}>
      <output aria-label="Última acción">{lastAction}</output>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Acciones del documento</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {DOCUMENT_ACTIONS.map((action) => (
            <DropdownMenuItem key={action} onSelect={() => setLastAction(action)}>
              {action}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setLastAction("Eliminar")}>
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Selects in both sizes next to an input, so their heights can be compared with Arc's control heights. */
function CurrencySelects() {
  const [currency, setCurrency] = useState("ars");
  return (
    <div className="controls">
      <Input aria-label="Monto" defaultValue="100" />
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger aria-label="Moneda">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="ars">Pesos</SelectItem>
          <SelectItem value="usd">Dólares</SelectItem>
          <SelectItem value="eur">Euros</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="monthly">
        <SelectTrigger aria-label="Frecuencia" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="weekly">Semanal</SelectItem>
          <SelectItem value="monthly">Mensual</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

/** Renders the menus the spec drives. */
function ArcMenus() {
  return <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Menús</h1>
    <section><DocumentMenu /></section>
    <section><CurrencySelects /></section>
  </main></BeezUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ArcMenus />);
