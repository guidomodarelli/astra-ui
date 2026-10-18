/** Covers the interaction contract of Arc's closed DropdownMenu and beez-ui's extensions. */
import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { Button, DropdownMenu, type DropdownItem } from "beez-ui";

/**
 * Builds the document actions, with a disabled row and a destructive one after a separator.
 * @param callbacks - Callbacks observed by the tests.
 * @returns The menu items.
 */
function documentActions({ onRename, onDelete }: { onRename?: () => void; onDelete?: () => void } = {}): DropdownItem[] {
  return [
    { label: "Renombrar", icon: <svg data-testid="rename-icon" />, onSelect: onRename },
    { label: "Duplicar", disabled: true },
    { label: "Mover" },
    { label: "Eliminar", destructive: true, separatorBefore: true, onSelect: onDelete },
  ];
}

describe("DropdownMenu", () => {
  it("should draw Arc's labelled trigger, run the selected action and close the menu", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<DropdownMenu label="Acciones" icon={<svg data-testid="trigger-icon" />} items={documentActions({ onRename })} />);

    const trigger = screen.getByRole("button", { name: "Acciones" });
    expect(within(trigger).getByTestId("trigger-icon")).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole("menu", { name: "Acciones" })).toBeInTheDocument();
    expect(within(screen.getByRole("menuitem", { name: "Renombrar" })).getByTestId("rename-icon")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "Renombrar" }));

    expect(onRename).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("should wrap keyboard navigation from the last item back to the first", async () => {
    const user = userEvent.setup();
    render(<DropdownMenu label="Acciones" items={documentActions()} />);

    screen.getByRole("button", { name: "Acciones" }).focus();
    await user.keyboard("{Enter}");
    const deleteItem = await screen.findByRole("menuitem", { name: "Eliminar" });
    await user.keyboard("{End}");
    expect(deleteItem).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Renombrar" })).toHaveFocus();
  });

  it("should skip disabled items, separate groups and mark destructive items", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<DropdownMenu label="Acciones" items={documentActions({ onDelete })} />);

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    const menu = screen.getByRole("menu");
    const duplicateItem = screen.getByRole("menuitem", { name: "Duplicar" });
    const deleteItem = screen.getByRole("menuitem", { name: "Eliminar" });
    const separator = within(menu).getByRole("separator");

    expect(duplicateItem).toHaveAttribute("aria-disabled", "true");
    expect(deleteItem).toHaveAttribute("data-variant", "destructive");
    // The separator sits right before the item that asked for it.
    expect(separator.nextElementSibling).toBe(deleteItem);
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Mover" })).toHaveFocus();
    await user.click(deleteItem);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("should open from a custom trigger and name the menu after the label", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu
        label="Acciones de la fila"
        trigger={<Button size="sm" aria-label="Más acciones">⋮</Button>}
        items={[{ label: "Editar" }]}
      />,
    );

    expect(screen.queryByRole("button", { name: "Acciones de la fila" })).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Más acciones" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Acciones de la fila" })).toBeInTheDocument();
  });

  it("should name the menu with contentLabel when it is given", async () => {
    const user = userEvent.setup();
    render(<DropdownMenu label="Acciones" contentLabel="Acciones del documento" items={[{ label: "Editar" }]} />);

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    expect(screen.getByRole("menu", { name: "Acciones del documento" })).toBeInTheDocument();
  });

  it("should render link items through the provider link and keep their target", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu
        label="Ayuda"
        items={[
          { label: "Guía", href: "/guia" },
          { label: "Soporte", href: "https://example.com/soporte", target: "_blank", rel: "noreferrer" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ayuda" }));
    const guide = screen.getByRole("menuitem", { name: "Guía" });
    const support = screen.getByRole("menuitem", { name: "Soporte" });
    expect(guide.tagName).toBe("A");
    expect(guide).toHaveAttribute("href", "/guia");
    expect(support).toHaveAttribute("target", "_blank");
    expect(support).toHaveAttribute("rel", "noreferrer");
  });

  it("should render checked items as checkboxes with trailing content, custom classes and attributes", async () => {
    const user = userEvent.setup();
    function ArchivedToggle() {
      const [showArchived, setShowArchived] = useState(false);
      return (
        <DropdownMenu
          label="Vista"
          items={[
            {
              id: "archived",
              label: "Mostrar archivados",
              checked: showArchived,
              onSelect: () => setShowArchived(!showArchived),
              trailing: <span>3</span>,
              className: "archived-row",
              itemProps: { "data-testid": "archived-row", "aria-keyshortcuts": "A" },
            },
          ]}
        />
      );
    }
    render(<ArchivedToggle />);

    await user.click(screen.getByRole("button", { name: "Vista" }));
    const row = screen.getByRole("menuitemcheckbox", { name: /Mostrar archivados/ });
    expect(row).toHaveAttribute("aria-checked", "false");
    expect(row).toHaveClass("archived-row");
    expect(row).toHaveAttribute("data-testid", "archived-row");
    expect(row).toHaveAttribute("aria-keyshortcuts", "A");
    expect(within(row).getByText("3")).toBeInTheDocument();
    await user.click(row);
    await user.click(await screen.findByRole("button", { name: "Vista" }, { timeout: 3000 }));
    expect(screen.getByRole("menuitemcheckbox", { name: /Mostrar archivados/ })).toHaveAttribute("aria-checked", "true");
  });

  it("should render a single selection as radio items and report the chosen value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function OrderMenu() {
      const [order, setOrder] = useState("recent");
      return (
        <DropdownMenu
          label="Orden"
          selection={{
            value: order,
            onValueChange: (value) => {
              setOrder(value);
              onValueChange(value);
            },
          }}
          items={[
            { label: "Recientes", value: "recent" },
            { label: "Por nombre", value: "name" },
            { label: "Restablecer", separatorBefore: true },
          ]}
        />
      );
    }
    render(<OrderMenu />);

    await user.click(screen.getByRole("button", { name: "Orden" }));
    expect(screen.getByRole("menuitemradio", { name: "Recientes" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitem", { name: "Restablecer" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitemradio", { name: "Por nombre" }));
    expect(onValueChange).toHaveBeenCalledWith("name");

    await user.click(await screen.findByRole("button", { name: "Orden" }, { timeout: 3000 }));
    expect(screen.getByRole("menuitemradio", { name: "Por nombre" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Recientes" })).toHaveAttribute("aria-checked", "false");
  });

  it("should draw the danger tone on destructive checkbox and radio rows", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu
        label="Peligro"
        selection={{ value: "keep", onValueChange: () => {} }}
        items={[
          { label: "Conservar", value: "keep" },
          { label: "Borrar todo", value: "wipe", destructive: true },
          { label: "Borrar al salir", checked: false, destructive: true },
          { label: "Recordar", checked: true },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Peligro" }));
    expect(screen.getByRole("menuitemradio", { name: "Borrar todo" })).toHaveAttribute("data-variant", "destructive");
    expect(screen.getByRole("menuitemcheckbox", { name: "Borrar al salir" })).toHaveAttribute("data-variant", "destructive");
    expect(screen.getByRole("menuitemradio", { name: "Conservar" })).toHaveAttribute("data-variant", "default");
    expect(screen.getByRole("menuitemcheckbox", { name: "Recordar" })).toHaveAttribute("data-variant", "default");
  });

  it("should place its content on the requested side and alignment, with a content class", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu label="Acciones" side="top" align="end" contentClassName="menu-extra" items={[{ label: "Editar" }]} />,
    );

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-side", "top");
    expect(menu).toHaveAttribute("data-align", "end");
    expect(menu).toHaveClass("menu-extra");
  });

  it("should follow a controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DropdownMenu label="Acciones" open onOpenChange={onOpenChange} items={[{ label: "Renombrar" }]} />,
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(<DropdownMenu label="Acciones" open={false} onOpenChange={onOpenChange} items={[{ label: "Renombrar" }]} />);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("should leave the page interactive while a non-modal menu is open", async () => {
    const user = userEvent.setup();
    const onOutsideClick = vi.fn();
    render(
      <>
        <DropdownMenu label="Acciones" modal={false} items={[{ label: "Editar" }]} />
        <Button onClick={onOutsideClick}>Afuera</Button>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Afuera" })).not.toHaveAttribute("aria-hidden");
  });

  it("should unmount at once under reduced motion, so the page is reachable right after choosing an item", async () => {
    const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation((query) =>
      Object.assign(new EventTarget(), {
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
      }),
    );
    onTestFinished(() => matchMedia.mockRestore());
    const user = userEvent.setup();
    render(
      <>
        <DropdownMenu label="Acciones" items={[{ label: "Editar" }]} />
        <Button>Afuera</Button>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    await user.click(screen.getByRole("menuitem", { name: "Editar" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Afuera" })).toBeInTheDocument();
  });
});

describe("DropdownMenu inside a clickable container", () => {
  it("should run the chosen item without letting its click reach the container through the portal", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenCard = vi.fn();
    const onRename = vi.fn();
    render(
      // The message card opens on click; the menu is portaled, but React bubbles its events through the tree.
      <div data-testid="message-card" onClick={onOpenCard}>
        <DropdownMenu label="Acciones del mensaje" items={documentActions({ onRename })} />
      </div>,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Acciones del mensaje" }));
    onOpenCard.mockClear();
    await user.click(screen.getByRole("menuitem", { name: "Renombrar" }));

    // Assert
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onOpenCard).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
