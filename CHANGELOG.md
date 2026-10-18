# Cambios

Todos los cambios relevantes de beez-ui se documentan en este archivo con el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/). Cada cambio agrega sus entradas en `[Unreleased]`; `pnpm create-version` las pasa a la versión publicada con su fecha.

## [Unreleased]

### Fixed

- Con reduced motion, `DropdownMenu`, `Select`, `Popover`, `Tooltip` y `HoverCard` se desmontan al instante al cerrarse, sin el fundido de salida, así el resto de la página vuelve a estar disponible para los lectores de pantalla apenas se elige una opción.

## [4.0.0] - 2026-10-18

### Changed

- El movimiento de todos los componentes queda alineado únicamente con Arc: se quitan las entradas al montar de `Card`, `Badge`, `Separator`, las filas de `Table`, `Alert` estático y la raíz de `Avatar`; el hover de `Link` y del ícono de WhatsApp; la reacción al foco de `Input`, `Textarea`, `InputGroup`, `Label` y el trigger de `Select`; el pop demorado de los botones de cierre de `Dialog` y `Sheet`; el pop de los íconos de las toasts; la presión de los ítems de `Sidebar` y del avatar de `AccountMenu`; y el giro del botón de `AnimatedThemeToggler`.
- `DropdownMenu` entra y sale y `Select` entra en cada apertura como en Arc (escala y desplazamiento desde el trigger) en lugar de revelarse con un clip; las opciones de `Select` ya no se animan por separado y su check, igual que el de los ítems con check de `DropdownMenu`, aparece desde 0.6 con un desenfoque breve.
- El resaltado de `DropdownMenu` se desliza con el puntero y salta al instante con el teclado, como en Arc; `Select` y las sugerencias de `FilterQueryBar` ya no tienen resaltado deslizante.
- `Sidebar` sigue al sidebar rail de Arc: el hover solo cambia el color (sin la píldora compartida con desenfoque), los submenús abren su altura con el spring `smooth` sin escalonar ítems, las etiquetas se desplazan 6 px y la hoja móvil se desliza con `smooth`.
- `Sheet` sale con la curva estándar y se desvanece al final, como el drawer de Arc; `Card` interactiva suma el borde fuerte y la sombra `--shadow-raised` de Arc a su elevación de hover en lugar de la sombra animada anterior.
- `FormMessage` aparece subiendo desde un desenfoque; la foto de `Avatar` aparece desde un desenfoque de 4 px sin zoom; el ícono de `AnimatedThemeToggler` crece desde 0.7 con un desenfoque breve; `ReactionButton` usa el impulso de las reacciones de Arc.
- `AnimatedCollapse` abre y cierra su altura con el spring `smooth`, `PresenceSwap` usa el swap de Arc (sube 0.3 em desde un desenfoque) y `AnimatedListItem` entra 4 px desde un desenfoque leve sin escala y se reordena con `smooth`.
- `MOTION_TIMING.checkDraw` pasa a 0.24 s y `MOTION_LIST_STAGGER_LIMIT` a 4, los valores de Arc.

### Deprecated

- La prop `duration` de `AnimatedThemeToggler` se ignora: el botón ya no gira al cambiar el tema.

### Removed

