# Cambios

Todos los cambios relevantes de beez-ui se documentan en este archivo con el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/). Cada cambio agrega sus entradas en `[Unreleased]`; `pnpm create-version` las pasa a la versión publicada con su fecha.

## [Unreleased]

## [2.5.0] - 2026-10-15

### Added

- `Input` y `Textarea` aceptan `label`, `description` y `error`, de Arc: si se pasa cualquiera de ellos (aunque valga `undefined`, así el control no se vuelve a montar cuando aparece la validación) renderizan el campo completo, con el label asociado al control, la ayuda y el error enlazados por `aria-describedby`, y filas que se abren con un resorte y cambian solo las palabras que cambiaron; los números de la ayuda (por ejemplo un contador de caracteres) giran solo los dígitos que cambian. El error marca `aria-invalid` y se anuncia con `role="alert"`. Con movimiento reducido los cambios son instantáneos. Sin esas props siguen renderizando solo el control.

### Changed

- `Input` y `Textarea` toman el diseño de Arc: alto mínimo de 44 px (`Textarea`, 110 px con redimensión vertical y sin crecer con el contenido), radio de control, fondo `surface`, borde fuerte que pasa a `foreground` con hover de puntero fino y con foco de teclado, sin anillos de foco, y borde `danger` cuando son inválidos. `InputGroup` usa el mismo marco.

## [2.4.0] - 2026-10-14

### Added

- `ActionButton` (y `beez-ui/action-button`), de Arc: corre una acción asíncrona y muestra el resultado en el propio botón, con el label que cambia letra por letra de la flecha al spinner (`pendingLabel`, "Guardando" por defecto) y al check (`successLabel`, "Guardado"), y vuelve solo a idle después de `resetAfterMs` (2400 ms). Mientras corre sigue enfocable e ignora nuevas pulsaciones; si falla, vuelve a idle y entrega el error a `onActionError`. Acepta las variantes y tamaños de `Button`.
- `SplitButton` (y `beez-ui/split-button`), de Arc: una acción principal unida a un menú de acciones relacionadas (`actions`, con `destructive`, `disabled` e `icon`), en variante `primary` o `secondary` (compacta). El ícono y el label de la acción principal cambian en el lugar y los lectores de pantalla anuncian el label nuevo; la mitad del menú se nombra "Más acciones de {label}" o con `menuLabel`.

## [2.3.1] - 2026-10-14

### Changed

- `pnpm create-version` redacta con Claude Code (o Codex si Claude no está disponible) las entradas de `[Unreleased]` cuando faltan, en lugar de cortar el release; si ningún agente puede, el release se corta como antes.

## [2.3.0] - 2026-10-14

### Changed

- Las versiones se crean con `pnpm create-version` desde una terminal local y se publican en CI: el workflow de Release ya no corre con cada push a `main`, sino que recibe la versión, el tag y el commit creados localmente, verifica que el tag apunte a ese commit dentro de `main` y publica con `--ci-release`.

## [2.2.0] - 2026-10-14

### Added

- `MOTION_TIMING.centerMorph`, `MOTION_TIMING.centerMorphFold`, `MOTION_EASE_UNFOLD` y `MOTION_CENTER_MORPH_FOLDED_PERCENT` en `beez-ui/motion-tokens`, para animar superficies propias con el mismo despliegue desde el centro que el diálogo.

### Changed

- `DialogContent` se abre desplegándose desde su centro hacia todos los bordes y se cierra plegándose hacia su centro con un plegado más breve, como el Center Morph Modal de beUI, en lugar de aparecer subiendo con un fundido. La API, el foco, el cierre con Escape y el botón de cerrar no cambian; con movimiento reducido el diálogo sigue apareciendo sin animación. El despliegue respeta las esquinas del panel, incluidas las asimétricas o elípticas definidas con `className`.
- `AlertDialogContent` se abre y se cierra con el mismo despliegue desde el centro que `DialogContent`, en lugar de subir con un fundido, así ambos modales se animan igual. La API, el foco y las acciones no cambian.

## [2.1.0] - 2026-10-14

### Added

- `DialogContent` acepta `closeButtonPlacement="viewport"` para fijar el botón de cerrar en la esquina de la pantalla: aparece recién cuando el panel termina de entrar, así nunca se ve dentro del panel ni salta de lugar, se oculta en cuanto el diálogo empieza a cerrarse y, mientras está oculto, no recibe el foco.

