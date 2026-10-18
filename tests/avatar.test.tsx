/** Verifies Arc's closed Avatar and AvatarGroup through the public barrel, as a consumer would use them. */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { UserIcon } from "lucide-react";

import { Avatar, AvatarGroup, AstraUIProvider } from "@astra-kit/ui";
import { AstraUIProvider as NextAstraUIProvider } from "@astra-kit/ui/next";

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

  it("should give the xl photo its 88px intrinsic size through the default and Next image adapters", () => {
    // Arrange
    const { unmount } = render(
      <AstraUIProvider>
        <Avatar name="Perfil" src="https://images.unsplash.com/photo-example" size="xl" />
      </AstraUIProvider>
    );
    const unpicImage = screen.getByRole("img", { name: "Perfil" }).querySelector("img")!;

    // Act
    const unpicSource = new URL(unpicImage.src).searchParams;

    // Assert
    expect(unpicSource.get("w")).toBe("88");
    expect(unpicSource.get("h")).toBe("88");
    expect(unpicImage.srcset).toContain(" 88w");
    unmount();
    render(
      <NextAstraUIProvider>
        <Avatar name="Perfil" src="/profile.png" size="xl" />
      </NextAstraUIProvider>
    );
    const nextImage = screen.getByRole("img", { name: "Perfil" }).querySelector("img")!;
    expect(nextImage).toHaveAttribute("width", "88");
    expect(nextImage).toHaveAttribute("height", "88");
  });

  it("should request the photo without a referrer through the native, default and Next image adapters", () => {
    // Arrange
    const sources = [
      <Avatar key="native" name="Perfil" src="/profile.png" />,
      <AstraUIProvider key="default"><Avatar name="Perfil" src="https://images.unsplash.com/photo-example" /></AstraUIProvider>,
      <NextAstraUIProvider key="next"><Avatar name="Perfil" src="/profile.png" /></NextAstraUIProvider>,
    ];

    for (const avatar of sources) {
      // Act
      const { unmount } = render(avatar);
      const image = screen.getByRole("img", { name: "Perfil" }).querySelector("img")!;

      // Assert: identity providers such as Google reject some photos requested with a cross-site Referer.
      expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
      unmount();
    }
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

  it("should lowercase the overflow chip label the same way on a Turkish host", () => {
    // Arrange
    // The host default locale is fixed when the process starts, so this spy stands in for a Turkish server or browser:
    // a call without an explicit locale lowercases with Turkish rules ("I" becomes a dotless "ı").
    const nativeToLocaleLowerCase = String.prototype.toLocaleLowerCase;
    const toLocaleLowerCaseSpy = vi
      .spyOn(String.prototype, "toLocaleLowerCase")
      .mockImplementation(function lowercaseWithTurkishDefault(this: string, locales?: Intl.LocalesArgument) {
        return nativeToLocaleLowerCase.call(this, locales ?? "tr");
      });

    try {
      // Act
      render(<AvatarGroup members={TEAM} label="Integrantes" />);

      // Assert
      expect(screen.getByRole("img", { name: "2 integrantes más" })).toBeInTheDocument();
    } finally {
      toLocaleLowerCaseSpy.mockRestore();
    }
  });

  it("should hide a leaving member from assistive technology while their slot closes", () => {
    // Arrange
    const { rerender } = render(<AvatarGroup members={TEAM.slice(0, 3)} />);
    const leavingAvatar = screen.getByRole("img", { name: "Tomás Gil" });
    const leavingSlot = leavingAvatar.closest("[data-slot=avatar-group-slot]")!;
    expect(leavingSlot).not.toHaveAttribute("aria-hidden");

    // Act
    rerender(<AvatarGroup members={TEAM.slice(0, 2)} />);

    // Assert
    expect(leavingSlot).toBeInTheDocument();
    expect(leavingSlot).toHaveAttribute("aria-hidden", "true");
    expect(leavingSlot).toHaveAttribute("inert");
    expect(screen.queryByRole("img", { name: "Tomás Gil" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Lucía Paz" }).closest("[data-slot=avatar-group-slot]")).not.toHaveAttribute("inert");
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

describe("AvatarGroup total and root attributes", () => {
  it("should count the overflow chip against total when only a preview of the members is loaded", () => {
    // Arrange & Act
    render(
      <AvatarGroup
        members={[{ name: "Ana Núñez" }, { name: "Lucía Paz" }, { name: "Tomás Gil" }]}
        total={12}
        label="Asistentes"
      />,
    );

    // Assert
    const group = screen.getByRole("group", { name: "Asistentes" });
    expect(within(group).getAllByRole("img", { name: /^(Ana|Lucía|Tomás)/ })).toHaveLength(3);
    expect(within(group).getByRole("img", { name: "9 asistentes más" })).toHaveTextContent("+9");
  });

  it("should ignore a total smaller than the members it receives", () => {
    render(<AvatarGroup members={[{ name: "Ana Núñez" }, { name: "Lucía Paz" }]} total={1} max={1} />);

    expect(screen.getByRole("img", { name: "1 integrantes más" })).toHaveTextContent("+1");
  });

  it("should forward native and aria attributes to the root", () => {
    // Arrange & Act
    const { container } = render(
      <AvatarGroup
        members={[{ name: "Ana Núñez" }]}
        aria-hidden="true"
        className="Attendance__avatars"
        data-testid="attendance-avatars"
        style={{ marginInlineStart: "4px" }}
      />,
    );

    // Assert
    const root = screen.getByTestId("attendance-avatars");
    expect(root).toBe(container.firstElementChild);
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("Attendance__avatars");
    expect(root).toHaveAttribute("data-slot", "avatar-group");
    expect(root.style.marginInlineStart).toBe("4px");
    expect(root.style.getPropertyValue("--count")).toBe("1");
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});
