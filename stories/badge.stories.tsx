/** Demonstrates Badge through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Star } from "lucide-react";
import { Badge } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  children: string;
  tone: "neutral" | "success" | "info" | "warning" | "danger";
  size: "sm" | "md";
  showIcon: boolean;
};

const meta = {
  title: "Components/Badge",
  args: {
    children: "Publicado",
    tone: "neutral",
    size: "md",
    showIcon: false,
  },
  argTypes: {
    children: {
      control: "text",
    },
    tone: {
      control: "select",
      options: ["neutral", "success", "info", "warning", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    showIcon: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["children", "tone", "size", "showIcon"] } },
  render: ({ showIcon, ...args }) => <Badge {...args} icon={showIcon ? <Star /> : undefined} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
