/** Exercises Motion presence with real nested primitives, including hidden select portals. */
import { expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  Select,
} from "beez-ui";

it("should remove a closing dialog even when it contains an unopened select", async () => {
  const user = userEvent.setup();
  render(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir formulario</Button>
      </DialogTrigger>
      <DialogContent title="Datos" description="Elegí una opción.">
        <Select label="Categoría" placeholder="Seleccionar" options={[{ value: "one", label: "Primera" }]} />
        <DialogClose asChild>
          <Button>Cerrar formulario</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>,
  );
  await user.click(screen.getByRole("button", { name: "Abrir formulario" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Cerrar formulario" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { hidden: true }),
    ).not.toBeInTheDocument(),
  );
});
