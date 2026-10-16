/** Verifies Arc's Switch, Checkbox and RadioGroup through the public barrel, as a consumer would use them. */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { Checkbox, RadioGroup, Switch } from "beez-ui";

describe("Switch", () => {
  it("should name the switch with its inline label and toggle when the label is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Avisos por correo" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole("switch", { name: "Avisos por correo" });

    // Act
    await user.click(screen.getByText("Avisos por correo"));

    // Assert
    expect(toggle).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("should keep an external label as the name of the bare switch", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <>
        <Switch id="compact-mode" defaultChecked />
        <label htmlFor="compact-mode">Modo compacto</label>
      </>,
    );
    const toggle = screen.getByRole("switch", { name: "Modo compacto" });

    // Act
    await user.click(screen.getByText("Modo compacto"));

    // Assert
    expect(toggle).not.toBeChecked();
  });

  it("should follow a controlled value and toggle from the keyboard", async () => {
    // Arrange
    const user = userEvent.setup();
    function ControlledSwitch() {
      const [isActive, setIsActive] = useState(false);
      return (
        <>
          <Switch aria-label="Activo" checked={isActive} onCheckedChange={setIsActive} />
          <output aria-label="Estado">{isActive ? "Activo" : "Inactivo"}</output>
        </>
      );
    }
    render(<ControlledSwitch />);
    const toggle = screen.getByRole("switch", { name: "Activo" });

    // Act
    toggle.focus();
    await user.keyboard(" ");

    // Assert
    expect(toggle).toBeChecked();
    expect(screen.getByLabelText("Estado")).toHaveTextContent("Activo");
  });

  it("should ignore presses while disabled", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Sincronizar" disabled onCheckedChange={onCheckedChange} />);

    // Act
    await user.click(screen.getByRole("switch", { name: "Sincronizar" }));

    // Assert
    expect(screen.getByRole("switch", { name: "Sincronizar" })).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe("Checkbox", () => {
  it("should tie its label and description to the control", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <Checkbox
        label="Recibir novedades"
        description="Un correo por semana como máximo."
        aria-describedby="external-hint"
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Recibir novedades" });

    // Act
    await user.click(screen.getByText("Recibir novedades"));

    // Assert
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAccessibleDescription(/Un correo por semana como máximo\./);
    expect(checkbox.getAttribute("aria-describedby")?.split(" ")[0]).toBe("external-hint");
  });

  it("should keep the caller id and an external label on the bare control", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <>
        <Checkbox id="ends-on-another-day" onCheckedChange={onCheckedChange} />
        <label htmlFor="ends-on-another-day">Termina otro día</label>
      </>,
    );

    // Act
    await user.click(screen.getByText("Termina otro día"));

    // Assert
    expect(screen.getByRole("checkbox", { name: "Termina otro día" })).toHaveAttribute("id", "ends-on-another-day");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("should report the indeterminate state and leave it when pressed", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Checkbox aria-label="Seleccionar todo" defaultChecked="indeterminate" />);
    const checkbox = screen.getByRole("checkbox", { name: "Seleccionar todo" });
    expect(checkbox).toHaveAttribute("aria-checked", "mixed");

    // Act
    await user.click(checkbox);

    // Assert
    expect(checkbox).toBeChecked();
  });

  it("should submit its value with the form only while checked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <form aria-label="Preferencias">
        <Checkbox name="terms" value="accepted" label="Aceptar condiciones" />
      </form>,
    );
    const form = screen.getByRole("form", { name: "Preferencias" }) as HTMLFormElement;
    expect(new FormData(form).get("terms")).toBeNull();

    // Act
    await user.click(screen.getByRole("checkbox", { name: "Aceptar condiciones" }));

    // Assert
    expect(new FormData(form).get("terms")).toBe("accepted");
  });
});

