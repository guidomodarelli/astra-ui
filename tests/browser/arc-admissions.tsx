/** Mounts Arc's EmptyState, MetricCard, UsageMeter, Timeline and Stepper from the public barrel, so layout and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Check, Inbox } from "lucide-react";
import { AstraUIProvider, Button, EmptyState, MetricCard, Stepper, Timeline, UsageMeter } from "@astra-kit/ui";
import type { TimelineEvent } from "@astra-kit/ui";
import "./styles.css";

/** Fixed reference time, so day groups never depend on the real date. */
const NOW = Date.UTC(2026, 8, 22, 15);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** A meter whose usage can pass the limit and come back, so the spec can watch the segments re-flow. */
function MessagingQuota() {
  const [codes, setCodes] = useState(120);
  return (
    <section className="admissions-panel">
      <UsageMeter
        label="Envíos de hoy"
        decimals={0}
        limit={200}
        segments={[
          { id: "codes", label: "Códigos", value: codes },
          { id: "notices", label: "Avisos", value: 40 },
        ]}
      />
      <div className="controls">
        <Button variant="secondary" onClick={() => setCodes(200)}>Superar el límite</Button>
        <Button variant="secondary" onClick={() => setCodes(60)}>Bajar el uso</Button>
      </div>
    </section>
  );
}

/** A meter whose raw total sits a fraction past the limit but rounds onto it at the shown precision. */
function RoundedQuota() {
  return (
    <section className="admissions-panel">
      <UsageMeter label="Cupo redondeado" decimals={0} limit={200} segments={[{ id: "codes", label: "Códigos", value: 200.4 }]} />
    </section>
  );
}

/** A narrow meter whose localized status copy is longer than the room it has. */
function NarrowQuota() {
  return (
    <section className="admissions-panel admissions-narrow">
      <UsageMeter
        label="Avisos"
        decimals={0}
        limit={100}
        segments={[{ id: "notices", label: "Avisos", value: 20 }]}
        messages={{ freeBadge: ({ free }) => `Todavía quedan ${free} avisos disponibles para enviar durante el resto del día` }}
      />
    </section>
  );
}

/** A metric whose value grows, so the spec can watch the odometer land on the new digits. */
function RequestsMetric() {
  const [value, setValue] = useState(128);
  return (
    <section className="admissions-panel">
      <MetricCard label="Solicitudes recibidas" value={value} context="Últimos 7 días" change={value > 128 ? "+12%" : undefined} />
      <Button variant="secondary" onClick={() => setValue(1543)}>Actualizar métrica</Button>
    </section>
  );
}

/** An empty inbox whose copy changes, so the spec can watch the block spring to its new height. */
function EmptyInbox() {
  const [isFiltered, setIsFiltered] = useState(false);
  return (
    <section className="admissions-panel">
      <EmptyState
        label="Bandeja vacía"
        icon={<Inbox size={24} strokeWidth={1.5} />}
        title={isFiltered ? "Sin coincidencias" : "No hay solicitudes"}
        description={
          isFiltered
            ? "Ninguna solicitud coincide con los filtros elegidos. Probá con una búsqueda más corta, quitá el filtro de país o revisá la fecha elegida."
            : "Cuando alguien pida unirse, va a aparecer acá."
        }
        action={<Button variant="secondary" onClick={() => setIsFiltered((current) => !current)}>Alternar filtros</Button>}
      />
    </section>
  );
}

/** A two-step import flow that can move back to completed steps. */
function ImportStepper() {
  const [current, setCurrent] = useState(1);
  return (
    <section className="admissions-panel">
      <Stepper
        label="Importación CSV"
        completeLabel="Importación completa"
        current={current}
        onStepSelect={setCurrent}
        steps={[
          { id: "upload", label: "Subir archivo", description: "CSV con un correo por fila" },
          { id: "review", label: "Revisar filas", description: "Confirmá las filas válidas" },
          { id: "activate", label: "Activar acceso", description: "Habilitá a las personas importadas" },
        ]}
      />
      <Button variant="secondary" onClick={() => setCurrent((step) => Math.min(3, step + 1))}>Avanzar paso</Button>
    </section>
  );
}

const EVENTS: TimelineEvent[] = [
  { id: "approved", at: NOW - 4 * MINUTE, actor: "Martín", title: "aprobó la solicitud", icon: <Check />, tone: "success", detail: <p>Se asignó un lugar en la cohorte.</p> },
  { id: "code", at: NOW - 3 * HOUR, title: "Se envió el código de acceso", meta: "WhatsApp" },
  { id: "info", at: NOW - 26 * HOUR, actor: "Ana", title: "completó los datos pedidos" },
  { id: "asked", at: NOW - 28 * HOUR, actor: "Martín", title: "pidió más datos", meta: "Falta el país de residencia" },
  { id: "rule", at: NOW - 40 * HOUR, title: "La regla de país la marcó para revisión" },
  { id: "created", at: NOW - 52 * HOUR, actor: "Ana", title: "envió la solicitud", detail: <p>Llegó desde el enlace público.</p> },
];

/** A scrolling request history that can receive new updates. */
function RequestHistory() {
  const [events, setEvents] = useState(EVENTS);
  return (
    <section className="admissions-panel">
      <Timeline events={events} now={NOW} label="Historial de la solicitud" maxHeight={260} />
      <Button
        variant="secondary"
        onClick={() => setEvents((current) => [{ id: `note-${current.length}`, at: NOW, actor: "Lucía", title: "agregó una nota interna" }, ...current])}
      >
        Agregar actualización
      </Button>
    </section>
  );
}

/** Every admissions display on one page. */
function ArcAdmissions() {
  return <AstraUIProvider><main>
    <h1>Admisiones</h1>
    <MessagingQuota />
    <RoundedQuota />
    <NarrowQuota />
    <RequestsMetric />
    <EmptyInbox />
    <ImportStepper />
    <RequestHistory />
  </main></AstraUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ArcAdmissions />);
