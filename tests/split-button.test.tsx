import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Copy } from "lucide-react";

import { SplitButton } from "@golfo/ui";

describe("SplitButton", () => {
  it("should run the main action and offer the related actions in its menu", async () => {
    // Arrange
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const onCopyMarkdown = vi.fn();
    render(
      <SplitButton
        label="Copiar página"
        icon={<Copy />}
        onClick={onCopy}
        actions={[
          { label: "Copiar como Markdown", onSelect: onCopyMarkdown },
          { label: "Eliminar página", destructive: true },
          { label: "Exportar PDF", disabled: true },
        ]}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Copiar página" }));
    await user.click(screen.getByRole("button", { name: "Más acciones de Copiar página" }));

    // Assert
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("menuitem", { name: "Eliminar página" })).toHaveAttribute("data-variant", "destructive");
    expect(screen.getByRole("menuitem", { name: "Exportar PDF" })).toHaveAttribute("data-disabled");
    await user.click(screen.getByRole("menuitem", { name: "Copiar como Markdown" }));
    expect(onCopyMarkdown).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("should open the menu from the keyboard", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SplitButton label="Publicar" actions={[{ label: "Programar" }]} />);
    const trigger = screen.getByRole("button", { name: "Más acciones de Publicar" });

    // Act
    trigger.focus();
    await user.keyboard("{Enter}");

    // Assert
    expect(await screen.findByRole("menuitem", { name: "Programar" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("should name the menu half with menuLabel and announce label changes politely", () => {
    // Arrange
    const { rerender } = render(<SplitButton label="Copiar" menuLabel="Opciones de copia" actions={[]} />);

    // Act
    rerender(<SplitButton label="Copiado" menuLabel="Opciones de copia" actions={[]} />);

    // Assert
    expect(screen.getByRole("button", { name: "Copiado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Opciones de copia" })).toBeInTheDocument();
    expect(screen.getByRole("group")).toHaveTextContent("Copiado");
  });

  it("should keep emoji sequences, flags and combining accents whole in a single letter across label changes", () => {
    // Arrange
    const family = "👨‍👩‍👧‍👦";
    const flag = "🇦🇷";
    const decomposedAccent = "é";
    const getGlyphTexts = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('[data-slot="split-button-label"] span.inline-block'), (glyph) => glyph.textContent);
    const { container, rerender } = render(<SplitButton label={`Hola ${family} ${flag} caf${decomposedAccent}`} actions={[]} />);
    const initialGlyphs = getGlyphTexts(container);

    // Act
    rerender(<SplitButton label={`Chau ${family} ${flag} caf${decomposedAccent}`} actions={[]} />);
    const nextGlyphs = getGlyphTexts(container);

    // Assert
    for (const glyphs of [initialGlyphs, nextGlyphs]) {
      expect(glyphs).toEqual(expect.arrayContaining([family, flag, decomposedAccent]));
      for (const fragment of ["‍", "🇦", "́"]) {
        expect(glyphs).not.toContain(fragment);
      }
    }
  });

  it("should disable both halves and use the compact size for the secondary variant", () => {
    // Arrange
    const onClick = vi.fn();

    // Act
    render(<SplitButton label="Duplicar" variant="secondary" disabled onClick={onClick} actions={[{ label: "Duplicar en otro espacio" }]} />);

    // Assert
    const main = screen.getByRole("button", { name: "Duplicar" });
    const trigger = screen.getByRole("button", { name: "Más acciones de Duplicar" });
    expect(main).toBeDisabled();
    expect(trigger).toBeDisabled();
    expect(main).toHaveAttribute("data-variant", "secondary");
    expect(main).toHaveAttribute("data-size", "sm");
  });
});
