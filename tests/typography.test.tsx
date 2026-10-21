/** Verifies the typography components through the public barrel: semantics, Arc's variants and native attributes. */
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import {
  Abbr,
  Address,
  B,
  Blockquote,
  Cite,
  Code,
  Del,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Dfn,
  Em,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Heading,
  I,
  Ins,
  Kbd,
  Lead,
  List,
  ListItem,
  Mark,
  OrderedList,
  Pre,
  Q,
  S,
  Samp,
  Small,
  Strong,
  Sub,
  Sup,
  Text,
  Time,
  U,
  Var,
} from "@golfo/ui";

describe("Heading", () => {
  it("should render each shortcut as its outline level with Arc's default size", () => {
    // Arrange
    render(
      <>
        <H1>Tribus</H1>
        <H2>Próximos encuentros</H2>
        <H3>Esta semana</H3>
        <H4>Jueves</H4>
        <H5>Por la tarde</H5>
        <H6>Notas</H6>
      </>,
    );

    // Act
    const headings = screen.getAllByRole("heading");

    // Assert
    expect(headings.map((heading) => heading.tagName)).toEqual(["H1", "H2", "H3", "H4", "H5", "H6"]);
    expect(headings.map((heading) => heading.dataset.size)).toEqual(["3xl", "2xl", "xl", "lg", "base", "sm"]);
  });

  it("should keep the outline level when a different visual size is chosen", () => {
    // Arrange
    render(
      <Heading level={1} size="lg" id="page-title" className="consumer-heading">
        Configuración
      </Heading>,
    );

    // Act
    const heading = screen.getByRole("heading", { level: 1, name: "Configuración" });

    // Assert
    expect(heading).toHaveAttribute("data-size", "lg");
    expect(heading).toHaveAttribute("id", "page-title");
    expect(heading).toHaveClass("consumer-heading");
  });

  it("should default to a level 2 heading", () => {
    // Arrange
    render(<Heading>Resumen</Heading>);

    // Act
    const heading = screen.getByRole("heading", { name: "Resumen" });

    // Assert
    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveAttribute("data-size", "2xl");
  });
});

describe("Block text", () => {
  it("should render paragraphs with the size and tone they are given", () => {
    // Arrange
    render(
      <>
        <Text>Un libro por mes.</Text>
        <Text size="sm" tone="muted" data-testid="muted-text">
          Actualizado hoy.
        </Text>
        <Lead>Encontrá tu próxima tribu.</Lead>
      </>,
    );

    // Act
    const defaultText = screen.getByText("Un libro por mes.");
    const mutedText = screen.getByTestId("muted-text");
    const lead = screen.getByText("Encontrá tu próxima tribu.");

    // Assert
    expect(defaultText.tagName).toBe("P");
    expect(defaultText).toHaveAttribute("data-size", "base");
    expect(defaultText).toHaveAttribute("data-tone", "default");
    expect(mutedText).toHaveAttribute("data-size", "sm");
    expect(mutedText).toHaveAttribute("data-tone", "muted");
    expect(lead.tagName).toBe("P");
    expect(lead).toHaveAttribute("data-slot", "lead");
  });

  it("should render fine print, quotations, preformatted text and addresses with their native elements", () => {
    // Arrange
    render(
      <>
        <Small>Sujeto a disponibilidad.</Small>
        <Blockquote cite="https://example.com/fuente">Leer es viajar sin moverse.</Blockquote>
        <Pre>
          <Code>pnpm add @golfo/ui</Code>
        </Pre>
        <Address>Calle Falsa 123</Address>
      </>,
    );

    // Act
    const small = screen.getByText("Sujeto a disponibilidad.");
    const blockquote = screen.getByText("Leer es viajar sin moverse.");
    const code = screen.getByText("pnpm add @golfo/ui");
    const address = screen.getByText("Calle Falsa 123");

    // Assert
    expect(small.tagName).toBe("SMALL");
    expect(small).toHaveAttribute("data-tone", "secondary");
    expect(blockquote.tagName).toBe("BLOCKQUOTE");
    expect(blockquote).toHaveAttribute("cite", "https://example.com/fuente");
    expect(code.tagName).toBe("CODE");
    expect(code.parentElement?.tagName).toBe("PRE");
    expect(address.tagName).toBe("ADDRESS");
  });

  it("should forward refs to the rendered element", () => {
    // Arrange
    const paragraphRef = createRef<HTMLParagraphElement>();
    const headingRef = createRef<HTMLHeadingElement>();

    // Act
    render(
      <>
        <Text ref={paragraphRef}>Texto</Text>
        <H3 ref={headingRef}>Título</H3>
      </>,
    );

    // Assert
    expect(paragraphRef.current?.tagName).toBe("P");
    expect(headingRef.current?.tagName).toBe("H3");
  });
});

