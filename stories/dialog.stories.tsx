/** Demonstrates Dialog with Arc's API, including its `alert` mode for confirmations. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { Badge, Button, Dialog, DialogClose, DialogContent, DialogTrigger } from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { LiveArgs } from "./live-args.js";
/** Editable inputs specific to this example. */
type Args = {
  open: boolean;
  alert: boolean;
  title: string;
  description: string;
  content: string;
  hideTitle: boolean;
  showCloseButton: boolean;
  closeButtonPlacement: "content" | "viewport";
};
const meta = {
  title: "Components/Dialog",
  args: {
    open: false,
    alert: false,
    title: "Editar perfil",
    description: "Actualizá tus datos antes de guardar.",
    content: "El contenido del diálogo se adapta al espacio disponible.",
    hideTitle: false,
    showCloseButton: true,
    closeButtonPlacement: "content",
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    alert: {
      control: "boolean",
    },
    title: {
      control: "text",
    },
    description: {
      control: "text",
    },
    content: {
      control: "text",
    },
    hideTitle: {
      control: "boolean",
    },
    showCloseButton: {
      control: "boolean",
    },
    closeButtonPlacement: {
      control: "inline-radio",
      options: ["content", "viewport"],
    },
  },
  parameters: {
    controls: {
      include: [
        "open",
        "alert",
        "title",
        "description",
        "content",
        "hideTitle",
        "showCloseButton",
        "closeButtonPlacement",
      ],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <LiveArgs args={args} names={["open"]} updateArgs={updateArgs}>
        {({ open }, { open: setOpen }) => {
          return (
            <Dialog alert={args.alert} open={open} onOpenChange={(open) => setOpen(open)}>
              <DialogTrigger asChild>
                <Button>{args.alert ? "Abrir confirmación" : "Abrir diálogo"}</Button>
              </DialogTrigger>
              <DialogContent
                title={args.title}
                description={args.description}
                hideTitle={args.hideTitle}
                showCloseButton={args.showCloseButton}
                closeButtonPlacement={args.closeButtonPlacement}
                footer={
                  <>
                    <DialogClose asChild>
                      <Button variant="secondary">Cancelar</Button>
                    </DialogClose>
                    <Button variant={args.alert ? "danger" : "primary"} onClick={() => setOpen(false)}>
                      {args.alert ? "Confirmar" : "Guardar"}
                    </Button>
                  </>
                }
              >
                <p>{args.content}</p>
              </DialogContent>
            </Dialog>
          );
        }}
      </LiveArgs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
/** A destructive confirmation: `role="alertdialog"`, no close button and focus on "Cancelar" when it opens. */
export const Alert: Story = {
  args: {
    alert: true,
    title: "¿Eliminar el evento?",
    description: "Esta acción no se puede deshacer.",
    content: "Se avisará a quienes se anotaron.",
    showCloseButton: false,
  },
};
/**
 * Badges next to the title through `headerContent`, outside the accessible name, and the initial focus on the close
 * button through `closeButtonRef` and `onOpenAutoFocus`.
 */
export const HeaderContent: Story = {
  render: function Render() {
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Ver ronda</Button>
        </DialogTrigger>
        <DialogContent
          title="Ronda de preguntas"
          description="Respondé antes del viernes."
          headerContent={
            <span className="StoryRow">
              <Badge>Encuesta</Badge>
              <Badge tone="success">Abierta</Badge>
            </span>
          }
          closeButtonRef={closeButtonRef}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            closeButtonRef.current?.focus();
          }}
        >
          <p>Las respuestas se muestran cuando la ronda cierra.</p>
        </DialogContent>
      </Dialog>
    );
  },
};