- Se quitan los tokens de movimiento que no son de Arc: `MOTION_EASE_DRAWER`, `MOTION_EASE_UNFOLD`, `SPRING_HIGHLIGHT`, `SPRING_TABS`, `SPRING_TOOLTIP`, `SPRING_THUMB`, `MOTION_SUBTLE_PRESS_SCALE`, `MOTION_TOGGLE_PRESS_SCALE`, `MOTION_HOVER_SCALE`, `MOTION_THUMB_SQUISH_SCALE`, `MOTION_ITEM_CHECK_SCALE`, `MOTION_ICON_SWAP_SCALE`, `MOTION_CLOSE_BUTTON_SCALE`, `MOTION_LIST_ITEM_DISTANCE`, `MOTION_ITEM_ENTER_SCALE`, `MOTION_REVEAL_SCALE`, `MOTION_REVEAL_BLUR_PX`, `MOTION_SHIMMER_TRANSLATE`, `MOTION_CARD_SHADOW_LIFT`, `MOTION_CARD_SHADOW_REST`, `MOTION_SURFACE_CLIP_PERCENT`, `MOTION_SURFACE_CLIP_BLEED_PX`, `MOTION_TOOLTIP_DISTANCE`, `MOTION_TOOLTIP_SCALE`, `MOTION_CENTER_MORPH_FOLDED_PERCENT`, `MOTION_CONTENT_DISTANCE` y `MOTION_INVALID_SHAKE_PX`.
- `MOTION_TIMING` pierde `message`, `surfaceClip`, `shake`, `checkDrawDelay`, `iconSwap`, `listItem`, `listDelay`, `closeEnter`, `closeDelay`, `centerMorph`, `centerMorphFold`, `reveal`, `pop`, `collapse`, `monthSwap` y `skeleton`, y `MotionKind` queda con los tipos que usa la biblioteca (`rotate`, `item-check`, `icon-swap`, `message`, `reveal`, `dialog`, `sheet` y `overlay`).

### Fixed

- Los submenús de `Sidebar` recortan su contenido solo mientras abren o cierran: una vez abiertos, el anillo de foco de sus ítems se ve completo.

## [3.0.1] - 2026-10-16

### Fixed

- Las fotos de `Avatar`, `AvatarGroup` y `AccountMenu` se piden sin `Referer` (`referrerPolicy="no-referrer"`), así cargan las fotos de perfil de Google que antes se rechazaban y quedaban las iniciales.

## [3.0.0] - 2026-10-16

### Added

- `Dialog` acepta `alert` para confirmaciones: se anuncia como `alertdialog`, no se cierra al hacer click afuera, abre con el foco en el primer `DialogClose` y oculta el botón de cerrar por defecto.
- `DialogContent` suma `footer`, `hideTitle`, `closeLabel` ("Cerrar diálogo" por defecto), `headerClassName`, `titleClassName`, `descriptionClassName` y `footerClassName`; `title` y `description` aceptan cualquier contenido.
- `Pagination` suma `getHref` (enlaces con el `Link` del provider, sin dejar de llamar a `onPageChange`), paginación por cursor sin `pageCount` con `hasNextPage`, `previousLabel`, `nextLabel` y `className`.
- `Tooltip` acepta `side` `left` y `right`, `align`, `sideOffset`, `collisionPadding`, `contentClassName`, `open`, `defaultOpen`, `onOpenChange` y `delayDuration`, y funciona sin provider.
- `HoverCard` acepta `open`, `defaultOpen`, `onOpenChange`, `sideOffset`, `collisionPadding` y `contentClassName`.
- `DropdownMenu` acepta un `trigger` propio, ítems con enlace (`href`, `target`, `rel`), `checked`, `trailing`, `id`, `className` e `itemProps`, selección única con `selection` e ítems con `value`, y `side`, `align`, `contentClassName`, `contentLabel`, `open`, `defaultOpen`, `onOpenChange` y `modal`.
- `Select` acepta `description` y `error` con el mismo patrón que `Input`, `hideLabel` (label solo para lectores de pantalla), `size`, `triggerClassName` y `aria-invalid`; el `id` va al trigger, así un `<label htmlFor>` externo sigue funcionando.
- `Card` incorpora la vista rápida de Arc (`details`, `open`, `defaultOpen`, `onOpenChange`), el byline con `avatar`, `meta`, `status` y `action`, y las props `media`, `footer` y `headingLevel`.
- `AvatarGroup` recibe `members` (con `key` opcional para nombres repetidos), `max` (4 por defecto), `size` y `label` ("Integrantes" por defecto), arma solo el chip +N con un número animado y, con puntero fino, muestra el nombre de cada integrante al pasar el mouse.
- `Avatar` suma `fallback`, `badge` y `alt`; `Alert` suma `action` e `icon`.
- `Carousel` suma `loop`, `duration`, `watchFocus`, `onSettle` (avisa cuando termina la animación), `previousLabel`, `nextLabel`, `showControls`, `showIndicators` y `slideClassName`, y se reinicializa solo cuando cambian sus diapositivas o su tamaño, esperando a que termine el scroll o el arrastre en curso.
- `Carousel` acepta `interval` y `autoplay` con un control para pausar o iniciar la rotación, que también se pausa con hover, foco de teclado, arrastre, fuera de pantalla y en pestañas ocultas.
- `Calendar` acepta `todayLabel`, y el hook `useToday` se exporta desde `beez-ui` y `beez-ui/hooks`.
- `Pagination` pasa el evento del click como segundo argumento de `onPageChange(page, event)`, en botones, enlaces y flechas; con `getHref`, llamar `event.preventDefault()` evita que el enlace navegue, por ejemplo para paginar en el lugar con clicks simples y dejar que los clicks con modificadores abran otra pestaña.
- `Carousel` acepta `viewportClassName` y `trackClassName` para dar estilo al viewport recortado y a la pista de diapositivas, por ejemplo una altura definida en un visor de medios, sin apuntar a `[data-slot="carousel-content"]`.
- `AvatarGroup` acepta `total` para cuando `members` es solo una vista previa: si es mayor que la cantidad de integrantes recibidos, el chip +N cuenta contra el total. También reenvía atributos nativos y ARIA a la raíz (`aria-hidden`, `style`, `data-*`, `id`…).
- `Select` acepta `aria-describedby` en el trigger, combinado con los ids de `description` y `error`, y `options` acepta arrays de solo lectura, así una lista declarada `as const` no necesita copia.
- `DialogContent` suma `headerContent`, contenido extra del encabezado (por ejemplo etiquetas de tipo y estado) que se dibuja después del título y fuera de él, sin cambiar el nombre accesible del diálogo, y `closeButtonRef`, el ref del botón de cerrar; con `onOpenAutoFocus` permite abrir el diálogo con el foco en ese botón.

