/** Exercises Arc's Tooltip, Popover and Hover Card through their public API and @golfo/ui's extensions. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Button,
  HoverCard,
  HoverCardProfile,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@golfo/ui";

/** The bubble Radix renders for the open tooltip. */
function tooltipBubble() {
  return document.querySelector("[data-slot=tooltip-content]");
}

/** The surface Radix renders for the open hover card. */
function hoverCardSurface() {
  return document.querySelector("[data-slot=hover-card-content]");
}

describe("Tooltip", () => {
  it("should turn its only child into the trigger and open on keyboard focus without any provider", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Guardá los cambios pendientes">
        <Button>Guardar</Button>
      </Tooltip>,
    );
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Guardar" });
    expect(trigger).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Guardá los cambios pendientes");
    expect(trigger).toHaveAttribute("aria-describedby");
  });

  it("should prefer the top side by default and accept every side, alignment and content class", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Tooltip content="Copiar enlace">
        <Button>Compartir</Button>
      </Tooltip>,
    );
    await user.tab();
    await screen.findByRole("tooltip");
    expect(tooltipBubble()).toHaveAttribute("data-side", "top");

    for (const side of ["bottom", "left", "right"] as const) {
      rerender(
        <Tooltip content="Copiar enlace" side={side} align="start" contentClassName="tooltip-extra">
          <Button>Compartir</Button>
        </Tooltip>,
      );
      await waitFor(() => expect(tooltipBubble()).toHaveAttribute("data-side", side));
      expect(tooltipBubble()).toHaveAttribute("data-align", "start");
      expect(tooltipBubble()).toHaveClass("tooltip-extra");
    }
  });

  it("should remove the bubble once it closes", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Explicación breve">
        <Button>Ayuda</Button>
      </Tooltip>,
    );
    await user.tab();
    await screen.findByRole("tooltip");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(tooltipBubble()).not.toBeInTheDocument());
  });

  it("should follow a controlled open state and report dismissals", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Tooltip content="Siempre visible" open onOpenChange={onOpenChange}>
        <Button>Detalle</Button>
      </Tooltip>,
    );
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Siempre visible");
    screen.getByRole("button", { name: "Detalle" }).focus();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    rerender(
      <Tooltip content="Siempre visible" open={false} onOpenChange={onOpenChange}>
        <Button>Detalle</Button>
      </Tooltip>,
    );
    await waitFor(() => expect(tooltipBubble()).not.toBeInTheDocument());
  });

  it("should start open with defaultOpen and close by itself afterwards", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Abierto al montar" defaultOpen>
        <Button>Inicio</Button>
      </Tooltip>,
    );
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Abierto al montar");
    screen.getByRole("button", { name: "Inicio" }).focus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(tooltipBubble()).not.toBeInTheDocument());
  });
});

describe("Popover", () => {
  it("should close from a PopoverClose inside the panel and give focus back to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Ver filtros</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filtros">
          Filtros disponibles
          <PopoverClose asChild>
            <Button>Listo</Button>
          </PopoverClose>
        </PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Ver filtros" }));
    expect(screen.getByRole("dialog", { name: "Filtros" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Listo" }));
    // While it fades out, the leaving panel is already hidden from assistive technology.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Filtros disponibles")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Ver filtros" })).toHaveFocus();
  });

  it("should align the panel with the start of its trigger by default, as Arc does", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Por defecto</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Panel por defecto">Inicio</PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Centrado</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Panel centrado" align="center">
            Centro
          </PopoverContent>
        </Popover>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Por defecto" }));
    expect(screen.getByRole("dialog", { name: "Panel por defecto" })).toHaveAttribute("data-align", "start");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Inicio")).not.toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Centrado" }));
    expect(await screen.findByRole("dialog", { name: "Panel centrado" })).toHaveAttribute("data-align", "center");
  });

  it("should reopen while it is still closing and stay open", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Detalle</Button>
        </PopoverTrigger>
        <PopoverContent>Contenido del detalle</PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Detalle" });
    await user.click(trigger);
    await user.click(trigger);
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)));
    expect(screen.getByText("Contenido del detalle")).toBeInTheDocument();
    expect(screen.getByText("Contenido del detalle")).toHaveAttribute("data-state", "open");
  });
});