## [2.0.2] - 2026-10-14

### Changed

- La fecha de cada versión en el CHANGELOG usa la hora de Argentina, así una versión publicada de noche ya no aparece fechada al día siguiente.

## [2.0.1] - 2026-10-14

### Changed

- Cada versión que se publica agrega al CHANGELOG su propia sección con la fecha de publicación.

### Fixed

- El CHANGELOG publicado vuelve a tener una sección propia, con su fecha, para cada versión publicada de 0.12.0 a 2.0.0, en lugar de mezclar sus cambios en un solo bloque.

## [2.0.0] - 2026-10-13

### Changed

- **Incompatible:** el paquete vuelve a publicarse en npm como `beez-ui` (sin scope), desde GitHub Actions con trusted publishing. Quienes usan `@guidomodarelli/beez-ui` desde GitHub Packages tienen que reemplazar la dependencia y todos los imports, incluidos los subpaths y el CSS, por `beez-ui`; ya no hace falta mapear el scope ni un token para instalarlo. Las versiones 1.0.0 y 1.1.0 no se publicaron en npm.

## [1.0.0] - 2026-10-13

### Added

- El tema adopta el foundation de Arc: colores, superficies, textos y bordes por rol, radios concéntricos (controles 18 px, paneles 26 px, superficies 34 px), alturas de control de 36, 44 y 50 px, sombras, curvas y foco visible solo con teclado, en claro y oscuro.
- El acento por defecto es el azul de Arc y se puede cambiar con `data-accent` en `<html>` (`neutral`, `violet`, `blue`, `green`, `amber`, `orange`, `coral` o `rose`).
- La fuente Inter se incluye como fuente local para texto y controles.

### Changed

- **Incompatible:** `Button` sigue la API de Arc: `variant` pasa a `primary`, `secondary`, `ghost` o `danger` (antes `default`, `outline`, `secondary`, `ghost`, `destructive` y `link`) y `size` a `sm`, `md` o `lg` (antes `default`, `xs`, `sm`, `lg` y los tamaños `icon`). Renderiza un `<button>` nativo, con `type="button"` por defecto, y toma el radio, las alturas, los colores y el hover solo con puntero fino de Arc.
- **Incompatible:** `AlertDialogAction` y `AlertDialogCancel` usan las variantes y tamaños de Arc; por defecto, `primary` y `secondary`.
- `BeezUIProvider` escribe el tema como clase y como atributo `data-theme` en `<html>`.
- Los títulos grandes (`--font-display`) usan Geist en lugar de Poppins, y el texto usa Inter en lugar de Geist.
- El fondo de la página deja de usar degradados decorativos: `--body-background-image` vale `none`.

### Removed

- **Incompatible:** `Button` ya no admite `asChild`: un link con aspecto de botón se estiliza como link.
- **Incompatible:** se retira el export `buttonVariants`.
- Se retira la fuente Poppins.

## [0.16.0] - 2026-10-13

### Added

- El tema adopta el foundation de Arc: colores, superficies, textos y bordes por rol, radios concéntricos (controles 18 px, paneles 26 px, superficies 34 px), alturas de control de 36, 44 y 50 px, sombras, curvas y foco visible solo con teclado, en claro y oscuro.
- El acento por defecto es el azul de Arc y se puede cambiar con `data-accent` en `<html>` (`neutral`, `violet`, `blue`, `green`, `amber`, `orange`, `coral` o `rose`).
- La fuente Inter se incluye como fuente local para texto y controles.

### Changed

- **Incompatible:** `Button` sigue la API de Arc: `variant` pasa a `primary`, `secondary`, `ghost` o `danger` (antes `default`, `outline`, `secondary`, `ghost`, `destructive` y `link`) y `size` a `sm`, `md` o `lg` (antes `default`, `xs`, `sm`, `lg` y los tamaños `icon`). Renderiza un `<button>` nativo, con `type="button"` por defecto, y toma el radio, las alturas, los colores y el hover solo con puntero fino de Arc.
- **Incompatible:** `AlertDialogAction` y `AlertDialogCancel` usan las variantes y tamaños de Arc; por defecto, `primary` y `secondary`.
- `BeezUIProvider` escribe el tema como clase y como atributo `data-theme` en `<html>`.
- Los títulos grandes (`--font-display`) usan Geist en lugar de Poppins, y el texto usa Inter en lugar de Geist.
- El fondo de la página deja de usar degradados decorativos: `--body-background-image` vale `none`.

