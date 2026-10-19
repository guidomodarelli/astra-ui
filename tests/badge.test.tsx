import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Star } from "lucide-react";

import { Badge } from "@astra-kit/ui";

describe("Badge", () => {
  it("should draw Arc's neutral tone and medium size by default", () => {
    // Arrange
    render(<Badge>Borrador</Badge>);

    // Act
    const badge = screen.getByText("Borrador").closest("[data-slot=badge]");

    // Assert
    expect(badge).toHaveAttribute("data-tone", "neutral");
    expect(badge).toHaveAttribute("data-size", "md");
  });

  it("should draw the tone and size it is given and forward native span attributes", () => {
    // Arrange
    render(
      <Badge tone="danger" size="sm" className="consumer-badge" aria-label="Estado del pago">
        Vencido
      </Badge>,
    );

    // Act
    const badge = screen.getByLabelText("Estado del pago");

    // Assert
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveAttribute("data-tone", "danger");
    expect(badge).toHaveAttribute("data-size", "sm");
    expect(badge).toHaveClass("consumer-badge");
  });

  it("should keep only the current label readable after the text changes", () => {
    // Arrange
    const { rerender } = render(<Badge>Borrador</Badge>);

    // Act
    rerender(<Badge>Publicado</Badge>);

    // Assert
    expect(screen.getByText("Publicado")).not.toHaveAttribute("aria-hidden");
    const outgoing = screen.queryByText("Borrador");
    if (outgoing) expect(outgoing).toHaveAttribute("aria-hidden", "true");
  });

  it("should render a decorative icon next to the label", () => {
    // Arrange
    render(<Badge icon={<Star data-testid="badge-star" />}>Destacado</Badge>);

    // Act
    const icon = screen.getByTestId("badge-star");

    // Assert
    expect(icon.closest("[aria-hidden=true]")).not.toBeNull();
    expect(screen.getByText("Destacado").closest("[data-slot=badge]")).toContainElement(icon);
  });

  it("should render node children as they are, keeping their controls usable", () => {
    // Arrange
    render(
      <Badge tone="danger">
        <span>Excluidas</span>
        <button type="button">Quitar exclusión</button>
      </Badge>,
    );

    // Act
    const removeButton = screen.getByRole("button", { name: "Quitar exclusión" });

    // Assert
    expect(removeButton.closest("[data-slot=badge]")).toContainElement(screen.getByText("Excluidas"));
  });
});
