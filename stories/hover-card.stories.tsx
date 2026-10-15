/** Demonstrates HoverCard as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardProfile,
} from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  name: string;
  bio: string;
  openDelay: number;
  closeDelay: number;
  side: "top" | "bottom";
};
const meta = {
  title: "Components/HoverCard",
  args: {
    name: "Guido",
    bio: "Construye componentes reutilizables.",
    openDelay: 500,
    closeDelay: 140,
    side: "bottom",
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
      options: ["top", "bottom"],
    },
  },
  parameters: {
    controls: { include: ["name", "bio", "openDelay", "closeDelay", "side"] },
  },
  render: ({ name, bio, openDelay, closeDelay, side }) => (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>
        <Button variant="ghost">@{name}</Button>
      </HoverCardTrigger>
      <HoverCardContent side={side}>
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
      </HoverCardContent>
    </HoverCard>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
