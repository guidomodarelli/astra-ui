# beez-ui

Biblioteca de componentes React reutilizables, con adaptadores opcionales por framework y tema compartido. Reúne los componentes de LaTribu y las funcionalidades reutilizables de agenda-mensual.

## Storybook

```bash
pnpm storybook
```

Abre `http://localhost:6006` para explorar los componentes con controles de texto,
variantes, tamaños, estados y comportamiento. El selector de la barra permite
probar el tema claro, oscuro o del sistema. Las stories de componentes compuestos
incluyen sus piezas en ejemplos completos; los campos editables y selectores
sincronizan sus interacciones con Controls. `BeezUIProvider` configura el preview
y no forma parte del catálogo. Las notificaciones se exploran en `ThemedToaster`,
sin duplicar una story de `Toaster`; `WhatsappIcon` está en la sección `Icons`.

```bash
pnpm build-storybook       # Genera storybook-static para servirlo o publicarlo
pnpm typecheck:stories    # Comprueba stories y configuración con TypeScript
pnpm test:storybook       # Build y navegación/interacciones en Chromium y WebKit
```

El catálogo consume los exports públicos y el CSS compilado de la librería. Los
scripts compilan `beez-ui` antes de arrancar; si editás sus fuentes con Storybook
abierto, ejecutá `pnpm build` para actualizar el paquete que muestra el preview.
Los cambios en las stories se actualizan durante el desarrollo. Storybook y sus
addons son dependencias de desarrollo y no se incluyen en el paquete publicado.

