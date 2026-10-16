/** Mounts a Calendar with a long Today label and a looping Carousel, so their layout and indicator motion run in real engines. */
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

/** Today pinned in the month with the longest Spanish name, so the title competes with the controls for room. */
const TODAY = new Date(2026, 8, 10);
const SLIDES = [1, 2, 3, 4, 5];

function App() {
  return (
    <BeezUIProvider>
      <main>
        <section>
          <Calendar mode="single" showToday todayLabel="Volver a la fecha actual" today={TODAY} defaultMonth={TODAY} />
        </section>
        <section className="arc-data-carousel">
          <Carousel aria-label="Galería en bucle" opts={{ loop: true }}>
            <CarouselContent>
              {SLIDES.map((slide) => (
                <CarouselItem key={slide}>
                  <div className="arc-data-slide">{`Foto ${slide}`}</div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
            <CarouselIndicators />
          </Carousel>
        </section>
      </main>
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
