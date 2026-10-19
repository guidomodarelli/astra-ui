import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Stepper } from "@astra-kit/ui";

const STEPS = [
  { id: "upload", label: "Subir archivo", description: "CSV con correos" },
  { id: "review", label: "Revisar", description: "Confirmá las filas válidas" },
  { id: "activate", label: "Activar" },
];

describe("Stepper", () => {
  it("should be a read-only group with Spanish statuses and mark the current step", () => {
    // Arrange
    render(<Stepper steps={STEPS} current={1} />);

    // Act
    const stepper = screen.getByRole("group", { name: "Progreso" });
    const items = within(stepper).getAllByRole("listitem");

    // Assert
    expect(within(stepper).queryAllByRole("button")).toHaveLength(0);
    expect(items[0]).toHaveTextContent("Subir archivo, Completado");
    expect(items[1]!.querySelector("[aria-current=step]")).toHaveTextContent("Revisar");
    expect(items[2]).toHaveTextContent("Activar, Sin empezar");
    expect(screen.getByText("Paso 2 de 3: Revisar")).toBeInTheDocument();
  });

  it("should become a nav where only completed steps can be chosen", async () => {
    // Arrange
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    render(<Stepper steps={STEPS} current={2} onStepSelect={onStepSelect} label="Importación" />);
    const nav = screen.getByRole("navigation", { name: "Importación" });
    const [upload, review, activate] = within(nav).getAllByRole("button");

    // Act
    await user.click(review!);
    await user.click(activate!);

    // Assert
    expect(onStepSelect).toHaveBeenCalledTimes(1);
    expect(onStepSelect).toHaveBeenCalledWith(1);
    expect(upload).not.toHaveAttribute("aria-disabled");
    expect(activate).toHaveAttribute("aria-disabled", "true");
    expect(activate).toHaveAttribute("aria-current", "step");
  });

  it("should keep the current step in the tab order and take only upcoming steps out of it", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Stepper steps={STEPS} current={1} onStepSelect={vi.fn()} />);
    const [upload, review, activate] = screen.getAllByRole("button");

    // Act
    upload!.focus();
    await user.keyboard("{End}");

    // Assert
    expect(review).toHaveFocus();
    expect(review).not.toHaveAttribute("tabindex");
    expect(activate).toHaveAttribute("tabindex", "-1");
    await user.tab({ shift: true });
    expect(upload).toHaveFocus();
    await user.tab();
    expect(review).toHaveFocus();
  });

  it("should move focus between reachable steps with the arrows, Home and End", async () => {
    // Arrange
    const user = userEvent.setup();
    const onStepSelect = vi.fn();
    render(<Stepper steps={STEPS} current={2} onStepSelect={onStepSelect} />);
    const [upload, review, activate] = screen.getAllByRole("button");

    // Act
    upload!.focus();
    await user.keyboard("{ArrowRight}");

    // Assert
    expect(review).toHaveFocus();
    await user.keyboard("{End}");
    expect(activate).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(review).toHaveFocus();
    await user.keyboard("{Home}");
    expect(upload).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onStepSelect).toHaveBeenCalledWith(0);
  });

  it("should replace the description with the error of a failed step", () => {
    // Arrange
    render(<Stepper steps={[STEPS[0]!, { ...STEPS[1]!, error: "Hay 3 filas inválidas" }, STEPS[2]!]} current={1} />);

    // Act
    const failed = screen.getAllByRole("listitem")[1]!;

    // Assert
    expect(failed).toHaveAttribute("data-status", "error");
    expect(failed).toHaveTextContent("Revisar, Error");
    expect(failed).toHaveTextContent("Hay 3 filas inválidas");
    expect(failed).not.toHaveTextContent("Confirmá las filas válidas");
  });

  it("should show only the current description when details is current", () => {
    // Arrange
    render(<Stepper steps={STEPS} current={0} details="current" orientation="vertical" />);

    // Act
    const items = screen.getAllByRole("listitem");

    // Assert
    expect(items[0]).toHaveTextContent("CSV con correos");
    expect(items[1]).not.toHaveTextContent("Confirmá las filas válidas");
  });

  it("should announce completion and accept replacement copy", () => {
    // Arrange
    render(
      <Stepper
        steps={STEPS}
        current={3}
        completeLabel="Importación lista"
        messages={{ completed: "Done", stepAnnouncement: ({ position, count }) => `${position}/${count}` }}
      />,
    );

    // Act
    const items = screen.getAllByRole("listitem");

    // Assert
    expect(items.every((item) => item.getAttribute("data-status") === "complete")).toBe(true);
    expect(items[0]).toHaveTextContent("Subir archivo, Done");
    expect(screen.getAllByText("Importación lista").length).toBeGreaterThan(0);
  });
});
