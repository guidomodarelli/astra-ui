import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ArcButton } from "@guidomodarelli/beez-ui";

describe("ArcButton", () => {
  it("should run the click handler when pressed", async () => {
    const handleClick = vi.fn();
    render(<ArcButton onClick={handleClick}>Guardar cambios</ArcButton>);

    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should mark itself busy and swallow clicks while loading without losing focus", async () => {
    const handleClick = vi.fn();
    render(<ArcButton loading onClick={handleClick}>Guardar cambios</ArcButton>);
    const button = screen.getByRole("button", { name: "Guardar cambios" });

    await userEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeEnabled();
    expect(button).toHaveFocus();
  });

  it("should not run the click handler when disabled", async () => {
    const handleClick = vi.fn();
    render(<ArcButton disabled onClick={handleClick}>Eliminar</ArcButton>);

    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should expose the chosen variant and size and default to primary md", () => {
    render(
      <>
        <ArcButton>Continuar</ArcButton>
        <ArcButton variant="danger" size="lg">Eliminar cuenta</ArcButton>
      </>,
    );

    expect(screen.getByRole("button", { name: "Continuar" })).toHaveAttribute("data-variant", "primary");
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveAttribute("data-size", "md");
    expect(screen.getByRole("button", { name: "Eliminar cuenta" })).toHaveAttribute("data-variant", "danger");
    expect(screen.getByRole("button", { name: "Eliminar cuenta" })).toHaveAttribute("data-size", "lg");
  });

  it("should forward its ref to the native button", () => {
    let element: HTMLButtonElement | null = null;
    render(<ArcButton ref={(node) => { element = node; }}>Continuar</ArcButton>);

    expect(element).toBe(screen.getByRole("button", { name: "Continuar" }));
  });
});
