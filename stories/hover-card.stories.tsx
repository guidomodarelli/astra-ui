/** Demonstrates Arc's closed HoverCard with the HoverCardProfile preset. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, HoverCard, HoverCardProfile } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  name: string;
  bio: string;
  openDelay: number;
  closeDelay: number;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
};
const meta = {
  title: "Components/HoverCard",
  args: {
    name: "Guido",
    bio: "Construye componentes reutilizables.",
    openDelay: 500,
    closeDelay: 140,
    side: "bottom",
    align: "start",
  },
  argTypes: {
    name: {
      control: "text",
    },
    bio: {
      control: "text",
    },
    openDelay: {
      control: {
        type: "range",
        min: 0,
        max: 1000,
        step: 50,
      },
    },
    closeDelay: {
      control: {
        type: "range",
        min: 0,
        max: 1000,
        step: 50,
      },
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
  },
  parameters: {
    controls: { include: ["name", "bio", "openDelay", "closeDelay", "side", "align"] },
  },
  render: ({ name, bio, openDelay, closeDelay, side, align }) => (
    <HoverCard
      openDelay={openDelay}
      closeDelay={closeDelay}
      side={side}
      align={align}
      content={
        <HoverCardProfile
          name={name}
          role="Ingeniero de producto, Plataforma"
          bio={bio}
          stats={[
            { label: "Componentes", value: 48 },
            { label: "Versiones", value: 12 },
          ]}
          meta="Buenos Aires"
        />
      }
    >
      <Button variant="ghost">@{name}</Button>
    </HoverCard>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
