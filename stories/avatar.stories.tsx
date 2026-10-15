/** Demonstrates Avatar through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  src: string;
  alt: string;
  initials: string;
  size: "default" | "sm" | "lg" | "xl";
  status: "none" | "online" | "offline";
  showBadge: boolean;
};

const meta = {
  title: "Components/Avatar",
  args: {
    src: "avatar.svg",
    alt: "Perfil de ejemplo",
    initials: "GH",
    size: "default",
    status: "none",
    showBadge: false,
  },
  argTypes: {
    src: {
      control: "text",
    },
    alt: {
      control: "text",
    },
    initials: {
      control: "text",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "xl"],
    },
    status: {
      control: "select",
      options: ["none", "online", "offline"],
    },
    showBadge: {
      control: "boolean",
    },
  },
  parameters: {
    controls: { include: ["src", "alt", "initials", "size", "status", "showBadge"] },
  },
  render: ({ src, alt, initials, size, status, showBadge }) => (
    <Avatar size={size} status={status === "none" ? undefined : status}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{initials}</AvatarFallback>
      {showBadge && <AvatarBadge aria-label="Disponible" />}
    </Avatar>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {
  args: {
    status: "online",
  },
};