describe("RadioGroup", () => {
  /** Billing options laid out as Arc option rows. */
  const BILLING_OPTIONS = [
    { value: "monthly", label: "Mensual", description: "Se renueva cada mes." },
    { value: "yearly", label: "Anual", description: "Dos meses sin cargo." },
  ];

  it("should name the group by its legend and each option row by its label and helper copy", () => {
    // Arrange
    render(<RadioGroup label="Facturación" options={BILLING_OPTIONS} defaultValue="monthly" />);

    // Act
    const group = screen.getByRole("radiogroup", { name: "Facturación" });

    // Assert
    expect(group.tagName).toBe("FIELDSET");
    expect(screen.getByText("Facturación").tagName).toBe("LEGEND");
    expect(screen.getByRole("radio", { name: "Anual" })).toHaveAccessibleDescription("Dos meses sin cargo.");
    expect(screen.getByRole("radio", { name: "Mensual" })).toBeChecked();
  });

  it("should choose and focus an option from its row copy", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup label="Facturación" options={BILLING_OPTIONS} defaultValue="monthly" onValueChange={onValueChange} />);

    // Act
    await user.click(screen.getByText("Dos meses sin cargo."));

    // Assert
    expect(onValueChange).toHaveBeenCalledWith("yearly");
    expect(screen.getByRole("radio", { name: "Anual" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Anual" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Mensual" })).not.toBeChecked();
  });

  it("should follow a controlled value", async () => {
    // Arrange
    const user = userEvent.setup();
    function ControlledGroup() {
      const [frequency, setFrequency] = useState("weekly");
      return (
        <>
          <RadioGroup
            label="Frecuencia"
            value={frequency}
            onValueChange={setFrequency}
            options={[
              { value: "weekly", label: "Semanal" },
              { value: "monthly", label: "Mensual" },
            ]}
          />
          <output aria-label="Elegida">{frequency}</output>
        </>
      );
    }
    render(<ControlledGroup />);

    // Act
    await user.click(screen.getByRole("radio", { name: "Mensual" }));

    // Assert
    expect(screen.getByRole("radio", { name: "Mensual" })).toBeChecked();
    expect(screen.getByLabelText("Elegida")).toHaveTextContent("monthly");
  });

  it("should not choose a disabled option", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <RadioGroup
        label="Plan"
        defaultValue="free"
        options={[
          { value: "free", label: "Gratis" },
          { value: "pro", label: "Pro", disabled: true },
        ]}
      />,
    );

    // Act
    await user.click(screen.getByText("Pro"));

    // Assert
    expect(screen.getByRole("radio", { name: "Pro" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Gratis" })).toBeChecked();
  });

  it("should submit the chosen value under its name and keep the consumer class on the group", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <form aria-label="Preferencias">
        <RadioGroup label="Facturación" name="billing" options={BILLING_OPTIONS} defaultValue="monthly" className="billing-group" />
      </form>,
    );
    const form = screen.getByRole("form", { name: "Preferencias" }) as HTMLFormElement;

    // Act
    await user.click(screen.getByRole("radio", { name: "Anual" }));

    // Assert
    expect(new FormData(form).get("billing")).toBe("yearly");
    expect(screen.getByRole("radiogroup", { name: "Facturación" })).toHaveClass("billing-group");
  });
});

describe("form reset", () => {
  it("should restore each uncontrolled control to its default when its form is reset", async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <form aria-label="Preferencias">
        <Switch name="alerts" label="Avisos por correo" defaultChecked />
        <Checkbox name="terms" label="Aceptar condiciones" />
        <RadioGroup
          name="billing"
          label="Facturación"
          defaultValue="monthly"
          options={[
            { value: "monthly", label: "Mensual" },
            { value: "yearly", label: "Anual" },
          ]}
        />
        <button type="reset">Restablecer</button>
      </form>,
    );
    const toggle = screen.getByRole("switch", { name: "Avisos por correo" });
    const checkbox = screen.getByRole("checkbox", { name: "Aceptar condiciones" });
    const monthly = screen.getByRole("radio", { name: "Mensual" });
    const yearly = screen.getByRole("radio", { name: "Anual" });
    await user.click(toggle);
    await user.click(checkbox);
    await user.click(yearly);
    expect(toggle).toHaveAttribute("data-state", "unchecked");
    expect(checkbox).toHaveAttribute("data-state", "checked");
    expect(yearly).toHaveAttribute("data-state", "checked");

    // Act
    await user.click(screen.getByRole("button", { name: "Restablecer" }));

    // Assert
    expect(toggle).toHaveAttribute("data-state", "checked");
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(checkbox).toHaveAttribute("data-state", "unchecked");
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    expect(monthly).toHaveAttribute("data-state", "checked");
    expect(monthly).toHaveAttribute("aria-checked", "true");
    expect(yearly).toHaveAttribute("aria-checked", "false");
  });

  it("should restore each uncontrolled control to its default after a successful React form action", async () => {
    // Arrange
    const user = userEvent.setup();
    const submittedValues: Array<Record<string, FormDataEntryValue>> = [];
    render(
      <form
        aria-label="Preferencias"
        action={async (formData: FormData) => {
          submittedValues.push(Object.fromEntries(formData));
        }}
      >
        <Switch name="alerts" value="on" label="Avisos por correo" defaultChecked />
        <Checkbox name="terms" value="accepted" label="Aceptar condiciones" />
        <RadioGroup
          name="billing"
          label="Facturación"
          defaultValue="monthly"
          options={[
            { value: "monthly", label: "Mensual" },
            { value: "yearly", label: "Anual" },
          ]}
        />
        <button type="submit">Guardar</button>
      </form>,
    );
    const toggle = screen.getByRole("switch", { name: "Avisos por correo" });
    const checkbox = screen.getByRole("checkbox", { name: "Aceptar condiciones" });
    await user.click(toggle);
    await user.click(checkbox);
    await user.click(screen.getByRole("radio", { name: "Anual" }));

    // Act
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    // Assert
    await waitFor(() => expect(toggle).toHaveAttribute("data-state", "checked"));
    expect(submittedValues).toEqual([{ terms: "accepted", billing: "yearly" }]);
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "Mensual" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Anual" })).toHaveAttribute("data-state", "unchecked");
  });
});
