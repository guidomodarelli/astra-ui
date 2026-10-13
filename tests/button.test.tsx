import { describe, it, expect, vi } from "vitest";
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "beez-ui";

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

  it("should render Arc's primary medium button unless another variant and size are chosen", () => {
    render(
      <>
        <Button>Guardar</Button>
        <Button variant="danger" size="lg">Eliminar</Button>
      </>,
    );

    const primary = screen.getByRole("button", { name: "Guardar" });
    expect(primary).toHaveAttribute("data-variant", "primary");
    expect(primary).toHaveAttribute("data-size", "md");
    const danger = screen.getByRole("button", { name: "Eliminar" });
    expect(danger).toHaveAttribute("data-variant", "danger");
    expect(danger).toHaveAttribute("data-size", "lg");
  });

  it("should not submit a surrounding form unless its type is submit", async () => {
    const handleSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form onSubmit={(event) => handleSubmit(event.nativeEvent as SubmitEvent)}>
        <Button>Agregar fila</Button>
        <Button type="submit">Enviar</Button>
      </form>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Agregar fila" }));
    expect(handleSubmit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
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
    render(
      <LeavingPanel>
        <Button>Voy</Button>
      </LeavingPanel>,
    );
    expect(screen.getByRole("button", { name: "Voy" })).toBeInTheDocument();

    // A synchronous click checks the exit state before the exit animation can finish.
    fireEvent.click(screen.getByRole("button", { name: "Cerrar panel" }));

    const leavingButton = screen.getByText("Voy").closest("button");
    expect(leavingButton).toHaveAttribute("inert");
    expect(leavingButton).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("button", { name: "Voy" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Voy")).not.toBeInTheDocument());
  });

  it("should forward its ref to the rendered element", () => {
    let element: HTMLElement | null = null;
    render(<Button ref={(node) => { element = node; }}>Continuar</Button>);

    expect(element).toBe(screen.getByRole("button", { name: "Continuar" }));
  });
});
