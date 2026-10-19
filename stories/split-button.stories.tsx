/** Demonstrates SplitButton through its public component contract. */
import { useEffect, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SplitButton } from "@golfo/ui";
import { Check, Copy, ExternalLink, FileText, Trash2 } from "lucide-react";

/** Editable inputs specific to this example. */
type Args = {
  variant: "primary" | "secondary";
  disabled: boolean;
};

/** Time the copied confirmation stays before the main action returns to its label. */
const COPIED_CONFIRMATION_MS = 1600;

/** Copies the page and confirms it on the main action, like a consumer would. */
function CopyPageExample({ variant, disabled }: Args) {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  return (
    <SplitButton
      label={isCopied ? "Copiado" : "Copiar página"}
      icon={isCopied ? <Check /> : <Copy />}
      variant={variant}
      disabled={disabled}
      onClick={() => {
        setIsCopied(true);
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setIsCopied(false), COPIED_CONFIRMATION_MS);
      }}
      actions={[
        { label: "Copiar como Markdown", icon: <FileText /> },
        { label: "Abrir en otra pestaña", icon: <ExternalLink /> },
        { label: "Eliminar página", icon: <Trash2 />, destructive: true },
      ]}
    />
  );
}

const meta = {
  title: "Components/SplitButton",
  args: { variant: "primary", disabled: false },
  argTypes: { variant: { control: "inline-radio", options: ["primary", "secondary"] } },
  render: (args) => <CopyPageExample {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
