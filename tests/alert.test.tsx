import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Alert, AlertDescription, AlertTitle } from "beez-ui";

describe("Alert", () => {
  it("should interrupt only for danger and announce other tones politely", () => {
    // Arrange
    render(
      <>
        <Alert tone="success"><AlertTitle>Pago acreditado</AlertTitle></Alert>
        <Alert tone="danger"><AlertTitle>El pago falló</AlertTitle></Alert>
        <Alert><AlertTitle>Revisá los datos</AlertTitle></Alert>
      </>,
    );

    // Act
    const alerts = screen.getAllByRole("alert");

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent("Pago acreditado");
    expect(alerts.map((alert) => alert.textContent)).toEqual(["El pago falló", "Revisá los datos"]);
  });

  it("should draw the tone icon unless it is hidden", () => {
    // Arrange
    const { container, rerender } = render(<Alert tone="warning"><AlertTitle>Cupo casi completo</AlertTitle></Alert>);
    expect(container.querySelector("[data-slot=alert-icon] svg")).not.toBeNull();

    // Act
    rerender(<Alert tone="warning" icon={false}><AlertTitle>Cupo casi completo</AlertTitle></Alert>);

    // Assert
    expect(container.querySelector("[data-slot=alert-icon]")).toBeNull();
  });

  it("should collapse an uncontrolled alert before reporting the dismissal", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Alert tone="info" onDismiss={onDismiss}>
        <AlertTitle>Nueva versión</AlertTitle>
        <AlertDescription>Recargá para verla.</AlertDescription>
      </Alert>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Descartar aviso" }));

    // Assert
    await waitFor(() => expect(screen.queryByText("Nueva versión")).not.toBeInTheDocument());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("should let a controlled alert decide when it closes", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    function ControlledAlert() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Alert open={open} onDismiss={onDismiss} dismissLabel="Cerrar aviso de pago">
            <AlertTitle>Pago pendiente</AlertTitle>
          </Alert>
          <button type="button" onClick={() => setOpen(false)}>Ocultar</button>
        </>
      );
    }
    render(<ControlledAlert />);

    // Act
    await user.click(screen.getByRole("button", { name: "Cerrar aviso de pago" }));

    // Assert
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Pago pendiente")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ocultar" }));
    await waitFor(() => expect(screen.queryByText("Pago pendiente")).not.toBeInTheDocument());
  });
});
