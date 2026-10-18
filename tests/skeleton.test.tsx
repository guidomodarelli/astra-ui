import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Skeleton } from "@astra-kit/ui";

describe("Skeleton", () => {
  it("should draw Arc's three lines by default and size the placeholder through its class", () => {
    // Arrange
    render(<Skeleton className="summary-placeholder" />);

    // Act
    const placeholder = screen.getByRole("status", { name: "Cargando contenido" });

    // Assert
    expect(placeholder).toHaveClass("summary-placeholder");
    expect(placeholder).toHaveAttribute("aria-busy", "true");
    expect(placeholder.querySelectorAll("[data-slot=skeleton]")).toHaveLength(3);
  });

  it("should announce the composed placeholder once and keep its lines within bounds", () => {
    // Arrange
    render(<Skeleton lines={10} avatar />);

    // Act
    const placeholder = screen.getByRole("status", { name: "Cargando contenido" });

    // Assert
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

  it("should keep the placeholder over its children while loading, as Arc does by default", () => {
    // Arrange
    render(
      <Skeleton lines={2}>
        <p>Resumen listo</p>
      </Skeleton>,
    );

    // Act
    const placeholder = screen.getByRole("status", { name: "Cargando contenido" });

    // Assert
    expect(placeholder.closest("[data-slot=skeleton-reveal]")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Resumen listo")).not.toBeInTheDocument();
  });

  it("should reveal the content once loading finishes", () => {
    // Arrange
    const { rerender } = render(
      <Skeleton loading lines={2} className="summary-reveal">
        <p>Resumen listo</p>
      </Skeleton>,
    );

    // Act
    rerender(
      <Skeleton loading={false} lines={2} className="summary-reveal">
        <p>Resumen listo</p>
      </Skeleton>,
    );

    // Assert
    const reveal = screen.getByText("Resumen listo").closest("[data-slot=skeleton-reveal]");
    expect(reveal).toHaveAttribute("aria-busy", "false");
    expect(reveal).toHaveClass("summary-reveal");
  });

  it("should take leaving content out of reach as soon as loading starts again", () => {
    // Arrange
    const { rerender } = render(
      <Skeleton loading={false}>
        <button type="button">Ver resumen</button>
      </Skeleton>,
    );

    // Act
    rerender(
      <Skeleton loading>
        <button type="button">Ver resumen</button>
      </Skeleton>,
    );

    // Assert
    expect(screen.getByRole("status", { name: "Cargando contenido" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver resumen" })).not.toBeInTheDocument();
    const leavingButton = screen.queryByRole("button", { name: "Ver resumen", hidden: true });
    if (leavingButton) expect(leavingButton.closest("[inert]")).toHaveAttribute("aria-hidden", "true");
  });
});
