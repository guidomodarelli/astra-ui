import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";

import { Carousel } from "beez-ui";

const SLIDES = ["Uno", "Dos", "Tres"];

/** A carousel with one text slide per entry of {@link SLIDES}. */
function renderCarousel(props: Partial<Parameters<typeof Carousel>[0]> = {}) {
  return render(
    <Carousel label="Destacados" {...props}>
      {SLIDES.map((slide) => (
        <p key={slide}>{slide}</p>
      ))}
    </Carousel>,
  );
}

afterEach(() => vi.restoreAllMocks());

/** Emulates the reduced motion preference without replacing React or the component. */
function preferReducedMotion() {
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  }));
}

describe("Carousel", () => {
  it("should name the carousel and describe its role in Spanish", () => {
    // Arrange & Act
    renderCarousel();

    // Assert
    const carousel = screen.getByRole("region", { name: "Destacados" });
    expect(carousel.tagName).toBe("SECTION");
    expect(carousel).toHaveAttribute("aria-roledescription", "carrusel");
    expect(within(carousel).getByRole("group", { name: "Diapositivas" })).toHaveAttribute("tabindex", "0");
  });

  it("should render one named slide panel per child and keep only the active one interactive", () => {
    // Arrange & Act
    renderCarousel({ defaultIndex: 1 });

    // Assert
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(panels).toHaveLength(SLIDES.length);
    expect(panels.map((panel) => panel.getAttribute("aria-label"))).toEqual([
      "Diapositiva 1 de 3",
      "Diapositiva 2 de 3",
      "Diapositiva 3 de 3",
    ]);
    expect(panels.map((panel) => panel.hasAttribute("inert"))).toEqual([true, false, true]);
    expect(panels[1]).toHaveAttribute("aria-roledescription", "diapositiva");
    expect(panels[1]).toHaveTextContent("Dos");
  });

  it("should take the active slide from a controlled index", () => {
    // Arrange & Act
    renderCarousel({ index: 2 });

    // Assert
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(panels.map((panel) => panel.hasAttribute("inert"))).toEqual([true, true, false]);
  });

  it.each([
    { initialSlides: [] as string[], description: "no slides" },
    { initialSlides: SLIDES.slice(0, 1), description: "a single slide" },
  ])("should reach a controlled index once enough slides arrive after mounting with $description", async ({ initialSlides }) => {
    // Arrange
    const { rerender } = render(
      <Carousel label="Destacados" index={2}>
        {initialSlides.map((slide) => (
          <p key={slide}>{slide}</p>
        ))}
      </Carousel>,
    );

    // Act
    await act(async () => {
      rerender(
        <Carousel label="Destacados" index={2}>
          {SLIDES.map((slide) => (
            <p key={slide}>{slide}</p>
          ))}
        </Carousel>,
      );
    });

    // Assert
    const panels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(panels.map((panel) => panel.hasAttribute("inert"))).toEqual([true, true, false]);
  });

  it("should clamp an initial slide beyond the last one", () => {
    // Arrange & Act
    renderCarousel({ defaultIndex: 9 });

    // Assert
    expect(screen.getAllByRole("tabpanel", { hidden: true })[2]).not.toHaveAttribute("inert");
  });

  it("should name slides with a custom slide label", () => {
    // Arrange & Act
    renderCarousel({ slideLabel: (index, count) => `Foto ${index + 1} de ${count}` });

    // Assert
    expect(screen.getByRole("tabpanel", { name: "Foto 1 de 3" })).toBeInTheDocument();
  });

  it("should label the arrows in Spanish and accept custom names", () => {
    // Arrange & Act
    const { unmount } = renderCarousel();
    expect(screen.getByRole("button", { name: "Diapositiva anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Diapositiva siguiente" })).toBeInTheDocument();
    unmount();
    renderCarousel({ previousLabel: "Medio anterior", nextLabel: "Siguiente medio" });

    // Assert
    expect(screen.getByRole("button", { name: "Medio anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente medio" })).toBeInTheDocument();
  });

  it("should hide the arrows and the control row when asked", () => {
    // Arrange & Act
    const { container } = renderCarousel({ showControls: false, showIndicators: false });

    // Assert
    expect(screen.queryByRole("button", { name: "Diapositiva anterior" })).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="carousel-controls"]')).not.toBeInTheDocument();
  });

  it("should leave out the control row for a single slide", () => {
    // Arrange & Act
    const { container } = render(
      <Carousel label="Una foto">
        <p>Única</p>
      </Carousel>,
    );

    // Assert
    expect(container.querySelector('[data-slot="carousel-controls"]')).not.toBeInTheDocument();
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();
    const slide = screen.getByRole("group", { name: "Diapositiva 1 de 1" });
    expect(slide).toHaveAttribute("aria-roledescription", "diapositiva");
    expect(slide).not.toHaveAttribute("inert");
  });

  it("should describe slides as groups, not tab panels, when the indicator tabs are hidden", () => {
    // Arrange & Act
    renderCarousel({ showIndicators: false });

    // Assert
    expect(screen.queryByRole("tabpanel", { hidden: true })).not.toBeInTheDocument();
    const slides = SLIDES.map((_, index) => screen.getByRole("group", { name: `Diapositiva ${index + 1} de 3`, hidden: true }));
    for (const slide of slides) expect(slide).toHaveAttribute("aria-roledescription", "diapositiva");
  });

  it("should add a rotation control only when an interval is given", () => {
    // Arrange & Act
    const { unmount } = renderCarousel();
    expect(screen.queryByRole("button", { name: /rotación/ })).not.toBeInTheDocument();
    unmount();
    renderCarousel({ interval: 4000 });

    // Assert
    expect(screen.getByRole("button", { name: "Iniciar la rotación de diapositivas" })).toBeInTheDocument();
  });

  it("should offer to pause when it starts rotating on mount", () => {
    // Arrange & Act
    renderCarousel({ interval: 4000, autoplay: true });

    // Assert
    expect(screen.getByRole("button", { name: "Pausar la rotación de diapositivas" })).toBeInTheDocument();
  });

  it("should apply the root, slide and size settings", () => {
    // Arrange & Act
    renderCarousel({ className: "Gallery", slideClassName: "Gallery__slide", slideSize: "100%" });

    // Assert
    const carousel = screen.getByRole("region", { name: "Destacados" });
    expect(carousel).toHaveClass("Gallery");
    expect(carousel.style.getPropertyValue("--carousel-slide")).toBe("100%");
    for (const panel of screen.getAllByRole("tabpanel", { hidden: true })) expect(panel).toHaveClass("Gallery__slide");
  });

  it("should render the indicator tabs on the server so hydrating does not grow the control row", async () => {
    // Arrange
    const carousel = (
      <Carousel label="Destacados" defaultIndex={1} showControls={false}>
        {SLIDES.map((slide) => (
          <p key={slide}>{slide}</p>
        ))}
      </Carousel>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(carousel);
    document.body.append(container);
    const serverTabs = within(container).getAllByRole("tab");
    const recoverableErrors: unknown[] = [];
    let root: Root | undefined;

    try {
      // Act
      await act(async () => {
        root = hydrateRoot(container, carousel, { onRecoverableError: (error) => recoverableErrors.push(error) });
      });

      // Assert
      expect(serverTabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
      expect(recoverableErrors).toEqual([]);
      expect(within(container).getAllByRole("tab")).toHaveLength(SLIDES.length);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it("should keep the rotation control in place but disabled after hydrating with reduced motion", async () => {
    // Arrange
    preferReducedMotion();
    const carousel = (
      <Carousel label="Destacados" interval={4000} autoplay showControls={false} showIndicators={false}>
        {SLIDES.map((slide) => (
          <p key={slide}>{slide}</p>
        ))}
      </Carousel>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(carousel);
    document.body.append(container);
    const recoverableErrors: unknown[] = [];
    let root: Root | undefined;

    try {
      // Act
      await act(async () => {
        root = hydrateRoot(container, carousel, { onRecoverableError: (error) => recoverableErrors.push(error) });
      });

      // Assert
      expect(recoverableErrors).toEqual([]);
      expect(container.querySelector('[data-slot="carousel-controls"]')).toBeInTheDocument();
      expect(within(container).getByRole("button", { name: "Iniciar la rotación de diapositivas" })).toBeDisabled();
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
