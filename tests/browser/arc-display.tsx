/** Mounts Arc's Badge, Avatar, Skeleton, Card and Alert from the public barrel, so layout and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PlusIcon } from "lucide-react";
import { Alert, Avatar, AvatarGroup, Badge, BeezUIProvider, Button, Card, Skeleton } from "beez-ui";
import "./styles.css";

/** A badge whose label grows, so the spec can watch the pill spring to the new width. */
function GrowingBadge() {
  const [isPublished, setIsPublished] = useState(false);
  return (
    <div className="controls">
      <Badge aria-label="Estado de la publicación" tone="success">{isPublished ? "Publicado en la tribu" : "Listo"}</Badge>
      <Button variant="secondary" onClick={() => setIsPublished(true)}>Publicar</Button>
    </div>
  );
}

/** An avatar whose presence can be toggled. */
function PresenceAvatar() {
  const [isOnline, setIsOnline] = useState(false);
  return (
    <div className="controls">
      <Avatar name="Ana" size="lg" status={isOnline ? "online" : undefined} />
      <Button variant="secondary" onClick={() => setIsOnline((current) => !current)}>Cambiar presencia</Button>
    </div>
  );
}

/** A dismissible alert followed by a marker, so the spec can watch the gap close. */
function DismissibleAlert() {
  return (
    <div className="narrow-field">
      <Alert tone="info" title="Nueva versión disponible" onDismiss={() => undefined}>
        Recargá la página para usarla.
      </Alert>
      <p>Debajo del aviso</p>
    </div>
  );
}

/** An alert with both its own action and the dismiss button, which must sit side by side. */
function ActionableAlert() {
  return (
    <div className="narrow-field">
      <Alert
        tone="warning"
        title="Cupo casi completo"
        onDismiss={() => undefined}
        dismissLabel="Descartar aviso de cupo"
        action={<Button size="sm" variant="secondary">Ampliar</Button>}
      >
        Quedan dos lugares en la tribu.
      </Alert>
    </div>
  );
}

/** An alert whose long action cannot sit beside its copy on a phone, so it has to move under the text. */
function LongActionAlert() {
  return (
    <Alert
      tone="warning"
      title="Pago pendiente"
      onDismiss={() => undefined}
      dismissLabel="Descartar aviso de pago"
      action={<Button size="sm" variant="secondary">Actualizar método de pago</Button>}
    >
      Revisá tu tarjeta para no perder el acceso a la tribu.
    </Alert>
  );
}

/** A group whose members join and leave, so the spec can watch the overflow chip follow `max`. */
function GrowingAvatarGroup() {
  const [memberCount, setMemberCount] = useState(5);
  const members = ["Ana Núñez", "Lucía Paz", "Tomás Gil", "Sara Ruiz", "Inés Ma", "Leo Park", "Eva Sol"]
    .slice(0, memberCount)
    .map((name) => ({ name }));
  return (
    <div className="controls">
      <AvatarGroup label="Equipo destacado" members={members} max={3} size="lg" />
      <Button variant="secondary" onClick={() => setMemberCount((current) => current + 1)}>Sumar integrante</Button>
    </div>
  );
}

/** An alert that opens later and carries its own height class and inline opacity. */
function StyledAlert() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="narrow-field">
      <Button variant="secondary" onClick={() => setIsOpen(true)}>Mostrar aviso alto</Button>
      <Alert aria-label="Aviso alto" tone="info" title="Aviso con alto propio" open={isOpen} className="tall-alert" style={{ opacity: 0.5 }} />
    </div>
  );
}

/** A reveal whose consumer class gives it a scrolling overflow. */
function ScrollingReveal() {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="narrow-field" data-testid="scrolling-reveal">
      <Button variant="secondary" onClick={() => setIsLoading((current) => !current)}>Alternar carga</Button>
      <Skeleton label="Resumen con desplazamiento" loading={isLoading} lines={2} className="scrolling-reveal">
        <p>Resumen listo para revisar.</p>
      </Skeleton>
    </div>
  );
}

/** Avatars of every size carrying both a custom badge and a presence dot, which must not cover each other. */
function BadgedPresenceAvatars() {
  return (
    <div className="controls">
      {(["sm", "md", "lg", "xl"] as const).map((size) => (
        <Avatar key={size} name={`Avatar con insignia ${size}`} size={size} status="online" badge={<PlusIcon aria-hidden="true" />} />
      ))}
    </div>
  );
}

/** A reveal with a fixed height from its class, which must hold before and after it loads. */
function FixedHeightReveal() {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="narrow-field" data-testid="fixed-reveal">
      <Button variant="secondary" onClick={() => setIsLoading((current) => !current)}>Alternar carga fija</Button>
      <Skeleton label="Resumen de alto fijo" loading={isLoading} lines={2} className="fixed-reveal">
        <p>Resumen de alto fijo listo.</p>
      </Skeleton>
    </div>
  );
}

/** A quick look card with a plain, unpositioned button in its body, so the spec can check the body control stays above the title's hit area. */
function CardWithBodyButton() {
  const [likes, setLikes] = useState(0);
  return (
    <Card
      aria-label="Tarjeta con botón en el cuerpo"
      className="summary-card"
      title="Tribu de huerta"
      description="Cosechas compartidas."
      details={<p>Riego los domingos.</p>}
    >
      <button type="button" onClick={() => setLikes((current) => current + 1)}>Me gusta: {likes}</button>
    </Card>
  );
}

/** Renders one fixture per component. */
function ArcDisplay() {
  return <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Componentes de visualización</h1>
    <section><GrowingBadge /></section>
    <section><PresenceAvatar /></section>
    <section><GrowingAvatarGroup /></section>
    <section className="narrow-field"><Skeleton avatar lines={3} label="Cargando miembros" /></section>
    <section className="controls">
      <Card
        aria-label="Tarjeta interactiva"
        className="summary-card"
        title="Tribu de lectura"
        media={<span aria-label="Foto de la tribu" role="img">Foto</span>}
        action={<Button variant="secondary">Unirme</Button>}
      />
      <Card aria-label="Tarjeta estática" className="summary-card" title="Resumen">Sin acciones</Card>
      <Card
        aria-label="Tarjeta con vista rápida"
        className="summary-card"
        title="Tribu de cocina"
        description="Recetas de estación."
        meta="Ana Núñez"
        status="Actualizada hace 2 horas"
        details={<p>Encuentros los sábados.</p>}
      />
      <CardWithBodyButton />
    </section>
    <section><DismissibleAlert /></section>
    <section><ActionableAlert /></section>
    <section><LongActionAlert /></section>
    <section><StyledAlert /></section>
    <section><ScrollingReveal /></section>
    <section><BadgedPresenceAvatars /></section>
    <section><FixedHeightReveal /></section>
  </main></BeezUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ArcDisplay />);
