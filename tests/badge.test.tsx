import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Star } from "lucide-react";

import { Badge, badgeVariants } from "beez-ui";

describe("Badge", () => {
  it("should draw each shadcn variant with its Arc tone unless a tone is given", () => {
    // Arrange
    render(
      <>
        <Badge variant="destructive">Vencido</Badge>
        <Badge variant="secondary" tone="success">Pagado</Badge>
      </>,
    );

    // Act
    const overdue = screen.getByText("Vencido").closest("[data-slot=badge]");
    const paid = screen.getByText("Pagado").closest("[data-slot=badge]");

    // Assert
    expect(overdue).toHaveAttribute("data-tone", "danger");
    expect(paid).toHaveAttribute("data-tone", "success");
    expect(paid).toHaveAttribute("data-variant", "secondary");
  });

  it("should style other elements like the badge of the same variant", () => {
    // Arrange
    const variantOnly = badgeVariants({ variant: "outline" });

    // Act
    const withImpliedTone = badgeVariants({ variant: "outline", tone: "neutral" });

    // Assert
    expect(variantOnly).toBe(withImpliedTone);
    expect(badgeVariants({ variant: "outline", tone: "danger" })).not.toBe(variantOnly);
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

  it("should merge into its child element when asChild is set", () => {
    // Arrange
    render(
      <Badge asChild variant="link">
        <a href="/novedades">Novedades</a>
      </Badge>,
    );

    // Act
    const link = screen.getByRole("link", { name: "Novedades" });

    // Assert
    expect(link).toHaveAttribute("data-slot", "badge");
    expect(link).toHaveAttribute("data-tone", "info");
  });
});
