/** Verifies the optional entrypoint using real Next.js and Base UI components. */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Avatar, Pagination } from "@golfo/ui";
import { GolfoUIProvider } from "@golfo/ui/next";

describe("GolfoUIProvider", () => {
  it("should activate Next Image while preserving the avatar lifecycle", async () => {
    render(<GolfoUIProvider><Avatar name="Gonzalo Herrera" src="/profile.png" /></GolfoUIProvider>);
    const image = screen.getByRole("img", { name: "Gonzalo Herrera" }).querySelector("img")!;
    expect(image).toHaveAttribute("data-nimg", "1");
    expect(image.src).toBe(new URL("/profile.png", window.location.href).href);
    fireEvent.load(image);
    await waitFor(() => expect(screen.queryByText("GH")).not.toBeInTheDocument());
    fireEvent.error(image);
    expect(await screen.findByText("GH")).toBeInTheDocument();
  });

  it("should opt into the Next image optimizer when requested", () => {
    render(<GolfoUIProvider optimizeImages><Avatar name="Perfil" src="/profile.png" /></GolfoUIProvider>);
    expect(screen.getByRole("img", { name: "Perfil" }).querySelector("img")!.getAttribute("src")).toContain("/_next/image?");
  });

  it("should preserve navigation hrefs through the Next adapter", () => {
    render(<GolfoUIProvider><Pagination page={1} pageCount={2} getHref={(page) => `/page/${page}`} /></GolfoUIProvider>);
    expect(screen.getByRole("link", { name: "Ir a la página siguiente" })).toHaveAttribute("href", "/page/2");
  });
});

