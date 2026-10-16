/** Demonstrates Alert through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, Button } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  title: string;
  description: string;
  tone: "info" | "success" | "warning" | "danger";
  dismissible: boolean;
  withAction: boolean;
};

/** Keeps the dismissed state so a dismissed alert can be shown again. */
function AlertExample({ title, description, tone, dismissible, withAction }: Args) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="StoryStack">
      <Alert
        tone={tone}
        title={title}
        open={dismissible ? isOpen : undefined}
        onDismiss={dismissible ? () => setIsOpen(false) : undefined}
        action={withAction ? <Button size="sm" variant="secondary">Revisar</Button> : undefined}
      >
        {description}
      </Alert>
      {dismissible && !isOpen ? (
        <Button variant="secondary" onClick={() => setIsOpen(true)}>Mostrar de nuevo</Button>
      ) : null}
    </div>
  );
}

const meta = {
  title: "Components/Alert",
  args: {
    title: "Cambios guardados",
    description: "La información está actualizada.",
    tone: "success",
    dismissible: true,
    withAction: false,
  },
  argTypes: {
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    tone: {
      control: "select",
      options: ["info", "success", "warning", "danger"],
    },
    dismissible: {
      control: "boolean",
    },
    withAction: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["title", "description", "tone", "dismissible", "withAction"] } },
  render: (args) => <AlertExample {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
