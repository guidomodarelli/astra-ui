/** Demonstrates the typography components on Arc's type scale through their public contracts. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Abbr,
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
  Var,
} from "@golfo/ui";
import type { HeadingLevel, HeadingSize, TextSize, TextTone } from "@golfo/ui";

/** Editable inputs specific to this example. */
type Args = {
  headingLevel: HeadingLevel;
  headingSize: HeadingSize | "default";
  textSize: TextSize;
  textTone: TextTone;
};

const meta = {
  title: "Components/Typography",
  args: {
    headingLevel: 1,
    headingSize: "default",
    textSize: "base",
    textTone: "default",
  },
  argTypes: {
    headingLevel: { control: "select", options: [1, 2, 3, 4, 5, 6] },
    headingSize: { control: "select", options: ["default", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] },
    textSize: { control: "select", options: ["xs", "sm", "base", "lg"] },
    textTone: { control: "select", options: ["default", "secondary", "muted"] },
  },
  parameters: { controls: { include: ["headingLevel", "headingSize", "textSize", "textTone"] } },
  render: ({ headingLevel, headingSize, textSize, textTone }) => (
    <div className="StoryStack">
      <Heading level={headingLevel} size={headingSize === "default" ? undefined : headingSize}>
        Tribus de lectura
      </Heading>
      <Text size={textSize} tone={textTone}>
        Un libro por mes, con <Strong>encuentros presenciales</Strong> y <Em>debates</Em> abiertos a toda la tribu.
      </Text>
    </div>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};

/** Every heading level at its default size: Geist from 30px up, Inter below. */
export const Headings: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="StoryStack">
      <Heading level={2} size="5xl">Portada</Heading>
      <Heading level={2} size="4xl">Destacado</Heading>
      <H1>Tribus de lectura</H1>
      <H2>Próximos encuentros</H2>
      <H3>Esta semana</H3>
      <H4>Jueves</H4>
      <H5>Por la tarde</H5>
      <H6>Notas</H6>
    </div>
  ),
};

/** Paragraphs, inline semantics and block text. */
export const Text_: Story = {
  name: "Text",
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="StoryStack">
      <Lead>Encontrá a la gente que comparte lo que te gusta.</Lead>
      <Text>
        Un libro por mes, con <Strong>encuentros presenciales</Strong>, <Em>debates</Em> y <Mark>novedades</Mark>. La{" "}
        <Abbr title="Interfaz de programación de aplicaciones">API</Abbr> se publicó el{" "}
        <Time dateTime="2026-10-21">21 de octubre</Time>; el precio pasó de <Del>$ 1.000</Del> a <Ins>$ 800</Ins>.
      </Text>
      <Text>
        Abrí la paleta con <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> o ejecutá <Code>pnpm dev</Code>; la consola responde{" "}
        <Samp>Listo en 1,2 s</Samp>. La fórmula es <Var>x</Var>
        <Sup>2</Sup> + H<Sub>2</Sub>O.
      </Text>
      <Text tone="secondary">
        Como dice <Cite>Rayuela</Cite>, <Q>andábamos sin buscarnos</Q>. Una <Dfn>tribu</Dfn> es un grupo con un interés
        en común. <S>Inscripción cerrada.</S>
      </Text>
      <Text size="sm" tone="muted">Actualizado hace 2 horas.</Text>
      <Small>Sujeto a disponibilidad.</Small>
      <Blockquote>Leer es viajar sin moverse.</Blockquote>
      <Pre>
        <Code>{"pnpm add @golfo/ui\npnpm dev"}</Code>
      </Pre>
    </div>
  ),
};

/** Unordered, ordered and description lists. */
export const Lists: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="StoryStack">
      <List>
        <ListItem>Cuenta verificada</ListItem>
        <ListItem>
          Perfil completo
          <List>
            <ListItem>Foto</ListItem>
            <ListItem>Descripción</ListItem>
          </List>
        </ListItem>
      </List>
      <OrderedList>
        <ListItem>Elegí una tribu</ListItem>
        <ListItem>Pedí unirte</ListItem>
        <ListItem>Esperá la aprobación</ListItem>
      </OrderedList>
      <DescriptionList>
        <div>
          <DescriptionTerm>Miembros</DescriptionTerm>
          <DescriptionDetails>128</DescriptionDetails>
        </div>
        <div>
          <DescriptionTerm>Próximo encuentro</DescriptionTerm>
          <DescriptionDetails>Jueves a las 19 h</DescriptionDetails>
        </div>
      </DescriptionList>
    </div>
  ),
};