### Changed

- **Incompatible:** los componentes adoptados de Arc usan la API pública de Arc en lugar de la composición estilo shadcn: `Switch`, `RadioGroup`, `Badge`, `Avatar`, `AvatarGroup`, `Skeleton`, `Card`, `Alert`, `Tooltip`, `HoverCard`, `DropdownMenu`, `Select`, `Pagination`, `Calendar` y `Carousel` pasan a ser componentes cerrados configurados por props; `Dialog`, `Popover` y `Tabs` conservan sus partes de Arc. El diseño y la motion no cambian.
- **Incompatible:** `DialogContent` recibe `title` (obligatorio) y `description` como props y dibuja su propio encabezado; el botón de cerrar se llama "Cerrar diálogo" en lugar de "Cerrar".
- **Incompatible:** `Pagination` recibe `page`, `pageCount`, `onPageChange` y `label`, y dibuja Anterior, Siguiente y una ventana de 5 páginas con botones, o con enlaces si se pasa `getHref`; cada página se llama "Página N".
- **Incompatible:** `TabsList` usa siempre la lista segmentada de Arc.
- **Incompatible:** `Tooltip` envuelve a su trigger (`<Tooltip content="…">`) y `HoverCard` recibe `content` con el trigger como hijo, con `side="bottom"` y `align="start"` por defecto.
- **Incompatible:** `DropdownMenu` recibe `label`, `icon` e `items`; el menú toma su nombre accesible de `label` o de `contentLabel`.
- **Incompatible:** `Select` recibe `label` (obligatorio y visible salvo con `hideLabel`) y `options`, con el placeholder "Seleccioná una opción" por defecto; la lista se abre debajo del trigger, con su mismo ancho. `className` se aplica al campo y `triggerClassName` al trigger.
- **Incompatible:** `PopoverContent` se alinea por defecto con el inicio del trigger (`align="start"`).
- **Incompatible:** `AccountMenu` reemplaza `children` por `items` y `DataTable` reemplaza `columnVisibilityMenuExtraContent` por `columnVisibilityMenuExtraItems`; los dos reciben los mismos ítems que `DropdownMenu`.
- **Incompatible:** `RadioGroup` recibe `label` (se dibuja como `legend` de un `fieldset`), `options`, `value` o `defaultValue`, `onValueChange` y `name` (se genera si falta).
- **Incompatible:** `Badge` usa `tone` (`neutral` por defecto), `size` e `icon`.
- **Incompatible:** `Avatar` recibe `name` (obligatorio), `src`, `size` (`sm`, `md`, `lg` o `xl`; `md` por defecto), `status` y `statusLabel`, y se anuncia como una sola imagen (por ejemplo "Ana, En línea").
- **Incompatible:** `Skeleton` sigue a Arc: sin hijos dibuja 3 líneas por defecto, y con hijos muestra el placeholder mientras `loading` (verdadero por defecto) y después pasa al contenido; solo reenvía `className`.
- **Incompatible:** `Card` recibe `title` (opcional), `description` y `children`.
- **Incompatible:** `Alert` recibe `title` (obligatorio), `tone` (`info` por defecto, anunciado con `role="status"`) y el detalle como `children`; el botón de descartar se llama "Descartar aviso: <título>" por defecto.
- **Incompatible:** `Calendar` recibe `value` y `onChange`, `month` y `onMonthChange`, `minDate`, `maxDate`, `disabledDates`, `locale` como texto (`"es-AR"` por defecto, semana desde el lunes), `showToday` y `className`.
- **Incompatible:** `Carousel` recibe `label` (obligatorio), una diapositiva por hijo, `index`, `defaultIndex`, `onIndexChange`, `slideSize` (`min(80cqw, 340px)` por defecto) y `slideLabel`; las flechas quedan debajo de las diapositivas, junto a los indicadores.
- **Incompatible:** los indicadores del carrusel son pestañas (`role="tab"` con `aria-selected`), las flechas usan `aria-disabled` en los extremos sin perder el foco, las diapositivas inactivas quedan inertes, el cambio de diapositiva se anuncia en una región en vivo y los nombres accesibles pasan a "Diapositiva anterior" y "Diapositiva siguiente".

