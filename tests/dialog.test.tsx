/** Exercises the Arc Dialog contract that jsdom can observe: names, swaps, slots, dismissal and the `alert` mode. */
import { createRef, useState, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Dialog, DialogClose, DialogContent, DialogTrigger } from "@golfo/ui";

/**
 * Renders an open dialog with the given title and description.
 * @param props - Copy of the title and the description.
 * @returns The dialog markup.
 */
function OpenDialog({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <Dialog open>
      <DialogContent title={title} description={description}>
        <p>Cuerpo</p>
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("should open from its trigger and name the dialog after the title and description props", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Abrir</Button>
        </DialogTrigger>
        <DialogContent title="Renombrar" description="Cambia también la dirección.">
          <p>Formulario</p>
        </DialogContent>
      </Dialog>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Abrir" }));

    // Assert
    expect(screen.getByRole("dialog", { name: "Renombrar", description: "Cambia también la dirección." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Renombrar" })).toBeInTheDocument();
    expect(screen.getByText("Formulario")).toBeInTheDocument();
  });

  it("should name the dialog after the new title as soon as it changes while open", () => {
    const { rerender } = render(<OpenDialog title="Paso 1" description="Primer paso." />);
    expect(screen.getByRole("dialog", { name: "Paso 1", description: "Primer paso." })).toBeInTheDocument();

    rerender(<OpenDialog title="Paso 2" description="Segundo paso." />);

    expect(screen.getByRole("dialog", { name: "Paso 2", description: "Segundo paso." })).toBeInTheDocument();
  });

  it("should leave a single copy of the title once the swap settles", async () => {
    const { rerender } = render(<OpenDialog title="Paso 1" description="Primer paso." />);
    rerender(<OpenDialog title="Paso 2" description="Primer paso." />);

    await waitFor(() => expect(screen.queryByText("Paso 1")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Paso 2" })).toBeInTheDocument();
  });

  it("should keep a rich title untouched", () => {
    render(
      <OpenDialog
        title={
          <>
            Hola <strong>Ana</strong>
          </>
        }
      />,
    );

    expect(screen.getByRole("dialog", { name: "Hola Ana" })).toBeInTheDocument();
  });

  it("should omit the description reference when there is no description", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<OpenDialog title="Datos" />);

    expect(screen.getByRole("dialog", { name: "Datos" })).not.toHaveAttribute("aria-describedby");
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("Description"));
    warn.mockRestore();
  });

  it("should keep a hidden title as the accessible name", () => {
    render(
      <Dialog open>
        <DialogContent title="Galería" hideTitle>
          <p>Fotos</p>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("dialog", { name: "Galería" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Galería" })).toBeInTheDocument();
  });

  it("should render the footer slot and the consumer class names on their parts", () => {
    render(
      <Dialog open>
        <DialogContent
          title="Datos"
          description="Revisá los datos."
          className="content-extra"
          headerClassName="header-extra"
          titleClassName="title-extra"
          descriptionClassName="description-extra"
          footerClassName="footer-extra"
          footer={<Button>Guardar</Button>}
        >
          <p>Cuerpo</p>
        </DialogContent>
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("content-extra");
    expect(screen.getByRole("heading", { name: "Datos" })).toHaveClass("title-extra");
    expect(screen.getByText("Revisá los datos.").closest("[data-slot=dialog-description]")).toHaveClass(
      "description-extra",
    );
    expect(dialog.querySelector("[data-slot=dialog-header]")).toHaveClass("header-extra");
    const footer = dialog.querySelector("[data-slot=dialog-footer]");
    expect(footer).toHaveClass("footer-extra");
    expect(footer).toContainElement(screen.getByRole("button", { name: "Guardar" }));
  });

  it("should leave out the footer when a conditional footer evaluates to false", () => {
    render(
      <Dialog open>
        <DialogContent title="Datos" footer={false}>
          <p>Cuerpo</p>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("dialog").querySelector("[data-slot=dialog-footer]")).toBeNull();
  });

  it("should close from the built-in close button, named in Spanish by default", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog defaultOpen onOpenChange={onOpenChange}>
        <DialogContent title="Datos" description="Revisá los datos.">
          <p>Cuerpo</p>
        </DialogContent>
      </Dialog>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Cerrar diálogo" }));

    // Assert
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument());
  });

  it("should name the close button with closeLabel and close from a DialogClose", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent
          title="Datos"
          closeLabel="Cerrar ficha"
          footer={
            <DialogClose asChild>
              <Button variant="secondary">Cancelar</Button>
            </DialogClose>
          }
        >
          <p>Cuerpo</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("button", { name: "Cerrar ficha" })).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Assert
    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument());
  });

  it("should reserve room for the close button only when the panel renders it", () => {
    const { rerender } = render(
      <Dialog open>
        <DialogContent title="Datos">
          <p>Cuerpo</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-close-button-placement", "content");

    rerender(
      <Dialog open>
        <DialogContent title="Datos" showCloseButton={false}>
          <p>Cuerpo</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).not.toHaveAttribute("data-close-button-placement");
    expect(screen.queryByRole("button", { name: "Cerrar diálogo" })).not.toBeInTheDocument();
  });

  it("should close when the pointer goes down outside a regular dialog", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Afuera</button>
        <Dialog defaultOpen modal={false}>
          <DialogContent title="Datos">
            <p>Cuerpo</p>
          </DialogContent>
        </Dialog>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Afuera" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument());
  });
});

