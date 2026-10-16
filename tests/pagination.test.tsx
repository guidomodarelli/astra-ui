/** Covers Arc's Pagination contract: the five page window, Spanish copy, buttons, links and cursor pages. */
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BeezUIProvider, Pagination, type BeezLinkProps } from "beez-ui";

/**
 * Reads the page numbers the navigation currently shows.
 * @returns The visible page numbers, in order.
 */
function visiblePages(): string[] {
  return screen.getAllByRole("button", { name: /^Página \d+$/ }).map((button) => button.textContent ?? "");
}

describe("Pagination", () => {
  it("should name the landmark, pages and arrows in Spanish by default", () => {
    render(<Pagination page={2} pageCount={5} onPageChange={() => {}} />);

    const navigation = screen.getByRole("navigation", { name: "Paginación" });
    expect(within(navigation).getByRole("button", { name: "Ir a la página anterior" })).toHaveTextContent("Anterior");
    expect(within(navigation).getByRole("button", { name: "Ir a la página siguiente" })).toHaveTextContent("Siguiente");
    expect(within(navigation).getByRole("button", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByRole("button", { name: "Página 1" })).not.toHaveAttribute("aria-current");
  });

  it("should slide a five page window around the current page and clamp it at the ends", () => {
    const { rerender } = render(<Pagination page={7} pageCount={12} onPageChange={() => {}} />);
    expect(visiblePages()).toEqual(["5", "6", "7", "8", "9"]);

    rerender(<Pagination page={1} pageCount={12} onPageChange={() => {}} />);
    expect(visiblePages()).toEqual(["1", "2", "3", "4", "5"]);

    rerender(<Pagination page={40} pageCount={12} onPageChange={() => {}} />);
    expect(visiblePages()).toEqual(["8", "9", "10", "11", "12"]);
    expect(screen.getByRole("button", { name: "Página 12" })).toHaveAttribute("aria-current", "page");

    rerender(<Pagination page={2} pageCount={3} onPageChange={() => {}} />);
    expect(visiblePages()).toEqual(["1", "2", "3"]);
  });

  it("should request pages from the numbers and arrows", async () => {
    // Arrange
    const user = userEvent.setup();
    function Stateful() {
      const [page, setPage] = useState(1);
      return <Pagination page={page} pageCount={8} onPageChange={setPage} />;
    }
    render(<Stateful />);

    // Act & Assert
    await user.click(screen.getByRole("button", { name: "Ir a la página siguiente" }));
    expect(screen.getByRole("button", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Página 4" }));
    expect(screen.getByRole("button", { name: "Página 4" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Ir a la página anterior" }));
    expect(screen.getByRole("button", { name: "Página 3" })).toHaveAttribute("aria-current", "page");
  });

  it("should disable the arrows at the ends without requesting a page", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} />);
    const previous = screen.getByRole("button", { name: "Ir a la página anterior" });

    // Act & Assert
    expect(previous).toHaveAttribute("aria-disabled", "true");
    await user.click(previous);
    previous.focus();
    await user.keyboard("{Enter}");
    rerender(<Pagination page={3} pageCount={3} onPageChange={onPageChange} />);
    const next = screen.getByRole("button", { name: "Ir a la página siguiente" });
    expect(next).toHaveAttribute("aria-disabled", "true");
    await user.click(next);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("should render an empty landmark without pages", () => {
    render(<Pagination page={1} pageCount={0} onPageChange={() => {}} label="Resultados" />);

    expect(screen.getByRole("navigation", { name: "Resultados" })).toBeEmptyDOMElement();
  });

  it("should render links through the provider's Link and still report the page", async () => {
    // Arrange
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onPageChange = vi.fn();
    /** Router link that intercepts navigation, as the Next.js or TanStack adapters do. */
    function RouterLink({ href, onClick, ...props }: BeezLinkProps) {
      return (
        <a
          {...props}
          href={href}
          data-router="true"
          onClick={(event) => {
            onClick?.(event);
            if (event.defaultPrevented) return;
            event.preventDefault();
            onNavigate(href);
          }}
        />
      );
    }
    render(
      <BeezUIProvider components={{ Link: RouterLink }}>
        <Pagination page={1} pageCount={4} getHref={(page) => `/eventos?pagina=${page}`} onPageChange={onPageChange} />
      </BeezUIProvider>,
    );

    // Act
    await user.click(screen.getByRole("link", { name: "Página 3" }));
    await user.click(screen.getByRole("link", { name: "Ir a la página anterior" }));

    // Assert
    expect(screen.getByRole("link", { name: "Página 3" })).toHaveAttribute("href", "/eventos?pagina=3");
    expect(screen.getByRole("link", { name: "Página 3" })).toHaveAttribute("data-router", "true");
    expect(screen.getByRole("link", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Ir a la página siguiente" })).toHaveAttribute("href", "/eventos?pagina=2");
    expect(screen.getByRole("link", { name: "Ir a la página anterior" })).toHaveAttribute("aria-disabled", "true");
    expect(onNavigate.mock.calls).toEqual([["/eventos?pagina=3"]]);
    expect(onPageChange.mock.calls.map(([requestedPage]) => requestedPage)).toEqual([3]);
  });

  it("should page by cursor with only the arrows when there is no page count", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={1} hasNextPage onPageChange={onPageChange} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Ir a la página anterior" }));
    await user.click(screen.getByRole("button", { name: "Ir a la página siguiente" }));
    rerender(<Pagination page={2} hasNextPage={false} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "Ir a la página siguiente" }));
    await user.click(screen.getByRole("button", { name: "Ir a la página anterior" }));

    // Assert
    expect(screen.queryByRole("button", { name: /^Página \d+$/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir a la página siguiente" })).toHaveAttribute("aria-disabled", "true");
    expect(onPageChange.mock.calls.map(([requestedPage]) => requestedPage)).toEqual([2, 1]);
  });

  it("should use custom arrow labels as their visible text and accessible name", () => {
    render(
      <Pagination
        page={2}
        pageCount={3}
        onPageChange={() => {}}
        previousLabel="Más recientes"
        nextLabel="Más antiguos"
        className="pagination-extra"
      />,
    );

    expect(screen.getByRole("button", { name: "Más recientes" })).toHaveTextContent("Más recientes");
    expect(screen.getByRole("button", { name: "Más antiguos" })).toHaveTextContent("Más antiguos");
    expect(screen.getByRole("navigation")).toHaveClass("pagination-extra");
  });
});

describe("Pagination click event", () => {
  it("should hand the click event to onPageChange so a plain click on a link can stay in place", async () => {
    // Arrange
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const requestedPages: number[] = [];
    /** Router link that skips prevented clicks, as the Next.js and TanStack adapters do. */
    function RouterLink({ href, onClick, ...props }: BeezLinkProps) {
      return (
        <a
          {...props}
          href={href}
          onClick={(event) => {
            onClick?.(event);
            if (event.defaultPrevented) return;
            event.preventDefault();
            onNavigate(href);
          }}
        />
      );
    }
    render(
      <BeezUIProvider components={{ Link: RouterLink }}>
        <Pagination
          page={2}
          pageCount={4}
          getHref={(page) => `/ronda?pagina=${page}`}
          onPageChange={(page, event) => {
            // Plain clicks stay in place; the first page is left to the router.
            if (page !== 1) event.preventDefault();
            requestedPages.push(page);
          }}
        />
      </BeezUIProvider>,
    );

    // Act
    await user.click(screen.getByRole("link", { name: "Página 3" }));
    await user.click(screen.getByRole("link", { name: "Ir a la página siguiente" }));
    await user.click(screen.getByRole("link", { name: "Ir a la página anterior" }));

    // Assert
    expect(requestedPages).toEqual([3, 3, 1]);
    expect(onNavigate.mock.calls).toEqual([["/ronda?pagina=1"]]);
  });

  it("should hand the click event to onPageChange from page and arrow buttons", async () => {
    // Arrange
    const user = userEvent.setup();
    const requests: Array<[number, string, string | undefined]> = [];
    render(
      <Pagination
        page={2}
        pageCount={4}
        onPageChange={(page, event) => requests.push([page, event.type, event.currentTarget.getAttribute("aria-label") ?? undefined])}
      />,
    );

    // Act
    await user.click(screen.getByRole("button", { name: "Página 4" }));
    await user.click(screen.getByRole("button", { name: "Ir a la página anterior" }));

    // Assert
    expect(requests).toEqual([
      [4, "click", "Página 4"],
      [1, "click", "Ir a la página anterior"],
    ]);
  });
});
