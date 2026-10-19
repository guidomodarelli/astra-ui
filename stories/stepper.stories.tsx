/** Demonstrates Stepper through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Stepper } from "@astra-kit/ui";
import type { StepperOrientation } from "@astra-kit/ui";

/** Editable inputs specific to this example. */
type Args = { orientation: StepperOrientation; interactive: boolean; compact: boolean; withError: boolean };

const STEPS = [
  { id: "upload", label: "Subir archivo", description: "CSV con un correo por fila" },
  { id: "review", label: "Revisar", description: "Confirmá las filas válidas" },
  { id: "activate", label: "Activar", description: "Habilitá a las personas importadas" },
];

/** Keeps the current step so the flow can move forward and back. */
function StepperExample({ orientation, interactive, compact, withError }: Args) {
  const [current, setCurrent] = useState(1);
  const steps = withError
    ? STEPS.map((step) => (step.id === "review" ? { ...step, error: "Hay 3 filas con correos inválidos" } : step))
    : STEPS;
  return (
    <div className="StoryStack">
      <Stepper
        label="Importación CSV"
        completeLabel="Importación completa"
        steps={steps}
        current={current}
        orientation={orientation}
        compact={compact}
        onStepSelect={interactive ? setCurrent : undefined}
      />
      <div className="StoryRow">
        <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent((step) => Math.max(0, step - 1))}>
          Anterior
        </Button>
        <Button disabled={current === STEPS.length} onClick={() => setCurrent((step) => Math.min(STEPS.length, step + 1))}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}

const meta = {
  title: "Components/Stepper",
  args: { orientation: "horizontal", interactive: true, compact: false, withError: false },
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
    interactive: { control: "boolean" },
    compact: { control: "boolean" },
    withError: { control: "boolean" },
  },
  parameters: { controls: { include: ["orientation", "interactive", "compact", "withError"] } },
  render: (args) => <StepperExample {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
