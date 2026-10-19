/** Demonstrates RadioGroup through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "@astra-kit/ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  label: string;
  value: string;
  descriptions: boolean;
  disabledOption: boolean;
};
const meta = {
  title: "Components/RadioGroup",
  args: {
    label: "Frecuencia de cobro",
    value: "monthly",
    descriptions: true,
    disabledOption: false,
  },
  argTypes: {
    label: {
      control: "text",
    },
    value: {
      control: "select",
      options: ["weekly", "monthly", "yearly"],
    },
    descriptions: {
      control: "boolean",
      description: "Agrega `description` a cada opción.",
    },
    disabledOption: {
      control: "boolean",
      description: "Deshabilita la opción anual.",
    },
  },
  parameters: { controls: { include: ["label", "value", "descriptions", "disabledOption"] } },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["value"]} updateArgs={updateArgs}>
        {({ value }, { value: setValue }) => (
          <RadioGroup
            className="StoryStack"
            label={args.label}
            value={value}
            onValueChange={(nextValue) => setValue(nextValue)}
            options={[
              { value: "weekly", label: "Semanal", description: args.descriptions ? "Se cobra cada lunes." : undefined },
              { value: "monthly", label: "Mensual", description: args.descriptions ? "Se cobra el primer día del mes." : undefined },
              {
                value: "yearly",
                label: "Anual",
                description: args.descriptions ? "Dos meses sin cargo." : undefined,
                disabled: args.disabledOption,
              },
            ]}
          />
        )}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
