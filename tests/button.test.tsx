import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@guidomodarelli/beez-ui";

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

  it("should not open a menu from a loading trigger by pointer or keyboard, keeping it focusable", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button loading>Acciones</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Acciones" });

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    trigger.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}");

    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("should open the menu from the same trigger once loading ends", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button loading>Acciones</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    rerender(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Acciones</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Editar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Acciones" });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("should forward its ref to the rendered element", () => {
    let element: HTMLElement | null = null;
    render(<Button ref={(node) => { element = node; }}>Continuar</Button>);

    expect(element).toBe(screen.getByRole("button", { name: "Continuar" }));
  });
});
