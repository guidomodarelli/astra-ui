import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@guidomodarelli/beez-ui";

describe("Button", () => {
  it("renders an accessible button label", () => {
    render(<Button type="button">Launch next step</Button>);

    expect(
      screen.getByRole("button", { name: /launch next step/i })
    ).toBeInTheDocument();
  });

  it("should run the click handler when pressed", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Guardar cambios</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should mark itself busy and swallow clicks while loading without losing focus", async () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Guardar cambios</Button>);
    const button = screen.getByRole("button", { name: "Guardar cambios" });

    await userEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeEnabled();
    expect(button).toHaveFocus();
  });

  it("should keep an asChild link as the only interactive element with its label", () => {
    render(
      <Button asChild variant="outline">
        <a href="/perfil">Ver perfil</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ver perfil" });
    expect(link).toHaveAttribute("href", "/perfil");
    expect(link).toHaveAttribute("data-variant", "outline");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should stop an asChild link from navigating while loading", async () => {
    const handleClick = vi.fn();
    render(
      <Button asChild loading>
        <a href="#destino" onClick={handleClick}>Continuar</a>
      </Button>,
    );

    await userEvent.click(screen.getByRole("link", { name: "Continuar" }));

    expect(handleClick).not.toHaveBeenCalled();
    expect(window.location.hash).not.toBe("#destino");
  });

  it("should forward its ref to the rendered element", () => {
    let element: HTMLElement | null = null;
    render(<Button ref={(node) => { element = node; }}>Continuar</Button>);

    expect(element).toBe(screen.getByRole("button", { name: "Continuar" }));
  });
});
