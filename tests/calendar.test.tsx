import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { Calendar } from "beez-ui";

/** Today pinned through react-day-picker's `today` prop, so the tests never depend on the real clock. */
const TODAY = new Date(2026, 8, 10);

/** Accessible name of the Today button; react-day-picker names today's day "Hoy, jueves, …", which must not match. */
const TODAY_BUTTON_NAME = /^Hoy$/;

/** A single-date calendar that owns its selection, as a consumer form would. */
function SingleDateCalendar({ defaultMonth, onSelect }: { defaultMonth: Date; onSelect?: (date: Date | undefined) => void }) {
  const [selected, setSelected] = useState<Date>();
  return (
    <Calendar
      mode="single"
      showToday
      today={TODAY}
      defaultMonth={defaultMonth}
      selected={selected}
      onSelect={(date) => {
        setSelected(date);
        onSelect?.(date);
      }}
    />
  );
}

describe("Calendar", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should bring today's month into view and select today from the Today button", async () => {
    // Arrange
    const onSelect = vi.fn();
    render(<SingleDateCalendar defaultMonth={new Date(2026, 0, 1)} onSelect={onSelect} />);
    expect(screen.getByText("enero 2026")).toBeInTheDocument();

    // Act
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    expect(screen.getByText("septiembre 2026")).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(TODAY);
    expect(screen.getByRole("button", { name: TODAY_BUTTON_NAME })).toHaveAttribute("aria-disabled", "true");
  });

  it("should hand onSelect the modifiers DayPicker gives today, including custom ones", async () => {
    // Arrange
    const onSelect = vi.fn();
    render(
      <Calendar
        mode="single"
        showToday
        today={TODAY}
        defaultMonth={new Date(2026, 0, 1)}
        modifiers={{ booked: TODAY }}
        onSelect={onSelect}
      />,
    );

    // Act
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    const [selectedDate, triggerDate, modifiers] = onSelect.mock.calls[0];
    expect(selectedDate).toEqual(TODAY);
    expect(triggerDate).toEqual(TODAY);
    expect(modifiers).toMatchObject({ today: true, booked: true, disabled: false });
  });

  it("should select today in the calendar time zone rather than the viewer's", async () => {
    // Arrange: 20:00 UTC on September 10 is already September 11 in Kiritimati (UTC+14).
    vi.useFakeTimers({ toFake: ["Date"], now: new Date(Date.UTC(2026, 8, 10, 20)) });
    const onSelect = vi.fn();
    render(<Calendar mode="single" showToday timeZone="Pacific/Kiritimati" defaultMonth={TODAY} onSelect={onSelect} />);

    // Act
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    const selectedDate: Date = onSelect.mock.calls[0][0];
    expect([selectedDate.getMonth(), selectedDate.getDate()]).toEqual([8, 11]);
    expect(screen.getByRole("button", { name: /^Hoy, viernes, 11 de septiembre/i })).toHaveAttribute("data-today", "true");
  });

  it("should hand onSelect the live click event after navigating to today's month", async () => {
    // Arrange
    const currentTargets: (EventTarget | null)[] = [];
    render(
      <Calendar
        mode="single"
        showToday
        today={TODAY}
        defaultMonth={new Date(2026, 0, 1)}
        onSelect={(_selected, _triggerDate, _modifiers, event) => currentTargets.push(event.currentTarget)}
      />,
    );
    const todayButton = screen.getByRole("button", { name: TODAY_BUTTON_NAME });

    // Act
    await userEvent.click(todayButton);

    // Assert
    expect(currentTargets).toEqual([todayButton]);
  });

  it("should rest dimmed and leave the selection alone when today is hidden in the displayed month", async () => {
    // Arrange
    const onSelect = vi.fn();
    render(<Calendar mode="single" showToday today={TODAY} defaultMonth={TODAY} hidden={TODAY} onSelect={onSelect} />);
    const todayButton = screen.getByRole("button", { name: TODAY_BUTTON_NAME });

    // Act
    await userEvent.click(todayButton);

    // Assert
    expect(todayButton).toHaveAttribute("aria-disabled", "true");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should leave the selection alone when today is already selected", async () => {
    // Arrange
    const onSelect = vi.fn();
    render(<SingleDateCalendar defaultMonth={new Date(2026, 8, 1)} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));
    onSelect.mockClear();

    // Act
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should only navigate to today's month when today is disabled", async () => {
    // Arrange
    const onSelect = vi.fn();
    render(
      <Calendar
        mode="single"
        showToday
        today={TODAY}
        defaultMonth={new Date(2026, 5, 1)}
        disabled={TODAY}
        onSelect={onSelect}
      />,
    );

    // Act
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    expect(screen.getByText("septiembre 2026")).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: TODAY_BUTTON_NAME })).toHaveAttribute("aria-disabled", "true");
  });

  it("should only navigate to today's month in range mode", async () => {
    // Arrange
    const onSelect = vi.fn();
    render(<Calendar mode="range" showToday today={TODAY} defaultMonth={new Date(2026, 5, 1)} onSelect={onSelect} />);

    // Act
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    expect(screen.getByText("septiembre 2026")).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should use custom Today copy", () => {
    // Arrange & Act
    render(<Calendar mode="single" showToday todayLabel="Ahora" today={TODAY} defaultMonth={TODAY} />);

    // Assert
    expect(screen.getByRole("button", { name: /^Ahora$/ })).toBeInTheDocument();
  });

  it("should not render a Today button unless asked", () => {
    // Arrange & Act
    render(<Calendar mode="single" today={TODAY} defaultMonth={TODAY} />);

    // Assert
    expect(screen.queryByRole("button", { name: TODAY_BUTTON_NAME })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeInTheDocument();
  });

  it("should mark today on its day button", () => {
    // Arrange & Act
    render(<Calendar mode="single" today={TODAY} defaultMonth={TODAY} />);

    // Assert
    expect(screen.getByRole("button", { name: /jueves, 10 de septiembre/i })).toHaveAttribute("data-today", "true");
    expect(screen.getByRole("button", { name: /viernes, 11 de septiembre/i })).not.toHaveAttribute("data-today");
  });

  it("should let the gliding disc paint a single selection but not a range", async () => {
    // Arrange
    const { container, rerender } = render(<SingleDateCalendar defaultMonth={TODAY} />);
    const month = () => container.querySelector('[data-slot="calendar-month"]');
    expect(month()).not.toHaveAttribute("data-selection-disc");

    // Act
    await userEvent.click(screen.getByRole("button", { name: /viernes, 11 de septiembre/i }));

    // Assert
    expect(month()).toHaveAttribute("data-selection-disc", "visible");
    rerender(
      <Calendar
        mode="range"
        today={TODAY}
        defaultMonth={TODAY}
        selected={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 12) }}
      />,
    );
    expect(month()).not.toHaveAttribute("data-selection-disc");
  });
});
