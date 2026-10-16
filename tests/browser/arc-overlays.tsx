/** Mounts Arc's Tooltip, Popover and Hover Card from the public barrel, so their placement and motion run in real engines. */
import { createRoot } from "react-dom/client";
import {
  BeezUIProvider,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardProfile,
  HoverCardTrigger,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipProvider,
} from "beez-ui";
import "./styles.css";

function App() {
  return (
    <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}>
      <main>
        <h1>Capas flotantes</h1>
        <section className="controls">
          <TooltipProvider>
            <Tooltip content="Guardá los cambios pendientes">
              <Button variant="secondary">Guardar</Button>
            </Tooltip>
            <Tooltip content="Copiar enlace">
              <Button variant="secondary">Compartir</Button>
            </Tooltip>
          </TooltipProvider>
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
          <HoverCard>
            <HoverCardTrigger href="#ana">Ana Pérez</HoverCardTrigger>
            <HoverCardContent>
              <HoverCardProfile name="Ana Pérez" role="Diseñadora de producto, Pagos" bio="Diseña flujos de cobro." />
            </HoverCardContent>
          </HoverCard>
        </section>
      </main>
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
