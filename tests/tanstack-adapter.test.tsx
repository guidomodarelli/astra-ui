/** Exercises the adapter against a real TanStack router and native image lifecycle. */
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Avatar, Link } from "@astra-kit/ui";
import { AstraUIProvider } from "@astra-kit/ui/tanstack";

/** Builds consumer-owned routes without mocking routing internals. */
function renderRouter(href = "/target?tab=summary#details", initialEntry = "/") {
  const root = createRootRoute({ component: () => <AstraUIProvider><Outlet /></AstraUIProvider> });
  const index = createRoute({ getParentRoute: () => root, path: "/", component: () => <><Link href={href}>Abrir</Link><Avatar name="Perfil" src="/profile.png" /></> });
  const target = createRoute({ getParentRoute: () => root, path: "/target", component: () => <h1>Destino</h1> });
  const router = createRouter({ routeTree: root.addChildren([index, target]), history: createMemoryHistory({ initialEntries: [initialEntry] }) });
  render(<RouterProvider router={router} />);
  return router;
}

describe("TanStack adapter", () => {
  it("should navigate while preserving search parameters and hash", async () => {
    const router = renderRouter();
    await userEvent.click(await screen.findByRole("link", { name: "Abrir" }));
    expect(await screen.findByRole("heading", { name: "Destino" })).toBeInTheDocument();
    expect(router.state.location.search).toEqual({ tab: "summary" });
    expect(router.state.location.hash).toBe("details");
  });

  it("should preserve the current search for a hash-only href", async () => {
    const router = renderRouter("#details", "/?initial=yes");
    await userEvent.click(await screen.findByRole("link", { name: "Abrir" }));
    await waitFor(() => expect(router.state.location.hash).toBe("details"));
    expect(router.state.location.search).toEqual({ initial: "yes" });
  });

  it("should retain native images without importing an image framework", async () => {
    renderRouter();
    const avatar = await screen.findByRole("img", { name: "Perfil" });
    const image = avatar.querySelector("img")!;
    expect(image).not.toHaveAttribute("data-nimg");
    expect(screen.getByText("P")).toBeInTheDocument();
    fireEvent.load(image);
    expect(screen.queryByText("P")).not.toBeInTheDocument();
  });
});
