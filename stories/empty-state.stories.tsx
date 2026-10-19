/** Demonstrates EmptyState through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox } from "lucide-react";
import { Button, EmptyState } from "@golfo/ui";

/** Editable inputs specific to this example. */
type Args = { title: string; description: string; withAction: boolean; withCustomIcon: boolean };

const meta = {
  title: "Components/EmptyState",
  args: {
    title: "No hay solicitudes pendientes",
    description: "Cuando alguien pida unirse a la academia, su solicitud va a aparecer acá.",
    withAction: true,
    withCustomIcon: true,
  },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    withAction: { control: "boolean" },
    withCustomIcon: { control: "boolean" },
  },
  parameters: { controls: { include: ["title", "description", "withAction", "withCustomIcon"] } },
  render: ({ title, description, withAction, withCustomIcon }) => (
    <EmptyState
      label="Bandeja de solicitudes"
      title={title}
      description={description}
      icon={withCustomIcon ? <Inbox size={24} strokeWidth={1.5} /> : undefined}
      action={withAction ? <Button variant="secondary">Compartir enlace de ingreso</Button> : undefined}
    />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
