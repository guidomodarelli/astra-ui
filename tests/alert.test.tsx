import { createRef, useState } from "react";
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

  it("should keep consumer layout props and ref on the outermost element of a dismissible alert", () => {
    // Arrange
    const alertRef = createRef<HTMLDivElement>();

    // Act
    const { container } = render(
      <div className="grid">
        <Alert ref={alertRef} tone="info" className="col-span-2" style={{ marginTop: 8 }} onDismiss={() => undefined}>
          <AlertTitle>Nueva versión</AlertTitle>
        </Alert>
      </div>,
    );

    // Assert
    const layoutChild = container.firstElementChild?.firstElementChild;
    expect(layoutChild).toBe(screen.getByRole("status"));
    expect(layoutChild).toHaveClass("col-span-2");
    expect(layoutChild).toHaveStyle({ marginTop: "8px" });
    expect(alertRef.current).toBe(layoutChild);
  });

  it("should run the cleanup a consumer callback ref returns when a dismissible alert unmounts", () => {
    // Arrange
    const cleanupRef = vi.fn();
    const attachedNodes: Array<HTMLDivElement | null> = [];
    const { unmount } = render(
      <Alert
        tone="info"
        onDismiss={() => undefined}
        ref={(node) => {
          attachedNodes.push(node);
          return cleanupRef;
        }}
      >
        <AlertTitle>Nueva versión</AlertTitle>
      </Alert>,
    );
    expect(attachedNodes[0]).toBe(screen.getByRole("status"));

    // Act
    unmount();

    // Assert
    expect(cleanupRef).toHaveBeenCalledTimes(1);
    expect(attachedNodes).not.toContain(null);
  });

  it("should take a closing alert out of reach as soon as it starts leaving", () => {
    // Arrange
    const { rerender } = render(
      <Alert tone="info" open onDismiss={() => undefined}>
        <AlertTitle>Nueva versión</AlertTitle>
        <a href="/novedades">Ver novedades</a>
      </Alert>,
    );

    // Act
    rerender(
      <Alert tone="info" open={false} onDismiss={() => undefined}>
        <AlertTitle>Nueva versión</AlertTitle>
        <a href="/novedades">Ver novedades</a>
      </Alert>,
    );

    // Assert
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ver novedades" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descartar aviso" })).not.toBeInTheDocument();
    const leavingAlert = screen.queryByRole("status", { hidden: true });
    if (leavingAlert) expect(leavingAlert).toHaveAttribute("inert");
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
