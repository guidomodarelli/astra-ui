/** Demonstrates Card through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, Button, Card } from "@astra-kit/ui";

/** Editable inputs specific to this example. */
type Args = {
  title: string;
  description: string;
  content: string;
  status: string;
  media: boolean;
  byline: boolean;
  quickLook: boolean;
  footer: boolean;
};

const meta = {
  title: "Components/Card",
  args: {
    title: "Resumen mensual",
    description: "Actividad del equipo",
    content: "Hay tres tareas pendientes de revisión.",
    status: "Actualizado hace 2 horas",
    media: false,
    byline: true,
    quickLook: false,
    footer: false,
  },
  argTypes: {
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    content: {
      control: "text",
    },
    status: {
      control: "text",
    },
    media: {
      control: "boolean",
    },
    byline: {
      control: "boolean",
    },
    quickLook: {
      control: "boolean",
      description: "Pasa `details` para que el título abra la vista rápida.",
    },
    footer: {
      control: "boolean",
    },
  },
  parameters: {
    controls: { include: ["title", "description", "content", "status", "media", "byline", "quickLook", "footer"] },
  },
  render: ({ title, description, content, status, media, byline, quickLook, footer }) => (
    <Card
      className="StoryCard"
      title={title}
      description={description}
      media={media ? <img src="avatar.svg" alt="" /> : undefined}
      avatar={byline ? <Avatar name="Ana Núñez" size="md" /> : undefined}
      meta={byline ? "Ana Núñez" : undefined}
      status={byline ? status : undefined}
      action={byline ? <Button size="sm" variant="secondary">Abrir</Button> : undefined}
      details={quickLook ? <p>Alcance, hitos y preguntas abiertas del mes.</p> : undefined}
      footer={footer ? <Button>Ver detalles</Button> : undefined}
    >
      {content ? <p>{content}</p> : null}
    </Card>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
