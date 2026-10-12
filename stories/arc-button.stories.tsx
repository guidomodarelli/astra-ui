/** Demonstrates ArcButton through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArcButton } from "@guidomodarelli/beez-ui";
import { fn } from "storybook/test";
/** Editable inputs specific to this example. */
type Args = {
  children: string;
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
  loading: boolean;
  disabled: boolean;
};

const meta = {
  title: "Components/ArcButton",
  args: {
    children: "Guardar cambios",
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
  },
  argTypes: {
    children: { control: "text" },
    variant: { control: "select", options: ["primary", "secondary", "ghost", "danger"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  parameters: {
    controls: { include: ["children", "variant", "size", "loading", "disabled"] },
  },
  render: ({ children, ...args }) => (
    <ArcButton {...args} onClick={fn()}>
      {children}
    </ArcButton>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};

/** Simulated save delay so the spinner and label morph are visible. */
const SAVE_DELAY_MS = 900;

/** Saves with a simulated delay, then confirms in place by morphing the label. */
function SaveDraftExample() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const save = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
    }, SAVE_DELAY_MS);
  };
  return (
    <ArcButton variant="secondary" loading={isSaving} onClick={save}>
      {isSaved ? "Guardado" : "Guardar borrador"}
    </ArcButton>
  );
}

/** Shows the label width morph after an async save. */
export const SaveAndConfirm: Story = {
  render: () => <SaveDraftExample />,
};
