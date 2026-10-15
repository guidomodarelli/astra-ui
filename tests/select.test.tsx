/** Covers the interaction contract of the Arc-styled Select composition. */
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "beez-ui";

/**
 * Renders a currency select.
 * @param props - Initial value, the disabled state, and the change callback.
 * @returns The labelled trigger and its options.
 */
function CurrencySelect({
  defaultValue,
  disabled,
  onValueChange,
}: {
  defaultValue?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onValueChange?.(nextValue);
      }}
    >
      <SelectTrigger aria-label="Moneda">
        <SelectValue placeholder="Elegí una moneda" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ars">Pesos</SelectItem>
        <SelectItem value="usd">Dólares</SelectItem>
        <SelectItem value="eur" disabled>
          Euros
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

describe("Select", () => {
  it("should show the placeholder until a value is chosen", () => {
    render(<CurrencySelect />);

    const trigger = screen.getByRole("combobox", { name: "Moneda" });
    expect(trigger).toHaveTextContent("Elegí una moneda");
    expect(trigger).toHaveAttribute("data-placeholder");
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

  it("should not open while disabled", async () => {
    const user = userEvent.setup();
    render(<CurrencySelect disabled />);

    const trigger = screen.getByRole("combobox", { name: "Moneda" });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

});
