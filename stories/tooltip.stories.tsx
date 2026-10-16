/** Demonstrates Arc's closed Tooltip: the content wraps its trigger, without any provider. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Tooltip } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  content: string;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
  sideOffset: number;
};
const meta = {
  title: "Components/Tooltip",
  args: {
    content: "Guardá los cambios pendientes",
    side: "top",
    align: "center",
    sideOffset: 8,
  },
  argTypes: {
    content: {
      control: "text",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
    sideOffset: {
      control: {
        type: "range",
        min: 0,
        max: 24,
        step: 1,
      },
    },
  },
  parameters: { controls: { include: ["content", "side", "align", "sideOffset"] } },
  render: ({ content, side, align, sideOffset }) => (
    <Tooltip content={content} side={side} align={align} sideOffset={sideOffset}>
      <Button variant="secondary">Pasá el cursor o enfocá</Button>
    </Tooltip>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
/** Moving between tooltips opens the next one at once, with no app-level provider. */
export const Toolbar: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Tooltip content="Negrita">
        <Button variant="ghost" size="sm" aria-label="Negrita">
          N
        </Button>
      </Tooltip>
      <Tooltip content="Cursiva">
        <Button variant="ghost" size="sm" aria-label="Cursiva">
          C
        </Button>
      </Tooltip>
      <Tooltip content="Subrayado">
        <Button variant="ghost" size="sm" aria-label="Subrayado">
          S
        </Button>
      </Tooltip>
    </div>
  ),
};
