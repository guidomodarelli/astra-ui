import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Timeline } from "@golfo/ui";
import type { TimelineEvent } from "@golfo/ui";

/** Reference time: 22 Sep 2026, 12:00 UTC. */
const NOW = Date.UTC(2026, 8, 22, 12);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const EVENTS: TimelineEvent[] = [
  { id: "created", at: NOW - 26 * HOUR, actor: "Ana", title: "envió la solicitud" },
  { id: "approved", at: NOW - 5 * MINUTE, actor: "Martín", title: "aprobó la solicitud", tone: "success", detail: <p>Cupo asignado.</p> },
  { id: "code", at: NOW - 2 * HOUR, title: "Se envió el código de acceso", meta: "WhatsApp", detail: <p>Entregado.</p> },
  { id: "reviewed", at: NOW - 30 * HOUR, actor: "Martín", title: "pidió más datos" },
];

describe("Timeline", () => {
  it("should group events by day under Spanish day headings, newest first", () => {
    // Arrange
    render(<Timeline events={EVENTS} now={NOW} label="Historial de la solicitud" />);

    // Act
    const feed = screen.getByRole("region", { name: "Historial de la solicitud" });
    const headings = within(feed).getAllByRole("heading", { level: 3 });

    // Assert
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Hoy2 actualizaciones, 2 actualizaciones",
      "Ayer2 actualizaciones, 2 actualizaciones",
    ]);
    expect(within(feed).getAllByRole("listitem").map((item) => item.querySelector("[data-slot=timeline-title]")?.textContent)).toEqual([
      "Martín aprobó la solicitud",
      "Se envió el código de acceso",
      "Ana envió la solicitud",
      "Martín pidió más datos",
    ]);
  });

  it("should show relative times today and spell them out for screen readers", () => {
    // Arrange
    render(<Timeline events={EVENTS} now={NOW} label="Historial" />);

    // Act
    const times = screen.getAllByRole("listitem").map((item) => item.querySelector("time"));

    // Assert
    expect(times[0]).toHaveTextContent("5 min");
    expect(times[0]).toHaveTextContent("hace 5 minutos, martes, 22 de septiembre");
    expect(times[1]).toHaveTextContent("2 h");
    expect(times[0]).toHaveAttribute("datetime", new Date(NOW - 5 * MINUTE).toISOString());
  });

  it("should make only rows with detail expandable and toggle them with a click", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Timeline events={EVENTS} now={NOW} label="Historial" />);
    const triggers = screen.getAllByRole("button");
    expect(triggers).toHaveLength(2);

    // Act
    await user.click(screen.getByRole("button", { name: /aprobó la solicitud/ }));

    // Assert
    const trigger = screen.getByRole("button", { name: /aprobó la solicitud/ });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(trigger.getAttribute("aria-controls")!)).toHaveTextContent("Cupo asignado.");
  });

  it("should move between expandable rows with the arrows, Home and End", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Timeline events={EVENTS} now={NOW} label="Historial" defaultExpanded={["code"]} />);
    const [approved, code] = screen.getAllByRole("button");

    // Act
    approved!.focus();
    await user.keyboard("{ArrowDown}");

    // Assert
    expect(code).toHaveFocus();
    expect(code).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Home}");
    expect(approved).toHaveFocus();
    await user.keyboard("{End}");
    expect(code).toHaveFocus();
  });

  it("should announce updates that arrive after the first render", () => {
    // Arrange
    const { rerender } = render(<Timeline events={EVENTS} now={NOW} label="Historial" />);

    // Act
    rerender(<Timeline events={[...EVENTS, { id: "joined", at: NOW, actor: "Ana", title: "ingresó a la academia" }]} now={NOW} label="Historial" />);

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent("Nueva actualización: Ana ingresó a la academia");
  });

  it("should use the heading level, locale and copy passed in", () => {
    // Arrange
    render(
      <Timeline
        events={EVENTS}
        now={NOW}
        label="History"
        locale="en-US"
        headingLevel={2}
        messages={{ today: "Today", yesterday: "Yesterday", updates: (count) => (count === 1 ? "update" : "updates"), minutesShort: (minutes) => `${minutes}m` }}
      />,
    );

    // Act
    const headings = screen.getAllByRole("heading", { level: 2 });

    // Assert
    expect(headings[0]).toHaveTextContent("Today2 updates");
    expect(headings[1]).toHaveTextContent("Yesterday");
    expect(screen.getAllByRole("listitem")[0]!.querySelector("time")).toHaveTextContent("5m");
  });

  it("should label the previous calendar day as yesterday across a daylight-saving change", () => {
    // Arrange: 9 March 2026, 00:30 in New York (EDT), the day after clocks moved forward.
    const now = Date.UTC(2026, 2, 9, 4, 30);
    const events: TimelineEvent[] = [{ id: "sunday", at: Date.UTC(2026, 2, 8, 15), actor: "Ana", title: "envió la solicitud" }];

    // Act
    render(<Timeline events={events} now={now} label="Historial" timeZone="America/New_York" />);

    // Assert
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(/^Ayer/);
  });

  it("should announce a repeated update summary again with a new node", () => {
    // Arrange
    const { rerender } = render(<Timeline events={EVENTS} now={NOW} label="Historial" />);
    const first = { id: "note-1", at: NOW, actor: "Ana", title: "agregó una nota" };
    rerender(<Timeline events={[...EVENTS, first]} now={NOW} label="Historial" />);
    const firstNode = screen.getByRole("status").firstElementChild;

    // Act
    rerender(<Timeline events={[...EVENTS, first, { ...first, id: "note-2" }]} now={NOW} label="Historial" />);

    // Assert
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Nueva actualización: Ana agregó una nota");
    expect(status.firstElementChild).not.toBe(firstNode);
  });
});
