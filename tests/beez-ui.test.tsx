import { describe, it, expect, vi } from "vitest";
/** Verifies the distributed UI package through its public consumer contract. */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Avatar, Checkbox } from "beez-ui";



describe("beez-ui consumer contract", () => {
  it("should prevent actions when disabled", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Guardar</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("should fall back to the initials when the avatar photo fails and retry when its source changes", () => {
    const { rerender } = render(<Avatar name="Gonzalo Herrera" src="/first.png" />);
    const findImage = () => screen.getByRole("img", { name: "Gonzalo Herrera" }).querySelector("img")!;
    fireEvent.error(findImage());
    expect(screen.getByText("GH")).toBeInTheDocument();
    rerender(<Avatar name="Gonzalo Herrera" src="/second.png" />);
    fireEvent.load(findImage());
    expect(screen.queryByText("GH")).not.toBeInTheDocument();
    expect(findImage().src).toBe(new URL("/second.png", window.location.href).href);
  });

  it("should preserve checkbox interaction", async () => {
    render(<Checkbox aria-label="Aceptar" />);
    const checkbox = screen.getByRole("checkbox", { name: "Aceptar" });
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("should let the photo replace a custom fallback when the image loads", () => {
    render(<Avatar name="Gonzalo Herrera" src="/profile.png" fallback="G" />);
    expect(screen.getByText("G")).toBeInTheDocument();
    fireEvent.load(screen.getByRole("img", { name: "Gonzalo Herrera" }).querySelector("img")!);
    expect(screen.queryByText("G")).not.toBeInTheDocument();
  });
});
