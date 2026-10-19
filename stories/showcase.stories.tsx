/** Composes the library into a realistic panel, so its motion can be judged in context. */
import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDays, CheckCircle2, Settings } from "lucide-react";
import {
  Alert,
  AnimatedThemeToggler,
  AvatarGroup,
  Badge,
  Button,
  Calendar,
  Card,
  Checkbox,
  Input,
  Label,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TypingAnimation,
} from "@golfo/ui";

/** Time the activity tab shows its loading placeholder before the content arrives. */
const ACTIVITY_LOADING_MS = 1600;
const TEAM = [{ name: "Ana Núñez" }, { name: "Lucía Uriarte" }, { name: "Martín Alonso" }, { name: "José Ortiz" }];
const PAGE_COUNT = 4;
const ACTIVITY = [
  "Ana aprobó el presupuesto de marzo",
  "Lucas agregó 3 gastos compartidos",
  "Mara actualizó la categoría Hogar",
] as const;

/** Shows placeholders first, then the recent activity, as a slow request would. */
function ActivityFeed() {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), ACTIVITY_LOADING_MS);
    return () => clearTimeout(timeout);
  }, []);
  if (isLoading) {
    return <Skeleton label="Cargando actividad" lines={ACTIVITY.length} />;
  }
  return (
    <ul className="StoryStack">
      {ACTIVITY.map((entry) => (
        <li key={entry}>{entry}</li>
      ))}
    </ul>
  );
}

/** Groups the preferences with toggles, a validated field and a date picker. */
function PreferencesForm() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const isEmailInvalid = isSubmitted && !email.includes("@");
  return (
    <form
      className="StoryStack"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setIsSubmitted(true);
        setIsSaved(email.includes("@"));
      }}
    >
      <div className="StoryRow">
        <Switch id="showcase-digest" defaultChecked />
        <Label htmlFor="showcase-digest">Resumen semanal</Label>
      </div>
      <div className="StoryRow">
        <Checkbox id="showcase-alerts" />
        <Label htmlFor="showcase-alerts">Alertas de gastos altos</Label>
      </div>
      <div className="StoryStack">
        <Label htmlFor="showcase-email">Correo de avisos</Label>
        <Input
          id="showcase-email"
          type="email"
          placeholder="nombre@correo.com"
          value={email}
          aria-invalid={isEmailInvalid || undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setIsSaved(false);
          }}
        />
      </div>
      <div className="StoryRow">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" type="button">
              <CalendarDays data-icon="inline-start" />
              {date ? date.toLocaleDateString("es-AR") : "Fecha de cierre"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar value={date} onChange={setDate} showToday />
          </PopoverContent>
        </Popover>
        <Button type="submit">Guardar</Button>
      </div>
      {isSaved && (
        <Alert tone="success" icon={<CheckCircle2 />} title="Preferencias guardadas">
          {`Vas a recibir los avisos en ${email}.`}
        </Alert>
      )}
    </form>
  );
}

/** Pages through local state, so the current-page highlight glides between pages. */
function ReportPagination() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} pageCount={PAGE_COUNT} onPageChange={setPage} />;
}

const meta = {
  title: "Showcase/Panel",
  parameters: {
    docs: {
      description: {
        story:
          "Panel completo para evaluar el movimiento en contexto: pestañas y paginación con indicador deslizante, placeholders con brillo, validación con mensaje, calendario con transición de mes y alerta con entrada suave.",
      },
    },
  },
  render: () => (
    <Card
      className="StoryShowcase"
      title={
        <TypingAnimation startOnView={false} duration={45}>
          Gastos compartidos
        </TypingAnimation>
      }
      description="Casa · marzo 2026"
      action={
        <div className="StoryRow">
          <AvatarGroup label="Integrantes" members={TEAM} size="sm" />
          <AnimatedThemeToggler className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted" />
        </div>
      }
      footer={
        <Tooltip content="En partes iguales, salvo excepciones">
          <Button variant="ghost">¿Cómo se reparte?</Button>
        </Tooltip>
      }
    >
        <Tabs defaultValue="resumen">
          <TabsList aria-label="Secciones del panel">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="actividad">Actividad</TabsTrigger>
            <TabsTrigger value="ajustes">
              <Settings data-icon="inline-start" />
              Ajustes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="resumen">
            <div className="StoryStack">
              <div className="StoryRow">
                <Badge tone="info">Al día</Badge>
                <Badge>12 movimientos</Badge>
              </div>
              <p>Total del mes: $ 184.200, repartido entre cuatro personas.</p>
              <ReportPagination />
            </div>
          </TabsContent>
          <TabsContent value="actividad">
            <ActivityFeed />
          </TabsContent>
          <TabsContent value="ajustes">
            <PreferencesForm />
          </TabsContent>
        </Tabs>
    </Card>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Panel: Story = {};
