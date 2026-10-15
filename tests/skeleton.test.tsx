import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Skeleton } from "beez-ui";

describe("Skeleton", () => {
  it("should announce the composed placeholder once and keep its lines within bounds", () => {
    // Arrange
    render(<Skeleton lines={10} avatar />);

    // Act
    const placeholder = screen.getByRole("status", { name: "Cargando contenido" });

    // Assert
    expect(placeholder).toHaveAttribute("aria-busy", "true");
    // Six lines at most, plus the avatar block.
    expect(placeholder.querySelectorAll("[data-slot=skeleton]")).toHaveLength(7);
  });

  it("should draw at least one line", () => {
    // Arrange
    render(<Skeleton lines={0} label="Cargando miembros" />);

    // Act
    const placeholder = screen.getByRole("status", { name: "Cargando miembros" });

    // Assert
    expect(placeholder.querySelectorAll("[data-slot=skeleton]")).toHaveLength(1);
  });

  it("should reveal the content once loading finishes", () => {
    // Arrange
    const { rerender } = render(
      <Skeleton loading lines={2}>
        <p>Resumen listo</p>
      </Skeleton>,
    );
    expect(screen.getByRole("status", { name: "Cargando contenido" })).toBeInTheDocument();
    expect(screen.queryByText("Resumen listo")).not.toBeInTheDocument();

    // Act
    rerender(
      <Skeleton loading={false} lines={2}>
        <p>Resumen listo</p>
      </Skeleton>,
    );

    // Assert
    const content = screen.getByText("Resumen listo");
    expect(content.closest("[data-slot=skeleton-reveal]")).toHaveAttribute("aria-busy", "false");
  });

  it("should stay a bare block sized by the consumer without Arc's props", () => {
    // Arrange
    render(<Skeleton aria-label="Cargando resumen" className="h-4 w-24" />);

    // Act
    const block = screen.getByLabelText("Cargando resumen");

    // Assert
    expect(block).toHaveAttribute("data-slot", "skeleton");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
