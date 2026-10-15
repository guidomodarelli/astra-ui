/** Mounts Arc's Badge, Avatar, Skeleton, Card and Alert from the public barrel, so layout and motion run in real engines. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
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

/** Renders one fixture per component. */
function ArcDisplay() {
  return <BeezUIProvider themeOptions={{ defaultTheme: "light", enableSystem: false }}><main>
    <h1>Componentes de visualización</h1>
    <section><GrowingBadge /></section>
    <section><PresenceAvatar /></section>
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
  </main></BeezUIProvider>;
}

createRoot(document.getElementById("root")!).render(<ArcDisplay />);
