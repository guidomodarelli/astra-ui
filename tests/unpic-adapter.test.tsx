/** Verifies responsive image generation through the native provider without mocking Unpic. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar, AstraUIProvider } from "@astra-kit/ui";

/**
 * Finds the photo inside the avatar named `name`.
 * @param name - Accessible name of the avatar.
 * @returns The avatar's image element.
 */
function getAvatarImage(name: string): HTMLImageElement {
  return screen.getByRole("img", { name }).querySelector("img")!;
}

describe("Unpic adapter", () => {
  it("should use the detected CDN's responsive URLs and preserve image load events", () => {
    render(<AstraUIProvider><Avatar name="Perfil" src="https://images.unsplash.com/photo-example" /></AstraUIProvider>);
    const image = getAvatarImage("Perfil");
    expect(new URL(image.src).searchParams.get("w")).toBe("32");
    expect(image.srcset).not.toBe("");
    fireEvent.load(image);
    expect(screen.queryByText("P")).not.toBeInTheDocument();
  });

  it("should preserve a source that has no configured image service", () => {
    render(<AstraUIProvider><Avatar name="Perfil" src="/profile.png" /></AstraUIProvider>);
    expect(getAvatarImage("Perfil").src).toBe(new URL("/profile.png", window.location.href).href);
  });
});