describe("Inline text", () => {
  it("should render every inline component with its semantic element and a stable slot", () => {
    // Arrange
    const inlineCases = [
      { Component: Strong, tag: "STRONG", slot: "strong" },
      { Component: B, tag: "B", slot: "b" },
      { Component: Em, tag: "EM", slot: "em" },
      { Component: I, tag: "I", slot: "i" },
      { Component: U, tag: "U", slot: "u" },
      { Component: S, tag: "S", slot: "s" },
      { Component: Del, tag: "DEL", slot: "del" },
      { Component: Ins, tag: "INS", slot: "ins" },
      { Component: Mark, tag: "MARK", slot: "mark" },
      { Component: Code, tag: "CODE", slot: "code" },
      { Component: Kbd, tag: "KBD", slot: "kbd" },
      { Component: Samp, tag: "SAMP", slot: "samp" },
      { Component: Var, tag: "VAR", slot: "var" },
      { Component: Abbr, tag: "ABBR", slot: "abbr" },
      { Component: Cite, tag: "CITE", slot: "cite" },
      { Component: Dfn, tag: "DFN", slot: "dfn" },
      { Component: Q, tag: "Q", slot: "q" },
      { Component: Sub, tag: "SUB", slot: "sub" },
      { Component: Sup, tag: "SUP", slot: "sup" },
      { Component: Time, tag: "TIME", slot: "time" },
    ];
    render(
      <p data-testid="paragraph">
        {inlineCases.map(({ Component, slot }) => (
          <Component key={slot} className="consumer-inline">
            {slot}
          </Component>
        ))}
      </p>,
    );

    // Act
    const paragraph = screen.getByTestId("paragraph");

    // Assert
    for (const { tag, slot } of inlineCases) {
      const element = paragraph.querySelector(`[data-slot="${slot}"]`);
      expect(element?.tagName).toBe(tag);
      expect(element).toHaveTextContent(slot);
      expect(element).toHaveClass("consumer-inline");
    }
  });

  it("should pass native attributes through, such as an abbreviation's expansion and a machine-readable date", () => {
    // Arrange
    render(
      <Text>
        <Abbr title="Interfaz de programación de aplicaciones">API</Abbr> publicada el{" "}
        <Time dateTime="2026-10-21">21 de octubre</Time>
      </Text>,
    );

    // Act
    const abbreviation = screen.getByTitle("Interfaz de programación de aplicaciones");
    const time = screen.getByText("21 de octubre");

    // Assert
    expect(abbreviation).toHaveTextContent("API");
    expect(time).toHaveAttribute("datetime", "2026-10-21");
  });

  it("should render key caps in Arc's two heights", () => {
    // Arrange
    render(
      <Text>
        <Kbd>Ctrl</Kbd> + <Kbd size="sm">K</Kbd>
      </Text>,
    );

    // Act
    const control = screen.getByText("Ctrl");
    const letter = screen.getByText("K");

    // Assert
    expect(control).toHaveAttribute("data-size", "md");
    expect(letter).toHaveAttribute("data-size", "sm");
  });
});

describe("Lists", () => {
  it("should render unordered and ordered lists with their items", () => {
    // Arrange
    render(
      <>
        <List aria-label="Requisitos">
          <ListItem>Cuenta verificada</ListItem>
          <ListItem>Perfil completo</ListItem>
        </List>
        <OrderedList aria-label="Pasos" start={3}>
          <ListItem>Elegí una tribu</ListItem>
        </OrderedList>
        <List aria-label="Sin viñetas" marker="none">
          <ListItem>Opción</ListItem>
        </List>
      </>,
    );

    // Act
    const requirements = screen.getByRole("list", { name: "Requisitos" });
    const steps = screen.getByRole("list", { name: "Pasos" });
    const plainList = screen.getByRole("list", { name: "Sin viñetas" });

    // Assert
    expect(requirements.tagName).toBe("UL");
    expect(requirements).toHaveAttribute("data-marker", "disc");
    expect(within(requirements).getAllByRole("listitem")).toHaveLength(2);
    expect(steps.tagName).toBe("OL");
    expect(steps).toHaveAttribute("start", "3");
    expect(plainList).toHaveAttribute("data-marker", "none");
  });

  it("should pair description terms with their details", () => {
    // Arrange
    render(
      <DescriptionList aria-label="Datos de la tribu">
        <div>
          <DescriptionTerm>Miembros</DescriptionTerm>
          <DescriptionDetails>128</DescriptionDetails>
        </div>
      </DescriptionList>,
    );

    // Act
    const term = screen.getByRole("term");
    const definition = screen.getByRole("definition");

    // Assert
    expect(term).toHaveTextContent("Miembros");
    expect(definition).toHaveTextContent("128");
    expect(term.closest("dl")).toHaveAttribute("aria-label", "Datos de la tribu");
  });
});
