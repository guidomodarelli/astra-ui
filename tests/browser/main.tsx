/** Exercises the public package in a standalone React app without a framework provider. */
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { createRoot } from "react-dom/client";
import { Alert, AnimatedThemeToggler, Avatar, BeezUIProvider, Button, Calendar, DataTable, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Highlighter, InputGroup, InputGroupInput, InputGroupAddon, RadioGroup, Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, ThemedToaster, toast, TypingAnimation } from "beez-ui";
import "./styles.css";

const ROWS = [{ name: "Luz", amount: 20 }, { name: "Internet", amount: 40 }];
const COLUMNS = [{ accessorKey: "name", header: "Nombre" }, { accessorKey: "amount", header: "Importe" }];
const QUERY_CONFIG = [{ key: "", kind: "text" as const, label: "Nombre" }];

/** Exercises the native orchestrator's shared theme and image behavior. */
function BrowserExample() {
  const [date, setDate] = useState<Date>();
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 8, 1));
  const [selectedAction, setSelectedAction] = useState("");
  return <main>
    <h1>Componentes compartidos</h1>
    <div className="controls"><AnimatedThemeToggler /><Button onClick={() => toast.success("Cambios guardados")}>Notificar</Button><Avatar name="Perfil de prueba" src="/missing-avatar.png" /></div>
    <section>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="sm" aria-label="Acciones de envío">⋮</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setSelectedAction("Editar datos de envío")}><Pencil /><span>Editar datos de envío</span></DropdownMenuItem>
          <DropdownMenuItem variant="destructive"><Trash2 /><span>Eliminar datos de envío</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <output aria-label="Acción seleccionada">{selectedAction}</output>
    </section>
    <section><Alert title="Listo para usar en React" /><Avatar name="Avatar nativo" src="/avatar.svg" /></section>
    <section><DataTable columns={COLUMNS} data={ROWS} emptyMessage="Sin resultados" filterColumnId="name" queryFilterConfig={QUERY_CONFIG} queryFilterLabel="Filtrar filas" /></section>
    <section><InputGroup><InputGroupAddon>Buscar</InputGroupAddon><InputGroupInput aria-label="Búsqueda adicional" /></InputGroup></section>
    <section><RadioGroup label="Frecuencia" defaultValue="weekly" options={[{ value: "weekly", label: "Semanal" }, { value: "monthly", label: "Mensual" }]} /></section>
    <section><Calendar month={calendarMonth} onMonthChange={setCalendarMonth} value={date} onChange={setDate} /><output aria-label="Día seleccionado">{date?.getDate()}</output></section>
    <section><TypingAnimation startOnView={false} duration={1} showCursor={false}>Texto animado</TypingAnimation><Highlighter color="var(--primary)">Contenido destacado</Highlighter></section>
    <Sheet><SheetTrigger asChild><Button>Abrir panel largo</Button></SheetTrigger><SheetContent><SheetTitle>Panel largo</SheetTitle><SheetDescription>Contenido desplazable</SheetDescription><div className="long-content"><p>Inicio</p><Button>Última acción</Button></div></SheetContent></Sheet>
    <ThemedToaster />
  </main>;
}

createRoot(document.getElementById("root")!).render(<BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><BrowserExample /></BeezUIProvider>);
