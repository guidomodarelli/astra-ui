import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { MetricCard } from "@astra-kit/ui";

describe("MetricCard", () => {
  it("should render an article whose number is read once, formatted for es-AR", () => {
    // Arrange
    render(<MetricCard label="Solicitudes recibidas" value={1234} context="Últimos 30 días" />);

    // Act
    const card = screen.getByRole("article");

    // Assert
    expect(card).toHaveTextContent("Solicitudes recibidas");
    expect(card).toHaveTextContent("Últimos 30 días");
    expect(card.querySelector(".sr-only")).toHaveTextContent("1.234");
    expect(card.querySelector("[data-slot=odometer]")).toHaveAttribute("aria-hidden", "true");
  });

  it("should append the suffix to the spoken number and honour another locale", () => {
    // Arrange
    render(<MetricCard label="Entregas" value={1234} suffix=" avisos" context="Hoy" locale="en-US" />);

    // Act
    const spokenValue = screen.getByRole("article").querySelector("[data-slot=metric-card-value] .sr-only");

    // Assert
    expect(spokenValue).toHaveTextContent("1,234 avisos");
  });

  it("should tint a signed change by its direction and leave an unsigned one neutral", () => {
    // Arrange
    const { container, rerender } = render(<MetricCard label="Aprobadas" value={12} context="vs. la semana pasada" change="+20%" />);
    const change = () => container.querySelector("[data-slot=metric-card-change]");
    expect(change()).toHaveAttribute("data-trend", "up");

    // Act
    rerender(<MetricCard label="Aprobadas" value={9} context="vs. la semana pasada" change="−25%" />);

    // Assert
    expect(change()).toHaveAttribute("data-trend", "down");
    rerender(<MetricCard label="Aprobadas" value={9} context="vs. la semana pasada" change="Sin cambios" />);
    expect(change()).not.toHaveAttribute("data-trend");
  });

  it("should hide the change chip when no change is passed", () => {
    // Arrange
    const { container } = render(<MetricCard label="Rechazadas" value={3} context="Este mes" />);

    // Act
    const change = container.querySelector("[data-slot=metric-card-change]");

    // Assert
    expect(change).toBeNull();
  });

  it("should update the spoken number when the value changes", () => {
    // Arrange
    const { rerender } = render(<MetricCard label="Pendientes" value={8} context="Ahora" />);

    // Act
    rerender(<MetricCard label="Pendientes" value={12} context="Ahora" />);

    // Assert
    expect(screen.getByRole("article").querySelector("[data-slot=metric-card-value] .sr-only")).toHaveTextContent("12");
  });
});
