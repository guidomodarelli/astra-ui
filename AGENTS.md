# Reglas del repositorio

## Entorno de tests

- Usar Vitest con jsdom para los tests compatibles con ese entorno.
- Cuando jsdom no soporte una API o no reproduzca fielmente el comportamiento que se necesita validar (layout, Web Animations, media queries reales, observers de tamaño o intersección), implementar o trasladar ese caso a Playwright en `tests/browser/`, ejecutándolo en los navegadores y tamaños de pantalla relevantes.
- Se permiten shims mínimos de APIs de plataforma que jsdom no implementa (por ejemplo `matchMedia`) solo cuando son necesarios para montar los componentes. Deben vivir en `vitest.setup.ts`, estar documentados y no modelar el comportamiento de la API: ningún test puede afirmar sobre ese comportamiento a través del shim.
- No agregar mocks ni polyfills para simular el comportamiento faltante y hacer pasar esos casos. No debilitar assertions ni omitir cobertura: validar el comportamiento real con Playwright cuando jsdom no lo soporte.

## Validación integral de componentes

Todo cambio que agregue, modifique, corrija o reemplace un componente (incluidos estilos, tokens, motion y migraciones a Arc) debe validarse completo antes de darse por terminado, no solo el caso puntual que motivó el cambio. Validar el componente tocado y todos los que lo componen, lo contienen o comparten estilos o primitivas con él.

- **Desktop y mobile**: ejecutar los tests de Playwright en los cuatro proyectos de `playwright.config.ts` (`chromium-desktop`, `chromium-mobile`, `webkit-desktop`, `webkit-mobile`). Revisar también anchos intermedios y bordes cuando el layout cambie entre breakpoints, sin scroll horizontal ni contenido cortado o superpuesto.
- **Comportamiento**: estados (default, hover, focus-visible, active, disabled, loading, error, vacío, contenido largo), interacción con mouse, teclado y touch, foco (orden, trampa y retorno al cerrar overlays), props controladas y no controladas, y accesibilidad (roles, nombres accesibles, atributos ARIA).
- **Posicionamiento y z-index**: overlays, popovers, menús, tooltips, dialogs, sheets y toasts deben quedar por encima de lo que corresponde y por debajo de lo que corresponde. Verificar el apilado cuando se abren dentro de otros overlays, del sidebar, de tablas con scroll o de contenedores con `overflow`/`transform`, y que el posicionamiento respete los bordes del viewport en desktop y mobile.
- **Relación con otros componentes**: probar el componente compuesto en sus contextos reales (formularios, tablas, sidebar, dialogs, menús, adapters de Next y TanStack) y verificar que no cambie el layout, el espaciado, los tokens ni el comportamiento de componentes vecinos o consumidores.
- **Animación**: entrada y salida completas, interrupciones (abrir y cerrar rápido), estado final correcto y la rama de `prefers-reduced-motion`. Usar `motion-recorder.ts` y los specs de motion de `tests/browser/` para validar frames reales.
- **Estabilidad visual**: sin saltos de UI, layout shift, desplazamientos del contenido, parpadeos, cambios de tamaño al cambiar de estado, saltos del scroll ni aparición o desaparición de la barra de scroll al abrir overlays. Medir con Playwright (por ejemplo `boundingBox()` antes, durante y después de la interacción) en lugar de asumirlo.
- **Temas**: verificar tema claro y oscuro.
- **Hidratación**: los componentes que renderizan en servidor no deben producir hydration mismatches ni cambiar de layout al hidratar.

Cada aspecto que cambie con el componente debe quedar cubierto por un test (Vitest si jsdom lo reproduce, Playwright en `tests/browser/` si no). Antes de cerrar, ejecutar `pnpm test`, `pnpm test:browser` y, si cambian stories o el catálogo, `pnpm test:storybook`. Revisar visualmente el resultado en Storybook o en las páginas de `tests/browser/` en desktop y mobile. Si algún aspecto no pudo validarse, informarlo explícitamente con el motivo.

## CHANGELOG

- Todo cambio que modifique el comportamiento, la API pública, los estilos, las dependencias publicadas o el proceso de release debe actualizar `CHANGELOG.md` en el mismo commit.
- Las entradas van siempre dentro del bloque `## [Unreleased]`, nunca en una versión ya publicada. No escribir la versión ni la fecha a mano: `pnpm create-version` (@astra-kit/rp 1.0.0) renombra `[Unreleased]` a `## [X.Y.Z] - AAAA-MM-DD` en el commit de versión y deja un `## [Unreleased]` vacío arriba. La fecha usa la hora de Argentina (`releaseTimeZone: "America/Argentina/Buenos_Aires"` en `astra-rp.config.js`), también cuando el release corre en el runner de CI en UTC.
- Agrupar las entradas con el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), usando solo estas secciones y en este orden: `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`. Omitir las secciones vacías.
- Una línea `- ` por cambio, en español, escrita para quien consume el paquete (qué cambia para él), sin detalles internos de implementación.
- Cambios que no afectan a quien consume el paquete (tests, refactors internos sin efecto visible, tooling local) no necesitan entrada.
- Antes de publicar, escribir en `[Unreleased]` los cambios del release. Si faltan, `changelogDraft: true` (en `astra-rp.config.js`) hace que astra-rp los redacte con Claude Code o, si falla, con Codex, y los escriba sin confirmar: revisalos en la salida del comando. Si ningún agente puede, astra-rp bloquea el release mientras `[Unreleased]` no exista o no tenga entradas. No cerrar la sección a mano ni desde los hooks (por ejemplo con `releaseUnreleased`): la cierra astra-rp. En el commit de versión, `release:prepare` exige el bloque fechado que coincide con la versión del manifiesto.

## Release

- `pnpm create-version` (alias `pnpm cv`) es el comando compartido `astra-rp create-version`. Lo propio de @astra-kit/ui (incluida la zona horaria de la fecha del CHANGELOG, `releaseTimeZone`) se configura en `astra-rp.config.js` y en el hook `prepare` de `scripts/release-hooks.js`; la verificación y publicación del tarball y las credenciales de npm las resuelve astra-rp. No reimplementar el orquestador ni la publicación en este repositorio. No publicar con `pnpm publish`: `prepublishOnly` (`astra-rp guard-publish`) lo bloquea a propósito.
- Cada versión queda en un commit cuyo asunto es exactamente `X.Y.Z`, con el tag anotado `vX.Y.Z`. No crear commits de release ni tags a mano.
