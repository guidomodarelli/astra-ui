/** Exercises the polished motion and fixed behaviors through the public barrel, with real state. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Avatar,
  AvatarGroup,
  GolfoUIProvider,
  Button,
  Calendar,
  Card,
  DropdownMenu,
  FilterQueryBar,
  type FilterQualifierConfig,
  Pagination,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  TypingAnimation,
} from "@golfo/ui";
import "./styles.css";

/** Pages of the results pagination. */
const PAGE_COUNT = 3;
/** Fixed month, so navigation and its direction are deterministic across runs. */
const INITIAL_MONTH = new Date(2026, 0, 1);

/** A calendar whose month lives in local state, so it opens on {@link INITIAL_MONTH} and navigates from there. */
function MonthCalendar() {
  const [month, setMonth] = useState(INITIAL_MONTH);
  return <Calendar month={month} onMonthChange={setMonth} />;
}
const FILTER_CONFIGS: FilterQualifierConfig[] = [
  { key: "", kind: "text", label: "Concepto" },
  {
    key: "estado",
    kind: "enum",
    columnId: "status",
    label: "Estado",
    options: [
      { slug: "pagado", value: "Pagado", label: "Pagado" },
      { slug: "pendiente", value: "Pendiente", label: "Pendiente" },
    ],
  },
];

/** Keeps the query in local state, as a consumer table would. */
function StatefulFilter() {
  const [query, setQuery] = useState("");
  return (
    <FilterQueryBar
      configs={FILTER_CONFIGS}
      value={query}
      onValueChange={setQuery}
      ariaLabel="Filtrar movimientos"
    />
  );
}

/** Pages through the URL hash with links, as a router-backed table would, keeping the list mounted. */
function StatefulPagination() {
  const [page, setPage] = useState<number>(1);
  return (
    <Pagination
      label="Páginas de resultados"
      page={page}
      pageCount={PAGE_COUNT}
      getHref={(pageNumber) => `#pagina-${pageNumber}`}
      onPageChange={setPage}
    />
  );
}

/** Swaps the avatar source on demand, so a fresh load reveals the image in place. */
function ReloadableAvatar() {
  const [version, setVersion] = useState(0);
  return (
    <div className="controls">
      <Avatar
        name="Ana Núñez"
        alt="Foto de Ana"
        size="lg"
        src={version === 0 ? null : `/avatar.svg?version=${version}`}
      />
      <Button onClick={() => setVersion((current) => current + 1)}>Cargar foto</Button>
      <AvatarGroup label="Equipo" members={[{ name: "Lucía Uriarte" }, { name: "Martín Alonso" }]} />
    </div>
  );
}

/** Renders the polished components with deterministic data. */
function PolishExamples() {
  return (
    <GolfoUIProvider>
      <main>
        <h1>Pulido de componentes</h1>
        <section>
          <StatefulPagination />
        </section>
        <section>
          <StatefulFilter />
        </section>
        <section>
          <Card
            aria-label="Resumen del mes"
            className="summary-card"
            title="Resumen del mes"
            footer={<Button variant="secondary">Ver detalle</Button>}
          >
            Total: $ 184.200
          </Card>
        </section>
        <section>
          <MonthCalendar />
        </section>
        <section>
          <ReloadableAvatar />
        </section>
        <section>
          <Skeleton label="Cargando resumen" lines={1} className="motion-skeleton" />
          <TypingAnimation startOnView={false} duration={20} pauseDelay={60000} words={["Hola", "Chau"]} />
        </section>
        <section>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Abrir ajustes</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>Ajustes</SheetTitle>
              <SheetDescription>Preferencias del panel.</SheetDescription>
            </SheetContent>
          </Sheet>
          <DropdownMenu
            label="Más acciones"
            trigger={<Button>Más acciones</Button>}
            items={[{ label: "Renombrar" }, { label: "Duplicar" }, { label: "Archivar" }, { label: "Compartir" }]}
          />
        </section>
      </main>
    </GolfoUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<PolishExamples />);
