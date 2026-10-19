import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UsageMeter } from "@astra-kit/ui";

const SEGMENTS = [
  { id: "codes", label: "Códigos", value: 120 },
  { id: "notices", label: "Avisos", value: 30 },
];

describe("UsageMeter", () => {
  it("should name the group by its label and describe the bar in Spanish", () => {
    // Arrange
    render(<UsageMeter label="Envíos de hoy" segments={SEGMENTS} limit={200} decimals={0} />);

    // Act
    const meter = screen.getByRole("group", { name: "Envíos de hoy" });

    // Assert
    expect(within(meter).getByRole("img")).toHaveAccessibleName(
      "Envíos de hoy: 150 de 200 usados. Códigos 120, Avisos 30. 50 libres.",
    );
    expect(meter).toHaveTextContent("150 de 200 usados");
    expect(meter).toHaveAttribute("data-status", "ok");
    expect(meter.querySelector("[data-slot=usage-meter-status]")).toHaveTextContent("50 libres");
  });

  it("should warn when usage reaches the warning share and flag the overage past the limit", () => {
    // Arrange
    const { rerender } = render(<UsageMeter label="Envíos de hoy" segments={[{ id: "codes", label: "Códigos", value: 185 }]} limit={200} decimals={0} />);
    const meter = screen.getByRole("group", { name: "Envíos de hoy" });
    expect(meter).toHaveAttribute("data-status", "near");
    expect(meter.querySelector("[data-slot=usage-meter-status]")).toHaveTextContent("Casi lleno");

    // Act
    rerender(<UsageMeter label="Envíos de hoy" segments={[{ id: "codes", label: "Códigos", value: 230 }]} limit={200} decimals={0} />);

    // Assert
    expect(meter).toHaveAttribute("data-status", "over");
    expect(meter.querySelector("[data-slot=usage-meter-status]")).toHaveTextContent("30 de más");
    expect(screen.getByRole("button", { name: "Excedente, 30" })).toBeInTheDocument();
    expect(screen.getByText("Supera el límite del plan por 30.")).toBeInTheDocument();
  });

  it("should format amounts with the unit, decimals and es-AR separators", () => {
    // Arrange
    render(
      <UsageMeter
        label="Almacenamiento"
        unit="GB"
        limit={50}
        segments={[
          { id: "files", label: "Archivos", value: 21.4 },
          { id: "media", label: "Multimedia", value: 14.2 },
        ]}
      />,
    );

    // Act
    const legend = screen.getByRole("group", { name: "Almacenamiento por categoría" });

    // Assert
    expect(within(legend).getByRole("button", { name: "Archivos, 21,4 GB" })).toBeInTheDocument();
    expect(within(legend).getByRole("button", { name: "Libre, 14,4 GB" })).toBeInTheDocument();
    expect(screen.getByText("35,6 GB de 50 GB usados")).toBeInTheDocument();
  });

  it("should move a single tab stop through the legend with the arrows, Home and End", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UsageMeter label="Envíos de hoy" segments={SEGMENTS} limit={200} decimals={0} />);
    const items = within(screen.getByRole("group", { name: "Envíos de hoy por categoría" })).getAllByRole("button");
    expect(items.map((item) => item.tabIndex)).toEqual([0, -1, -1]);

    // Act
    await user.tab();
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(items[1]).toHaveFocus();
    expect(items.map((item) => item.tabIndex)).toEqual([-1, 0, -1]);
    await user.keyboard("{End}");
    expect(items[2]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(items[0]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(items[2]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();
  });

  it("should pin a category with Enter, describe it in the caption and clear it with Escape", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UsageMeter label="Envíos de hoy" segments={SEGMENTS} limit={200} decimals={0} />);
    const codes = screen.getByRole("button", { name: "Códigos, 120" });

    // Act
    await user.tab();
    await user.keyboard("{Enter}");

    // Assert
    expect(codes).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("en Códigos · 60 % del plan")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(codes).toHaveAttribute("aria-pressed", "false");
  });

  it("should use the copy passed through messages, freeLabel and overLabel", () => {
    // Arrange
    render(
      <UsageMeter
        label="Daily codes"
        segments={SEGMENTS}
        limit={200}
        decimals={0}
        freeLabel="Remaining"
        overLabel="Over"
        messages={{
          usedCaption: ({ limit }) => `of ${limit} used`,
          freeBadge: ({ free }) => `${free} left`,
          legendLabel: ({ label }) => `${label} breakdown`,
          barSummary: ({ total, limit }) => `${total} of ${limit}`,
        }}
      />,
    );

    // Act
    const meter = screen.getByRole("group", { name: "Daily codes" });

    // Assert
    expect(meter).toHaveTextContent("of 200 used");
    expect(meter.querySelector("[data-slot=usage-meter-status]")).toHaveTextContent("50 left");
    expect(within(meter).getByRole("img")).toHaveAccessibleName("150 of 200");
    expect(screen.getByRole("group", { name: "Daily codes breakdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remaining, 50" })).toBeInTheDocument();
  });
});
