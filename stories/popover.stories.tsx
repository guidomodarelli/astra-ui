/** Demonstrates Arc's Popover composition with a close button inside the panel. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Popover, PopoverTrigger, PopoverContent, PopoverClose } from "@golfo/ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  title: string;
  description: string;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
};
const meta = {
  title: "Components/Popover",
  args: {
    open: false,
    title: "Información adicional",
    description: "Un detalle contextual sin abandonar la página.",
    side: "bottom",
    align: "start",
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    title: {
      control: "text",
    },
    description: {
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
  },
  parameters: {
    controls: { include: ["open", "title", "description", "side", "align"] },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["open"]} updateArgs={updateArgs}>
        {({ open }, { open: setOpen }) => {
          return (
            <Popover open={open} onOpenChange={(open) => setOpen(open)}>
              <PopoverTrigger asChild>
                <Button variant="secondary">Ver detalle</Button>
              </PopoverTrigger>
              <PopoverContent side={args.side} align={args.align} aria-labelledby="popover-story-title">
                <div style={{ display: "grid", gap: "0.125rem" }}>
                  <h2 id="popover-story-title" style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500 }}>
                    {args.title}
                  </h2>
                  <p style={{ margin: 0, color: "var(--text-secondary)" }}>{args.description}</p>
                </div>
                <PopoverClose asChild>
                  <Button size="sm">Listo</Button>
                </PopoverClose>
              </PopoverContent>
            </Popover>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