### Removed

- **Incompatible:** `AlertDialog` y todas sus partes, junto con el entrypoint `beez-ui/alert-dialog`; usar `<Dialog alert>`.
- **Incompatible:** `DialogPortal`, `DialogOverlay`, `DialogHeader`, `DialogFooter`, `DialogTitle` y `DialogDescription`.
- **Incompatible:** `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext` y `PaginationEllipsis`.
- **Incompatible:** `variant` de `TabsList` (incluida la variante `line`) y `tabsListVariants`.
- **Incompatible:** `TooltipTrigger`, `TooltipContent` y `TooltipProvider`.
- **Incompatible:** `PopoverAnchor`, `PopoverHeader`, `PopoverTitle` y `PopoverDescription`.
- **Incompatible:** `HoverCardTrigger` y `HoverCardContent`.
- **Incompatible:** toda la composición de `DropdownMenu` (`DropdownMenuTrigger`, `Content`, `Item`, `CheckboxItem`, `RadioGroup`, `RadioItem`, `Label`, `Separator`, `Shortcut`, `Group`, `Portal` y los submenús `Sub*`); Arc no tiene submenús.
- **Incompatible:** `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton` y `SelectScrollDownButton`.
- **Incompatible:** `size` de `Switch` y `RadioGroupItem`.
- **Incompatible:** `variant`, `asChild` y `badgeVariants` de `Badge`.
- **Incompatible:** `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroupCount`, la composición de `AvatarGroup` y `size="default"`.
- **Incompatible:** el bloque libre de `Skeleton`.
- **Incompatible:** `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`, `CardMedia` y `size` de `Card`.
- **Incompatible:** `AlertTitle`, `AlertDescription`, `AlertAction` y `variant` de `Alert`.
- **Incompatible:** `mode` múltiple y de rango, `selected`, `onSelect`, los matchers de `disabled`, `components`, `classNames`, `buttonVariant`, `CalendarDayButton` y el resto de las props de react-day-picker de `Calendar`.
- **Incompatible:** `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`, `CarouselIndicators`, `CarouselIndicator`, `useCarousel`, `opts`, `setApi`, `plugins`, `orientation` (ya no hay carrusel vertical) y el tipo `CarouselApi`.

### Fixed

