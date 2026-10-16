/** Exercises the polished motion and fixed behaviors through the public barrel, with real state. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
  BeezUIProvider,
  Button,
  Calendar,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
} from "beez-ui";
import "./styles.css";

/** Pages of the results pagination. */
const PAGE_COUNT = 3;
const SLIDES = ["Primera", "Segunda", "Tercera"] as const;
/** Fixed month, so navigation and its direction are deterministic across runs. */
const INITIAL_MONTH = new Date(2026, 0, 1);
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
      <Avatar size="lg">
        <AvatarImage
          src={version === 0 ? null : `/avatar.svg?version=${version}`}
          alt="Foto de Ana"
        />
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>
      <Button onClick={() => setVersion((current) => current + 1)}>Cargar foto</Button>
      <AvatarGroup aria-label="Equipo">
        <Avatar>
          <AvatarFallback>LU</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>MA</AvatarFallback>
        </Avatar>
      </AvatarGroup>
    </div>
  );
}

/** Renders the polished components with deterministic data. */
function PolishExamples() {
  return (
    <BeezUIProvider>
      <main>
        <h1>Pulido de componentes</h1>
        <section>
          <StatefulPagination />
        </section>
        <section>
          <StatefulFilter />
        </section>
        <section>
          <Card aria-label="Resumen del mes" className="summary-card">
            <CardHeader>
              <CardTitle>Resumen del mes</CardTitle>
            </CardHeader>
            <CardContent>Total: $ 184.200</CardContent>
            <CardFooter>
              <Button variant="secondary">Ver detalle</Button>
            </CardFooter>
          </Card>
        </section>
        <section>
          <Calendar mode="single" defaultMonth={INITIAL_MONTH} />
        </section>
        <section>
          <ReloadableAvatar />
        </section>
        <section>
          <Skeleton aria-label="Cargando resumen" className="motion-skeleton" />
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
        <section className="carousel-frame">
          <Carousel orientation="vertical" aria-label="Novedades" className="vertical-carousel">
            <CarouselContent className="vertical-carousel-content">
              {SLIDES.map((slide) => (
                <CarouselItem key={slide}>{`Diapositiva ${slide}`}</CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
      </main>
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<PolishExamples />);
