/** Demonstrates Arc's closed DropdownMenu: items are data, with @astra-kit/ui's checkbox, radio and link rows. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, DropdownMenu } from "@astra-kit/ui";
import { EllipsisIcon, ListFilterIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  checked: boolean;
  disabled: boolean;
  align: "start" | "center" | "end";
  destructive: boolean;
};
const meta = {
  title: "Components/DropdownMenu",
  args: {
    open: false,
    checked: true,
    disabled: false,
    align: "start",
    destructive: true,
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    checked: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
    destructive: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["open", "checked", "disabled", "align", "destructive"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["open", "checked"]} updateArgs={updateArgs}>
        {({ open, checked }, { open: setOpen, checked: setChecked }) => {
          return (
            <DropdownMenu
              label="Acciones del registro"
              open={open}
              onOpenChange={(open) => setOpen(open)}
              align={args.align}
              items={[
                {
                  label: "Editar datos",
                  icon: <PencilIcon />,
                  disabled: args.disabled,
                  trailing: "⌘E",
                },
                {
                  label: "Mostrar detalles",
                  checked,
                  onSelect: () => setChecked(!checked),
                },
                { label: "Ver la guía", href: "#guia" },
                {
                  label: "Eliminar registro",
                  icon: <Trash2Icon />,
                  destructive: args.destructive,
                  separatorBefore: true,
                },
              ]}
            />
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
/** A custom icon trigger: `label` names the menu while the button keeps its own accessible name. */
export const CustomTrigger: Story = {
  render: () => (
    <DropdownMenu
      label="Acciones de la fila"
      trigger={
        <Button variant="ghost" size="sm" aria-label="Más acciones">
          <EllipsisIcon />
        </Button>
      }
      align="end"
      items={[{ label: "Duplicar" }, { label: "Archivar" }]}
    />
  ),
};
/** A single selection: rows with a `value` render as radio items. */
export const Selection: Story = {
  render: function Render() {
    const [order, setOrder] = useState("recent");
    return (
      <DropdownMenu
        label="Ordenar"
        icon={<ListFilterIcon />}
        selection={{ value: order, onValueChange: setOrder }}
        items={[
          { label: "Más recientes", value: "recent" },
          { label: "Por nombre", value: "name" },
          { label: "Por importe", value: "amount" },
        ]}
      />
    );
  },
};