- El click de un ítem de `DropdownMenu` (también en `AccountMenu`, `SplitButton`, `AnimatedThemeToggler` y el menú de columnas de `DataTable`) ya no llega, a través del portal, a los contenedores de React que envuelven el menú: una tarjeta clickeable que contiene el menú no se abre al elegir una opción. La selección, el cierre y la navegación de los ítems con enlace no cambian.
- Las fotos de `Avatar` con `size="xl"` se piden y se dibujan a 88px, en lugar de 40px estirados, con el provider por defecto y con el de Next.
- Cuando alguien sale de un `AvatarGroup` (cambian `members` o baja `max`), los lectores de pantalla dejan de anunciarlo apenas empieza a cerrarse su lugar.
- En pantallas o contenedores angostos, la `action` de un `Alert` baja debajo del texto cuando no entra al lado, en lugar de desbordar el aviso y aplastar el texto.
- Los números de la ayuda de `Input` y `Textarea` ruedan hasta su línea sin pasarse ni rebotar al asentarse.

## [2.7.1] - 2026-10-16

### Fixed

- `RichLinkEditor` ya no pinta su propio fondo: deja ver la superficie que lo contiene, así dentro de un diálogo o de una tarjeta en modo oscuro deja de verse como un bloque de otro color.

## [2.7.0] - 2026-10-16

### Added

- `beez-ui/motion-tokens` suma los presets de Arc que faltaban: `MOTION_TIMING.instant`, `MOTION_TIMING.standard`, `MOTION_TIMING.considered`, `MOTION_EASE_EXIT`, `MOTION_EASE_STANDARD`, `MOTION_EXIT_SCALE`, `MOTION_TOOLTIP_SCALE` y `MOTION_DIALOG_EXIT_DISTANCE`.

### Changed

- Los tokens de `beez-ui/motion-tokens` toman los valores de los presets de Arc y conservan sus nombres: los springs pasan a `snappy`, `smooth` o `morph` (expresados con `visualDuration` y `bounce` en lugar de `stiffness`, `damping` y `mass`), las duraciones y curvas usan las de Arc y la presión baja a 0.97.
- `Dialog` y `AlertDialog` entran como el diálogo de Arc: el panel sube 8 px y crece desde 0.96 con un resorte suave mientras aparece, y sale rápido (0.16 s), en lugar de desplegarse desde el centro. La transformación y la opacidad que el panel recibe por `className` o `style` se mantienen durante toda la animación, y reabrirlo mientras sale lo devuelve desde donde está.
- `Input`, `Textarea`, `InputGroup` y `SelectTrigger` ya no tiemblan al pasar a `aria-invalid="true"`: el error se indica con el color y el mensaje, sin mover el campo.
- Las opciones de `Select`, `Alert`, `FormMessage` y el ícono de `AnimatedThemeToggler` aparecen con un fundido y una escala breves, sin desenfoque; las opciones del `Select` entran todas juntas, sin escalonarse.
- El ancho del `Sidebar` cambia con el resorte `smooth` de Arc (0.4 s, sin rebote), más suave que antes.

### Deprecated

- `MOTION_TIMING.centerMorph`, `MOTION_TIMING.centerMorphFold`, `MOTION_EASE_UNFOLD` y `MOTION_CENTER_MORPH_FOLDED_PERCENT`: los diálogos ya no se despliegan desde el centro. Siguen exportados con su valor.
- `MOTION_TIMING.shake` y `MOTION_INVALID_SHAKE_PX`: los campos inválidos ya no tiemblan. Siguen exportados con su valor.

### Fixed

- Al moverse con el teclado mientras un `Select` o un `DropdownMenu` todavía se está abriendo, el resaltado se desliza hasta el tamaño y la posición finales de la opción y ya no salta al terminar.

## [2.6.2] - 2026-10-16

### Fixed

- El `Toaster` exportado por beez-ui (desde `beez-ui` y `beez-ui/sonner`) también responde al click y al teclado (Alt+T) mientras hay un `Dialog`, `AlertDialog` o `Sheet` abierto, y devuelve el foco al modal cuando se cierra el toast enfocado, sin cambiar su aspecto ni sus props.

## [2.6.1] - 2026-10-16

### Fixed

