/** Demonstrates Arc's closed Select with its label, helper and error rows. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "@golfo/ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";

/** Choices of the frequency select. */
const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "yearly", label: "Anual" },
];

/** Editable inputs specific to this example. */
type Args = {
  value: string;
  label: string;
  description: string;
  error: string;
  hideLabel: boolean;
  disabled: boolean;
  size: "default" | "sm";
  placeholder: string;
};
const meta = {
  title: "Components/Select",
  args: {
    value: "monthly",
    label: "Frecuencia",
    description: "Cada cuánto se repite el cobro.",
    error: "",
    hideLabel: false,
    disabled: false,
    size: "default",
    placeholder: "Seleccioná una frecuencia",
  },
  argTypes: {
    value: {
      control: "select",
      options: ["", "weekly", "monthly", "yearly"],
    },
    label: {
      control: "text",
    },
    description: {
      control: "text",
    },
    error: {
      control: "text",
    },
    hideLabel: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    size: {
      control: "select",
      options: ["default", "sm"],
    },
    placeholder: {
      control: "text",
    },
  },
  parameters: {
    controls: {
      include: ["value", "label", "description", "error", "hideLabel", "disabled", "size", "placeholder"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["value"]} updateArgs={updateArgs}>
        {({ value }, { value: setValue }) => {
          return (
            <div style={{ maxWidth: "20rem" }}>
              <Select
                label={args.label}
                hideLabel={args.hideLabel}
                description={args.description || undefined}
                error={args.error || undefined}
                value={value}
                disabled={args.disabled}
                size={args.size}
                placeholder={args.placeholder}
                onValueChange={(value) => setValue(value)}
                options={FREQUENCY_OPTIONS}
              />
            </div>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
