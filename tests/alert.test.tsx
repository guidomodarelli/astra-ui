import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sparkles } from "lucide-react";

import { Alert } from "beez-ui";

describe("Alert", () => {
  it("should interrupt only for danger and announce the info default and other tones politely", () => {
    // Arrange
    render(
      <>
        <Alert tone="success" title="Pago acreditado" />
        <Alert tone="danger" title="El pago falló" />
        <Alert title="Revisá los datos">Completá los campos requeridos.</Alert>
      </>,
    );

    // Act
    const statuses = screen.getAllByRole("status");

    // Assert
    expect(screen.getByRole("alert")).toHaveTextContent("El pago falló");
    expect(statuses.map((status) => status.getAttribute("data-tone"))).toEqual(["success", "info"]);
    expect(statuses[1]).toHaveTextContent("Revisá los datosCompletá los campos requeridos.");
  });

  it("should draw the tone icon unless another icon replaces it or it is hidden", () => {
    // Arrange
    const { container, rerender } = render(<Alert tone="warning" title="Cupo casi completo" />);
    expect(container.querySelector("[data-slot=alert-icon] svg")).not.toBeNull();

    // Act
    rerender(<Alert tone="warning" title="Cupo casi completo" icon={<Sparkles data-testid="custom-icon" />} />);

    // Assert
    expect(screen.getByTestId("custom-icon").closest("[data-slot=alert-icon]")).toHaveAttribute("aria-hidden", "true");
    rerender(<Alert tone="warning" title="Cupo casi completo" icon={false} />);
    expect(container.querySelector("[data-slot=alert-icon]")).toBeNull();
  });

  it("should render its own action next to the copy", async () => {
    // Arrange
    const user = userEvent.setup();
    const onExtend = vi.fn();
    render(
      <Alert tone="warning" title="Cupo casi completo" action={<button type="button" onClick={onExtend}>Ampliar</button>}>
        Quedan dos lugares.
      </Alert>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Ampliar" }));

    // Assert
    expect(onExtend).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Ampliar" }).closest("[data-slot=alert-action]")).not.toBeNull();
  });

  it("should collapse an uncontrolled alert before reporting the dismissal", async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Alert tone="info" title="Nueva versión" onDismiss={onDismiss}>
        Recargá para verla.
      </Alert>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Descartar aviso: Nueva versión" }));

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
        <Alert ref={alertRef} title="Nueva versión" className="col-span-2" style={{ marginTop: 8 }} onDismiss={() => undefined} />
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
        title="Nueva versión"
        onDismiss={() => undefined}
        ref={(node) => {
          attachedNodes.push(node);
          return cleanupRef;
        }}
      />,
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
      <Alert title="Nueva versión" open onDismiss={() => undefined}>
        <a href="/novedades">Ver novedades</a>
      </Alert>,
    );

    // Act
    rerender(
      <Alert title="Nueva versión" open={false} onDismiss={() => undefined}>
        <a href="/novedades">Ver novedades</a>
      </Alert>,
    );

    // Assert
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ver novedades" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Descartar aviso/ })).not.toBeInTheDocument();
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
          <Alert open={open} title="Pago pendiente" onDismiss={onDismiss} dismissLabel="Cerrar aviso de pago" />
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

  it("should keep only the current title readable after it changes", () => {
    // Arrange
    const { rerender } = render(<Alert tone="info" title="Subiendo archivo" />);

    // Act
    rerender(<Alert tone="success" title="Archivo subido" />);

    // Assert
    expect(screen.getByText("Archivo subido")).not.toHaveAttribute("aria-hidden");
    const outgoing = screen.queryByText("Subiendo archivo");
    if (outgoing) expect(outgoing).toHaveAttribute("aria-hidden", "true");
  });
});