### Removed

- **Incompatible:** `Button` ya no admite `asChild`: un link con aspecto de botón se estiliza como link.
- **Incompatible:** se retira el export `buttonVariants`.
- Se retira la fuente Poppins.

## [0.15.0] - 2026-10-13

### Fixed

- La preparación del release lee y extrae el tarball también en Windows con el `tar` de Git Bash, que rechazaba las rutas absolutas con letra de unidad.

## [0.14.0] - 2026-10-13

### Fixed

- `Button` vuelve a quedar inerte y oculto para tecnologías de asistencia mientras un `AnimatePresence` padre lo retira, también con `asChild`: durante la animación de salida no se puede hacer clic, enfocar ni anunciar.
- `AnimatedCollapse` marca la región como inerte y oculta para tecnologías de asistencia mientras se cierra, como `PresenceSwap` y `AnimatedListItem`, para que sus controles no sigan activos durante el fundido.

## [0.13.0] - 2026-10-12

### Added

- `Button` acepta la prop `loading`: muestra un spinner, marca el botón como ocupado e ignora los clics sin perder el foco; si es el trigger de un menú o popover, tampoco lo abre.

### Changed

- `Button` adopta el estilo y la animación de Arc: nuevos colores por variante (`default` pasa a usar `foreground` en lugar de `primary`), presión según el ancho del botón y animación del ancho cuando cambia el texto. También aplica a los botones con `asChild`. Los triggers de menús y popovers no se achican al presionarlos.

## [0.12.0] - 2026-10-12

### Added

- Publicación desde GitHub Actions con versión calculada y CHANGELOG mantenido manualmente, usando el token automático del repositorio.

### Changed

- El release se inicia automáticamente al subir cambios a `main`, incluidos los cambios de `package.json`, y conserva la ejecución manual desde Actions.
- El paquete pasa a publicarse en GitHub Packages como `@guidomodarelli/beez-ui`; los consumidores deben actualizar sus dependencias e imports y configurar acceso al registry de GitHub.
- La ejecución manual del release permite omitir explícitamente un tag pendiente del registro anterior durante una migración; la ejecución automática conserva esa protección.

### Fixed

- Los eventos de teclado sin una tecla válida no interrumpen la navegación lateral; se conservan los atajos con Ctrl y Cmd.
- La preparación del paquete acepta las notas de `[Unreleased]` que conserva el motor de publicación actual, sin exigir que se reescriba el historial.

## [0.11.0] - 2026-10-03

- 859b7a6 agrega mejoras al sidebar y persistencia de estado

## [0.10.0] - 2026-10-03

