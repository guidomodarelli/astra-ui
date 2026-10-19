/** Demonstrates Timeline through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, Send } from "lucide-react";
import { Button, Timeline } from "@golfo/ui";
import type { TimelineEvent } from "@golfo/ui";

/** Editable inputs specific to this example. */
type Args = { maxHeight: number; withScroll: boolean };

/** Fixed reference time, so the story renders the same day groups every day. */
const NOW = Date.UTC(2026, 8, 22, 15);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const EVENTS: TimelineEvent[] = [
  {
    id: "approved",
    at: NOW - 4 * MINUTE,
    actor: "Martín",
    title: "aprobó la solicitud",
    icon: <Check />,
    tone: "success",
    detail: <p>Se asignó un lugar en la cohorte de octubre.</p>,
  },
  { id: "code", at: NOW - 3 * HOUR, title: "Se envió el código de acceso", meta: "WhatsApp", icon: <Send /> },
  { id: "info", at: NOW - 26 * HOUR, actor: "Ana", title: "completó los datos pedidos" },
  { id: "asked", at: NOW - 28 * HOUR, actor: "Martín", title: "pidió más datos", meta: "Falta el país de residencia" },
  {
    id: "created",
    at: NOW - 52 * HOUR,
    actor: "Ana",
    title: "envió la solicitud",
    detail: <p>Llegó desde el enlace público de la academia.</p>,
  },
];

/** Adds updates on demand, so the slide-in and the announcement can be tried. */
function TimelineExample({ maxHeight, withScroll }: Args) {
  const [events, setEvents] = useState(EVENTS);
  const addUpdate = () =>
    setEvents((current) => [{ id: `note-${current.length}`, at: NOW, actor: "Lucía", title: "agregó una nota interna" }, ...current]);
  return (
    <div className="StoryStack">
      <Timeline
        events={events}
        now={NOW}
        label="Historial de la solicitud"
        timeZone="America/Argentina/Buenos_Aires"
        maxHeight={withScroll ? maxHeight : undefined}
        defaultExpanded={["approved"]}
      />
      <Button variant="secondary" onClick={addUpdate}>
        Agregar actualización
      </Button>
    </div>
  );
}

const meta = {
  title: "Components/Timeline",
  args: { maxHeight: 320, withScroll: false },
  argTypes: {
    maxHeight: { control: { type: "range", min: 160, max: 600, step: 20 } },
    withScroll: { control: "boolean" },
  },
  parameters: { controls: { include: ["maxHeight", "withScroll"] } },
  render: (args) => <TimelineExample {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
