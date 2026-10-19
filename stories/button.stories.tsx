/** Demonstrates Button through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@golfo/ui";
import { Save } from "lucide-react";
import { fn } from "storybook/test";
/** Editable inputs specific to this example. */
type Args = {
  children: string;
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  iconOnly: boolean;
  loading: boolean;
  disabled: boolean;
};

const meta = {
  title: "Components/Button",
  args: {
    children: "Guardar cambios",
    variant: "primary",
    size: "md",
    iconOnly: false,
    loading: false,
    disabled: false,
  },
  argTypes: {
    children: {
      control: "text",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    iconOnly: {
      control: "boolean",
    },
    loading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
  parameters: {
    controls: { include: ["children", "variant", "size", "iconOnly", "loading", "disabled"] },
  },
  render: ({ children, iconOnly, ...args }) => (
    <Button {...args} aria-label={iconOnly ? children : undefined} onClick={fn()}>
      {iconOnly ? <Save aria-hidden="true" /> : children}
    </Button>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
