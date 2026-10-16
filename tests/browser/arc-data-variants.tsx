/** Mounts a Calendar with a long Today label and a looping Carousel, so their layout and indicator motion run in real engines. */
import { createRoot } from "react-dom/client";
import { BeezUIProvider, Calendar, Carousel } from "beez-ui";
import "./styles.css";

/** Five slides, so the loop boundary has dots in between that must stay resting dots. */
const SLIDES = [1, 2, 3, 4, 5];

function App() {
  return (
    <BeezUIProvider>
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
      </main>
    </BeezUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
