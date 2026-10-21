/** Mounts the typography components from the public barrel, so fonts, sizes and colours resolve in real engines. */
import { createRoot } from "react-dom/client";
import {
  Abbr,
  Blockquote,
  Code,
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
  Em,
  GolfoUIProvider,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Heading,
  Kbd,
  Lead,
  List,
  ListItem,
  Mark,
  OrderedList,
  Pre,
  Small,
  Strong,
  Text,
  Time,
} from "@golfo/ui";
import "./arc-typography.css";

/** A command long enough to overflow a phone, so the spec can check it scrolls inside its block. */
const LONG_COMMAND = "pnpm add @golfo/ui --save-exact --filter @golfo/tutribu --registry https://registry.npmjs.org/";

function ArcTypography() {
  return <GolfoUIProvider><main>
    <section aria-label="Títulos">
      <H1>Tribus de lectura</H1>
      <H2>Próximos encuentros</H2>
      <H3>Esta semana</H3>
      <H4>Jueves</H4>
      <H5>Por la tarde</H5>
      <H6>Notas</H6>
      <Heading level={2} size="5xl">Portada</Heading>
    </section>
    <section aria-label="Texto">
      <Lead>Encontrá a la gente que comparte lo que te gusta.</Lead>
      <Text data-testid="paragraph">
        Un libro por mes, con <Strong>encuentros presenciales</Strong>, <Em>debates</Em> y <Mark>novedades</Mark>. Abrí la
        paleta con <Kbd>Ctrl</Kbd> <Kbd size="sm">K</Kbd> o ejecutá <Code>pnpm dev</Code>. La{" "}
        <Abbr title="Interfaz de programación de aplicaciones">API</Abbr> se publicó el{" "}
        <Time dateTime="2026-10-21">21 de octubre</Time>.
      </Text>
      <Text tone="muted" size="sm">Actualizado hace 2 horas.</Text>
      <Small>Sujeto a disponibilidad.</Small>
      <Blockquote>Leer es viajar sin moverse.</Blockquote>
      <Pre data-testid="pre"><Code>{LONG_COMMAND}</Code></Pre>
    </section>
    <section aria-label="Listas">
      <List aria-label="Requisitos"><ListItem>Cuenta verificada</ListItem><ListItem>Perfil completo</ListItem></List>
      <OrderedList aria-label="Pasos"><ListItem>Elegí una tribu</ListItem><ListItem>Pedí unirte</ListItem></OrderedList>
      <OrderedList aria-label="Pasos con letras" type="a"><ListItem>Elegí una tribu</ListItem><ListItem>Pedí unirte</ListItem></OrderedList>
      <OrderedList aria-label="Etapas" type="I"><ListItem>Postulación</ListItem><ListItem>Admisión</ListItem></OrderedList>
      <DescriptionList aria-label="Datos de la tribu">
        <div><DescriptionTerm>Miembros</DescriptionTerm><DescriptionDetails>128</DescriptionDetails></div>
      </DescriptionList>
    </section>
  </main></GolfoUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ArcTypography />);
