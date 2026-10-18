/** Covers the interaction contract of Arc's closed Select and beez-ui's extensions. */
import { createRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select, type SelectProps } from "beez-ui";

/** Options of the currency select, with a disabled one. */
const CURRENCIES = [
  { value: "ars", label: "Pesos" },
  { value: "usd", label: "Dólares" },
  { value: "eur", label: "Euros", disabled: true },
];

/**
 * Renders a controlled currency select.
 * @param props - Select props that override the defaults of the harness.
 * @returns The labelled select.
 */
function CurrencySelect({ defaultValue, onValueChange, ...props }: Partial<SelectProps> & { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Select
      label="Moneda"
      options={CURRENCIES}
      {...props}
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onValueChange?.(nextValue);
      }}
    />
  );
}

describe("Select", () => {
  it("should name the trigger with its visible label and show the Spanish placeholder until a value is chosen", () => {
    render(<CurrencySelect />);

    const trigger = screen.getByRole("combobox", { name: "Moneda" });
    expect(screen.getByText("Moneda").tagName).toBe("LABEL");
    expect(trigger).toHaveTextContent("Seleccioná una opción");
    expect(trigger).toHaveAttribute("data-placeholder");
  });

  it("should show a custom placeholder", () => {
    render(<CurrencySelect placeholder="Elegí una moneda" />);

    expect(screen.getByRole("combobox", { name: "Moneda" })).toHaveTextContent("Elegí una moneda");
  });

  it("should choose an option from the keyboard and show it in the trigger", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CurrencySelect defaultValue="ars" onValueChange={onValueChange} />);

    const trigger = screen.getByRole("combobox", { name: "Moneda" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Euros" })).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledWith("usd");
    expect(trigger).toHaveTextContent("Dólares");
    expect(trigger).not.toHaveAttribute("data-placeholder");
  });

  it("should keep its own value when uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Select label="Frecuencia" defaultValue="monthly" options={[{ value: "weekly", label: "Semanal" }, { value: "monthly", label: "Mensual" }]} />);

    const trigger = screen.getByRole("combobox", { name: "Frecuencia" });
    expect(trigger).toHaveTextContent("Mensual");
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Semanal" }));
    expect(trigger).toHaveTextContent("Semanal");
  });

  it("should not open while disabled", async () => {
    const user = userEvent.setup();
    render(<CurrencySelect disabled />);

    const trigger = screen.getByRole("combobox", { name: "Moneda" });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should describe the trigger with its helper copy and mark it invalid with an error", () => {
    const { rerender } = render(<CurrencySelect description="Se usa para los cobros." />);

    const trigger = screen.getByRole("combobox", { name: "Moneda" });
    expect(trigger).toHaveAccessibleDescription("Se usa para los cobros.");
    expect(trigger).not.toHaveAttribute("aria-invalid");

    rerender(<CurrencySelect description="Se usa para los cobros." error="Elegí una moneda para continuar." />);
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Elegí una moneda para continuar.");
    expect(trigger).toHaveAccessibleDescription("Se usa para los cobros. Elegí una moneda para continuar.");
  });

  it("should accept aria-invalid on the trigger without an error message", () => {
    render(<CurrencySelect aria-invalid />);

    expect(screen.getByRole("combobox", { name: "Moneda" })).toHaveAttribute("aria-invalid", "true");
  });

  it("should keep a hidden label as the accessible name and give its id to the trigger for an external label", () => {
    render(
      <>
        <label htmlFor="currency">Moneda de la factura</label>
        <CurrencySelect id="currency" hideLabel />
      </>,
    );

    const trigger = screen.getByRole("combobox", { name: /Moneda de la factura/ });
    expect(trigger).toHaveAttribute("id", "currency");
    expect(trigger).toHaveAccessibleName("Moneda de la factura Moneda");
  });

  it("should place className on the field and triggerClassName on the trigger, and forward its ref to the trigger", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<CurrencySelect className="currency-field" triggerClassName="currency-trigger" ref={ref} />);

    const trigger = screen.getByRole("combobox", { name: "Moneda" });
    expect(trigger).toHaveClass("currency-trigger");
    expect(trigger.closest(".currency-field")).not.toBeNull();
    expect(ref.current).toBe(trigger);
  });

  it("should submit its value with a form through name", async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="Pago">
        <CurrencySelect name="currency" defaultValue="ars" />
      </form>,
    );

    await user.click(screen.getByRole("combobox", { name: "Moneda" }));
    await user.click(screen.getByRole("option", { name: "Dólares" }));
    expect(new FormData(screen.getByRole("form", { name: "Pago" }) as HTMLFormElement).get("currency")).toBe("usd");
  });

  it("should open and close from a controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<CurrencySelect open onOpenChange={onOpenChange} />);

    expect(await screen.findByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<CurrencySelect open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should play the entrance of its option list on every opening, not only the first", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<CurrencySelect defaultValue="ars" />);
    const trigger = screen.getByRole("combobox", { name: "Moneda" });

    // Act
    await user.click(trigger);
    const firstList = await screen.findByRole("listbox");
    const firstOpacity = firstList.style.opacity;
    // The first entrance settles before closing, so the reopening cannot resume an interrupted one.
    await vi.waitFor(() => expect(firstList).not.toHaveAttribute("data-motion-entering"));
    await user.keyboard("{Escape}");
    await vi.waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    await user.click(trigger);
    const reopenedOpacity = (await screen.findByRole("listbox")).style.opacity;

    // Assert: each opening is still fading in instead of jumping to its resting place.
    expect(Number.parseFloat(firstOpacity)).toBeLessThan(1);
    expect(Number.parseFloat(reopenedOpacity)).toBeLessThan(1);
    expect(trigger).toHaveTextContent("Pesos");
  });
});

describe("Select described by external copy", () => {
  it("should combine an external aria-describedby with its own helper and error rows", () => {
    // Arrange & Act
    render(
      <>
        <p id="currency-hint">Podés cambiarla después.</p>
        <CurrencySelect
          aria-describedby="currency-hint"
          description="Se usa para los cobros."
          error="Elegí una moneda para continuar."
        />
      </>,
    );

    // Assert
    expect(screen.getByRole("combobox", { name: "Moneda" })).toHaveAccessibleDescription(
      "Podés cambiarla después. Se usa para los cobros. Elegí una moneda para continuar.",
    );
  });

  it("should accept readonly options declared with as const", async () => {
    // Arrange
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const plans = [
      { value: "mensual", label: "Mensual" },
      { value: "anual", label: "Anual" },
    ] as const;
    render(<Select label="Plan" options={plans} onValueChange={onValueChange} />);

    // Act
    await user.click(screen.getByRole("combobox", { name: "Plan" }));
    await user.click(await screen.findByRole("option", { name: "Anual" }));

    // Assert
    expect(onValueChange).toHaveBeenCalledWith("anual");
  });
});
