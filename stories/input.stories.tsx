/** Demonstrates Input through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "@astra-kit/ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  invalid: boolean;
  description: string;
  error: string;
  type: "text" | "email" | "password" | "number";
};

const meta = {
  title: "Components/Input",
  args: {
    label: "Nombre",
    value: "",
    placeholder: "Ingresá tu nombre",
    disabled: false,
    invalid: false,
    description: "Lo ven todos los miembros de la tribu.",
    error: "Completá este campo",
    type: "text",
  },
  argTypes: {
    label: {
      control: "text",
    },
    value: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    invalid: {
      control: "boolean",
    },
    description: {
      control: "text",
    },
    error: {
      control: "text",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number"],
    },
  },
  parameters: {
    controls: {
      include: ["label", "value", "placeholder", "disabled", "invalid", "description", "error", "type"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["value"]} updateArgs={updateArgs}>
        {({ value }, { value: setValue }) => {
          return (
            <Input
              label={args.label}
              value={value}
              placeholder={args.placeholder}
              disabled={args.disabled}
              description={args.description || undefined}
              error={args.invalid ? args.error : undefined}
              type={args.type}
              onChange={(event) => setValue(event.target.value)}
            />
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
