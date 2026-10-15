/** Exercises the Arc Dialog and AlertDialog contracts that jsdom can observe: names, swaps, slots and dismissal. */
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "beez-ui";

/**
 * Renders an open dialog with the given title and description.
 * @param title - Copy of the title.
 * @param description - Copy of the description.
 * @returns The dialog markup.
 */
function OpenDialog({ title, description }: { title: string; description: string }) {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
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

  it("should render an asChild title as the consumer's own element", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle asChild>
            <h3>Ficha del evento</h3>
          </DialogTitle>
          <DialogDescription>Detalle completo.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Ficha del evento" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Ficha del evento" })).toBeInTheDocument();
  });

  it("should keep the title of rich children untouched", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>
            Hola <strong>Ana</strong>
          </DialogTitle>
          <DialogDescription>Bienvenida.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole("dialog", { name: "Hola Ana" })).toBeInTheDocument();
  });

  it("should close from the panel close button and from the footer close button", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Datos</DialogTitle>
          <DialogDescription>Revisá los datos.</DialogDescription>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>,
    );

    const closeButtons = screen.getAllByRole("button", { name: "Cerrar" });
    expect(closeButtons).toHaveLength(2);
    await user.click(closeButtons[0]!);

    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument());
  });

  it("should reserve room for the close button only when the panel renders it", () => {
    const { rerender } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Datos</DialogTitle>
          <DialogDescription>Revisá los datos.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-close-button-placement", "content");

    rerender(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Datos</DialogTitle>
          <DialogDescription>Revisá los datos.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog")).not.toHaveAttribute("data-close-button-placement");
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  });
});

describe("AlertDialog", () => {
  it("should name the confirmation after the new title as soon as it changes while open", () => {
    const renderAlert = (title: string) => (
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>No se puede deshacer.</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    );
    const { rerender } = render(renderAlert("¿Eliminar el evento?"));
    expect(screen.getByRole("alertdialog", { name: "¿Eliminar el evento?" })).toBeInTheDocument();

    rerender(renderAlert("¿Eliminar la serie?"));

    expect(screen.getByRole("alertdialog", { name: "¿Eliminar la serie?" })).toBeInTheDocument();
  });
});
