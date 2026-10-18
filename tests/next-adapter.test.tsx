/** Verifies the optional entrypoint using real Next.js and Base UI components. */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Avatar, Pagination } from "@astra-kit/ui";
import { AstraUIProvider } from "@astra-kit/ui/next";

describe("AstraUIProvider", () => {
  it("should activate Next Image while preserving the avatar lifecycle", async () => {
    render(<AstraUIProvider><Avatar name="Gonzalo Herrera" src="/profile.png" /></AstraUIProvider>);
    const image = screen.getByRole("img", { name: "Gonzalo Herrera" }).querySelector("img")!;
    expect(image).toHaveAttribute("data-nimg", "1");
    expect(image.src).toBe(new URL("/profile.png", window.location.href).href);
    fireEvent.load(image);
    await waitFor(() => expect(screen.queryByText("GH")).not.toBeInTheDocument());
    fireEvent.error(image);
    expect(await screen.findByText("GH")).toBeInTheDocument();
  });

  it("should opt into the Next image optimizer when requested", () => {
    render(<AstraUIProvider optimizeImages><Avatar name="Perfil" src="/profile.png" /></AstraUIProvider>);
    expect(screen.getByRole("img", { name: "Perfil" }).querySelector("img")!.getAttribute("src")).toContain("/_next/image?");
  });

  it("should preserve navigation hrefs through the Next adapter", () => {
    render(<AstraUIProvider><Pagination page={1} pageCount={2} getHref={(page) => `/page/${page}`} /></AstraUIProvider>);
    expect(screen.getByRole("link", { name: "Ir a la página siguiente" })).toHaveAttribute("href", "/page/2");
  });
});

