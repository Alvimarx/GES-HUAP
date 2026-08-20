# Herramientas de verificación visual

Comprueban que la implementación (`dist/`) siga siendo **idéntica** al diseño aprobado
(`design/2026-08-20-ruta-guiada-claude-design.html`). Correrlas después de cualquier cambio en
`src/styles.css`, `src/app.js` o `src/shell.html`.

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
| `behavior.js <urlA> <urlB>` | Recorre los 14 problemas × 5 momentos × 2 contextos y compara el texto renderizado, más la calculadora de plazos. Tarda unos 3 minutos. |
| `print-check.js <url>` | Genera el PDF en **A4 y en carta** y comprueba que la fecha de vigencia salga al pie de **todas** las páginas y que ninguna línea del cuerpo quede debajo. Necesita además `pdfjs-dist` (`npm install --no-save pdfjs-dist`; ruta configurable con `PDFJS_PATH`). |

**`print-check.js` hay que correrlo después de editar `content/` o la hoja de impresión.** El pie vive
en un `<tfoot>` con `display: table-footer-group`, que se repite en cada página y **reserva su altura
en el flujo**, así que el solapamiento no debería poder ocurrir. La comprobación existe porque una
versión anterior usaba `position: fixed`, que se repetía igual pero flotaba sobre el texto y lo
borraba del papel — y la primera versión de esta herramienta lo daba por bueno. Si vuelve a avisar,
revisar el bloque `@media print` de `src/styles.css` antes que nada.

## Cómo leer los resultados

- **`measure.js` es el que manda.** Si la geometría es idéntica, el diseño está intacto.
- **`diff.js` siempre deja un residuo** de 0,004 % a 0,05 % de píxeles. No es un error: el visor de
  Claude Design envuelve cada texto interpolado en un `<span>` propio, el navegador aplica kerning
  distinto y algunos glifos se corren una fracción de píxel. A 3× de aumento no se distingue.
  Ver `docs/2026-08-20-implementacion-ruta-guiada.md` §2.
- **`behavior.js` normaliza los espacios en blanco**, porque el marcado del diseño tiene saltos de
  línea entre elementos y el generado no. No afecta el layout: lo confirma `measure.js`.
