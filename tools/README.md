# Herramientas de verificación visual

Comprueban la implementación (`dist/`). Correrlas después de cualquier cambio en
`src/styles.css`, `src/app.js`, `src/shell.html` o `content/`.

**Desde el rediseño del 2026-08-23** (pregunta única de confirmación + animaciones, pedido por el
usuario) las pantallas 2 y 3 **divergen a propósito** del diseño de Claude Design
(`design/2026-08-20-ruta-guiada-claude-design.html`): `diff.js` y `measure.js` solo siguen siendo
comparables en la pantalla 1 (lista de problemas). La red de seguridad del contenido pasó a ser
`behavior.js`, que ya no compara contra el diseño.

No son parte del sitio ni del build. Requieren Node y Playwright con Chromium:

```sh
npm install --no-save playwright        # o usar una instalación existente
node src/build.js
```

Servir ambas versiones en un mismo servidor estático, por ejemplo:

```sh
mkdir -p /tmp/ges/orig /tmp/ges/mine
cp "design/2026-08-20-ruta-guiada-claude-design.html" /tmp/ges/orig/index.html
cp -r dist/* /tmp/ges/mine/
npx http-server /tmp/ges -p 8321 -s
```

En `tools/*.js`, `PW` apunta a la instalación de Playwright; ajustarla si hace falta.

| Herramienta | Qué hace |
|---|---|
| `shot.js <url> <dir>` | Captura 6 estados de la ruta guiada en móvil (390 px) y escritorio (1280 px), a 2×. |
| `diff.js <dirA> <dirB> <dirSalida>` | Compara las capturas píxel a píxel y escribe las diferencias en rojo. |
| `measure.js <urlA> <urlB>` | Compara posición y tamaño de todas las cajas con estilo del diseño, caja por caja. |
| `behavior.js <url>` | Cobertura de contenido: recorre los 14 problemas × 2 respuestas de la pregunta de confirmación y comprueba que cada acción y cada plazo declarados en `content/` aparezcan en su rama, y que la pista `confirma` se vea en la pregunta. |
| `search-check.js [url]` | Ejercita el buscador en el navegador con 48 consultas y comprueba el resultado de cada una. Correrlo tras tocar el buscador o el campo `sinonimos`. |
| `print-check.js <url>` | Genera el PDF en **A4 y en carta** y comprueba que la fecha de vigencia salga al pie de **todas** las páginas y que ninguna línea del cuerpo quede debajo. Necesita además `pdfjs-dist` (`npm install --no-save pdfjs-dist`; ruta configurable con `PDFJS_PATH`). |

**`print-check.js` hay que correrlo después de editar `content/` o la hoja de impresión.** El pie vive
en un `<tfoot>` con `display: table-footer-group`, que se repite en cada página y **reserva su altura
en el flujo**, así que el solapamiento no debería poder ocurrir. La comprobación existe porque una
versión anterior usaba `position: fixed`, que se repetía igual pero flotaba sobre el texto y lo
borraba del papel — y la primera versión de esta herramienta lo daba por bueno. Si vuelve a avisar,
revisar el bloque `@media print` de `src/styles.css` antes que nada.

## Cómo leer los resultados

- **`behavior.js` es el que manda para el contenido:** si reporta cobertura completa, ninguna
  garantía se perdió al componer las vistas.
- **`diff.js` y `measure.js`** solo aplican a la pantalla 1; en ella el residuo de píxeles de
  0,004 %–0,05 % es kerning, no un error (ver `docs/2026-08-20-implementacion-ruta-guiada.md` §2).
- Las animaciones no afectan a las capturas: `shot.js` las anula antes de capturar, y `behavior.js`
  espera a que cada pantalla exista en el DOM.
