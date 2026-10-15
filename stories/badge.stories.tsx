/** Demonstrates Badge through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Star } from "lucide-react";
import { Badge } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  children: string;
  variant:
    "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  tone: "none" | "neutral" | "success" | "info" | "warning" | "danger";
  size: "sm" | "md";
  showIcon: boolean;
};

const meta = {
  title: "Components/Badge",
  args: {
    children: "Publicado",
    variant: "default",
    tone: "none",
    size: "md",
    showIcon: false,
  },
  argTypes: {
    children: {
      control: "text",
    },
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    tone: {
      control: "select",
      options: ["none", "neutral", "success", "info", "warning", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    showIcon: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["children", "variant", "tone", "size", "showIcon"] } },
  render: ({ tone, showIcon, ...args }) => (
    <Badge {...args} tone={tone === "none" ? undefined : tone} icon={showIcon ? <Star /> : undefined} />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
