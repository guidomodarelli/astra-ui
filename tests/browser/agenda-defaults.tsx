/** Exercises shared defaults with interactive menus, forms and viewport-bound panels. */
import { createRoot } from "react-dom/client";
import { GolfoUIProvider, Button, Dialog, DialogClose, DialogTrigger, DialogContent, Select, Popover, PopoverTrigger, PopoverContent, Tabs, TabsList, TabsTrigger, TabsContent, Textarea, Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription, DropdownMenu } from "@golfo/ui";
import "./styles.css";

/** Renders the public primitives without consumer size or spacing overrides. */
function AgendaDefaults() {
  return <GolfoUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Personalizaciones compartidas</h1>
    <section><Select label="Frecuencia" hideLabel className="overlay-select" defaultValue="monthly" options={[{ value: "monthly", label: "Mensual" }, { value: "weekly", label: "Semanal" }]} /></section>
    <section><Tabs defaultValue="first"><TabsList aria-label="Secciones"><TabsTrigger value="first">Primera</TabsTrigger><TabsTrigger value="second">Segunda</TabsTrigger></TabsList><TabsContent value="first">Primer contenido</TabsContent><TabsContent value="second">Segundo contenido</TabsContent></Tabs></section>
    <section><Textarea disabled aria-label="Mensaje deshabilitado" value="Pendiente" /><Textarea aria-label="Mensaje editable" defaultValue="Editable" /></section>
    <section><Popover><PopoverTrigger asChild><Button>Abrir detalle</Button></PopoverTrigger><PopoverContent aria-label="Detalle">Contenido del detalle</PopoverContent></Popover></section>
    <section><Dialog><DialogTrigger asChild><Button>Abrir diálogo</Button></DialogTrigger><DialogContent title="Editar datos" description="Revisá los datos." footer={<DialogClose asChild><Button variant="secondary">Cerrar</Button></DialogClose>} /></Dialog></section>
    <section><Dialog alert><DialogTrigger asChild><Button>Abrir confirmación</Button></DialogTrigger><DialogContent title="Confirmar cambio" description="Revisá la acción." footer={<DialogClose asChild><Button variant="secondary">Cancelar</Button></DialogClose>} /></Dialog></section>
    <section><DropdownMenu label="Abrir acciones" trigger={<Button>Abrir acciones</Button>} items={[{ label: "Editar" }, { label: "Carpetas" }]} /></section>
    {(["top", "bottom"] as const).map(side => <section key={side}><Sheet><SheetTrigger asChild><Button>Abrir panel {side}</Button></SheetTrigger><SheetContent side={side}><SheetTitle>Panel {side}</SheetTitle><SheetDescription>Contenido largo desplazable</SheetDescription><div className="long-content"><Button>Inicio del panel</Button><Button>Fin del panel</Button></div></SheetContent></Sheet></section>)}
  </main></GolfoUIProvider>;
}

createRoot(document.getElementById("root")!).render(<AgendaDefaults />);