describe("Dialog alert", () => {
  /**
   * A destructive confirmation in alert mode.
   * @param props - Optional handler for the destructive action.
   * @returns The alert dialog markup.
   */
  function DeleteConfirmation({ onDelete }: { onDelete?: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button">Afuera</button>
        <Dialog alert open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Eliminar evento</Button>
          </DialogTrigger>
          <DialogContent
            title="¿Eliminar el evento?"
            description="Esta acción no se puede deshacer."
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="secondary">Conservar</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button variant="danger" onClick={onDelete}>
                  Eliminar
                </Button>
              </>
            }
          />
        </Dialog>
      </>
    );
  }

  it("should render an alertdialog without a close button and focus the first DialogClose", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmation />);

    await user.click(screen.getByRole("button", { name: "Eliminar evento" }));

    const alert = screen.getByRole("alertdialog", {
      name: "¿Eliminar el evento?",
      description: "Esta acción no se puede deshacer.",
    });
    expect(alert).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar diálogo" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Conservar" })).toHaveFocus());
  });

  it("should stay open when the pointer goes down outside and close from a DialogClose or Escape", async () => {
    const user = userEvent.setup();
    render(<DeleteConfirmation />);
    await user.click(screen.getByRole("button", { name: "Eliminar evento" }));

    // A modal sets `pointer-events: none` on the page, so the press outside is dispatched where Radix listens for it.
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog", { hidden: true })).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Eliminar evento" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog", { hidden: true })).not.toBeInTheDocument());
  });

  it("should show its close button when asked to", async () => {
    const user = userEvent.setup();
    render(
      <Dialog alert defaultOpen>
        <DialogContent title="¿Salir sin guardar?" showCloseButton>
          <p>Perderás los cambios.</p>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Cerrar diálogo" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog", { hidden: true })).not.toBeInTheDocument());
  });

  it("should name the confirmation after the new title as soon as it changes while open", () => {
    const renderAlert = (title: string) => (
      <Dialog alert open>
        <DialogContent title={title} description="No se puede deshacer." />
      </Dialog>
    );
    const { rerender } = render(renderAlert("¿Eliminar el evento?"));
    expect(screen.getByRole("alertdialog", { name: "¿Eliminar el evento?" })).toBeInTheDocument();

    rerender(renderAlert("¿Eliminar la serie?"));

    expect(screen.getByRole("alertdialog", { name: "¿Eliminar la serie?" })).toBeInTheDocument();
  });
});

describe("Dialog header content and close button ref", () => {
  it("should render headerContent inside the header without changing the accessible name", () => {
    // Arrange & Act
    render(
      <Dialog open>
        <DialogContent
          title="Ronda de preguntas"
          description="Respondé antes del viernes."
          headerContent={<span data-testid="round-tags">Encuesta · Abierta</span>}
        >
          <p>Cuerpo</p>
        </DialogContent>
      </Dialog>,
    );

    // Assert
    const dialog = screen.getByRole("dialog", { name: "Ronda de preguntas" });
    const header = dialog.querySelector("[data-slot=dialog-header]");
    expect(header).toContainElement(screen.getByTestId("round-tags"));
    expect(screen.getByRole("heading", { name: "Ronda de preguntas" })).not.toContainElement(
      screen.getByTestId("round-tags"),
    );
    expect(dialog).toHaveAccessibleDescription("Respondé antes del viernes.");
  });

  it("should render the header for headerContent even when the title is hidden", () => {
    render(
      <Dialog open>
        <DialogContent title="Ronda" hideTitle headerContent={<span data-testid="round-tags">Abierta</span>}>
          <p>Cuerpo</p>
        </DialogContent>
      </Dialog>,
    );

    const dialog = screen.getByRole("dialog", { name: "Ronda" });
    expect(dialog.querySelector("[data-slot=dialog-header]")).toContainElement(screen.getByTestId("round-tags"));
  });

  it("should expose the close button through closeButtonRef so it can take the initial focus", async () => {
    // Arrange
    const closeButtonRef = createRef<HTMLButtonElement>();

    // Act
    render(
      <Dialog open>
        <DialogContent
          title="Detalle"
          closeButtonRef={closeButtonRef}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            closeButtonRef.current?.focus();
          }}
        >
          <Button>Guardar</Button>
        </DialogContent>
      </Dialog>,
    );

    // Assert
    const closeButton = screen.getByRole("button", { name: "Cerrar diálogo" });
    expect(closeButtonRef.current).toBe(closeButton);
    await waitFor(() => expect(closeButton).toHaveFocus());
  });
});
