/** Covers Arc's Tabs contract: value handling, panel lifecycle and refs, as consumers use them. */
import { createRef, useState, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "beez-ui";

/** Two-tab composition shared by the scenarios. */
function SectionTabs({
  forceMount,
  ...tabsProps
}: Partial<ComponentProps<typeof Tabs>> & { forceMount?: true }) {
  return (
    <Tabs {...tabsProps}>
      <TabsList aria-label="Secciones">
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="detalle">Detalle</TabsTrigger>
      </TabsList>
      <TabsContent value="resumen" forceMount={forceMount}>
        Contenido del resumen
      </TabsContent>
      <TabsContent value="detalle" forceMount={forceMount}>
        Contenido del detalle
      </TabsContent>
    </Tabs>
  );
}

/** A controlled parent that only switches after a confirmation. */
function GuardedTabs({ onRequest }: { onRequest: (value: string) => void }) {
  const [value, setValue] = useState("resumen");
  return (
    <>
      <SectionTabs value={value} onValueChange={onRequest} />
      <button type="button" onClick={() => setValue("detalle")}>
        Confirmar
      </button>
    </>
  );
}

describe("Tabs", () => {
  it("should show only the selected panel and remove the previous one once it leaves", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SectionTabs defaultValue="resumen" />);

    // Act
    await user.click(screen.getByRole("tab", { name: "Detalle" }));

    // Assert
    expect(screen.getByRole("tab", { name: "Detalle" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Contenido del detalle");
    await waitFor(() => expect(screen.queryByText("Contenido del resumen")).not.toBeInTheDocument());
  });

  it("should report a controlled change without switching until the parent updates the value", async () => {
    // Arrange
    const user = userEvent.setup();
    const onRequest = vi.fn();
    render(<GuardedTabs onRequest={onRequest} />);

    // Act
    await user.click(screen.getByRole("tab", { name: "Detalle" }));

    // Assert
    expect(onRequest).toHaveBeenCalledWith("detalle");
    expect(screen.getByRole("tab", { name: "Resumen" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Contenido del resumen");

    // Act
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    // Assert
    expect(screen.getByRole("tab", { name: "Detalle" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Contenido del detalle");
  });

  it("should keep force-mounted panels in the document and switch which one is active", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<SectionTabs defaultValue="resumen" forceMount />);

    // Act
    await user.click(screen.getByRole("tab", { name: "Detalle" }));

    // Assert
    expect(screen.getByRole("tabpanel", { name: "Resumen" })).toHaveAttribute("data-state", "inactive");
    expect(screen.getByRole("tabpanel", { name: "Detalle" })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("tabpanel", { name: "Detalle" })).toHaveTextContent("Contenido del detalle");
  });

  it("should render the consumer's element as the panel with asChild, with and without force mounting", async () => {
    // Arrange
    const user = userEvent.setup();
    const animatedRef = createRef<HTMLElement>();
    const mountedRef = createRef<HTMLElement>();
    render(
      <Tabs defaultValue="resumen">
        <TabsList aria-label="Secciones">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
        </TabsList>
        <TabsContent asChild value="resumen">
          <section ref={animatedRef}>Contenido del resumen</section>
        </TabsContent>
        <TabsContent asChild forceMount value="detalle">
          <section ref={mountedRef}>Contenido del detalle</section>
        </TabsContent>
      </Tabs>,
    );

    // Act
    const animatedPanel = screen.getByRole("tabpanel", { name: "Resumen" });

    // Assert
    expect(animatedPanel.tagName).toBe("SECTION");
    expect(animatedRef.current).toBe(animatedPanel);
    expect(animatedPanel.querySelector("div")).toBeNull();

    // Act
    await user.click(screen.getByRole("tab", { name: "Detalle" }));

    // Assert
    const mountedPanel = screen.getByRole("tabpanel", { name: "Detalle" });
    expect(mountedPanel.tagName).toBe("SECTION");
    expect(mountedRef.current).toBe(mountedPanel);
  });

  it("should move the selection with the arrow keys and forward the root and panel refs", async () => {
    // Arrange
    const user = userEvent.setup();
    const rootRef = createRef<HTMLDivElement>();
    const panelRef = createRef<HTMLDivElement>();
    render(
      <Tabs ref={rootRef} defaultValue="resumen">
        <TabsList aria-label="Secciones">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">Contenido del resumen</TabsContent>
        <TabsContent ref={panelRef} value="detalle">
          Contenido del detalle
        </TabsContent>
      </Tabs>,
    );

    // Act
    await user.click(screen.getByRole("tab", { name: "Resumen" }));
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(screen.getByRole("tab", { name: "Detalle" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Detalle" })).toHaveAttribute("aria-selected", "true");
    expect(rootRef.current).toContainElement(screen.getByRole("tablist", { name: "Secciones" }));
    expect(panelRef.current).toBe(screen.getByRole("tabpanel"));
  });
});
