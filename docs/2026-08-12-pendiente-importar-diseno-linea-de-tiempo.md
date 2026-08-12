# Pendiente — Importar e implementar «GES HUAP - Linea de tiempo.html» (Claude Design)

**Fecha:** 12-08-2026 · **Estado:** bloqueado a la espera del archivo de diseño

## Tarea encargada

Alinear el diseño hecho en Claude Design con la spec
[`docs/superpowers/specs/2026-08-09-landing-ges-medicos-design.md`](superpowers/specs/2026-08-09-landing-ges-medicos-design.md)
e implementarlo en este repositorio. Regla acordada con el usuario:

- **Visual:** el resultado debe quedar **exactamente igual** al diseño, sin ninguna diferencia visual.
- **Funcional:** si el diseño y la spec difieren en algo funcional, **gana la spec**.

Proyecto de origen:
`https://claude.ai/design/p/b77cdd79-e638-4e92-b0d9-e14588ca3dbd?file=GES+HUAP+-+Linea+de+tiempo.html`

## Por qué está bloqueado

Desde la sesión remota no fue posible obtener el archivo:

- La autorización del MCP de Claude Design (`/design-login`) requiere terminal interactiva, no disponible
  en el entorno remoto.
- La URL del proyecto devuelve 403 a fetch no autenticado.
- El archivo no está en el repo, ni sembrado en el workspace, ni en Drive/Gmail/artifacts de la cuenta.

## Cómo desbloquear (cualquiera de estas vías)

1. **Subir el HTML al repo** (vía recomendada): descargarlo desde Claude Design y commitearlo, por ejemplo
   en `design/GES HUAP - Linea de tiempo.html`, en `main` o en la rama de trabajo.
2. Desde Claude Design usar **«Send to Claude Code Web»** para sembrar el proyecto en el workspace.
3. Ejecutar la importación desde una sesión local de Claude Code con `/design-login`.

## Pauta de alineación (aplicar cuando llegue el archivo)

**1. Auditoría de datos normativos.** Todo dato normativo, clínico o de contacto incrustado en el HTML se
contrasta contra `content/*.json` (creados el 12-08-2026 desde las fuentes verificadas de la carpeta). Un dato
del diseño que no esté respaldado por `content/` no se conserva: se corrige o se reemplaza por marcador
`{{FALTA: …}}`. En particular, vigilar los tres puntos de partida que el afiche institucional tiene errados
(gran quemado ×2, agresión sexual aguda) — un diseño basado en el afiche los traerá mal.

**2. Requisitos funcionales de la spec que prevalecen sobre el diseño** (spec §4–§6; CLAUDE.md §10–§11):

- Contenido normativo separado de la presentación: el HTML consume `content/*.json` vía build; no queda
  hardcodeado.
- Sin dependencias externas: sin CDN, sin fuentes remotas, sin JS de terceros. Autocontenido.
- HTML funcional sin JavaScript; el JS solo mejora.
- Hoja de estilos de impresión de primera clase; bloques expandibles impresos abiertos.
- WCAG 2.1 AA: semántica, teclado, contraste.
- Fecha de vigencia del contenido visible (cabecera y pie de impresión), desde `content/vigencia.json`.
- Solo el buzón institucional `ges@huap.online`; ningún correo personal.
- Sin escudo/logos HUAP mientras no exista archivo oficial y autorización.
- Sin analítica que registre datos personales.

**3. Fidelidad visual.** Fuera de lo anterior, no se altera nada visual: paleta, tipografía, espaciados,
composición y microcopy del diseño se conservan tal cual. Las correcciones de datos del punto 1 se hacen
manteniendo el estilo del elemento que las contiene.

**4. Verificación antes de declarar terminado.** Render comparado contra el diseño (escritorio y móvil),
validación de datos contra `content/`, impresión, y peso de página (< 200 KB, spec §10).

## Recordatorio de gates

Nada de esto se publica sin el visto bueno de la Unidad GES (CLAUDE.md §2; spec §8). Los plazos de
`content/plazos-*.json` están revalidados contra el DS 29/2025 pero **pendientes de validación por la unidad**.
