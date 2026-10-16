/** Verifies Arc's closed Avatar and AvatarGroup through the public barrel, as a consumer would use them. */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { UserIcon } from "lucide-react";

import { Avatar, AvatarGroup } from "beez-ui";

describe("Avatar", () => {
  it("should name the avatar once and show the first two initials while there is no photo", () => {
    // Arrange
    render(<Avatar name="Ana María Núñez" />);

    // Act
    const avatar = screen.getByRole("img", { name: "Ana María Núñez" });

    // Assert
    expect(avatar).toHaveAttribute("data-size", "md");
    expect(within(avatar).getByText("AM")).toHaveAttribute("aria-hidden", "true");
  });

  it("should append the presence in Spanish to the name and drop it when the status is cleared", () => {
    // Arrange
    const { rerender } = render(<Avatar name="Ana Núñez" status="online" />);
    expect(screen.getByRole("img", { name: "Ana Núñez, En línea" })).toBeInTheDocument();

    // Act
    rerender(<Avatar name="Ana Núñez" />);

    // Assert
    expect(screen.getByRole("img", { name: "Ana Núñez" })).toBeInTheDocument();
  });

  it("should use a custom presence label and a custom accessible text", () => {
    // Arrange
    render(<Avatar name="Lucía" alt="Foto de Lucía" status="offline" statusLabel="Ausente" />);

    // Act
    const avatar = screen.getByRole("img", { name: "Foto de Lucía, Ausente" });

    // Assert
    expect(within(avatar).getByText("L")).toBeInTheDocument();
  });

  it("should replace the initials with the photo once it loads and bring them back when it fails", () => {
    // Arrange
    const { container } = render(<Avatar name="Gonzalo Herrera" src="/profile.png" size="lg" />);
    const image = container.querySelector("img")!;
    expect(screen.getByText("GH")).toBeInTheDocument();

    // Act
    fireEvent.load(image);

    // Assert
    expect(screen.queryByText("GH")).not.toBeInTheDocument();
    expect(image).toHaveAttribute("alt", "");
    fireEvent.error(image);
    expect(screen.getByText("GH")).toBeInTheDocument();
  });

  it("should draw a custom fallback and corner badge and forward native span attributes", () => {
    // Arrange
    render(
      <Avatar
        name="Invitado"
        size="sm"
        className="consumer-avatar"
        data-testid="guest-avatar"
        fallback={<UserIcon data-testid="guest-icon" />}
        badge={<span data-testid="guest-badge" />}
      />,
    );

    // Act
    const avatar = screen.getByTestId("guest-avatar");

    // Assert
    expect(avatar).toHaveAccessibleName("Invitado");
    expect(avatar).toHaveClass("consumer-avatar");
    expect(within(avatar).getByTestId("guest-icon")).toBeInTheDocument();
    expect(within(avatar).getByTestId("guest-badge").closest("[data-slot=avatar-badge]")).not.toBeNull();
    expect(within(avatar).queryByText("I")).not.toBeInTheDocument();
  });
});

describe("AvatarGroup", () => {
  const TEAM = [
    { name: "Ana Núñez", status: "online" as const },
    { name: "Lucía Paz" },
    { name: "Tomás Gil" },
    { name: "Sara Ruiz" },
    { name: "Inés Ma" },
    { name: "Leo Park" },
  ];

  it("should name the group in Spanish and collapse the members past the default four into the overflow chip", () => {
    // Arrange
    render(<AvatarGroup members={TEAM} />);

    // Act
    const group = screen.getByRole("group", { name: "Integrantes" });

    // Assert
    expect(within(group).getByRole("img", { name: "Ana Núñez, En línea" })).toBeInTheDocument();
    expect(within(group).getByRole("img", { name: "Sara Ruiz" })).toBeInTheDocument();
    expect(within(group).queryByRole("img", { name: "Inés Ma" })).not.toBeInTheDocument();
    expect(within(group).getByRole("img", { name: "2 integrantes más" })).toHaveTextContent("+2");
  });

  it("should follow max, size and label, and leave out the chip when everyone fits", () => {
    // Arrange
    render(<AvatarGroup members={TEAM} max={2} size="lg" label="Editores" />);
    const group = screen.getByRole("group", { name: "Editores" });
    expect(within(group).getByRole("img", { name: "4 editores más" })).toBeInTheDocument();
    expect(within(group).getByRole("img", { name: "Ana Núñez, En línea" })).toHaveAttribute("data-size", "lg");

    // Act
    render(<AvatarGroup members={TEAM.slice(0, 2)} max={2} label="Revisores" />);

    // Assert
    const fittingGroup = screen.getByRole("group", { name: "Revisores" });
    expect(within(fittingGroup).getAllByRole("img")).toHaveLength(2);
    expect(within(fittingGroup).queryByRole("img", { name: /más$/ })).not.toBeInTheDocument();
  });

  it("should keep members with the same name apart through their keys", () => {
    // Arrange
    const members = [
      { key: "ana-1", name: "Ana" },
      { key: "ana-2", name: "Ana" },
    ];

    // Act
    render(<AvatarGroup members={members} />);

    // Assert
    expect(screen.getAllByRole("img", { name: "Ana" })).toHaveLength(2);
  });
});
