/** Demonstrates UsageMeter through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { UsageMeter } from "@astra-kit/ui";

/** Editable inputs specific to this example. */
type Args = { codes: number; notices: number; limit: number; warnAt: number };

const meta = {
  title: "Components/UsageMeter",
  args: { codes: 120, notices: 45, limit: 200, warnAt: 0.9 },
  argTypes: {
    codes: { control: { type: "range", min: 0, max: 300, step: 5 } },
    notices: { control: { type: "range", min: 0, max: 300, step: 5 } },
    limit: { control: { type: "range", min: 50, max: 400, step: 10 } },
    warnAt: { control: { type: "range", min: 0.5, max: 1, step: 0.05 } },
  },
  parameters: { controls: { include: ["codes", "notices", "limit", "warnAt"] } },
  render: ({ codes, notices, limit, warnAt }) => (
    <div className="StoryStack">
      <UsageMeter
        label="Envíos de mensajería de hoy"
        decimals={0}
        limit={limit}
        warnAt={warnAt}
        segments={[
          { id: "codes", label: "Códigos", value: codes },
          { id: "notices", label: "Avisos", value: notices },
        ]}
      />
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
