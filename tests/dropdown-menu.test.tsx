/** Covers the interaction contract of the Arc-styled DropdownMenu composition. */
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "beez-ui";

/**
 * Renders a menu with every kind of row.
 * @param props - Callbacks observed by the tests.
 * @returns The trigger and its menu.
 */
function ActionsMenu({ onRename, onDelete }: { onRename?: () => void; onDelete?: () => void }) {
  const [showArchived, setShowArchived] = useState(false);
  const [order, setOrder] = useState("recent");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Documento</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onRename}>
          Renombrar
          <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>Duplicar</DropdownMenuItem>
        <DropdownMenuCheckboxItem checked={showArchived} onCheckedChange={setShowArchived}>
          Mostrar archivados
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={order} onValueChange={setOrder}>
          <DropdownMenuRadioItem value="recent">Recientes</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name">Por nombre</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Mover a</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Archivo</DropdownMenuItem>
            <DropdownMenuItem>Papelera</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("should run the selected action and close the menu", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<ActionsMenu onRename={onRename} />);

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    await user.click(screen.getByRole("menuitem", { name: /Renombrar/ }));

    expect(onRename).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("should wrap keyboard navigation from the last item back to the first by default", async () => {
    const user = userEvent.setup();
    render(<ActionsMenu />);

    screen.getByRole("button", { name: "Acciones" }).focus();
    await user.keyboard("{Enter}");
    const deleteItem = await screen.findByRole("menuitem", { name: "Eliminar" });
    await user.keyboard("{End}");
    expect(deleteItem).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Renombrar/ })).toHaveFocus();
  });

  it("should let consumers turn the keyboard wrap off", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent loop={false}>
          <DropdownMenuItem>Primera</DropdownMenuItem>
          <DropdownMenuItem>Última</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    screen.getByRole("button", { name: "Acciones" }).focus();
    await user.keyboard("{Enter}");
    const lastItem = await screen.findByRole("menuitem", { name: "Última" });
    await user.keyboard("{End}{ArrowDown}");

    expect(lastItem).toHaveFocus();
  });

  it("should skip disabled actions and mark destructive ones", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<ActionsMenu onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    const duplicateItem = screen.getByRole("menuitem", { name: "Duplicar" });
    const deleteItem = screen.getByRole("menuitem", { name: "Eliminar" });

    expect(duplicateItem).toHaveAttribute("aria-disabled", "true");
    expect(deleteItem).toHaveAttribute("data-variant", "destructive");
    await user.click(deleteItem);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("should toggle checkbox rows and choose radio rows", async () => {
    const user = userEvent.setup();
    render(<ActionsMenu />);
    /** Opens the menu again once the previous selection closed it. */
    const reopen = async () => {
      await user.click(await screen.findByRole("button", { name: "Acciones" }, { timeout: 3000 }));
    };

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Mostrar archivados" }));
    await reopen();
    expect(screen.getByRole("menuitemcheckbox", { name: "Mostrar archivados" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await user.click(screen.getByRole("menuitemradio", { name: "Por nombre" }));
    await reopen();
    expect(screen.getByRole("menuitemradio", { name: "Por nombre" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Recientes" })).toHaveAttribute("aria-checked", "false");
  });

  it("should open a submenu from the keyboard", async () => {
    const user = userEvent.setup();
    render(<ActionsMenu />);

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    screen.getByRole("menuitem", { name: "Mover a" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(await screen.findByRole("menuitem", { name: "Archivo" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Mover a" })).toHaveAttribute("aria-expanded", "true");
  });

  it("should follow a controlled open state", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DropdownMenu open onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Renombrar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <DropdownMenu open={false} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Renombrar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});
