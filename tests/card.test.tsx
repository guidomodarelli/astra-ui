/** Verifies Arc's closed Card and its quick look through the public barrel, as a consumer would use them. */
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Card } from "beez-ui";

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
});
