/** Demonstrates RadioGroup as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem, Label } from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  value: string;
  disabled: boolean;
  orientation: "horizontal" | "vertical";
  optionRows: boolean;
};
const meta = {
  title: "Components/RadioGroup",
  args: {
    value: "monthly",
    disabled: false,
    orientation: "vertical",
    optionRows: true,
  },
  argTypes: {
    value: {
      control: "select",
      options: ["weekly", "monthly"],
    },
    disabled: {
      control: "boolean",
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    optionRows: {
      control: "boolean",
      description: "Pasa `label` y `description` a cada `RadioGroupItem` para usar las filas de Arc.",
    },
  },
  parameters: { controls: { include: ["value", "disabled", "orientation", "optionRows"] } },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["value"]} updateArgs={updateArgs}>
        {({ value }, { value: setValue }) => {
          return (
            <RadioGroup
              value={value}
              disabled={args.disabled}
              orientation={args.orientation}
              className={
                args.orientation === "horizontal" ? "StoryRow" : "StoryStack"
              }
              onValueChange={(value) => setValue(value)}
            >
              {[
                { value: "weekly", label: "Semanal", description: "Se cobra cada lunes." },
                { value: "monthly", label: "Mensual", description: "Se cobra el primer día del mes." },
              ].map((option) => args.optionRows ? (
                <RadioGroupItem
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  description={option.description}
                />
              ) : (
                <div className="StoryRow" key={option.value}>
                  <RadioGroupItem value={option.value} id={`radio-${option.value}`} />
                  <Label htmlFor={`radio-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
