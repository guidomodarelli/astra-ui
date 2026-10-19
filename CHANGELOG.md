# Cambios

Todos los cambios relevantes de `@astra-kit/ui` se documentan en este archivo con el formato de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versionado [SemVer](https://semver.org/lang/es/). Cada cambio agrega sus entradas en `[Unreleased]`; `pnpm create-version` las pasa a la versión publicada con su fecha.

## [Unreleased]

## [1.0.0] - 2026-10-18

### Changed

- El paquete pasa a llamarse `@astra-kit/ui` y reinicia la numeración: reemplazá la dependencia `beez-ui` por `@astra-kit/ui` y todos los imports, incluidos los subpaths y el CSS (`@astra-kit/ui/next`, `@astra-kit/ui/styles.css`, …). El repositorio ahora es `guidomodarelli/astra-ui`.
- La API pública usa el prefijo `Astra`: `AstraUIProvider`, `AstraUIProviderProps`, `AstraUIComponents`, `AstraLinkProps`, `AstraImageProps` y `useAstraUIComponents`, también en `@astra-kit/ui/next` y `@astra-kit/ui/tanstack`.
- Las fuentes de `fonts.css` se registran como `Astra Inter`, `Astra Geist` y `Astra Mono`, la variable CSS de `ReactionButton` es `--astra-reaction-active-color` y el atributo del menú de tema es `data-astra-theme-menu`.

### Removed

- No se aceptan los nombres anteriores (`BeezUIProvider`, `BeezLinkProps`, `BeezImageProps`, `useBeezUIComponents`, `Beez Inter`/`Geist`/`Mono`, `--beez-reaction-active-color`, `data-beez-theme-menu`): hay que migrar todo de una vez. El historial de `beez-ui` 0.8.1–4.0.1 queda en [`docs/history/beez-ui-changelog.md`](https://github.com/guidomodarelli/astra-ui/blob/main/docs/history/beez-ui-changelog.md).

### Fixed

- `DropdownMenu` con un `trigger` propio no disponible ya no abre el menú: ni con click o toque cuando el botón está deshabilitado (por su `disabled`, por un `<fieldset disabled>` o por estado interno del componente), ni con Enter, Espacio o flecha abajo cuando tiene `aria-disabled="true"`, como un `Button` en `loading`. Antes se abría porque el navegador igual entrega el `pointerdown` al botón deshabilitado.
