/** Mounts Arc's Tooltip, Popover and Hover Card from the public barrel, so their placement and motion run in real engines. */
import { createRoot } from "react-dom/client";
import {
  GolfoUIProvider,
  Button,
  HoverCard,
  HoverCardProfile,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@golfo/ui";
import "./styles.css";

/** Height that leaves the long lists below taller than their panel in every viewport. */
const SHORT_PANEL_HEIGHT_PX = 200;

/** Entries tall enough together to overflow a short panel. */
const LONG_LIST = Array.from({ length: 30 }, (_, index) => `Aviso ${index + 1}`);

function App() {
  return (
    <GolfoUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}>
      <main>
        <h1>Capas flotantes</h1>
        <section className="controls">
          {/* Two tooltips without any provider: the skip window is shared at module level. */}
          <Tooltip content="Guardá los cambios pendientes">
            <Button variant="secondary">Guardar</Button>
          </Tooltip>
          <Tooltip content="Copiar enlace">
            <Button variant="secondary">Compartir</Button>
          </Tooltip>
          <Tooltip content="Abre el historial" side="right">
            <Button variant="secondary">Historial</Button>
          </Tooltip>
        </section>
        <section className="controls">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Ver filtros</Button>
            </PopoverTrigger>
            <PopoverContent aria-label="Filtros">
              Filtros disponibles
              <PopoverClose asChild>
                <Button size="sm">Listo</Button>
              </PopoverClose>
            </PopoverContent>
          </Popover>
        </section>
        <section className="controls">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Ver avisos</Button>
            </PopoverTrigger>
            {/* A panel with a fixed header and its own scrolling list, as an inbox needs. */}
            <PopoverContent aria-label="Avisos" style={{ maxHeight: SHORT_PANEL_HEIGHT_PX, overflow: "hidden", padding: 0 }}>
              <div data-popover-shrink="" style={{ display: "flex", flexDirection: "column" }}>
                <h2 style={{ margin: 0, padding: "0.5rem" }}>Avisos recientes</h2>
                <ul data-testid="inbox-list" style={{ flex: "1 1 auto", minHeight: 0, margin: 0, overflowY: "auto" }}>
                  {LONG_LIST.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="secondary">Ver ayuda</Button>
            </PopoverTrigger>
            {/* Plain content: many children without a scroll of their own, so the whole panel scrolls. */}
            <PopoverContent aria-label="Ayuda" style={{ maxHeight: SHORT_PANEL_HEIGHT_PX }}>
              {LONG_LIST.map((label) => (
                <p key={label} style={{ margin: 0, overflow: "hidden" }}>
                  {label}
                </p>
              ))}
            </PopoverContent>
          </Popover>
        </section>
        <section className="controls">
          <HoverCard
            content={
              <HoverCardProfile name="Ana Pérez" role="Diseñadora de producto, Pagos" bio="Diseña flujos de cobro." />
            }
          >
            <a href="#ana">Ana Pérez</a>
          </HoverCard>
        </section>
      </main>
    </GolfoUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
