import { describe, it, expect, vi } from "vitest";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@guidomodarelli/beez-ui";

/** Exit long enough for assertions to run while the leaving content is still mounted. */
const LEAVING_EXIT_TRANSITION = { duration: 0.2 };

/** Removes its content through a parent exit animation, like a closing panel would. */
function LeavingPanel({ children }: { children: ReactNode }) {
  const [isShown, setIsShown] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setIsShown(false)}>
        Cerrar panel
      </button>
      <AnimatePresence>
        {isShown ? (
          <motion.div key="panel" exit={{ opacity: 0, transition: LEAVING_EXIT_TRANSITION }}>
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

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

  it("should stop being interactive or announced while a parent exit removes it", async () => {
    const user = userEvent.setup();
    render(
      <LeavingPanel>
        <Button>Voy</Button>
      </LeavingPanel>,
    );
    expect(screen.getByRole("button", { name: "Voy" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar panel" }));

    const leavingButton = screen.getByText("Voy").closest("button");
    expect(leavingButton).toHaveAttribute("inert");
    expect(leavingButton).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("button", { name: "Voy" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Voy")).not.toBeInTheDocument());
  });

  it("should make an asChild link inert while a parent exit removes it", async () => {
    const user = userEvent.setup();
    render(
      <LeavingPanel>
        <Button asChild>
          <a href="/perfil">Ver perfil</a>
        </Button>
      </LeavingPanel>,
    );

    await user.click(screen.getByRole("button", { name: "Cerrar panel" }));

    const leavingLink = screen.getByText("Ver perfil").closest("a");
    expect(leavingLink).toHaveAttribute("inert");
    expect(leavingLink).toHaveAttribute("aria-hidden", "true");
    await waitFor(() => expect(screen.queryByText("Ver perfil")).not.toBeInTheDocument());
  });

  it("should forward its ref to the rendered element", () => {
    let element: HTMLElement | null = null;
    render(<Button ref={(node) => { element = node; }}>Continuar</Button>);

    expect(element).toBe(screen.getByRole("button", { name: "Continuar" }));
  });
});
