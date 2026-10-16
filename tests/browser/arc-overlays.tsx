/** Mounts Arc's Tooltip, Popover and Hover Card from the public barrel, so their placement and motion run in real engines. */
import { createRoot } from "react-dom/client";
import {
  BeezUIProvider,
  Button,
  HoverCard,
  HoverCardProfile,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "beez-ui";
import "./styles.css";

function App() {
  return (
    <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}>
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
          <HoverCard
            content={
              <HoverCardProfile name="Ana Pérez" role="Diseñadora de producto, Pagos" bio="Diseña flujos de cobro." />
            }
          >
            <a href="#ana">Ana Pérez</a>
          </HoverCard>
        </section>
      </main>
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