Configuración basada en [React con Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite)
y [Controls](https://storybook.js.org/docs/essentials/controls).

## Uso del paquete

El paquete se publica en npm como `beez-ui`. No hace falta
configurar el registry ni autenticarse para instalarlo:

```sh
pnpm add beez-ui
```

Entre 0.12.0 y 1.0.0 el paquete se publicó solo en GitHub Packages como
`@guidomodarelli/beez-ui`. Para migrar una aplicación desde ese nombre, reemplazar la
dependencia y todos los imports, incluidos los subpaths y el CSS, por `beez-ui`, y
quitar del `.npmrc` el mapeo `@guidomodarelli:registry=https://npm.pkg.github.com`
si ya no se usa para otros paquetes.


```tsx
import { Button, Avatar, AvatarImage, DataTable, Calendar } from "beez-ui";
```

Agrupar los imports de componentes desde la raíz. El paquete publica JavaScript ESM y declaraciones TypeScript en `dist`; el consumidor no necesita transpilar el código fuente de la librería. La gramática de filtros y los helpers de mes-año son independientes de React.

La utilidad `cn`, también exportada desde `beez-ui`, usa el paquete `cn` para combinar clases condicionales y resolver conflictos de Tailwind.

```css
@import "beez-ui/styles.css";
```

`beez-ui/styles.css` es CSS listo para el navegador: incluye reset, utilidades, el foundation de [Arc](https://uiarc.dev) (colores, superficies, radios concéntricos, alturas de control, sombras y foco por teclado) con modo claro y oscuro, y las fuentes locales Inter, Geist e IBM Plex Mono. No requiere Tailwind, plugins PostCSS ni declaraciones `@source` en el consumidor. Las clases se compilan en el build de la biblioteca y se publican en `dist/styles.css`; `styles.source.css` es la entrada de desarrollo y no se distribuye.

El modo oscuro se activa con `data-theme="dark"` o la clase `dark` en `<html>`; `BeezUIProvider` escribe ambos. El acento por defecto es el azul de Arc y se cambia con `data-accent` (`neutral`, `violet`, `blue`, `green`, `amber`, `orange`, `coral` o `rose`) en `<html>`. Los nombres de tokens de shadcn (`--primary`, `--muted`, `--card`…) siguen disponibles como alias de los roles de Arc; `--accent` es el acento de Arc, no el gris de hover de shadcn. Inter se usa para texto y controles y Geist para títulos grandes mediante `--font-display`; las licencias se incluyen en `assets/fonts`. Los consumidores pueden sobrescribir tokens mediante CSS normal. Si la aplicación usa Tailwind para sus propios estilos puede mantenerlo, pero ya no necesita escanear beez-ui.

`DropdownMenuContent` toma el ancho natural de sus opciones, con un mínimo de 12 rem y un máximo limitado por el espacio disponible. No hereda el ancho del botón disparador: los menús abiertos desde un icono deben mantener sus etiquetas legibles. Para un ancho específico, usar `className` y ajustar también el mínimo cuando se necesite un menú más pequeño.

Los componentes usan por defecto los espaciados compactos de Agenda: `Select` mide 2 rem (1.75 rem en tamaño pequeño), `TabsList` horizontal mide 2 rem y `PopoverContent` usa 0.625 rem de padding. Los menús y submenús tienen un mínimo de 12 rem, con filas compactas. `Dialog` y `AlertDialog` usan 1 rem de padding y un footer con borde superior y fondo diferenciado; `Textarea` distingue el estado deshabilitado mediante su fondo. Estos valores conservan los colores y fuentes del tema compartido. Son cambios de los defaults, sin una prop adicional para activarlos; los consumidores pueden personalizarlos mediante `className`.

Los `Sheet` superiores e inferiores limitan su altura al viewport dinámico (`100dvh`) y permiten desplazar el contenido para mantener accesibles las acciones de paneles largos.

## Movimiento

Las nuevas animaciones usan la dependencia `motion`: `animate` controla la
reproducción, `hover` y `press` los gestos, y `AnimatePresence` / `usePresence`
retienen los overlays durante su salida. Los presets y tiempos viven en
`src/motion/`. No se usan keyframes CSS para estas animaciones.

`MotionSlot` anima el nodo original del primitive mediante refs compuestos,
sin agregar wrappers al DOM ni reemplazar sus handlers. Las curvas y springs
siguen los tokens de [beui motion](https://beui.dev/components/motion):

- `Button` usa la presión de Arc: se comprime a 0.97 con un spring rápido (un poco más en
  botones de solo ícono y menos en los anchos), sin escalar los disparadores de menús; su
  texto cambia de ancho con un spring. Los ítems de `Sidebar` y `Tabs` se comprimen a 0.98.
- `Checkbox` y `RadioGroup` se comprimen a 0.92. La marca del checkbox aparece
  con pop y trazo (`pathLength`) y sale con blur; el punto del radio aparece con spring.
- El thumb de `Switch` viaja con un spring pesado y se aplasta mientras se presiona.
- `Input`, `Textarea`, `InputGroup` y `SelectTrigger` tiemblan al pasar a
  `aria-invalid="true"`; `FormMessage` entra con blur.
- `Tooltip` entra con blur, escala y desplazamiento desde el trigger.
  `Popover`, `HoverCard`, `DropdownMenu` y `Select` escalan desde 0.96 y se revelan
  con un clip desde la esquina más cercana al trigger.
- `Dialog` y `AlertDialog` se despliegan desde su centro y se pliegan al cerrar; `Sheet` entra desde su borde con spring
  y sale con la curva de cajón (0.24 s), sin demorar la siguiente interacción.
- `GlideSlot` desliza el indicador activo entre ítems como un `layoutId` compartido:
  la pestaña activa de `Tabs` (fondo o subrayado), la
  página actual de `PaginationContent`, y al navegar con teclado el ítem resaltado de
  `DropdownMenu` y `Select` y la sugerencia activa de `FilterQueryBar`. Con el puntero,
  esos resaltados lo siguen al instante: el propio puntero ya marca la posición.
- Las superficies flotantes se revelan con un clip que deja 24 px libres fuera de la
  caja, así su borde (`ring`) y su sombra se ven desde el primer frame. Una copia
  transitoria viaja entre ítems y se elimina al llegar, devolviendo el estilo al ítem.
- El chevron de `SelectTrigger` gira 180° al abrir y los chevrons de `DataTable`
  (grupos y columnas) giran en lugar de cambiar de ícono; CSS define el ángulo final.
- Las opciones del `Select` entran escalonadas con blur (las primeras 10; el resto
  solo se desvanece) y los checks de ítems de `Select` y `DropdownMenu` aparecen con pop.
- `Sidebar` sigue a [beui animated sidebar](https://beui.dev/components/motion/animated-sidebar):
  el ancho cambia con un spring entre el panel y el riel de íconos, las etiquetas se
  desvanecen al colapsar, una píldora compartida sigue al ítem activo y al hovereado, los
  submenús se despliegan escalonados y en pantallas chicas se abre como hoja con foco atrapado.
- El ícono de `AnimatedThemeToggler` cambia con blur y escala; el botón de cierre de
  `Dialog` aparece con un pop demorado.
- El contenido de `Tabs` entra con un desplazamiento de 4 px y `Alert` entra con blur.
  Cards y enlaces responden al hover; el avatar bajo el puntero de un `AvatarGroup` se
  eleva. Un brillo recorre el `Skeleton` desde su `::after` con reproducción nativa,
  sin trabajo por frame en JavaScript.
- `Calendar` desliza el mes entrante desde el lado de la navegación (invertido en RTL).
- `AvatarImage` se revela con blur y un zoom de 1.06 al terminar de cargar; las imágenes
  ya cargadas al montar no se animan.
- El cursor de `TypingAnimation` queda fijo mientras escribe y parpadea en reposo. Las animaciones especializadas
  existentes de Embla, Sonner y rough-notation se conservan.

El contenido que está saliendo deja de ser interactivo y accesible de inmediato.
Cada familia de overlays tiene un contexto de visibilidad independiente para
soportar composiciones anidadas; los portales sin nodo visible no bloquean el
cierre del padre. `Select` conserva su desmontaje nativo y usa Motion en la entrada.
La elección explícita de `forceMount` permanece bajo control del consumidor.

Se respeta `prefers-reduced-motion`: las nuevas animaciones se cancelan y se
restauran los estilos; las anotaciones se dibujan sin animación y el texto aparece
completo, incluidas todas las palabras de una secuencia. Los controles del carrusel
avanzan directamente. El CSS solo aporta el fallback de movimiento reducido para
los efectos heredados. `BeezUIProvider` configura `MotionConfig` con
`reducedMotion="user"`. El primer render conserva el contrato de SSR.

El selector aplica el tema inmediatamente y anima su icono con Motion; no depende
de View Transitions nativas ni de una animación para completar el cambio. Los estilos temporales se liberan al terminar
la reproducción. Las stories permiten probar los gestos y estados reales; el
selector de tema de la story y la barra de Storybook se mantienen sincronizados.

## Providers de UI

Elegir un único `BeezUIProvider` según el framework. Los componentes y `useTheme` siempre se importan desde `beez-ui`.

| Import del provider | Navegación | Imágenes de avatar |
| --- | --- | --- |
| `beez-ui` | Anclas nativas | `@unpic/react` |
| `beez-ui/next` | `next/link` | `next/image` |
| `beez-ui/tanstack` | TanStack Router | `@unpic/react` |

```tsx
"use client";

import type { ReactNode } from "react";
import { BeezUIProvider } from "beez-ui/next";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <BeezUIProvider themeOptions={{ storageKey: "tutribu-theme", defaultTheme: "system" }}>
      {children}
    </BeezUIProvider>
  );
}
```

Todos los providers usan `next-themes` con clases CSS. El consumidor configura `themeOptions` y conecta sus controles a `useTheme` desde `beez-ui`. Al migrar una aplicación, conservar su clave de almacenamiento y retirar los scripts y estados anteriores que modifiquen el tema. En Next, mantener `suppressHydrationWarning` en el elemento `html` porque el provider restaura la preferencia antes de hidratar.

El provider de Next desactiva prefetch y optimización de imágenes por defecto, como LaTribu. Se activan con `prefetch` y `optimizeImages`; para optimizar imágenes remotas hay que configurar sus hosts en la app. `Link` y los enlaces de paginación usan el adaptador del provider. El contrato común de `Link` acepta href como string y atributos de ancla, no todas las opciones exclusivas de Next.

El provider de TanStack se monta dentro del router de la aplicación. Preserva query y hash; `prefetch` activa precarga por intención. TanStack no aporta un componente Image propio: Unpic genera variantes responsivas para CDNs compatibles y conserva las URLs que no reconoce; no instala un servidor de optimización.

Next y TanStack Router son peers opcionales aislados en sus entrypoints. El provider nativo admite overrides mediante `components`. Sin provider, los componentes conservan anclas e imágenes HTML como fallback.

## Responsabilidades del consumidor

- Tema: `AnimatedThemeToggler` y `ThemedToaster` consumen el contexto compartido. Sus props explícitas de tema siguen disponibles para usos controlados.
- Navegación: `PaginationNext`, `PaginationPrevious` y `PaginationLink` usan anclas nativas. El prop opcional `component` admite el adaptador del router que elija la app. Sin proveedor usa el elemento nativo; con el proveedor de Next usa su navegación cliente.
- Sidebar: en `SidebarProvider`, `defaultOpen` y el modo controlado conservan la semántica de LaTribu. Los ítems con `href` navegan con el adaptador de router del proveedor. `storageKey` activa opcionalmente persistencia local segura tras hidratar, sin cambiar la cookie pública `sidebar_state` ni sus siete días de duración; `cookieName` y `cookieMaxAge` la reemplazan cuando la app ya lee su propia cookie en el servidor. Para el contenido propio: `SidebarBrandButton` arma la fila de marca (sirve como `DropdownMenuTrigger asChild`), `SidebarLabel` saca del riel de íconos el texto que solo tiene sentido expandido, `useSidebarPanel()` expone `collapsed` y `AccountMenu` con `triggerVariant="sidebar"` se reduce solo al avatar. No dependas de los atributos `data-*` internos del sidebar: pueden cambiar entre versiones.
- Formularios y tablas: el consumidor provee sus datos, validaciones y callbacks. No se importan servicios, modelos de negocio ni endpoints de agenda-mensual.

## Componentes incorporados desde agenda-mensual

`Alert`, `AnimatedThemeToggler`, `Calendar`, `DataTable`, `FilterQueryBar`, `Form`, `Highlighter`, `InputGroup`, `Label`, `RadioGroup`, `TypingAnimation` y `ThemedToaster`, junto con sus subcomponentes, tipos y gramática de filtros.

`FilterQueryBar` mantiene el foco en el input mientras se recorren las sugerencias con el puntero o las flechas. Enter aplica la opción activa; interactuar con el input no cierra la lista.

La tabla conserva agrupación estable, columnas configurables, memoización, exclusiones y sincronización de qualifiers por identificadores. La barra conserva navegación por teclado, autocompletado y filtros de texto, rangos, fechas, presencia y carpetas. `Calendar` usa español por defecto y acepta otra locale. Los textos y configuraciones de filtros se pueden personalizar por props.

Los componentes compartidos conservan el tema de LaTribu. Se incorporaron atributos `data-variant`/`data-size` del botón, scroll para paneles largos y persistencia opcional del sidebar. `Button` sigue la API de Arc: `variant` `primary`, `secondary`, `ghost` o `danger`, `size` `sm`, `md` o `lg` y `loading`; renderiza un `<button>` nativo con `type="button"` por defecto y no admite `asChild`: un link con aspecto de botón se estiliza como link. Se mantienen los estados deshabilitados y los skeletons deterministas. `AvatarImage` delega carga y fallback a Base UI; conserva carga diferida y recuperación al cambiar `src`. El export original `Toaster` permanece disponible; `ThemedToaster` agrega los estilos e iconos compartidos.

## Componentes de producto reutilizables

Provienen de las carpetas de producto de LaTribu y agenda-mensual y quedaron desacoplados de su dominio: reciben datos ya resueltos y textos por props, con valores por defecto en español. Solo se incorporan piezas genéricas que no fijan decisiones de un producto y que no son una composición trivial de primitivas existentes; los flujos propios de una app (notificaciones, calendarios de eventos, handoff de navegadores internos, actualización de PWA) y los envoltorios simples (estados vacío y de error, loaders, popovers de ayuda) se mantienen en esa app.

- Movimiento: `PresenceSwap`, `AnimatedCount`, `AnimatedCollapse` y `AnimatedListItem`. Los tokens que usa la biblioteca se exportan desde la raíz y desde `beez-ui/motion-tokens`, así las apps animan sus superficies con las mismas curvas y springs en lugar de copiarlos.
- Indicadores: `ProgressRing` y `ReactionButton`. El color del ícono activo de la reacción se configura con `activeColor`.
- Acciones (de Arc, sobre `Button`): `ActionButton` corre una acción asíncrona (`onAction`) y muestra el resultado en el propio botón: pasa de la flecha al spinner con `pendingLabel` ("Guardando") y al check con `successLabel` ("Guardado"), y vuelve solo a idle después de `resetAfterMs`. Mientras corre sigue enfocable e ignora nuevas pulsaciones, y si falla vuelve a idle y entrega el error a `onActionError`. `SplitButton` une una acción principal con un menú de acciones relacionadas (`actions`): su ícono y su label cambian en el lugar, y la mitad del menú se nombra "Más acciones de {label}" o con `menuLabel`. Para un envío común sin estado de éxito, usá `Button` con `loading`.
- Cuenta: `AccountMenu`, con inicio de sesión mediante `signInHref` o `onSignIn`.
- Contenido: `RichTextContent`, `RichMarkdownContent`, `RichLinkEditor` y `useRichLinkEditor`. Solo interpretan links en markdown, URLs sueltas, listas y negrita; el HTML del contenido nunca se renderiza como markup.
- Filtros guardados: `FilterPresetsBar` y `FilterPresetSaveButton` guardan, aplican, editan y borran consultas con nombre de `FilterQueryBar`. La app decide dónde persistirlas; `parseFilterPresets` valida lo que vuelve del almacenamiento.
- Archivos: `FileUpload`, `FileUploadDropZone`, `FileUploadList` y `FileUploadItem` validan tipo y tamaño, pero no suben archivos: el progreso y los errores los informa la app. Cada ítem acepta un ícono propio y un progreso en barra (`bar`) o de relleno (`fill`).
- Utilidades: `formatFileSize`, `copyTextToClipboard` y búsqueda difusa.

Los hooks de uso general se importan desde `beez-ui/hooks`: `useIsMobile`, `useIsHydrated`, `useViewerTimeZone`, `usePrefersReducedMotion` y `useHorizontalSwipe` (con `resolveHorizontalSwipe`). `useIsMobile` también sigue disponible desde la raíz.

```tsx
import { useIsHydrated } from "beez-ui/hooks";
```

## React Compiler

El build usa el port de React Compiler en Rust de [Oxc](https://oxc.rs/blog/2026-08-18-react-compiler-support), mediante `oxc-transform-react`. Esta integración sigue marcada como experimental por Oxc.

Las optimizaciones se incluyen en el JavaScript publicado: el consumidor no necesita habilitar React Compiler en Vite, Next ni otro bundler. El target es React 19 y utiliza `react/compiler-runtime`, incluido en el peer React 19.2; no se añade un runtime independiente.

TypeScript 7 valida los tipos y genera las declaraciones. Oxc recibe los fuentes originales y ejecuta React Compiler antes de eliminar TypeScript y transformar JSX. Conserva ESM, los exports y las directivas de cliente. Sólo los módulos cuyo prólogo declara `"use client"` reciben memoización automática; los módulos compatibles con Server Components se emiten sin cachés de cliente. Esto evita introducir hooks del runtime de cliente en el render servidor de Next.

La cobertura depende de las heurísticas del compilador y de las reglas de React: algunas funciones conservan su implementación sin optimizar. Las memoizaciones y comentarios del código fuente permanecen intactos. El build informa cuántos módulos incluyen memoización automática y falla ante errores fatales de transformación.

```sh
# Comparar el comportamiento sin memoización automática.
pnpm test:uncompiled

# Volver a generar la distribución optimizada.
pnpm build
```

`test:uncompiled` usa `pnpm build --no-react-compiler` y ejecuta Vitest. CI y `release:prepare` ejecutan esa comparación antes del check normal, que restaura el build optimizado. Los consumidores de prueba no habilitan un segundo compilador: ejercen el paquete generado, incluido un componente de servidor real en Next.

## Desarrollo y validación

Usar pnpm **12.3.4**. Las dependencias tienen rangos `^` y el lockfile fija las versiones verificadas.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm exec playwright install chromium webkit
pnpm test:browser
pnpm build
pnpm release:prepare
```

`pnpm build` genera las declaraciones con TypeScript 7, JavaScript con Oxc/React Compiler y CSS con el CLI de Tailwind. `pnpm check` ejecuta oxlint (configurado en `.oxlintrc.json`), los typechecks separados de código y tests con TypeScript 7, y Vitest 5. `tests/tsconfig.json` incorpora los matchers de Testing Library y los tipos de Vite sin incluirlos en el código de producción. `test:browser` verifica una app React/Vite nativa y una app Next real en Chromium y WebKit, tanto en desktop como en móvil. Los tests unitarios importan los archivos compilados. Los consumidores de navegador no instalan plugins de Tailwind, y una prueba adicional sirve el tarball por HTTP sin procesadores CSS para verificar estilos computados y carga de fuentes. Una prueba adicional instala el tarball en un consumidor aislado sin Next y verifica render, filtrado y declaraciones públicas.

Los tests resuelven `beez-ui`, `beez-ui/next`, `beez-ui/tanstack` y `beez-ui/hooks` mediante rutas explícitas a las declaraciones compiladas en `tests/tsconfig.json`. Ejecutar `pnpm build` después de clonar o si falta `dist`; los comandos de validación completos ya lo hacen. Si el editor conserva diagnósticos anteriores después del build, reiniciar su servidor de TypeScript.

El compilador `tsc` es TypeScript 7. El paquete `typescript` apunta a la [API de compatibilidad oficial de TypeScript 6](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0) mediante un alias, porque el plugin de docgen de Storybook lo declara como dependencia peer; no reemplaza el compilador de los typechecks. El lint no depende de él: oxlint analiza TypeScript sin el compilador.

## Crear y publicar una versión

### Desde GitHub Actions

El workflow **Release** se ejecuta automáticamente con cada push o merge a `main`,
incluidos los cambios de `package.json`. También se puede iniciar en GitHub desde
**Actions → Release → Run workflow**, seleccionando `main`.
El workflow usa `pnpm create-version --accept-suggested`: beez-rp calcula la versión
y verifica que `[Unreleased]` tenga entradas escritas a mano, cierra esa sección con la versión, prepara y valida el tarball, crea y sube
el commit y el tag y publica en npm con trusted publishing (OIDC).

El disparador también incluye los pushes que cambian `package.json`, pero
beez-rp 0.6.1 no retoma una versión editada a mano en un commit común: necesita
su commit de versión y tag de release. Para el flujo automático, dejar que
beez-rp aumente la versión según los commits.

No necesita secrets manuales: pasa `GITHUB_TOKEN` como `NPM_TOKEN`, con
`contents: write` para subir el release y `packages: write` para publicar.
El token se entrega solo al paso de release. El workflow conserva el historial
completo de Git, instala Chromium y WebKit para las validaciones y serializa
los releases sin cancelar uno que ya esté en curso. Solo permite ejecutarlos
sobre `main`.

Si el paquete ya existe, este repositorio debe tener acceso de escritura en
**Package settings → Manage Actions access**. Si una regla de protección de
`main` impide pushes del token del workflow, debe ajustarse para permitir el
flujo de release antes de ejecutarlo. No ejecutar un release local mientras
esté corriendo el de Actions. Los pushes hechos con `GITHUB_TOKEN` no disparan
otros workflows, incluido **Release**, por lo que el commit de versión no crea un
bucle de publicaciones. La preparación del release ejecuta las validaciones completas.
Para retomar una publicación fallida después del push, volver a ejecutar **Release**.

### Desde una terminal local

Desde este repositorio, configurar `NPM_TOKEN` con un token personal de GitHub **clásico** con `write:packages` en el entorno o en `.env`, tomando `.env.example` como referencia. Si el valor existente es un token de npm, reemplazarlo localmente por el de GitHub. No pegarlo en el chat ni agregar credenciales al `.npmrc` del proyecto: beez-rp rechaza esas credenciales. El campo `repository` del manifest vincula el paquete con este repositorio.

### Un solo comando: `pnpm create-version` (alias `pnpm cv`)

```sh
pnpm create-version                         # diagnóstico, plan y release interactivo
pnpm create-version --bump minor            # patch | minor | major sin preguntar
pnpm create-version -b m                    # atajo de --bump: acepta p | m | M (o -b=m)
pnpm create-version -m                      # atajos --patch/-p, --minor/-m, --major/-M
pnpm create-version --set-version 0.7.0     # versión exacta
pnpm create-version -sv 0.7.0               # atajo de --set-version (o -sv=0.7.0)
pnpm create-version -l                      # atajo de --local: todo el release en esta máquina
pnpm create-version --accept-suggested     # toma la versión sugerida por los commits
pnpm create-version --dry-run               # solo muestra el diagnóstico y el plan
pnpm cv                                     # alias de pnpm create-version
pnpm create-version -h                      # todas las opciones (atajo de --help)
```

Los flags cortos distinguen mayúsculas (`-m` es minor y `-M` major) y van de a uno (`-l -m`, no `-lm`). Pedir dos tipos de versión distintos, combinar un tipo con `--set-version` o `--ci` con `--local` corta con un error.

El comando es el motor compartido de los proyectos Beez, `beez-rp create-version` (devDependency `beez-rp`). Su funcionamiento general (diagnóstico, bloqueos, reanudación, versiones permitidas) está documentado en el README de [beez-rp](https://github.com/guidomodarelli/beez-rp#create-version). Lo propio de beez-ui vive en `beez-rp.config.js`: la descripción de cada tipo de versión, la zona horaria de la fecha del CHANGELOG (`releaseTimeZone`), el hook `prepare` de `scripts/release-hooks.js` y la publicación en npm del tarball preparado (`publish: "npm"` + `artifact`, con `publication.authentication: "oidc"`).

Los releases salen sólo desde `main`, limpio y al día con origin (sólo `CHANGELOG.md` puede quedar sin commitear). En otra rama explica qué falta: pushear, abrir o mergear el PR. El último release es el último commit de `origin/main` que cambió el `version` de `package.json`, así que reconoce tanto los commits `X.Y.Z` como los anteriores `chore(release): prepara la versión X.Y.Z`.

### Flujo validado de un release nuevo

1. Actualiza `main` con fast-forward si está atrás.
2. Verifica que `CHANGELOG.md` tenga un bloque `## [Unreleased]` con entradas y solo secciones de Keep a Changelog. Si faltan, las redacta con Claude Code o, si falla, con Codex (`changelogDraft: true` en `beez-rp.config.js`) y las muestra en la terminal; si ningún agente puede, bloquea el release.
3. Pide la versión (sugiere `patch`, `minor` o `major` según los commits) y crea el commit `X.Y.Z` con la versión del manifiesto, el CHANGELOG con `[Unreleased]` renombrado a `## [X.Y.Z] - AAAA-MM-DD` y un `## [Unreleased]` vacío arriba, y el tag anotado `vX.Y.Z`, antes de las validaciones largas.
4. `prepare` (`scripts/release-hooks.js`): reusa el tarball ya preparado para esa versión si es posterior al último cambio de código (el commit de versión no cuenta); si no, ejecuta `pnpm release:prepare` sobre el commit de versión: instalación congelada, tests sin React Compiler, build optimizado, lint, typechecks, tests unitarios y pruebas de navegador, y genera el tarball verificado con `npm pack --ignore-scripts` (npm y no pnpm, para que sea reproducible) en `releases/<version>-<sha256>/beez-ui-<version>.tgz`.
5. Sube `main` y el tag `vX.Y.Z` a origin con un único `git push --atomic`.
6. Publicación: beez-rp exige que el commit de versión siga sin cambios, toma `releases/<version>-<sha256>/beez-ui-<version>.tgz`, verifica el SHA-256 de su ruta y compara su SHA-512 con el `integrity` de `npm pack --dry-run` sobre ese commit (`npm pack` es reproducible, así que coincidir prueba que es byte a byte lo que npm empaqueta) y recién ahí lo publica en npm con etiqueta `latest`. Además, `prepublishOnly` ejecuta `beez-rp guard-publish`, que corta un `pnpm publish` manual (o yarn/bun): se publica sólo con `pnpm create-version`, que usa npm.

Si algo falla después del commit de versión, basta con volver a ejecutar `pnpm create-version`: si `HEAD` es el commit `X.Y.Z` y npm todavía no tiene esa versión, retoma sólo la preparación (reusando el tarball si sigue vigente), el push si falta y la publicación. Nunca vuelve a subir la versión.

La publicación usa el cliente oficial de npm contra `https://registry.npmjs.org/` con [trusted publishing](https://docs.npmjs.com/trusted-publishers): el workflow **Release** tiene `id-token: write`, instala npm 11.5.1 y npm intercambia el token OIDC de GitHub Actions por una credencial de un solo uso, así que no hay tokens de npm guardados en el repositorio ni en los secrets. El paquete `beez-ui` en npm tiene configurado como trusted publisher este repositorio y el workflow `release.yml`; por eso la publicación solo funciona desde ese workflow. Instalación, build y checks siguen usando pnpm 12.

### CHANGELOG

`CHANGELOG.md` sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Cada cambio agrega sus entradas en el bloque `## [Unreleased]`, agrupadas en `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed` y `### Security` (solo las que apliquen). Si faltan entradas, `pnpm create-version` las redacta con Claude Code o Codex y las escribe sin confirmar (revisalas en la salida del comando); si ningún agente puede, bloquea el release mientras `[Unreleased]` no exista o no tenga entradas. Con beez-rp 0.10.0, el commit de versión renombra `[Unreleased]` a `## [X.Y.Z] - AAAA-MM-DD` (fecha en la hora de Argentina por `releaseTimeZone: "America/Argentina/Buenos_Aires"`, aunque el workflow **Release** corra en un runner en UTC) y deja un `[Unreleased]` vacío arriba; si el CHANGELOG no está en UTF-8, el release se detiene antes del bump. Ni las personas ni los hooks cierran la sección: hacerlo (por ejemplo con `releaseUnreleased`) la cerraría dos veces o dejaría `[Unreleased]` vacío y bloquearía el release. `release:prepare` exige el bloque fechado que coincide con la versión del manifiesto. La regla completa está en `AGENTS.md`.

Para validar y empaquetar la versión actual sin publicarla:

```sh
pnpm release:prepare
```

El paquete excluye fuentes privadas, tests, scripts, `.env` y `.npmrc`; incluye JavaScript, declaraciones, CSS, fuentes tipográficas y licencias. Conserva releases anteriores.

`prepack` ejecuta el build para los empaquetados manuales. `dist` y `releases` son generados e ignorados por Git. La CI verifica los checks, los tres providers y el catálogo de Storybook (`pnpm test:storybook`) en ambos motores de navegador en Linux y Windows. La publicación se ejecuta desde el workflow **Release**, que recibe la versión, el tag y el commit creados por `pnpm create-version`.

Tras publicar, los consumidores pueden instalar `pnpm add beez-ui`. También pueden instalar directamente el `.tgz` validado antes de una publicación. Las aplicaciones que todavía usan `@guidomodarelli/beez-ui` desde GitHub Packages deben migrar a `beez-ui` (ver «Uso del paquete»); su lockfile fija la resolución e integridad.

Los componentes nuevos de shadcn/ui se agregan mediante su CLI en esta biblioteca y se exportan desde la raíz. No editar las copias instaladas en los consumidores.

## Procedencia

Fuentes originales: `guidomodarelli/TuTribu` (`components/ui`) y `agenda-mensual` (`src/components/ui`). Se preservan las funcionalidades y los comentarios que explican sus decisiones; la integración adapta imports, contratos y dependencias del consumidor. Consultar `LICENSE.md` para la licencia original de shadcn/ui y `assets/fonts/*-LICENSE.txt` para las fuentes. El icono de WhatsApp proviene del registry `@svgl`.
