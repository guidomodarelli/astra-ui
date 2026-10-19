/** Demonstrates MetricCard through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricCard } from "@golfo/ui";

/** Editable inputs specific to this example. */
type Args = { label: string; value: number; suffix: string; context: string; change: string };

const meta = {
  title: "Components/MetricCard",
  args: { label: "Solicitudes recibidas", value: 128, suffix: "", context: "Últimos 7 días", change: "+12%" },
  argTypes: {
    label: { control: "text" },
    value: { control: { type: "number", step: 1 } },
    suffix: { control: "text" },
    context: { control: "text" },
    change: { control: "text" },
  },
  parameters: { controls: { include: ["label", "value", "suffix", "context", "change"] } },
  render: ({ label, value, suffix, context, change }) => (
    <div className="StoryStack">
      <MetricCard label={label} value={value} suffix={suffix || undefined} context={context} change={change || undefined} />
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
