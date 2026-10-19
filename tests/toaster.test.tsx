/** Checks the public `Toaster` keeps Sonner's props and look while adding @astra-kit/ui's modal behavior. */
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ThemedToaster, Toaster, toast } from "@astra-kit/ui";
import { Toaster as SubpathToaster } from "@astra-kit/ui/sonner";

afterEach(() => {
  act(() => { toast.dismiss(); });
});

/**
 * Shows a toast and returns the toast list it lands in.
 * @param container - Element the toaster rendered into.
 * @returns The Sonner toast list.
 */
async function showToast(container: HTMLElement) {
  act(() => { toast.error("No se pudo guardar"); });
  await screen.findByText("No se pudo guardar");
  return container.querySelector("[data-sonner-toaster]")!;
}

describe("Toaster", () => {
  it("should be the same component from the root barrel and the sonner subpath", () => {
    expect(SubpathToaster).toBe(Toaster);
  });

  it("should apply the consumer's Sonner props and add only the modal pointer class next to theirs", async () => {
    const { container } = render(
      <Toaster className="consumer-toaster" closeButton position="top-center" richColors theme="dark" />,
    );
    const toaster = await showToast(container);
    expect([...toaster.classList].sort()).toEqual(["consumer-toaster", "pointer-events-auto"]);
    expect(toaster).toHaveAttribute("data-sonner-theme", "dark");
    expect(toaster).toHaveAttribute("data-y-position", "top");
    expect(toaster).toHaveAttribute("data-x-position", "center");
    expect(toaster.querySelector("[data-sonner-toast]")).toHaveAttribute("data-rich-colors", "true");
    expect(screen.getByRole("button", { name: "Close toast" })).toBeInTheDocument();
  });

  it("should forward its ref to Sonner's toast region", () => {
    const ref = createRef<HTMLElement>();
    render(<Toaster ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveAttribute("aria-label", expect.stringContaining("Notifications"));
  });

  it("should keep the themed toaster's classes on top of the shared behavior", async () => {
    const { container } = render(<ThemedToaster theme="light" className="consumer-toaster" />);
    const toaster = await showToast(container);
    expect(toaster).toHaveClass("toaster", "group", "pointer-events-auto", "consumer-toaster");
  });
});
