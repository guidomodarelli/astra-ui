import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Avatar, AvatarFallback } from "beez-ui";

describe("Avatar", () => {
  it("should announce the presence in Spanish by default", () => {
    // Arrange
    render(
      <Avatar status="online">
        <AvatarFallback>AN</AvatarFallback>
      </Avatar>,
    );

    // Act
    const presence = screen.getByText("En línea");

    // Assert
    expect(presence.closest("[data-slot=avatar]")).toContainElement(screen.getByText("AN"));
  });

  it("should use a custom presence label and drop it when the status is cleared", () => {
    // Arrange
    const { rerender } = render(
      <Avatar status="offline" statusLabel="Ausente">
        <AvatarFallback>LU</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("Ausente")).toBeInTheDocument();
    expect(screen.queryByText("Desconectado")).not.toBeInTheDocument();

    // Act
    rerender(
      <Avatar>
        <AvatarFallback>LU</AvatarFallback>
      </Avatar>,
    );

    // Assert
    expect(screen.queryByText("Ausente")).not.toBeInTheDocument();
  });
});
