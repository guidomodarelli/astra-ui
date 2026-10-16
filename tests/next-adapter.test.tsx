/** Verifies the optional entrypoint using real Next.js and Base UI components. */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Avatar, PaginationNext } from "beez-ui";
import { BeezUIProvider } from "beez-ui/next";

describe("BeezUIProvider", () => {
  it("should activate Next Image while preserving the avatar lifecycle", async () => {
    render(<BeezUIProvider><Avatar name="Gonzalo Herrera" src="/profile.png" /></BeezUIProvider>);
    const image = screen.getByRole("img", { name: "Gonzalo Herrera" }).querySelector("img")!;
    expect(image).toHaveAttribute("data-nimg", "1");
    expect(image.src).toBe(new URL("/profile.png", window.location.href).href);
    fireEvent.load(image);
    await waitFor(() => expect(screen.queryByText("GH")).not.toBeInTheDocument());
    fireEvent.error(image);
    expect(await screen.findByText("GH")).toBeInTheDocument();
  });

  it("should opt into the Next image optimizer when requested", () => {
    render(<BeezUIProvider optimizeImages><Avatar name="Perfil" src="/profile.png" /></BeezUIProvider>);
    expect(screen.getByRole("img", { name: "Perfil" }).querySelector("img")!.getAttribute("src")).toContain("/_next/image?");
  });

  it("should preserve navigation hrefs through the Next adapter", () => {
    render(<BeezUIProvider><PaginationNext href="/page/2" text="Siguiente" /></BeezUIProvider>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/page/2");
  });
});

