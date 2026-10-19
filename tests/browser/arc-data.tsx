/** Mounts Arc's Calendar and Carousel from the public barrel, so their layout, cursor and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AstraUIProvider, Calendar, Carousel } from "@astra-kit/ui";
import "./styles.css";

const SLIDES = [1, 2, 3, 4];
/** Slide widths the controlled gallery switches between while it scrolls, to resize its slides mid-flight. */
const GALLERY_SLIDE_SIZES = { narrow: "min(60cqw, 240px)", wide: "min(80cqw, 320px)" } as const;
/** Milliseconds per slide of the rotating carousel, short so the spec does not wait long. */
const ROTATION_INTERVAL_MS = 700;

/** A single-date calendar with the Today button, whose selection is echoed for the spec. Today comes from the clock. */
function SingleDateCalendar() {
  const [selected, setSelected] = useState<Date | null>(null);
  return (
    <section>
      <Calendar showToday value={selected} onChange={setSelected} />
      <output aria-label="Día elegido">{selected?.getDate()}</output>
    </section>
  );
}

/** A carousel nested inside a slide, which must own the keys pressed inside it. */
function PhotoCarousel() {
  return (
    <Carousel
      label="Fotos"
      slideSize="100%"
      previousLabel="Foto anterior"
      nextLabel="Foto siguiente"
      slideLabel={(index, count) => `Foto ${index + 1} de ${count}`}
      showIndicators={false}
    >
      {SLIDES.map((photo) => (
        <p key={photo}>{`Foto ${photo}`}</p>
      ))}
    </Carousel>
  );
}

/** An uncontrolled carousel whose selection and resting slide are echoed for the spec. */
function FeaturedCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState(0);
  return (
    <section className="arc-data-carousel">
      <Carousel label="Destacados" onIndexChange={setActiveIndex} onSettle={setSettledIndex}>
        {SLIDES.map((slide) => (
          <div key={slide} className="arc-data-slide">
            <a href={`#tarjeta-${slide}`}>{`Tarjeta ${slide}`}</a>
            <input aria-label={`Nota ${slide}`} />
            {slide === 1 ? <PhotoCarousel /> : null}
            <div role="tablist" aria-label={`Vistas ${slide}`}>
              <button type="button" role="tab" aria-selected="true">{`Resumen ${slide}`}</button>
            </div>
          </div>
        ))}
      </Carousel>
      <output aria-label="Índice activo">{activeIndex}</output>
      <output aria-label="Índice asentado">{settledIndex}</output>
    </section>
  );
}

/** A controlled, full-width-slide gallery driven from outside, whose slides can be resized while it scrolls. */
function ControlledGallery() {
  const [index, setIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState(0);
  const [isWide, setIsWide] = useState(false);
  return (
    <section className="arc-data-carousel">
      <Carousel
        label="Galería controlada"
        index={index}
        onIndexChange={setIndex}
        onSettle={setSettledIndex}
        slideSize={isWide ? GALLERY_SLIDE_SIZES.wide : GALLERY_SLIDE_SIZES.narrow}
        slideClassName="arc-data-gallery-slide"
        duration={40}
      >
        {SLIDES.map((slide) => (
          <div key={slide} className="arc-data-slide">{`Imagen ${slide}`}</div>
        ))}
      </Carousel>
      <div className="controls">
        <button type="button" onClick={() => setIndex(2)}>
          Mostrar la imagen 3
        </button>
        <button type="button" onClick={() => setIsWide((wide) => !wide)}>
          Cambiar el tamaño
        </button>
      </div>
      <output aria-label="Índice controlado">{index}</output>
      <output aria-label="Índice controlado asentado">{settledIndex}</output>
    </section>
  );
}

/** A carousel that rotates on its own from mount. */
function RotatingCarousel() {
  return (
    <section className="arc-data-carousel">
      <Carousel label="Rotación" interval={ROTATION_INTERVAL_MS} autoplay slideLabel={(index, count) => `Aviso ${index + 1} de ${count}`}>
        {SLIDES.slice(0, 3).map((slide) => (
          <div key={slide} className="arc-data-slide">{`Aviso ${slide}`}</div>
        ))}
      </Carousel>
    </section>
  );
}

function App() {
  return (
    <AstraUIProvider>
      <main>
        <SingleDateCalendar />
        <FeaturedCarousel />
        <ControlledGallery />
        <RotatingCarousel />
      </main>
    </AstraUIProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
