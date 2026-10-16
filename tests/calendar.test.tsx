import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { Calendar, useToday } from "beez-ui";

/** Today pinned through a fake clock, so the tests never depend on the real date. */
const NOW = new Date(2026, 8, 10, 15, 30);
const TODAY = new Date(2026, 8, 10);

/** Accessible name of the Today button; react-day-picker names today's day "Hoy, jueves, …", which must not match. */
const TODAY_BUTTON_NAME = /^Hoy$/;

/** A calendar that owns its selection and its month, as a consumer form would. */
function ControlledCalendar({
  initialMonth,
  onChange,
  ...props
}: { initialMonth: Date; onChange?: (date: Date) => void } & Omit<Parameters<typeof Calendar>[0], "value" | "onChange" | "month" | "onMonthChange">) {
  const [value, setValue] = useState<Date | null>(null);
  const [month, setMonth] = useState(initialMonth);
  return (
    <Calendar
      {...props}
      value={value}
      month={month}
      onMonthChange={setMonth}
      onChange={(date) => {
        setValue(date);
        onChange?.(date);
      }}
    />
  );
}

describe("Calendar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should report the picked day through onChange and show it selected", async () => {
    // Arrange
    const onChange = vi.fn();
    render(<ControlledCalendar initialMonth={TODAY} onChange={onChange} />);
    const day = screen.getByRole("button", { name: /viernes, 11 de septiembre/i });

    // Act
    await userEvent.click(day);

    // Assert
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 8, 11));
    expect(day).toHaveAttribute("data-selected-single", "true");
  });

  it("should report the selected day again instead of clearing it", async () => {
    // Arrange
    const onChange = vi.fn();
    render(<Calendar value={new Date(2026, 8, 11)} onChange={onChange} />);
    const day = screen.getByRole("button", { name: /viernes, 11 de septiembre/i });

    // Act
    await userEvent.click(day);

    // Assert
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 8, 11));
    expect(day).toHaveAttribute("data-selected-single", "true");
  });

  it("should show only the value it receives, so an ignored pick selects nothing", async () => {
    // Arrange
    render(<Calendar value={null} onChange={() => undefined} />);
    const day = screen.getByRole("button", { name: /viernes, 11 de septiembre/i });

    // Act
    await userEvent.click(day);

    // Assert
    expect(day).toHaveAttribute("data-selected-single", "false");
  });

  it("should open on the month of the value when the month is not controlled", () => {
    // Arrange & Act
    render(<Calendar value={new Date(2026, 1, 14)} />);

    // Assert
    expect(screen.getByText("febrero 2026")).toBeInTheDocument();
  });

  it("should report the first day of the month it navigates to", async () => {
    // Arrange
    const onMonthChange = vi.fn();
    render(<Calendar month={TODAY} onMonthChange={onMonthChange} />);

    // Act
    await userEvent.click(screen.getByRole("button", { name: /siguiente/i }));

    // Assert
    expect(onMonthChange).toHaveBeenCalledWith(new Date(2026, 9, 1));
  });

  it("should block days outside minDate and maxDate and those matched by disabledDates", async () => {
    // Arrange
    const onChange = vi.fn();
    render(
      <Calendar
        month={TODAY}
        minDate={new Date(2026, 8, 5)}
        maxDate={new Date(2026, 8, 25)}
        disabledDates={(date) => date.getDay() === 0}
        onChange={onChange}
      />,
    );

    // Act
    await userEvent.click(screen.getByRole("button", { name: /jueves, 3 de septiembre/i }));
    await userEvent.click(screen.getByRole("button", { name: /domingo, 13 de septiembre/i }));
    await userEvent.click(screen.getByRole("button", { name: /sábado, 26 de septiembre/i }));

    // Assert
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /lunes, 14 de septiembre/i })).toBeEnabled();
  });

  it("should stop navigation at the months of minDate and maxDate", () => {
    // Arrange & Act
    render(<Calendar month={TODAY} minDate={new Date(2026, 8, 5)} maxDate={new Date(2026, 8, 25)} showToday />);

    // Assert
    expect(screen.getByRole("button", { name: /anterior/i })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: /siguiente/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("should start weeks on Monday and name days in Spanish by default", () => {
    // Arrange & Act
    const { container } = render(<Calendar month={TODAY} />);

    // Assert
    const weekdays = Array.from(container.querySelectorAll("thead th"), (cell) => cell.getAttribute("aria-label"));
    expect(weekdays[0]).toBe("lunes");
    expect(container.querySelector('[data-slot="calendar"]')).toHaveAttribute("lang", "es-AR");
  });

  it("should use the locale it receives for names and week start", () => {
    // Arrange & Act
    const { container } = render(<Calendar month={TODAY} locale="en-US" />);

    // Assert
    expect(screen.getByText("September 2026")).toBeInTheDocument();
    const weekdays = Array.from(container.querySelectorAll("thead th"), (cell) => cell.getAttribute("aria-label"));
    expect(weekdays[0]).toBe("Sunday");
  });

  it("should take month and weekday names from Intl for a locale without bundled translations", () => {
    // Arrange & Act
    render(<Calendar month={TODAY} locale="pt-BR" />);

    // Assert
    expect(screen.getByText(new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(TODAY))).toBeInTheDocument();
  });

  it("should bring today's month into view and select today from the Today button", async () => {
    // Arrange
    const onChange = vi.fn();
    render(<ControlledCalendar initialMonth={new Date(2026, 0, 1)} showToday onChange={onChange} />);
    expect(screen.getByText("enero 2026")).toBeInTheDocument();

    // Act
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    expect(screen.getByText("septiembre 2026")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith(TODAY);
    expect(screen.getByRole("button", { name: TODAY_BUTTON_NAME })).toHaveAttribute("aria-disabled", "true");
  });

  it("should leave the selection alone when today is already selected", async () => {
    // Arrange
    const onChange = vi.fn();
    render(<Calendar value={TODAY} showToday onChange={onChange} />);
    const todayButton = screen.getByRole("button", { name: TODAY_BUTTON_NAME });

    // Act
    await userEvent.click(todayButton);

    // Assert
    expect(onChange).not.toHaveBeenCalled();
    expect(todayButton).toHaveAttribute("aria-disabled", "true");
  });

  it("should only navigate to today's month when today is blocked", async () => {
    // Arrange
    const onChange = vi.fn();
    render(
      <ControlledCalendar
        initialMonth={new Date(2026, 5, 1)}
        showToday
        disabledDates={(date) => date.getDate() === TODAY.getDate() && date.getMonth() === TODAY.getMonth()}
        onChange={onChange}
      />,
    );

    // Act
    await userEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    expect(screen.getByText("septiembre 2026")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: TODAY_BUTTON_NAME })).toHaveAttribute("aria-disabled", "true");
  });

  it("should rest dimmed when today's month is outside minDate and maxDate", async () => {
    // Arrange
    const onMonthChange = vi.fn();
    render(
      <Calendar
        showToday
        month={new Date(2026, 5, 1)}
        minDate={new Date(2026, 0, 1)}
        maxDate={new Date(2026, 6, 31)}
        onMonthChange={onMonthChange}
      />,
    );
    const todayButton = screen.getByRole("button", { name: TODAY_BUTTON_NAME });

    // Act
    await userEvent.click(todayButton);

    // Assert
    expect(todayButton).toHaveAttribute("aria-disabled", "true");
    expect(onMonthChange).not.toHaveBeenCalled();
    expect(screen.getByText("junio 2026")).toBeInTheDocument();
  });

  it("should use custom Today copy", () => {
    // Arrange & Act
    render(<Calendar showToday todayLabel="Ahora" month={TODAY} />);

    // Assert
    expect(screen.getByRole("button", { name: /^Ahora$/ })).toBeInTheDocument();
  });

  it("should not render a Today button unless asked", () => {
    // Arrange & Act
    render(<Calendar month={TODAY} />);

    // Assert
    expect(screen.queryByRole("button", { name: TODAY_BUTTON_NAME })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /siguiente/i })).toBeInTheDocument();
  });

  it("should mark today on its day button", () => {
    // Arrange & Act
    render(<Calendar month={TODAY} />);

    // Assert
    expect(screen.getByRole("button", { name: /jueves, 10 de septiembre/i })).toHaveAttribute("data-today", "true");
    expect(screen.getByRole("button", { name: /viernes, 11 de septiembre/i })).not.toHaveAttribute("data-today");
  });

  it("should move today and the Today button to the next day when the viewer's midnight passes", () => {
    // Arrange
    vi.useFakeTimers({ now: new Date(2026, 8, 10, 23, 59, 30) });
    const onChange = vi.fn();
    render(<ControlledCalendar initialMonth={TODAY} showToday onChange={onChange} />);
    expect(screen.getByRole("button", { name: /jueves, 10 de septiembre/i })).toHaveAttribute("data-today", "true");

    // Act
    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    fireEvent.click(screen.getByRole("button", { name: TODAY_BUTTON_NAME }));

    // Assert
    expect(screen.getByRole("button", { name: /viernes, 11 de septiembre/i })).toHaveAttribute("data-today", "true");
    expect(screen.getByRole("button", { name: /jueves, 10 de septiembre/i })).not.toHaveAttribute("data-today");
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 8, 11));
  });

  it("should let the gliding disc paint the selection", async () => {
    // Arrange
    const { container } = render(<ControlledCalendar initialMonth={TODAY} />);
    const month = () => container.querySelector('[data-slot="calendar-month"]');
    expect(month()).not.toHaveAttribute("data-selection-disc");

    // Act
    await userEvent.click(screen.getByRole("button", { name: /viernes, 11 de septiembre/i }));

    // Assert
    expect(month()).toHaveAttribute("data-selection-disc", "visible");
  });

  it("should add its class to the calendar root", () => {
    // Arrange & Act
    const { container } = render(<Calendar month={TODAY} className="DeliveryCalendar" />);

    // Assert
    expect(container.querySelector('[data-slot="calendar"]')).toHaveClass("DeliveryCalendar");
  });
});

describe("useToday", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the viewer's local midnight and move to the next day when midnight passes", () => {
    // Arrange
    vi.useFakeTimers({ now: new Date(2026, 8, 10, 23, 59, 30) });
    const { result } = renderHook(() => useToday());
    expect(result.current).toEqual(new Date(2026, 8, 10));

    // Act
    act(() => {
      vi.advanceTimersByTime(31_000);
    });

    // Assert
    expect(result.current).toEqual(new Date(2026, 8, 11));
  });
});
