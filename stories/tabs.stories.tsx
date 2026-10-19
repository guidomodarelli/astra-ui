/** Demonstrates Tabs as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@astra-kit/ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  value: string;
  orientation: "horizontal" | "vertical";
  disabledSecond: boolean;
};
const meta = {
  title: "Components/Tabs",
  args: {
    value: "overview",
    orientation: "horizontal",
    disabledSecond: false,
  },
  argTypes: {
    value: {
      control: "select",
      options: ["overview", "activity"],
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    disabledSecond: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["value", "orientation", "disabledSecond"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["value"]} updateArgs={updateArgs}>
        {({ value }, { value: setValue }) => {
          return (
            <Tabs
              value={value}
              orientation={args.orientation}
              onValueChange={(value) => setValue(value)}
            >
              <TabsList aria-label="Secciones">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="activity" disabled={args.disabledSecond}>
                  Actividad
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview">Resumen de la cuenta.</TabsContent>
              <TabsContent value="activity">
                Últimos movimientos de la cuenta.
              </TabsContent>
            </Tabs>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};

/** Sections of a list wider than a phone screen: the list scrolls sideways and keeps the active tab in view. */
const OVERFLOW_SECTIONS = Array.from({ length: 10 }, (_, index) => `Sección ${index + 1}`);

export const Overflow: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Tabs defaultValue={OVERFLOW_SECTIONS[0]}>
        <TabsList aria-label="Secciones largas">
          {OVERFLOW_SECTIONS.map((section) => (
            <TabsTrigger key={section} value={section}>
              {section}
            </TabsTrigger>
          ))}
        </TabsList>
        {OVERFLOW_SECTIONS.map((section) => (
          <TabsContent key={section} value={section}>
            Contenido de {section.toLowerCase()}.
          </TabsContent>
        ))}
      </Tabs>
    </div>
  ),
};
