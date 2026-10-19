/**
 * Mounts a Calendar with a long Today label, a looping Carousel and a controlled Carousel whose parent rejects every
 * change, so their layout, indicator motion and reconciliation run in real engines.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { GolfoUIProvider, Calendar, Carousel } from "@golfo/ui";
import "./styles.css";

/** Five slides, so the loop boundary has dots in between that must stay resting dots. */
const SLIDES = [1, 2, 3, 4, 5];

/** A controlled carousel pinned to its first slide: the parent counts each requested change and never applies it. */
function PinnedCarousel() {
  const [requestCount, setRequestCount] = useState(0);
  return (
    <section className="arc-data-carousel">
      <Carousel label="Galería fija" index={0} onIndexChange={() => setRequestCount((count) => count + 1)}>
        {SLIDES.map((slide) => (
          <div key={slide} className="arc-data-slide">{`Cuadro ${slide}`}</div>
        ))}
      </Carousel>
      <output aria-label="Cambios pedidos">{requestCount}</output>
    </section>
  );
}

function App() {
  return (
    <GolfoUIProvider>
      <main>
        <section>
          {/* Today comes from the clock the spec pins in the month with the longest Spanish name. */}
          <Calendar showToday todayLabel="Volver a la fecha actual" />
        </section>
        <section className="arc-data-carousel">
          <Carousel label="Galería en bucle" loop>
            {SLIDES.map((slide) => (
              <div key={slide} className="arc-data-slide">{`Foto ${slide}`}</div>
            ))}
          </Carousel>
        </section>
        <PinnedCarousel />
      </main>
    </GolfoUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
