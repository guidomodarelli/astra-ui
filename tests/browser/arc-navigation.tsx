/** Mounts Arc's Tabs and Pagination from the public barrel, so their layout and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AstraUIProvider,
  Pagination,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@astra-kit/ui";
import "./styles.css";

/** Sections of the panel tabs; the second panel is much taller so the height morph is measurable. */
const SECTIONS = ["Resumen", "Actividad", "Miembros"] as const;

/** Enough tabs to overflow a phone-width list, so the active one must scroll into view. */
const MANY_SECTIONS = Array.from({ length: 12 }, (_, index) => `Sección ${index + 1}`);

/** Pages of both paginations: more than the five page window, so the window shifts. */
const PAGE_COUNT = 9;

/** Tabs whose panels differ in height. */
function PanelTabs() {
  return (
    <Tabs defaultValue="Resumen" data-testid="panel-tabs">
      <TabsList aria-label="Secciones de la tribu">
        {SECTIONS.map((section) => (
          <TabsTrigger key={section} value={section}>
            {section}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="Resumen">Resumen breve.</TabsContent>
      <TabsContent value="Actividad">
        <div style={{ height: 240 }}>Actividad reciente de la tribu.</div>
      </TabsContent>
      <TabsContent value="Miembros" style={{ minHeight: 120, overflow: "auto" }}>
        Miembros activos.
      </TabsContent>
    </Tabs>
  );
}

/** A tab list wider than a phone screen. */
function OverflowTabs() {
  return (
    <div className="narrow-field">
      <Tabs defaultValue={MANY_SECTIONS[0]}>
        <TabsList aria-label="Secciones largas">
          {MANY_SECTIONS.map((section) => (
            <TabsTrigger key={section} value={section}>
              {section}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

/** Pages through local state with arrow and number buttons. */
function StatefulPagination() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} pageCount={PAGE_COUNT} onPageChange={setPage} />;
}

/** Pages through the URL hash with links, as a router-backed list would. */
function LinkedPagination() {
  const [page, setPage] = useState(1);
  return (
    <Pagination
      label="Paginación enlazada"
      page={page}
      pageCount={PAGE_COUNT}
      getHref={(pageNumber) => `#pagina-${pageNumber}`}
      onPageChange={setPage}
    />
  );
}

/** Tabs driven only by their parent's `value`, as a router or a reset would change them, never by a trigger. */
function ControlledTabs() {
  const [value, setValue] = useState<string>(SECTIONS[0]);
  return (
    <div>
      <div className="controls">
        <button type="button" onClick={() => setValue(SECTIONS[2])}>Mostrar miembros</button>
        <button type="button" onClick={() => setValue(SECTIONS[0])}>Mostrar resumen</button>
      </div>
      <Tabs value={value} data-testid="controlled-tabs">
        <TabsList aria-label="Secciones controladas">
          {SECTIONS.map((section) => (
            <TabsTrigger key={section} value={section}>
              {section}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="Resumen">Resumen controlado.</TabsContent>
        <TabsContent value="Actividad">Actividad controlada.</TabsContent>
        <TabsContent value="Miembros">Miembros controlados.</TabsContent>
      </Tabs>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <AstraUIProvider>
    <main>
      <section>
        <PanelTabs />
      </section>
      <section>
        <ControlledTabs />
      </section>
      <section>
        <OverflowTabs />
      </section>
      <section>
        <StatefulPagination />
      </section>
      <section>
        <LinkedPagination />
      </section>
    </main>
  </AstraUIProvider>,
);
