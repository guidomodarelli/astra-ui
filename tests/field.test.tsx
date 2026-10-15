import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { Input, Textarea } from "beez-ui";

/** A bio field whose description counts the characters left, as a consumer would derive it from state. */
function BioField() {
  const [bio, setBio] = useState("");
  return (
    <Textarea
      label="Biografía"
      value={bio}
      onChange={(event) => setBio(event.target.value)}
      description={`Quedan ${10 - bio.length} caracteres`}
      error={bio.length > 10 ? "La biografía es demasiado larga" : undefined}
    />
  );
}

describe("Input", () => {
  it("should tie the label, description and error to the control", () => {
    // Arrange
    render(
      <Input
        label="Correo"
        type="email"
        defaultValue="hola"
        description="Solo lo usamos para los recibos."
        error="Ingresá un correo válido"
        aria-describedby="external-hint"
      />,
    );

    // Act
    const control = screen.getByLabelText("Correo");

    // Assert
    expect(control).toHaveAttribute("type", "email");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription(/Solo lo usamos para los recibos\. Ingresá un correo válido/);
    expect(control.getAttribute("aria-describedby")?.split(" ")[0]).toBe("external-hint");
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá un correo válido");
  });

  it("should keep the caller id and stay valid without an error", () => {
    // Arrange
    render(<Input id="tribe-name" label="Nombre de la tribu" />);

    // Act
    const control = screen.getByLabelText("Nombre de la tribu");

    // Assert
    expect(control).toHaveAttribute("id", "tribe-name");
    expect(control).not.toHaveAttribute("aria-invalid");
    expect(control).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should keep the typed value and the focus when an error appears", async () => {
    // Arrange
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <label htmlFor="slug">Dirección</label>
        <Input id="slug" error={undefined} />
      </>,
    );
    const control = screen.getByLabelText("Dirección");
    await user.type(control, "mi tribu");

    // Act
    rerender(
      <>
        <label htmlFor="slug">Dirección</label>
        <Input id="slug" error="Usá solo letras, números y guiones" />
      </>,
    );

    // Assert
    expect(screen.getByLabelText("Dirección")).toBe(control);
    expect(control).toHaveValue("mi tribu");
    expect(control).toHaveFocus();
    expect(control).toHaveAccessibleDescription(/Usá solo letras, números y guiones/);
  });

  it("should render the bare control when it has no field copy", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <>
        <label htmlFor="search">Buscar</label>
        <Input id="search" aria-invalid="true" />
      </>,
    );

    // Act
    const control = screen.getByLabelText("Buscar");
    await user.type(control, "arc");

    // Assert
    expect(control).toHaveValue("arc");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control.closest("[data-slot=field]")).toBeNull();
  });
});

describe("Textarea", () => {
  it("should update the count and announce the error as the person types", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<BioField />);
    const control = screen.getByLabelText("Biografía");

    // Act
    await user.type(control, "Hola");

    // Assert
    expect(control).toHaveAccessibleDescription("Quedan 6 caracteres");
    expect(control).not.toHaveAttribute("aria-invalid");

    // Act
    await user.type(control, " a todos");

    // Assert
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("La biografía es demasiado larga");
  });

  it("should render the bare control when it has no field copy", () => {
    // Arrange
    render(<Textarea aria-label="Comentario" rows={3} />);

    // Act
    const control = screen.getByRole("textbox", { name: "Comentario" });

    // Assert
    expect(control).toHaveAttribute("rows", "3");
    expect(control.closest("[data-slot=field]")).toBeNull();
  });
});