- 6769ea7 agrega funcionalidad de persistencia y animación al sidebar
- 3a84ef1 agrega actualización de la dependencia «beez-rp» a la versión 0.6.1
- 2723ab1 Bump beez-rp to 0.6.0 (#4)
- 811829a update «beez-rp» dependency to version 0.5.0
- ab5c997 build: bump beez-rp to 0.4.0
- d267b0b add checks configuration to prevent redundant validation before version bump
- 041a0f8 Migrate linting from ESLint to oxlint (#3)

## [0.9.1] - 2026-09-27

### Added

- `FileUploadDropZone` acepta `labels.uploadActionMobileSuffix`, un texto que completa la acción de subir en pantallas chicas.
- `FileUploadItem` acepta `icon` para mostrar un ícono propio por tipo de archivo y `progressVariant="fill"` para indicar el progreso rellenando el fondo del ítem.
- `AccountMenu` acepta clases para el texto, nombre, email y chevron del disparador, el encabezado, su avatar y el ítem de sesión, por ejemplo para ocultar la identidad en un sidebar colapsado.
- `FilterPresetSaveButton` acepta `className` para adaptar el botón al slot de acción de un input.

## [0.9.0] - 2026-09-27

### Added

- `ReactionButton` acepta `activeColor` para elegir el color del ícono activo (por defecto, el color destructivo).
- Entrypoint `beez-ui/hooks` con los hooks de uso general: `useIsMobile`, `useIsHydrated`, `useViewerTimeZone`, `usePrefersReducedMotion`, `useHorizontalSwipe` y `resolveHorizontalSwipe`.
- `FilterPresetsBar` y `FilterPresetSaveButton` para guardar, aplicar, editar y borrar consultas con nombre de `FilterQueryBar`, con `parseFilterPresets` para validar las que la app restaura de su almacenamiento.

### Changed

- `useIsHydrated`, `useViewerTimeZone`, `usePrefersReducedMotion`, `useHorizontalSwipe`, `resolveHorizontalSwipe` y `HORIZONTAL_SWIPE_DIRECTION` se importan desde `beez-ui/hooks` en lugar de la raíz; `useIsMobile` sigue también en la raíz.

### Removed

- Se retiran `EmptyState`, `ErrorState`, `BouncingDotsLoader` e `InfoPopover`: son envoltorios simples que cada app mantiene con su propio diseño.
- `getNameInitials` deja de ser público.
- Se retiran componentes atados a un solo producto que llegaron en 0.8.0: `ExternalBrowserHandoff`, `OpenInBrowserCta`, `detectInAppBrowser`, `buildExternalBrowserUrl`, `NotificationBell`, `NotificationPanel`, `MonthGrid`, `MonthCalendarHeader`, `PwaUpdateControl` y `ConfirmDeleteButton`. Quien los use debe mantener su propia versión.
- Se retiran los helpers `createMonthGridDays`, `splitCalendarWeeks`, `groupItemsByDateKey`, `shiftMonthKey`, `useMonthTransitionDirection`, `useMinuteClock`, `advanceMinuteClockTo`, `navigateToUrl`, `reloadCurrentPage`, `replaceCurrentUrlSearchParams` y `replaceCurrentUrlSearchParamValues`.
- Se retira el entrypoint opcional `beez-ui/emoji-picker` y la dependencia opcional `emoji-picker-react`.

## [0.8.2] - 2026-09-27

### Fixed

- Con movimiento reducido, `PresenceSwap`, `AnimatedListItem` y `AnimatedCollapse` conservan un fundido breve en lugar de cambiar sin transición; `PresenceSwap` ya no queda trabado en el estado anterior cuando su contenido cambia varias veces seguidas (por ejemplo, error → cargando → cargado).

## [0.8.1] - 2026-09-27

### Changed

- Cada versión publicada queda en un commit `X.Y.Z` con el tag `vX.Y.Z` en GitHub (antes era un commit `chore(release): prepara la versión X.Y.Z` sin tag), para ubicar el código exacto de cada versión.
- La publicación en npm la hace el comando compartido de beez-rp, que vuelve a verificar el SHA-256 y el contenido del tarball antes de subirlo; se retira `pnpm release:publish`.
- Publicar con `pnpm publish` queda bloqueado por `beez-rp guard-publish`: cada versión sale sólo desde `pnpm create-version`, que publica con npm el tarball verificado.

## [0.8.0] - 2026-09-26

### Added

- Los tokens de movimiento (`MOTION_TIMING`, `MOTION_EASE`, springs y distancias) se exportan desde la raíz y desde `beez-ui/motion-tokens`, con los nuevos `SPRING_POP`, `MOTION_ITEM_ENTER_SCALE` y las duraciones `pop` y `collapse`, para animar superficies propias igual que la biblioteca.
- Primitivas de movimiento `PresenceSwap`, `AnimatedCount`, `AnimatedCollapse` y `AnimatedListItem`, que respetan el movimiento reducido.
- `BouncingDotsLoader`, `ProgressRing`, `EmptyState`, `ErrorState`, `InfoPopover`, `ConfirmDeleteButton` y `ReactionButton`.
- `AccountMenu`: menú de cuenta con avatar, identidad, inicio de sesión como link o callback, cierre de sesión y variante para sidebar.
- `RichTextContent`, `RichMarkdownContent`, `RichLinkEditor` y `useRichLinkEditor` para mostrar y editar texto con links en markdown sin interpretar HTML, junto con `parseRichTextSegments` y `parseRichMarkdownBlocks`.
- `OpenInBrowserCta` y `ExternalBrowserHandoff` para salir de navegadores internos de otras apps, con `detectInAppBrowser` y `buildExternalBrowserUrl`.
- `PwaUpdateControl`, que ofrece aplicar una actualización pendiente del service worker.
- `NotificationBell` y `NotificationPanel`: bandeja de notificaciones en popover o en sheet según el viewport, a partir de ítems ya resueltos por la app.
- `MonthGrid` y `MonthCalendarHeader` para calendarios mensuales, con `createMonthGridDays`, `groupItemsByDateKey`, `shiftMonthKey` y `useMonthTransitionDirection`.
- `FileUpload`, `FileUploadDropZone`, `FileUploadList` y `FileUploadItem`, con validación por tipo y tamaño (`classifyFiles`, `isFileTypeAccepted`).
- `EmojiPicker` en el entrypoint opcional `beez-ui/emoji-picker`; requiere instalar `emoji-picker-react`.
- Hooks `useIsHydrated`, `useMinuteClock`, `useViewerTimeZone`, `useHorizontalSwipe` y `usePrefersReducedMotion`.
- Utilidades `formatFileSize`, `copyTextToClipboard`, `getNameInitials`, búsqueda difusa (`getFuzzyMatchRank`, `renderHighlightedText`) y helpers de URL (`replaceCurrentUrlSearchParams`).

### Fixed

- `BeezUIProvider` ya no provoca el aviso de React «Encountered a script tag» en apps renderizadas solo en el cliente; con SSR conserva el script que aplica el tema antes de hidratar, sin parpadeo.

## [0.7.0] - 2026-09-26

### Added

- `PaginationContent` desliza el resaltado de la página actual hacia la página elegida cuando la lista permanece montada (paginación en el cliente).
- `Calendar` desliza el mes entrante desde el lado de la navegación (también en RTL) y se mantiene estático con movimiento reducido.
- `AvatarImage` revela la imagen con un desenfoque y un zoom breves al terminar de cargar, en lugar de aparecer de golpe sobre el fallback.
- Las sugerencias de `FilterQueryBar` deslizan el resaltado entre opciones con teclado, como los menús y `Select`.
- `AvatarGroup` eleva levemente el avatar bajo el puntero en dispositivos con hover real.
- El chevron de `DropdownMenuSubTrigger` se desplaza hacia el submenú abierto.

### Changed

- `Skeleton` muestra un brillo que recorre el placeholder en lugar del pulso de opacidad; con movimiento reducido queda como un bloque liso.
- `Sheet` se cierra con una curva de cajón breve en lugar de un spring, y su botón de cierre aparece con un pop demorado como el de `Dialog`.
- `Alert` entra con un leve desplazamiento y desenfoque.
- Los anillos de foco y bordes de `Input`, `Textarea`, `InputGroup`, `SelectTrigger`, `Checkbox` y `RadioGroupItem` aparecen con una transición en lugar de saltar.
- En menús, `Select` y sugerencias, el resaltado sigue al puntero al instante y solo se desliza al navegar con teclado, con un spring más rápido.
- El sidebar colapsa y expande con una curva de cajón de 300 ms en lugar de una transición lineal.
- El thumb de `Switch` tiene una sombra sutil que lo separa del track.

### Fixed

- El cursor de `TypingAnimation` vuelve a parpadear: queda fijo mientras escribe o borra, parpadea en reposo y los lectores de pantalla lo ignoran.
- `Carousel` vertical responde a las flechas arriba y abajo; antes solo reaccionaba a izquierda y derecha.
- `SidebarMenuButton` con `variant="outline"` vuelve a pintar su borde con los tokens `oklch` del tema.
- `FormLabel`, `FormControl`, `FormDescription` y `FormMessage` fuera de un `FormField` lanzan un error claro en lugar de fallar en silencio.
- Los bordes sin color explícito (footers de `Card`, `Dialog` y `AlertDialog`, `Alert`, filas de `Table`, bordes de `Sheet` y del sidebar) usan el token `--border` del tema en lugar del color del texto cuando se consume `beez-ui/styles.css` sin Tailwind.
- `DropdownMenu`, sus submenús, `Popover`, `HoverCard` y `Select` muestran su borde y su sombra desde el primer frame al abrirse; antes el revelado los recortaba durante ~650 ms.
- `DataTable` filtra las columnas apuntadas por `queryFilterConfig` que no declaran `filterFn` (rangos numéricos, enums y año-mes); antes un rango sobre una columna numérica lanzaba `TypeError: val is not iterable` y un enum ocultaba todas las filas. Un `filterFn` propio de la columna sigue teniendo prioridad.
- Las `Card` interactivas conservan su contorno mientras muestran la sombra de hover; antes la sombra reemplazaba el anillo del borde.

## [0.6.2] - 2026-09-26

### Changed

- El comando de release (`pnpm create-version`, alias `pnpm cv`) toma las notas del bloque `[Unreleased]` del CHANGELOG, les asigna la versión y la fecha, y pide a Codex que lo complete cuando está vacío.
- Las cajas del comando de release ajustan el texto largo en varias líneas en lugar de cortarlo.
- Un release interrumpido reusa automáticamente el artefacto ya preparado cuando es posterior al último cambio de código.

### Removed

- La opción `--notes` y las preguntas sobre las notas del CHANGELOG y sobre reusar el artefacto preparado.

## 0.6.1 - 2026-09-26

- Actualiza pnpm a 12.6.0 y next a 16.3.6
- Add terminal UI for interactive prompts and spinners
- Update release banner and icons for improved visibility
- Remove create-version script
- Update release command to create-version and improve documentation

## 0.6.0 - 2026-09-23

- Actualiza el paquete a la versión 0.6.0.

## 0.5.6 - 2026-09-09

- Actualiza el paquete a la versión 0.5.6.

## 0.5.5 - 2026-09-09

- Actualiza el paquete a la versión 0.5.5.

## 0.5.4 - 2026-09-09

- Actualiza el paquete a la versión 0.5.4.

## 0.5.3 - 2026-09-09

- Actualiza el paquete a la versión 0.5.3.

## 0.5.2 - 2026-09-09

- Actualiza el paquete a la versión 0.5.2.

## 0.5.1 - 2026-09-08

- Actualiza el paquete a la versión 0.5.1.

## 0.5.0 - 2026-09-08

- Actualiza el paquete a la versión 0.5.0.

## 0.4.2 - 2026-09-08

- Actualiza el paquete a la versión 0.4.2.

## 0.4.1 - 2026-09-08

- Actualiza el paquete a la versión 0.4.1.

## 0.4.0 - 2026-09-08

- Distribuye los providers nativo, Next y TanStack con tema compartido, navegación e imágenes adaptadas al framework.
- Incluye CSS precompilado, tema y fuentes; los consumidores sólo importan `beez-ui/styles.css`, sin configurar Tailwind.
- Valida el tarball sin compiladores CSS y las integraciones en Chromium y WebKit.

## 0.3.1 - 2026-09-08

- Publica CSS precompilado para que los estilos funcionen sin Tailwind ni detección de clases en el consumidor.
- Conserva el tema, las fuentes y las utilidades compartidas mediante `beez-ui/styles.css`.
- Verifica estilos computados del tarball servido por HTTP sin procesadores CSS en Chromium y WebKit.

## 0.2.0 - 2026-09-08

- Unifica el nombre `BeezUIProvider` en los entrypoints nativo, Next y TanStack; reemplaza `NextBeezUIProvider`.
- Comparte el tema mediante `next-themes`, `themeOptions` y `useTheme` en todos los providers.
- Restaura `Link` desde la raíz con navegación por adaptadores y prefetch desactivado por defecto.
- Integra Unpic para imágenes nativas y de TanStack, y conserva Next Image en el provider de Next.
- Separa los tipos de tests y valida navegación, imágenes y tema en Chromium y WebKit.

## 0.1.1 - 2026-09-08

- Publica JavaScript ESM y declaraciones TypeScript en `dist`.
- Conserva los componentes agrupados y el tema de LaTribu.
- Mantiene visible el área del avatar durante la carga diferida para permitir que el navegador solicite la imagen.
- Agrega `BeezUIProvider` para adaptadores nativos o propios y `NextBeezUIProvider` como integración opcional.
- Incorpora preparación de releases con checks, control del contenido del paquete y checksum SHA-256.
- Documenta la autenticación con `NPM_TOKEN` y la publicación del artefacto validado.

## 0.1.0 - 2026-09-08

- Centraliza los componentes de LaTribu y agenda-mensual con su tema, fuentes y pruebas.
