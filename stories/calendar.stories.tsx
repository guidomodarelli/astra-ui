/** Demonstrates Calendar with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar } from "@golfo/ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  value: string;
  minDate: string;
  maxDate: string;
  blockWeekends: boolean;
  locale: string;
  showToday: boolean;
  todayLabel: string;
};

/**
 * Reads a `YYYY-MM-DD` control as a local date at noon, so time zones never shift the day.
 * @param day - Text of the control.
 * @returns The date, or `undefined` when the text is not a date.
 */
function parseDay(day: string): Date | undefined {
  const parsed = new Date(`${day}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Writes a date as the `YYYY-MM-DD` text of a control.
 * @param date - Picked date.
 * @returns The control text.
 */
function formatDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const meta = {
  title: "Components/Calendar",
  args: {
    value: "2026-09-10",
    minDate: "",
    maxDate: "",
    blockWeekends: false,
    locale: "es-AR",
    showToday: true,
    todayLabel: "Hoy",
  },
  argTypes: {
    value: { control: "text" },
    minDate: { control: "text" },
    maxDate: { control: "text" },
    blockWeekends: { control: "boolean" },
    locale: { control: "select", options: ["es-AR", "es-ES", "en-US", "pt-BR"] },
    showToday: { control: "boolean" },
    todayLabel: { control: "text" },
  },
  parameters: {
    controls: { include: ["value", "minDate", "maxDate", "blockWeekends", "locale", "showToday", "todayLabel"] },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["value"]} updateArgs={updateArgs}>
        {({ value }, { value: setValue }) => (
          <Calendar
            key={args.locale}
            value={parseDay(value) ?? null}
            onChange={(date) => setValue(formatDay(date))}
            minDate={parseDay(args.minDate)}
            maxDate={parseDay(args.maxDate)}
            disabledDates={args.blockWeekends ? (date) => date.getDay() === 0 || date.getDay() === 6 : undefined}
            locale={args.locale}
            showToday={args.showToday}
            todayLabel={args.todayLabel}
          />
        )}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
