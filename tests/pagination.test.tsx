/** Covers Arc's Pagination contract: Spanish defaults, the current page and link adapters. */
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  type BeezLinkProps,
} from "beez-ui";

describe("Pagination", () => {
  it("should name the landmark, arrows and hidden pages in Spanish by default", () => {
    // Arrange & Act
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="/pagina/1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/pagina/3" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    // Assert
    expect(screen.getByRole("navigation", { name: "Paginación" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a la página anterior" })).toHaveTextContent("Anterior");
    expect(screen.getByRole("link", { name: "Ir a la página siguiente" })).toHaveTextContent("Siguiente");
    expect(screen.getByText("Más páginas")).toBeInTheDocument();
  });

  it("should mark only the active page as current and keep consumer labels", () => {
    // Arrange & Act
    render(
      <Pagination aria-label="Páginas de resultados">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="/pagina/1">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="/pagina/2" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="/pagina/3" text="Más" aria-label="Ver más resultados" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );

    // Assert
    expect(screen.getByRole("navigation", { name: "Páginas de resultados" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Ver más resultados" })).toHaveTextContent("Más");
  });

  it("should never navigate from a disabled link, whether clicked or activated with Enter", async () => {
    // Arrange
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onClick = vi.fn();
    /** Router link that, like the Next.js and TanStack ones, skips clicks a handler already prevented. */
    function RouterLink({ href, onClick: handleClick, ...props }: BeezLinkProps) {
      return (
        <a
          {...props}
          href={href}
          onClick={(event) => {
            handleClick?.(event);
            if (event.defaultPrevented) return;
            event.preventDefault();
            onNavigate(href);
          }}
        />
      );
    }
    render(
      <>
        <PaginationNext component={RouterLink} href="/pagina/3" aria-disabled="true" onClick={onClick} />
        <PaginationLink href="/pagina/9" aria-disabled onClick={onClick}>
          9
        </PaginationLink>
      </>,
    );
    const nativeClicks: MouseEvent[] = [];
    const listening = new AbortController();
    document.addEventListener("click", (event) => nativeClicks.push(event), { signal: listening.signal });

    // Act
    screen.getByRole("link", { name: "Ir a la página siguiente" }).focus();
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("link", { name: "Ir a la página siguiente" }));
    screen.getByRole("link", { name: "9" }).focus();
    await user.keyboard("{Enter}");

    // Assert
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
    expect(nativeClicks.length).toBeGreaterThan(0);
    expect(nativeClicks.every((event) => event.defaultPrevented)).toBe(true);
    listening.abort();
  });

  it("should navigate through a per-link component and forward the arrow ref to its anchor", async () => {
    // Arrange
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const nextRef = createRef<HTMLAnchorElement>();
    /** Router link that intercepts navigation, as the Next.js or TanStack adapters do. */
    function RouterLink({ href, onClick, ...props }: BeezLinkProps) {
      return (
        <a
          {...props}
          href={href}
          data-router="true"
          onClick={(event) => {
            onClick?.(event);
            event.preventDefault();
            onNavigate(href);
          }}
        />
      );
    }
    render(<PaginationNext ref={nextRef} component={RouterLink} href="/pagina/2" />);

    // Act
    await user.click(screen.getByRole("link", { name: "Ir a la página siguiente" }));

    // Assert
    expect(onNavigate).toHaveBeenCalledWith("/pagina/2");
    expect(nextRef.current).toBe(screen.getByRole("link", { name: "Ir a la página siguiente" }));
    expect(nextRef.current).toHaveAttribute("data-router", "true");
  });
});
