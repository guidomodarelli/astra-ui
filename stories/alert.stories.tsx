/** Demonstrates Alert through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, AlertTitle, AlertDescription, Button } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  title: string;
  description: string;
  variant: "default" | "destructive";
  tone: "none" | "info" | "success" | "warning" | "danger";
  dismissible: boolean;
};

/** Keeps the dismissed state so a dismissed alert can be shown again. */
function AlertExample({ title, description, variant, tone, dismissible }: Args) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="StoryStack">
      <Alert
        variant={variant}
        tone={tone === "none" ? undefined : tone}
        open={dismissible ? isOpen : undefined}
        onDismiss={dismissible ? () => setIsOpen(false) : undefined}
      >
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
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
    variant: "default",
    tone: "success",
    dismissible: true,
  },
  argTypes: {
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
    tone: {
      control: "select",
      options: ["none", "info", "success", "warning", "danger"],
    },
    dismissible: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["title", "description", "variant", "tone", "dismissible"] } },
  render: (args) => <AlertExample {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
