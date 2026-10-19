/** Verifies Arc's closed Card and its quick look through the public barrel, as a consumer would use them. */
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Card } from "@golfo/ui";

describe("Card", () => {
  it("should render an article with its title, description, media, body and byline", () => {
    // Arrange
    render(
      <Card
        aria-label="Tarjeta de la tribu"
        className="consumer-card"
        title="Tribu de lectura"
        description="Un libro por mes."
        media={<img src="/tribe.png" alt="Portada de la tribu" />}
        avatar={<span data-testid="owner-avatar" />}
        meta="Ana Núñez"
        status="Actualizada hace 2 horas"
        action={<button type="button">Unirme</button>}
      >
        <p>Próximo encuentro el jueves.</p>
      </Card>,
    );

    // Act
    const card = screen.getByRole("article", { name: "Tarjeta de la tribu" });

    // Assert
    expect(card).toHaveClass("consumer-card");
    expect(within(card).getByRole("heading", { level: 3, name: "Tribu de lectura" })).toBeInTheDocument();
    expect(within(card).getByText("Un libro por mes.")).toBeInTheDocument();
    expect(within(card).getByRole("img", { name: "Portada de la tribu" })).toBeInTheDocument();
    expect(within(card).getByText("Próximo encuentro el jueves.")).toBeInTheDocument();
    expect(within(card).getByTestId("owner-avatar")).toBeInTheDocument();
    expect(within(card).getByText("Ana Núñez")).toBeInTheDocument();
    expect(within(card).getByRole("status")).toHaveTextContent("Actualizada hace 2 horas");
    expect(within(card).getByRole("button", { name: "Unirme" })).toBeInTheDocument();
    expect(within(card).queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should use the heading level it is given and render a footer after the content", () => {
    // Arrange
    render(
      <Card title="Resumen" headingLevel={2} footer={<button type="button">Ver detalles</button>}>
        Tres tareas pendientes.
      </Card>,
    );

    // Act
    const heading = screen.getByRole("heading", { level: 2, name: "Resumen" });

    // Assert
    const footer = screen.getByRole("button", { name: "Ver detalles" }).closest("[data-slot=card-footer]");
    expect(footer).not.toBeNull();
    expect(heading.compareDocumentPosition(footer!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("should render only the surface and its children without a title", () => {
    // Arrange
    render(
      <Card aria-label="Superficie">
        <p>Contenido libre</p>
      </Card>,
    );

    // Act
    const card = screen.getByRole("article", { name: "Superficie" });

    // Assert
    expect(within(card).queryByRole("heading")).not.toBeInTheDocument();
    expect(within(card).getByText("Contenido libre")).toBeInTheDocument();
  });

  it("should open the quick look from its title and close it with Escape", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Card title="Tribu de lectura" description="Un libro por mes." details={<p>Reglamento y calendario.</p>} />,
    );
    const trigger = screen.getByRole("button", { name: "Tribu de lectura" });

    // Act
    await user.click(trigger);

    // Assert
    const dialog = await screen.findByRole("dialog", { name: "Tribu de lectura" });
    expect(dialog).toHaveAccessibleDescription("Un libro por mes.");
    expect(within(dialog).getByText("Reglamento y calendario.")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    // The morph back into the card and the focus return need real layout; tests/browser/arc-display.spec.ts covers them.
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("should follow a controlled quick look and close it from its Spanish close button", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function ControlledCard() {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <Card
          title="Resumen"
          details="Detalle del mes."
          open={isOpen}
          onOpenChange={(nextOpen) => {
            onOpenChange(nextOpen);
            setIsOpen(nextOpen);
          }}
        />
      );
    }
    render(<ControlledCard />);
    const dialog = await screen.findByRole("dialog", { name: "Resumen" });

    // Act
    await user.click(within(dialog).getByRole("button", { name: "Cerrar vista rápida" }));

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("should open a controlled quick look whose details are the number 0", async () => {
    // Arrange
    render(<Card title="Pendientes" details={0} open />);

    // Act
    const dialog = await screen.findByRole("dialog", { name: "Pendientes" });

    // Assert
    expect(within(dialog).getByText("0")).toBeInTheDocument();
  });

  it("should hand its article node to a consumer object ref and callback ref", () => {
    // Arrange
    const objectRef = createRef<HTMLElement>();
    const callbackRef = vi.fn();

    // Act
    const { unmount } = render(
      <>
        <Card aria-label="Con objeto" ref={objectRef} title="Objeto" />
        <Card aria-label="Con callback" ref={callbackRef} title="Callback" />
      </>,
    );

    // Assert
    expect(objectRef.current).toBe(screen.getByRole("article", { name: "Con objeto" }));
    expect(callbackRef).toHaveBeenCalledWith(screen.getByRole("article", { name: "Con callback" }));
    unmount();
    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });

  it("should show a description of 0 in the card and describe its quick look with it", async () => {
    // Arrange
    render(<Card title="Pendientes" description={0} details="Sin tareas." open />);

    // Act
    const dialog = await screen.findByRole("dialog", { name: "Pendientes" });

    // Assert
    const cardDescription = document.querySelector("[data-slot=card] [data-slot=card-description]");
    expect(cardDescription).toHaveTextContent("0");
    expect(dialog).toHaveAccessibleDescription("0");
  });

  it("should keep a single live copy of its children while the quick look is open", async () => {
    // Arrange
    const user = userEvent.setup();
    function DraftCounter() {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount((current) => current + 1)}>
          Borradores: {count}
        </button>
      );
    }
    render(
      <Card title="Tribu de lectura" details={<p>Reglamento y calendario.</p>}>
        <label htmlFor="email">Correo</label>
        <input id="email" />
        <DraftCounter />
      </Card>,
    );
    await user.click(screen.getByRole("button", { name: "Borradores: 0" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Tribu de lectura" }));

    // Assert
    await screen.findByRole("dialog", { name: "Tribu de lectura" });
    expect(document.querySelectorAll("#email")).toHaveLength(1);
    expect(screen.getAllByText(/Borradores:/)).toHaveLength(1);
    expect(screen.getByText("Borradores: 1")).toBeInTheDocument();
  });

  it("should keep a single live copy of its avatar, action and footer while the quick look is open", async () => {
    // Arrange
    const user = userEvent.setup();
    function Counter({ label }: { label: string }) {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount((current) => current + 1)}>
          {label}: {count}
        </button>
      );
    }
    render(
      <Card
        title="Tribu de lectura"
        meta="Ana Núñez"
        avatar={<img id="owner-avatar" alt="Ana Núñez" src="data:," />}
        action={<Counter label="Me gusta" />}
        footer={<Counter label="Guardados" />}
        details={<p>Reglamento y calendario.</p>}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Me gusta: 0" }));
    await user.click(screen.getByRole("button", { name: "Guardados: 0" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Tribu de lectura" }));

    // Assert
    await screen.findByRole("dialog", { name: "Tribu de lectura" });
    expect(document.querySelectorAll("#owner-avatar")).toHaveLength(1);
    expect(screen.getAllByText(/Me gusta:/)).toHaveLength(1);
    expect(screen.getAllByText(/Guardados:/)).toHaveLength(1);
    expect(screen.getByText("Me gusta: 1")).toBeInTheDocument();
    expect(screen.getByText("Guardados: 1")).toBeInTheDocument();
  });

  it("should hide the returning quick look from assistive technology and the tab order as soon as it closes", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Card title="Tribu de lectura" details={<p>Reglamento y calendario.</p>} />);
    await user.click(screen.getByRole("button", { name: "Tribu de lectura" }));
    await screen.findByRole("dialog", { name: "Tribu de lectura" });

    // Act
    await user.keyboard("{Escape}");

    // Assert
    const returningPanel = document.querySelector<HTMLElement>("[data-slot=card-quick-look][data-returning]");
    expect(returningPanel).not.toBeNull();
    expect(returningPanel).toHaveAttribute("inert");
    expect(returningPanel).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar vista rápida" })).not.toBeInTheDocument();
  });

  it("should not offer a quick look when its title is a false condition", () => {
    // Arrange
    const canShowTitle = false;

    // Act
    render(<Card title={canShowTitle && "Resumen"} details={<p>Reglamento y calendario.</p>} />);

    // Assert
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText("Reglamento y calendario.")).not.toBeInTheDocument();
  });
});
