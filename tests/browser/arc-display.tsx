/** Mounts Arc's Badge, Avatar, Skeleton, Card and Alert from the public barrel, so layout and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  Badge,
  BeezUIProvider,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardMedia,
  CardTitle,
  Skeleton,
} from "beez-ui";
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
      <Avatar aria-label="Ana" size="lg" status={isOnline ? "online" : undefined}><AvatarFallback>AN</AvatarFallback></Avatar>
      <Button variant="secondary" onClick={() => setIsOnline((current) => !current)}>Cambiar presencia</Button>
    </div>
  );
}

/** A dismissible alert followed by a marker, so the spec can watch the gap close. */
function DismissibleAlert() {
  return (
    <div className="narrow-field">
      <Alert tone="info" onDismiss={() => undefined}>
        <AlertTitle>Nueva versión disponible</AlertTitle>
        <AlertDescription>Recargá la página para usarla.</AlertDescription>
      </Alert>
      <p>Debajo del aviso</p>
    </div>
  );
}

/** An alert with both its own action and the dismiss button, which must sit side by side. */
function ActionableAlert() {
  return (
    <div className="narrow-field">
      <Alert tone="warning" onDismiss={() => undefined} dismissLabel="Descartar aviso de cupo">
        <AlertTitle>Cupo casi completo</AlertTitle>
        <AlertDescription>Quedan dos lugares en la tribu.</AlertDescription>
        <AlertAction><Button size="sm" variant="secondary">Ampliar</Button></AlertAction>
      </Alert>
    </div>
  );
}

/** A group of profile-size avatars whose overflow counter must match them. */
function ProfileAvatarGroup() {
  return (
    <AvatarGroup aria-label="Equipo destacado">
      <Avatar size="xl"><AvatarFallback>AN</AvatarFallback></Avatar>
      <Avatar size="xl"><AvatarFallback>LU</AvatarFallback></Avatar>
      <AvatarGroupCount aria-label="Tres personas más">+3</AvatarGroupCount>
    </AvatarGroup>
  );
}

/** An alert that opens later and carries its own height class and inline opacity. */
function StyledAlert() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="narrow-field">
      <Button variant="secondary" onClick={() => setIsOpen(true)}>Mostrar aviso alto</Button>
      <Alert aria-label="Aviso alto" tone="info" open={isOpen} className="tall-alert" style={{ opacity: 0.5 }}>
        <AlertTitle>Aviso con alto propio</AlertTitle>
      </Alert>
    </div>
  );
}

/** A reveal whose consumer keeps its own scrolling overflow. */
function ScrollingReveal() {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <div className="narrow-field">
      <Button variant="secondary" onClick={() => setIsLoading((current) => !current)}>Alternar carga</Button>
      <Skeleton aria-label="Resumen con desplazamiento" loading={isLoading} lines={2} style={{ overflow: "auto" }}>
        <p>Resumen listo para revisar.</p>
      </Skeleton>
    </div>
  );
}

/** Renders one fixture per component. */
function ArcDisplay() {
  return <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Componentes de visualización</h1>
    <section><GrowingBadge /></section>
    <section><PresenceAvatar /></section>
    <section><ProfileAvatarGroup /></section>
    <section className="narrow-field"><Skeleton avatar lines={3} label="Cargando miembros" /></section>
    <section className="controls">
      <Card aria-label="Tarjeta interactiva" className="summary-card">
        <CardMedia aria-label="Foto de la tribu"><span>Foto</span></CardMedia>
        <CardHeader><CardTitle>Tribu de lectura</CardTitle></CardHeader>
        <CardContent><Button variant="secondary">Unirme</Button></CardContent>
      </Card>
      <Card aria-label="Tarjeta estática" className="summary-card">
        <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
        <CardContent>Sin acciones</CardContent>
      </Card>
    </section>
    <section><DismissibleAlert /></section>
    <section><ActionableAlert /></section>
    <section><StyledAlert /></section>
    <section><ScrollingReveal /></section>
  </main></BeezUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ArcDisplay />);
