/** Exercises Arc's Tooltip, Popover and Hover Card through their public composition and Arc's additions. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardProfile,
  HoverCardTrigger,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "beez-ui";

/** Emulates a user who prefers reduced motion, through the matchMedia shim of the test setup. */
function preferReducedMotion() {
  const nativeMatchMedia = window.matchMedia;
  return vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
    ...nativeMatchMedia(query),
    matches: query.includes("prefers-reduced-motion"),
  }));
}

describe("Tooltip", () => {
  it("should open on keyboard focus without a TooltipProvider around it", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip>
        <TooltipTrigger asChild>
          <Button>Guardar</Button>
        </TooltipTrigger>
        <TooltipContent>Guardá los cambios pendientes</TooltipContent>
      </Tooltip>,
    );
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Guardá los cambios pendientes");
  });

  it("should turn its only child into the trigger with the content shorthand", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip content="Copiar enlace" side="bottom">
          <Button>Compartir</Button>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Compartir" });
    expect(trigger).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Copiar enlace");
    expect(trigger).toHaveAttribute("aria-describedby");
    expect(document.querySelector("[data-slot=tooltip-content]")).toHaveAttribute("data-side", "bottom");
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
    await waitFor(() => expect(document.querySelector("[data-slot=tooltip-content]")).not.toBeInTheDocument());
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

  it("should leave no inline transform or opacity behind when motion is reduced", async () => {
    const reducedMotion = preferReducedMotion();
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Opciones</Button>
        </PopoverTrigger>
        <PopoverContent>Opciones de vista</PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Opciones" }));
    const panel = screen.getByText("Opciones de vista");
    await waitFor(() => {
      expect(panel.style.transform).toBe("");
      expect(panel.style.opacity).toBe("");
    });
    reducedMotion.mockRestore();
  });
});

describe("HoverCard", () => {
  it("should open on keyboard focus and describe a person with HoverCardProfile", async () => {
    const user = userEvent.setup();
    render(
      <HoverCard>
        <HoverCardTrigger href="#perfil">Ana Pérez</HoverCardTrigger>
        <HoverCardContent>
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
        </HoverCardContent>
      </HoverCard>,
    );
    await user.tab();
    expect(await screen.findByText("Diseñadora de producto, Pagos")).toBeInTheDocument();
    expect(screen.getByText("AP")).toBeInTheDocument();
    expect(screen.getByText("Diseña flujos de cobro.")).toBeInTheDocument();
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["Seguidores", "Proyectos"]);
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("Buenos Aires")).toBeInTheDocument();
  });

  it("should render a portrait instead of initials when the profile has an avatar URL", async () => {
    render(
      <HoverCard open>
        <HoverCardTrigger href="#perfil">Luis</HoverCardTrigger>
        <HoverCardContent>
          <HoverCardProfile name="Luis Gómez" avatar="/retrato.png" />
        </HoverCardContent>
      </HoverCard>,
    );
    const content = await screen.findByText("Luis Gómez");
    const portrait = content.closest("[data-slot=hover-card-profile]")?.querySelector("img");
    expect(portrait).toHaveAttribute("src", "/retrato.png");
    expect(screen.queryByText("LG")).not.toBeInTheDocument();
  });

  it("should close once keyboard focus leaves the trigger and the close delay passes", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <HoverCard onOpenChange={onOpenChange}>
        <HoverCardTrigger href="#perfil">Perfil público</HoverCardTrigger>
        <HoverCardContent>Tarjeta de perfil</HoverCardContent>
      </HoverCard>,
    );
    await user.tab();
    await screen.findByText("Tarjeta de perfil");
    await user.tab();
    await waitFor(() => expect(screen.queryByText("Tarjeta de perfil")).not.toBeInTheDocument());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
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
      <HoverCard>
        <HoverCardTrigger href="#perfil">Perfil público</HoverCardTrigger>
        <HoverCardContent>Tarjeta de perfil</HoverCardContent>
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
