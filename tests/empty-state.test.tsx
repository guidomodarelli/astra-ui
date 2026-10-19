import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox } from "lucide-react";

import { EmptyState } from "@astra-kit/ui";

describe("EmptyState", () => {
  it("should name the region and render the title as a heading with its description", () => {
    // Arrange
    render(
      <EmptyState
        label="Solicitudes"
        title="No hay solicitudes pendientes"
        description="Cuando alguien pida unirse, va a aparecer acá."
      />,
    );

    // Act
    const region = screen.getByRole("region", { name: "Solicitudes" });

    // Assert
    expect(region).toContainElement(screen.getByRole("heading", { level: 3, name: "No hay solicitudes pendientes" }));
    expect(region).toHaveTextContent("Cuando alguien pida unirse, va a aparecer acá.");
  });

  it("should hide the default folder icon and a custom icon from assistive technology", () => {
    // Arrange
    const { container, rerender } = render(<EmptyState title="Sin resultados" description="Probá otra búsqueda." />);
    const iconSlot = container.querySelector("[data-slot=empty-state-icon]");
    expect(iconSlot).toHaveAttribute("aria-hidden", "true");
    expect(iconSlot?.querySelector("svg")).not.toBeNull();

    // Act
    rerender(<EmptyState title="Sin resultados" description="Probá otra búsqueda." icon={<Inbox data-testid="inbox-icon" />} />);

    // Assert
    expect(screen.getByTestId("inbox-icon").closest("[data-slot=empty-state-icon]")).toHaveAttribute("aria-hidden", "true");
  });

  it("should render the action and keep it operable", async () => {
    // Arrange
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(
      <EmptyState
        title="La lista está vacía"
        description="Importá un CSV para habilitar personas."
        action={<button type="button" onClick={onImport}>Importar CSV</button>}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Importar CSV" }));

    // Assert
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("should replace the copy when the title and description change", () => {
    // Arrange
    const { rerender } = render(<EmptyState title="Sin solicitudes" description="Todo al día." />);

    // Act
    rerender(<EmptyState title="Sin coincidencias" description="Limpiá los filtros." />);

    // Assert
    expect(screen.getByRole("heading", { name: "Sin coincidencias" })).toBeInTheDocument();
    expect(screen.getByText("Limpiá los filtros.")).toBeInTheDocument();
  });

  it("should forward native section attributes", () => {
    // Arrange
    render(<EmptyState title="Vacío" description="Nada por acá." data-testid="empty" className="extra" />);

    // Act
    const section = screen.getByTestId("empty");

    // Assert
    expect(section.tagName).toBe("SECTION");
    expect(section).toHaveClass("extra");
  });
});