- Los botones de un toast de `ThemedToaster` (acción, cancelar o cerrar) responden mientras hay un `Dialog`, `AlertDialog` o `Sheet` abierto, y presionarlos ya no cierra el `Dialog` o el `Sheet`. También se alcanzan con el teclado mediante el atajo de Sonner (Alt+T), que ya no queda bloqueado por la trampa de foco del modal; si el control enfocado cierra su toast, el foco vuelve al modal en lugar de perderse.
- Presionar Escape en un menú, select o diálogo abierto desde el `Sidebar` en mobile cierra solo esa capa y deja el sidebar abierto.
- Abrir el `Sidebar` en mobile en una ventana de escritorio angosta ya no desplaza la página de costado cuando desaparece la barra de scroll.
- El contenido de `PopoverContent` más alto que el espacio disponible en pantalla se desplaza dentro del panel en lugar de quedar cortado fuera del viewport.

## [2.6.0] - 2026-10-15

### Added

- `Switch` acepta `label` para mostrar el texto dentro del control con la altura táctil de Arc.
- `Checkbox` acepta `label` y `description` para mostrar el campo con etiqueta de Arc, con la descripción vinculada por `aria-describedby`.
- `RadioGroupItem` acepta `label` y `description` para mostrar las filas de opción de Arc, con un resaltado que se desliza hacia la opción elegida, también con las flechas del teclado.
- `Badge` acepta `tone` (`neutral`, `success`, `info`, `warning`, `danger`), `size` (`sm`, `md`) e `icon`; cuando cambia el texto, el nuevo entra animado y el ancho se ajusta con un resorte.
- `Avatar` acepta `size="xl"` (88 px) y `status` (`online`, `offline`) con un punto de presencia animado y un texto accesible configurable con `statusLabel`; si el avatar también tiene un `AvatarBadge`, el punto pasa a la esquina superior.
- `Skeleton` acepta `lines`, `avatar` y `label` para dibujar el placeholder completo de Arc, y `loading` para pasar del placeholder al contenido con una transición.
- `CardMedia` agrega un marco para fotos en `Card` con un zoom suave al pasar el puntero.
- `Alert` acepta `tone` con su ícono y rol accesible, `icon`, `onDismiss` con `dismissLabel` para descartarlo, y `open` para ocultarlo colapsando su altura.
- `Tooltip` acepta `content` y `side` para envolver directamente su trigger, y funciona sin `TooltipProvider`.
- `PopoverClose` cierra el popover desde un control dentro del panel.
- `HoverCardProfile` muestra una vista previa de persona (retrato o iniciales, nombre, rol, bio, números y pie) dentro de `HoverCardContent`.
- `DialogTitle`, `DialogDescription`, `AlertDialogTitle` y `AlertDialogDescription` animan el cambio de texto mientras el diálogo está abierto, sin animar el primer render y sin movimiento con `prefers-reduced-motion`.
- `DialogHeader` deja espacio al botón de cerrar del panel para que un título largo no quede debajo.
- Los enlaces de `Pagination` con `aria-disabled` se muestran atenuados y no navegan ni con clic ni con el teclado.
- `Calendar` acepta `showToday` y `todayLabel` para mostrar un botón "Hoy" que vuelve al mes actual y selecciona el día de hoy.
- `CarouselIndicators` muestra un grupo de botones de puntos, con el activo marcado por `aria-current`, cuyo punto activo se estira en una píldora que acompaña el desplazamiento.
- `Carousel` responde a `Home` y `End` para ir a la primera y la última diapositiva.

### Changed

