/** Verifies ButtonLink and buttonClassName through the public barrel: link semantics, routing adapter and button recipe. */
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GolfoUIProvider, Button, ButtonLink, buttonClassName } from "@golfo/ui";

/** Represents an application router link that receives the navigation hints. */
function RouterLink({ prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  return <a data-router="true" data-prefetch={String(prefetch)} {...props} />;
}

describe("ButtonLink", () => {
  it("should render a link with the href and the button recipe of its variant and size", () => {
    render(<><ButtonLink href="/inicio" variant="secondary" size="sm">Volver al inicio</ButtonLink><Button variant="secondary" size="sm">Botón</Button></>);
    const link = screen.getByRole("link", { name: "Volver al inicio" });
    expect(link).toHaveAttribute("href", "/inicio");
    expect(link).toHaveAttribute("data-slot", "button-link");
    expect(link).toHaveAttribute("data-variant", "secondary");
    expect(link).toHaveAttribute("data-size", "sm");
    expect(link.className).toBe(buttonClassName({ variant: "secondary", size: "sm" }));
    expect(screen.getByRole("button", { name: "Botón" }).className).toBe(link.className);
  });

  it("should route through the provider's link adapter and forward prefetch", () => {
    render(<GolfoUIProvider components={{ Link: RouterLink }}><ButtonLink href="/cursos" prefetch={false}>Cursos</ButtonLink></GolfoUIProvider>);
    const link = screen.getByRole("link", { name: "Cursos" });
    expect(link).toHaveAttribute("data-router", "true");
    expect(link).toHaveAttribute("data-prefetch", "false");
  });

  it("should let an extra class win over the recipe on conflicts", () => {
    render(<ButtonLink href="/" size="sm" className="px-8 w-full">Inicio</ButtonLink>);
    const classes = screen.getByRole("link", { name: "Inicio" }).className.split(" ");
    expect(classes).toEqual(expect.arrayContaining(["px-8", "w-full"]));
    expect(classes).not.toContain("px-3");
  });
});

describe("buttonClassName", () => {
  it("should default to the primary medium recipe and merge extra classes", () => {
    expect(buttonClassName()).toBe(buttonClassName({ variant: "primary", size: "md" }));
    expect(buttonClassName({ className: "w-full" }).split(" ")).toContain("w-full");
  });
});
