/** Demonstrates ActionButton through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ActionButton } from "@astra-kit/ui";

/** Editable inputs specific to this example. */
type Args = {
  label: string;
  pendingLabel: string;
  successLabel: string;
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  actionDurationMs: number;
  resetAfterMs: number;
  fails: boolean;
};

/**
 * Simulates a request that settles after a delay.
 * @param durationMs - Time until it settles.
 * @param fails - Whether it rejects instead of resolving.
 * @returns The pending request.
 */
function simulateRequest(durationMs: number, fails: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (fails ? reject(new Error("La solicitud falló")) : resolve()), durationMs);
  });
}

const meta = {
  title: "Components/ActionButton",
  args: {
    label: "Publicar",
    pendingLabel: "Publicando",
    successLabel: "Publicado",
    variant: "primary",
    size: "md",
    actionDurationMs: 1200,
    resetAfterMs: 2400,
    fails: false,
  },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    actionDurationMs: { control: { type: "number", min: 0, step: 100 } },
    resetAfterMs: { control: { type: "number", min: 0, step: 100 } },
  },
  render: ({ actionDurationMs, fails, ...args }) => (
    <ActionButton {...args} onAction={() => simulateRequest(actionDurationMs, fails)} onActionError={() => {}} />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
