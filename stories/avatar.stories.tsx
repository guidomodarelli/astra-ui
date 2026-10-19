/** Demonstrates Avatar and AvatarGroup through their public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlusIcon } from "lucide-react";
import { Avatar, AvatarGroup } from "@golfo/ui";

/** Editable inputs specific to this example. */
type Args = {
  name: string;
  src: string;
  size: "sm" | "md" | "lg" | "xl";
  status: "none" | "online" | "offline";
  showBadge: boolean;
};

const meta = {
  title: "Components/Avatar",
  args: {
    name: "Gonzalo Herrera",
    src: "avatar.svg",
    size: "md",
    status: "none",
    showBadge: false,
  },
  argTypes: {
    name: {
      control: "text",
    },
    src: {
      control: "text",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
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
    controls: { include: ["name", "src", "size", "status", "showBadge"] },
  },
  render: ({ name, src, size, status, showBadge }) => (
    <Avatar
      name={name}
      src={src || undefined}
      size={size}
      status={status === "none" ? undefined : status}
      badge={showBadge ? <PlusIcon aria-hidden="true" /> : undefined}
    />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {
  args: {
    status: "online",
  },
};

/** Arc's avatar group: the members past `max` collapse into the +N chip. */
export const Group: Story = {
  render: ({ size }) => (
    <AvatarGroup
      label="Integrantes"
      max={3}
      size={size === "xl" ? "lg" : size}
      members={[
        { name: "Ana Núñez", src: "avatar.svg", status: "online" },
        { name: "Lucía Paz" },
        { name: "Tomás Gil" },
        { name: "Sara Ruiz" },
        { name: "Inés Ma" },
      ]}
    />
  ),
};

/** A preview of the members with the real total: the +N chip counts everyone who is not drawn. */
export const Preview: Story = {
  render: ({ size }) => (
    <AvatarGroup
      label="Asistentes"
      total={28}
      size={size === "xl" ? "lg" : size}
      members={[
        { name: "Ana Núñez", src: "avatar.svg" },
        { name: "Lucía Paz" },
        { name: "Tomás Gil" },
      ]}
    />
  ),
};
