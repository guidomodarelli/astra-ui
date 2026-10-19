import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ActionButton } from "@astra-kit/ui";

/** Short reset so the automatic return to idle is observable without fake timers. */
const SHORT_RESET_MS = 300;

/**
 * Creates an action whose promise the test settles by hand, to observe the pending state.
 * @returns The action and functions that resolve or reject its current run.
 */
function createControlledAction() {
  let resolveRun: () => void = () => {};
  let rejectRun: (error: unknown) => void = () => {};
  const onAction = vi.fn(
    () =>
      new Promise<void>((resolve, reject) => {
        resolveRun = resolve;
        rejectRun = reject;
      }),
  );
  return { onAction, resolve: () => resolveRun(), reject: (error: unknown) => rejectRun(error) };
}

describe("ActionButton", () => {
  it("should keep its label as accessible name and announce the pending and success labels while it runs", async () => {
    // Arrange
    const user = userEvent.setup();
    const action = createControlledAction();
    render(<ActionButton label="Publicar" pendingLabel="Publicando" successLabel="Publicado" onAction={action.onAction} />);
    const button = screen.getByRole("button", { name: "Publicar" });
    expect(button).toHaveAttribute("data-action-state", "idle");
    expect(screen.getByRole("status")).toHaveTextContent("");

    // Act
    await user.click(button);

    // Assert
    expect(button).toHaveAttribute("data-action-state", "pending");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Publicando");
    expect(screen.getByRole("button", { name: "Publicar" })).toBe(button);

    action.resolve();
    await waitFor(() => expect(button).toHaveAttribute("data-action-state", "success"));
    expect(screen.getByRole("status")).toHaveTextContent("Publicado");
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it("should return to idle on its own after the reset delay", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ActionButton label="Guardar" onAction={() => Promise.resolve()} resetAfterMs={SHORT_RESET_MS} />);
    const button = screen.getByRole("button", { name: "Guardar" });

    // Act
    await user.click(button);

    // Assert
    await waitFor(() => expect(button).toHaveAttribute("data-action-state", "success"));
    expect(screen.getByRole("status")).toHaveTextContent("Guardado");
    await waitFor(() => expect(button).toHaveAttribute("data-action-state", "idle"));
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("should keep the success state when resetAfterMs is 0", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<ActionButton label="Guardar" onAction={() => Promise.resolve()} resetAfterMs={0} />);
    const button = screen.getByRole("button", { name: "Guardar" });

    // Act
    await user.click(button);
    await waitFor(() => expect(button).toHaveAttribute("data-action-state", "success"));
    await new Promise((resolve) => setTimeout(resolve, SHORT_RESET_MS * 2));

    // Assert
    expect(button).toHaveAttribute("data-action-state", "success");
  });

  it("should ignore presses while the action is still running", async () => {
    // Arrange
    const user = userEvent.setup();
    const action = createControlledAction();
    render(<ActionButton label="Enviar" onAction={action.onAction} />);
    const button = screen.getByRole("button", { name: "Enviar" });

    // Act
    await user.click(button);
    await user.click(button);
    await user.keyboard("{Enter}");

    // Assert
    expect(action.onAction).toHaveBeenCalledTimes(1);
    action.resolve();
    await waitFor(() => expect(button).toHaveAttribute("data-action-state", "success"));
  });

  it("should return to idle and hand the error to onActionError when the action fails", async () => {
    // Arrange
    const user = userEvent.setup();
    const action = createControlledAction();
    const onActionError = vi.fn();
    const failure = new Error("Sin conexión");
    render(<ActionButton label="Guardar" onAction={action.onAction} onActionError={onActionError} />);
    const button = screen.getByRole("button", { name: "Guardar" });

    // Act
    await user.click(button);
    action.reject(failure);

    // Assert
    await waitFor(() => expect(button).toHaveAttribute("data-action-state", "idle"));
    expect(onActionError).toHaveBeenCalledWith(failure);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("should run again with the keyboard after a failure", async () => {
    // Arrange
    const user = userEvent.setup();
    const onAction = vi.fn().mockRejectedValueOnce(new Error("Falló")).mockResolvedValueOnce(undefined);
    render(<ActionButton label="Reintentar" onAction={onAction} onActionError={() => {}} />);
    const button = screen.getByRole("button", { name: "Reintentar" });

    // Act
    await user.click(button);
    await waitFor(() => expect(button).toHaveAttribute("data-action-state", "idle"));
    button.focus();
    await user.keyboard("{Enter}");

    // Assert
    await waitFor(() => expect(button).toHaveAttribute("data-action-state", "success"));
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it("should forward Button variant, size and disabled state", () => {
    // Arrange
    const onAction = vi.fn();

    // Act
    render(<ActionButton label="Eliminar" variant="danger" size="lg" disabled onAction={onAction} />);

    // Assert
    const button = screen.getByRole("button", { name: "Eliminar" });
    expect(button).toHaveAttribute("data-variant", "danger");
    expect(button).toHaveAttribute("data-size", "lg");
    expect(button).toBeDisabled();
  });
});