describe("HoverCard", () => {
  it("should open on keyboard focus and describe a person with HoverCardProfile", async () => {
    const user = userEvent.setup();
    render(
      <HoverCard
        content={
          <HoverCardProfile
            name="Ana Pérez"
            role="Diseñadora de producto, Pagos"
            bio="Diseña flujos de cobro."
            stats={[
              { label: "Seguidores", value: 128 },
              { label: "Proyectos", value: 12 },
            ]}
            meta="Buenos Aires"
          />
        }
      >
        <a href="#perfil">Ana Pérez</a>
      </HoverCard>,
    );
    await user.tab();
    expect(screen.getByRole("link", { name: "Ana Pérez" })).toHaveFocus();
    expect(await screen.findByText("Diseñadora de producto, Pagos")).toBeInTheDocument();
    expect(screen.getByText("AP")).toBeInTheDocument();
    expect(screen.getByText("Diseña flujos de cobro.")).toBeInTheDocument();
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["Seguidores", "Proyectos"]);
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("Buenos Aires")).toBeInTheDocument();
  });

  it("should open below the trigger, aligned with its start, and style its surface", async () => {
    const { rerender } = render(
      <HoverCard content="Tarjeta" open className="card-surface" contentClassName="card-extra">
        <a href="#perfil">Perfil</a>
      </HoverCard>,
    );
    await screen.findByText("Tarjeta");
    expect(hoverCardSurface()).toHaveAttribute("data-side", "bottom");
    expect(hoverCardSurface()).toHaveAttribute("data-align", "start");
    expect(hoverCardSurface()).toHaveClass("card-surface", "card-extra");

    rerender(
      <HoverCard content="Tarjeta" open side="right" align="end">
        <a href="#perfil">Perfil</a>
      </HoverCard>,
    );
    await waitFor(() => expect(hoverCardSurface()).toHaveAttribute("data-side", "right"));
    expect(hoverCardSurface()).toHaveAttribute("data-align", "end");
  });

  it("should render a portrait instead of initials when the profile has an avatar URL", async () => {
    render(
      <HoverCard open content={<HoverCardProfile name="Luis Gómez" avatar="/retrato.png" />}>
        <a href="#perfil">Luis</a>
      </HoverCard>,
    );
    const content = await screen.findByText("Luis Gómez");
    const portrait = content.closest("[data-slot=hover-card-profile]")?.querySelector("img");
    expect(portrait).toHaveAttribute("src", "/retrato.png");
    expect(screen.queryByText("LG")).not.toBeInTheDocument();
  });

  it("should report opening and closing, so consumers can load data while it is open", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <HoverCard content="Tarjeta de perfil" onOpenChange={onOpenChange}>
        <a href="#perfil">Perfil público</a>
      </HoverCard>,
    );
    await user.tab();
    await screen.findByText("Tarjeta de perfil");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.tab();
    await waitFor(() => expect(screen.queryByText("Tarjeta de perfil")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("should start open with defaultOpen", async () => {
    render(
      <HoverCard content="Vista previa inicial" defaultOpen>
        <a href="#perfil">Perfil</a>
      </HoverCard>,
    );
    expect(await screen.findByText("Vista previa inicial")).toBeInTheDocument();
  });
});

/*
 * A consumer test that opens a layer under a fake clock and ends without running it out leaves the animation frame
 * jsdom had scheduled on that clock pending forever, so frames never run again in the file. Layers must still finish
 * leaving and unmount in the next tests, which run on real timers.
 */
describe("overlays after a test that leaves a fake clock with a pending frame", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Milliseconds the fake-clock test advances: past the hover card's open delay, mid-entrance. */
  const FAKE_CLOCK_ADVANCE_MS = 700;

  function ProfileCard() {
    return (
      <HoverCard content="Tarjeta de perfil">
        <a href="#perfil">Perfil público</a>
      </HoverCard>
    );
  }

  it("should open the hover card under a fake clock and end the test with it open", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<ProfileCard />);
    await user.hover(screen.getByText("Perfil público"));
    await act(async () => {
      vi.advanceTimersByTime(FAKE_CLOCK_ADVANCE_MS);
    });
    expect(screen.getByText("Tarjeta de perfil")).toBeInTheDocument();
  });

  it("should still remove the hover card and a popover once they close on real timers", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ProfileCard />
        <Popover>
          <PopoverTrigger asChild>
            <Button>Ver filtros</Button>
          </PopoverTrigger>
          <PopoverContent>Filtros disponibles</PopoverContent>
        </Popover>
      </>,
    );
    await user.hover(screen.getByText("Perfil público"));
    await screen.findByText("Tarjeta de perfil");
    await user.unhover(screen.getByText("Perfil público"));
    await waitFor(() => expect(screen.queryByText("Tarjeta de perfil")).toBeNull());

    await user.click(screen.getByRole("button", { name: "Ver filtros" }));
    await screen.findByText("Filtros disponibles");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Filtros disponibles")).toBeNull());
  });
});
