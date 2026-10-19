/** Exercises framework-neutral adapters through the public orchestration boundary. */
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Avatar, GolfoUIProvider, Pagination } from "@golfo/ui";

/** Models a consumer-owned router without mocking a library implementation. */
function ConsumerLink(props: ComponentProps<"a">) {
  return <a data-router="consumer" {...props} />;
}

/** Models a consumer-owned image renderer and forwards native browser events. */
function ConsumerImage(props: ComponentProps<"img">) {
  return <img data-image-adapter="consumer" {...props} />;
}

describe("GolfoUIProvider", () => {
  it("should render a native link without an orchestrator", () => {
    render(<Pagination page={1} pageCount={2} getHref={(page) => `/page/${page}`} />);
    expect(screen.getByRole("link", { name: "Página 2" })).toHaveAttribute("href", "/page/2");
    expect(screen.getByRole("link", { name: "Página 2" })).not.toHaveAttribute("data-router");
  });

  it("should apply the consumer adapters while preserving the image lifecycle", () => {
    render(<GolfoUIProvider components={{ Link: ConsumerLink, Image: ConsumerImage }}><Pagination page={1} pageCount={2} getHref={(page) => `/page/${page}`} /><Avatar name="Perfil" src="/profile.png" /></GolfoUIProvider>);
    expect(screen.getByRole("link", { name: "Página 2" })).toHaveAttribute("data-router", "consumer");
    const image = screen.getByRole("img", { name: "Perfil" }).querySelector("img")!;
    expect(image).toHaveAttribute("data-image-adapter", "consumer");
    fireEvent.load(image);
    expect(screen.queryByText("P")).not.toBeInTheDocument();
    fireEvent.error(image);
    expect(screen.getByText("P")).toBeInTheDocument();
  });
});
