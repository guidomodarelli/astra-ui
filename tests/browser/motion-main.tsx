/** Exercises motion without replacing the real primitives or their event handlers. */
import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AstraUIProvider,
  Button,
  DropdownMenu,
  Dialog,
  DialogClose,
  DialogTrigger,
  DialogContent,
  TypingAnimation,
  Skeleton,
  Highlighter,
  Checkbox,
  Label,
  Input,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  Select,
  AnimatedThemeToggler,
  DataTable,
} from "@astra-kit/ui";

const GROUPED_ROWS = [
  { name: "Luz", currency: "ARS" },
  { name: "Internet", currency: "ARS" },
  { name: "Hosting", currency: "USD" },
];
const GROUPED_COLUMNS = [{ accessorKey: "name", header: "Servicio" }];
import "./styles.css";

/** Demonstrates state changes and deliberately slow typing for reduced-motion checks. */
function MotionExamples() {
  const [message, setMessage] = useState("Lectura sin esperas");
  const [action, setAction] = useState("");
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isArchivedVisible, setIsArchivedVisible] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const rowGroups = useMemo(
    () => ({
      getGroupKey: (row: (typeof GROUPED_ROWS)[number]) => row.currency,
      renderGroupHeader: (groupKey: string, groupRowCount: number) =>
        `${groupKey} (${groupRowCount})`,
      collapsedGroupKeys: collapsedGroups,
      onGroupToggle: (groupKey: string) =>
        setCollapsedGroups((current) => {
          const next = new Set(current);
          if (next.has(groupKey)) next.delete(groupKey);
          else next.add(groupKey);
          return next;
        }),
    }),
    [collapsedGroups],
  );
  return (
    <AstraUIProvider>
      <main>
        <h1>Movimiento compartido</h1>
        <section className="controls">
          <Button>Acción principal</Button>
          <Button disabled>Acción deshabilitada</Button>
          <Button variant="secondary" onClick={() => setIsDraftSaved(true)}>
            {isDraftSaved ? "Borrador guardado en tu cuenta" : "Guardar"}
          </Button>
          <Checkbox id="motion-choice" />
          <Label htmlFor="motion-choice">Recibir novedades</Label>
        </section>
        <section>
          <DropdownMenu
            label="Abrir menú"
            trigger={<Button>Abrir menú</Button>}
            items={[
              { label: "Editar", onSelect: () => setAction("Edición seleccionada") },
              { label: "Duplicar", onSelect: () => setAction("Copia seleccionada") },
              {
                label: "Mostrar archivados",
                checked: isArchivedVisible,
                onSelect: (event) => {
                  event.preventDefault();
                  setIsArchivedVisible(!isArchivedVisible);
                },
              },
            ]}
          />
          <output aria-label="Acción">{action}</output>
        </section>
        <section>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir diálogo</Button>
            </DialogTrigger>
            <DialogContent
              title="Confirmar cambios"
              description="El foco y el cierre siguen funcionando."
              footer={
                <DialogClose asChild>
                  <Button variant="secondary">Cerrar</Button>
                </DialogClose>
              }
            />
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir detalle</Button>
            </DialogTrigger>
            <DialogContent
              closeButtonPlacement="viewport"
              title="Detalle"
              description="El botón de cerrar queda en la esquina de la pantalla."
            />
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir ficha</Button>
            </DialogTrigger>
            <DialogContent
              style={{ borderRadius: "0 24px 24px 0" }}
              title="Ficha"
              description="Solo el borde derecho es redondeado."
            />
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Abrir nota</Button>
            </DialogTrigger>
            <DialogContent
              style={{ transform: "rotate(2deg)", opacity: 0.9 }}
              title="Nota"
              description="El panel descansa inclinado y algo translúcido."
            />
          </Dialog>
        </section>
        <section>
          <TypingAnimation duration={1000} delay={10000} startOnView={false}>
            {message}
          </TypingAnimation>
          <Button onClick={() => setMessage("Texto actualizado")}>
            Actualizar texto
          </Button>
        </section>
        <section className="controls">
          <Switch id="motion-switch" />
          <Label htmlFor="motion-switch">Modo compacto</Label>
          <Input
            aria-label="Correo"
            aria-invalid={isEmailInvalid || undefined}
          />
          <Button onClick={() => setIsEmailInvalid(true)}>Validar correo</Button>
          <Tooltip content="Explicación breve">
            <Button>Ayuda</Button>
          </Tooltip>
        </section>
        <section className="controls">
          <Select
            label="Moneda"
            hideLabel
            placeholder="Elegir moneda"
            className="overlay-select"
            options={[
              { value: "ars", label: "Pesos" },
              { value: "usd", label: "Dólares" },
              { value: "eur", label: "Euros" },
            ]}
          />
          <AnimatedThemeToggler />
        </section>
        <section>
          <DataTable
            columns={GROUPED_COLUMNS}
            data={GROUPED_ROWS}
            emptyMessage="Sin servicios"
            rowGroups={rowGroups}
          />
        </section>
        <section>
          <Tabs defaultValue="resumen">
            <TabsList aria-label="Secciones">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
            </TabsList>
            <TabsContent value="resumen">Contenido del resumen</TabsContent>
            <TabsContent value="detalle">Contenido del detalle</TabsContent>
          </Tabs>
        </section>
        <section>
          <Highlighter>Lectura destacada</Highlighter>
          <Skeleton lines={1} className="motion-skeleton" />
        </section>
      </main>
    </AstraUIProvider>
  );
}
createRoot(document.getElementById("root")!).render(<MotionExamples />);