- `Switch` adopta el diseño de Arc: pista de 42×24 (la variante `sm` pasa a 32×18) y thumb que se desliza con un resorte y se estira mientras se mantiene presionado.
- `Checkbox` adopta el diseño de Arc: cuadrado de 18 px con relleno animado, tilde que se dibuja y se transforma en guion en el estado indeterminado, y zona táctil de 44 px.
- `RadioGroupItem` adopta la marca de Arc: 17 px, rellena con el color de selección y con un punto que aparece con un resorte al elegirla.
- `Badge` adopta el diseño de Arc: altura de 26 px por defecto, borde y fondo según el tono; las variantes actuales se dibujan con los tonos de Arc.
- `Avatar`, `Card` y `Alert` adoptan los tokens de Arc: borde visible, superficie, radios, espaciado de 20 px en `Card` y descripción más chica en `Alert`.
- `Card` con enlaces o botones se eleva levemente al pasar el puntero, y su footer ya no tiene banda de fondo.
- `Skeleton` reemplaza el brillo deslizante por el pulso escalonado de Arc, que se detiene a los 20 segundos aproximadamente.
- `Tooltip`, `Popover` y `HoverCard` adoptan el diseño de Arc: superficies con radio, borde y sombra de Arc; el tooltip pierde la flecha. Las tres capas entran desde su trigger y, con movimiento reducido, solo se desvanecen.
- Los tooltips esperan 250 ms antes de abrir (`TooltipProvider` por defecto) y los hover cards abren a los 500 ms y cierran a los 140 ms; tras cerrar uno, el siguiente abre al instante.
- `sideOffset` y `collisionPadding` por defecto pasan a 8/12 px en tooltip y hover card, y a 6/10 px en popover; el popover usa más padding y el hover card mide 18.5rem.
- `DropdownMenu` adopta el diseño de Arc: panel sólido elevado (sin el efecto translúcido), filas de 36 px, tono de peligro en los ítems destructivos, ítems deshabilitados más tenues y entrada escalonada de las filas que respeta `prefers-reduced-motion`.
- `DropdownMenuContent` usa por defecto `sideOffset` 6, `collisionPadding` 12 y `loop`, así que las flechas del teclado vuelven del último ítem al primero; `DropdownMenuSubContent` también usa `collisionPadding` 12 y `loop`. Se pueden sobrescribir.
- `Select` adopta el diseño de Arc: el trigger usa las alturas de control de Arc (`default` igual que `Input`, `sm` de 36 px), responde al hover solo con puntero fino y marca `aria-invalid` con el borde de peligro; la lista tiene panel elevado, filas de 36 px y, con `position="popper"`, `collisionPadding` 12 y una altura máxima de 20rem.
- `Tabs` adopta el diseño y la motion de Arc: lista segmentada con superficie elevada en el tab activo, resaltado que se desliza con el resorte de Arc y paneles que entran desde el lado del tab elegido ajustando su altura.
- La lista de `Tabs` se desplaza de costado cuando no entra en pantalla y mantiene visible el tab activo o enfocado.
- `Pagination` adopta el diseño de Arc: controles compactos con números tabulares, marca de la página actual que se desliza y flechas que responden al presionarlas; sigue navegando con el `Link` del provider.
- `Pagination` usa textos por defecto en español ("Paginación", "Anterior", "Siguiente", "Ir a la página anterior", "Ir a la página siguiente", "Más páginas").
- `Dialog` y `AlertDialog` adoptan la superficie del Dialog de Arc: velo más oscuro con desenfoque, panel elevado con radio de superficie, borde fino, sombra flotante y padding de 24 px; conservan el despliegue desde el centro.
- El ancho máximo de `DialogContent` pasa de 384 px a 440 px, los títulos de los diálogos usan Inter a 18 px y las descripciones el color de texto secundario de Arc.
- El botón de cerrar de `DialogContent` pasa a 32 px, con borde y fondo suave, alineado con la primera línea del título.
- `DialogFooter` y `AlertDialogFooter` sobresalen 24 px hacia los costados y abajo, acompañando el nuevo padding.
- El texto plano de títulos y descripciones de los diálogos se renderiza dentro de un `span` con `data-slot="dialog-swap-text"`.
- `Calendar` adopta el diseño de Arc: días redondos de 36 px, título a la izquierda, punto bajo el día de hoy y un disco de selección que se desliza entre días.
- Los controles anterior y siguiente de `Carousel` adoptan el diseño de Arc (redondos, con borde, 36 px) y el carrusel muestra el cursor de arrastre.

### Fixed

- Las flechas del teclado dentro de un campo de texto de una diapositiva ya no mueven el `Carousel`.
- El día elegido de `Calendar` ya no pierde su color al pasar el puntero.

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
