/** Mounts Arc's Calendar and Carousel from the public barrel, so their layout, cursor and motion run in real engines. */
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BeezUIProvider,
  Calendar,
  Carousel,
  CarouselContent,
  CarouselIndicators,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "beez-ui";
import "./styles.css";

/** Month the calendar opens on; today is pinned in it so the spec never depends on the real clock. */
const INITIAL_MONTH = new Date(2026, 8, 1);
const TODAY = new Date(2026, 8, 10);
const SLIDES = [1, 2, 3, 4];

/** A single-date calendar with the Today button, whose selection is echoed for the spec. */
function SingleDateCalendar() {
  const [selected, setSelected] = useState<Date>();
  return (
    <section>
      <Calendar mode="single" showToday today={TODAY} defaultMonth={INITIAL_MONTH} selected={selected} onSelect={setSelected} />
      <output aria-label="Día elegido">{selected?.getDate()}</output>
    </section>
  );
}

/** A carousel nested inside a slide, which must own the keys pressed inside it. */
function PhotoCarousel() {
  return (
    <Carousel aria-label="Fotos">
      <CarouselContent>
        {SLIDES.map((photo) => (
          <CarouselItem key={photo}>{`Foto ${photo}`}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious aria-label="Foto anterior" />
      <CarouselNext aria-label="Foto siguiente" />
    </Carousel>
  );
}

function App() {
  // A consumer ref on the indicators, which must not stop focus from following the selected dot.
  const indicatorsRef = useRef<HTMLDivElement>(null);
  return (
    <BeezUIProvider>
      <main>
        <SingleDateCalendar />
        <section className="arc-data-carousel">
          <Carousel aria-label="Destacados">
            <CarouselContent>
              {SLIDES.map((slide) => (
                <CarouselItem key={slide}>
                  <div className="arc-data-slide">
                    <a href={`#tarjeta-${slide}`}>{`Tarjeta ${slide}`}</a>
                    <input aria-label={`Nota ${slide}`} />
                    {slide === 1 ? <PhotoCarousel /> : null}
                    <div role="tablist" aria-label={`Vistas ${slide}`}>
                      <button type="button" role="tab" aria-selected="true">{`Resumen ${slide}`}</button>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
            <CarouselIndicators ref={indicatorsRef} />
          </Carousel>
        </section>
      </main>
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
