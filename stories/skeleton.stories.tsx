/** Demonstrates Skeleton through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Skeleton } from "@astra-kit/ui";

/** Editable inputs specific to this example. */
type Args = { avatar: boolean; lines: number; label: string };

const meta = {
  title: "Components/Skeleton",
  args: {
    avatar: true,
    lines: 3,
    label: "Cargando contenido",
  },
  argTypes: {
    avatar: {
      control: "boolean",
    },
    lines: {
      control: {
        type: "range",
        min: 1,
        max: 6,
        step: 1,
      },
    },
    label: {
      control: "text",
    },
  },
  parameters: { controls: { include: ["avatar", "lines", "label"] } },
  render: ({ avatar, lines, label }) => (
    <div className="StoryStack">
      <Skeleton avatar={avatar} lines={lines} label={label} />
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};

/** Arc's reveal: the placeholder crossfades into the content while the height springs. */
function RevealExample({ avatar, lines, label }: Args) {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="StoryStack">
      <Button variant="secondary" onClick={() => setIsLoading((current) => !current)}>
        {isLoading ? "Mostrar contenido" : "Volver a cargar"}
      </Button>
      <Skeleton loading={isLoading} avatar={avatar} lines={lines} label={label}>
        <p>Resumen del mes: tres tareas pendientes de revisión y dos pagos acreditados.</p>
      </Skeleton>
    </div>
  );
}

export const Reveal: Story = {
  render: (args) => <RevealExample {...args} />,
};
