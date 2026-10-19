/** Demonstrates ButtonLink through its public component contract: navigation with the Button look. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ButtonLink } from "@astra-kit/ui";

/** Editable inputs specific to this example. */
type Args = {
  children: string;
  href: string;
  variant: "primary" | "secondary" | "ghost" | "danger";
  size: "sm" | "md" | "lg";
};

const meta = {
  title: "Components/ButtonLink",
  args: {
    children: "Volver al inicio",
    href: "#destination",
    variant: "primary",
    size: "md",
  },
  argTypes: {
    children: {
      control: "text",
    },
    href: {
      control: "text",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
  parameters: { controls: { include: ["children", "href", "variant", "size"] } },
  render: ({ children, href, variant, size }) => (
    <div className="StoryStack">
      <ButtonLink href={href} variant={variant} size={size}>
        {children}
      </ButtonLink>
      <p id="destination">Destino del enlace. Es un ancla: se puede abrir en otra pestaña o copiar.</p>
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
