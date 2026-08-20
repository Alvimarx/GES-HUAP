# Implementación de la ruta guiada — alineación diseño ↔ spec

**Fecha:** 20-08-2026 · **Estado:** implementado; **pendiente de validación por la Unidad GES**
**Diseño de origen:** «GES HUAP — Ruta guiada» (Claude Design)
**Spec:** [`docs/superpowers/specs/2026-08-09-landing-ges-medicos-design.md`](superpowers/specs/2026-08-09-landing-ges-medicos-design.md)

---

## 1. Qué se hizo

Se implementó en el repositorio el diseño aprobado, con dos reglas fijadas por el usuario:

- **Visual: idéntico**, sin diferencias. Solo se admiten mejoras.
- **Funcional: manda la spec** cuando diseño y spec se contradicen.

El diseño llegó como un HTML empaquetado que ejecuta una app React con el runtime del editor de
Claude Design. Se desempaquetó, se extrajeron la plantilla, los datos y las tipografías, y se
reimplementó sobre la arquitectura que exige la spec §4.

## 2. Fidelidad visual — cómo se verificó

No se declaró «idéntico» de vista: se midió.

**Comparación pixel a pixel** contra el diseño original, en 6 estados × 2 anchos (390 px y 1280 px,
a 2×): paso 1, paso 2, paso 3 en Confirmación, panel NTMA abierto, Seguimiento de ACV y Seguimiento
de Gran quemado.

| Resultado | Valor |
|---|---|
| Alto y ancho de página | **idénticos en las 12 capturas** |
| Píxeles distintos | entre 0,004 % y 0,05 % |

**Comparación de geometría**, caja por caja: se recorrieron ambos árboles y se compararon posición y
tamaño de todas las cajas con estilo del diseño (100 cajas en el paso 3, 62 en Seguimiento). Única
diferencia numérica en todo el recorrido: **0,01 px** en el ancho de la píldora «Paso 3 de 3».

**Origen del residuo.** El runtime del editor envuelve cada texto interpolado en un `<span>` propio,
de modo que `desde {{z.desde}}` se dibuja como dos tiradas de texto y no como una. El navegador aplica
kerning distinto en cada caso y algunos glifos se corren una fracción de píxel. Es un detalle del
visor, no del diseño; a 3× de aumento no se distingue. Se optó por no reproducir esos `<span>` en el
código de producción.

**Prueba funcional:** se recorrieron los 14 problemas × 5 momentos × 2 contextos (140 vistas) en ambas
versiones comparando el texto renderizado, más la calculadora de plazos en horas y en días.

## 3. Lo funcional que se resolvió a favor de la spec

| Punto | Diseño | Implementado | Por qué |
|---|---|---|---|
| Framework | React 18 desde `unpkg.com` | JavaScript sin dependencias | Spec §4: sin frameworks de runtime ni CDN. Un box sin salida a internet no cargaría la página. |
| Tipografías | Google Fonts | Nunito servida desde el propio sitio (`dist/fonts/`) | Spec §4: sin fuentes remotas. Se conservan los cinco subconjuntos y sus `unicode-range`, así que en español se descarga solo el latino (38 KB). |
| Sin JavaScript | Página en blanco | Documento lineal completo | Spec §4: «HTML funcional sin JavaScript; el JS solo mejora». |
| Impresión | Sin hoja de estilos | Documento completo, 12 páginas A4, sin fondos de color | Spec §5: hoja de impresión de primera clase, bloques plegables abiertos. |
| Contenido | Incrustado en un módulo JS | `content/*.json` | Spec §4: la unidad edita datos, no código. |

**Cómo conviven la ruta guiada y la página lineal.** La spec §11 pide una página lineal imprimible; el
diseño es una ruta guiada de 3 pasos. No hubo que elegir: el HTML contiene el documento lineal completo
(`#doc`) y el JavaScript monta encima la ruta guiada (`#app`). Con JavaScript se ve la ruta guiada tal
como fue diseñada; sin JavaScript y al imprimir sale el documento completo. Cumple las dos cosas.

## 4. Mejoras aplicadas (invisibles en reposo)

1. **Realce al pasar el puntero.** El diseño lo declara con el atributo `style-hover`, que el visor de
   Claude Design no llega a aplicar (no genera ninguna regla CSS para él). Se implementó como CSS real:
   es exactamente lo que el diseño pedía y solo se ve con el mouse encima.
2. **Accesibilidad.** `lang="es-CL"`, `<title>`, etiqueta del buscador para lectores de pantalla,
   `aria-pressed` en los botones de contexto y en la lista de verificación, `aria-expanded` en los
   plegables, y anuncio del contador «X de Y listas». Al cambiar de paso el foco va al título del paso.
3. **Foco de teclado visible** (WCAG 2.4.7), solo en controles y solo con `:focus-visible`: no aparece
   al usar el puntero.
4. **El foco no se pierde al re-dibujar.** Se restaura el control activo y la posición del cursor: sin
   esto, cada letra escrita en el buscador devolvería el foco al inicio de la página.
5. **`prefers-reduced-motion`** desactiva el parpadeo del distintivo «Notificar ahora».

## 5. Cambio de comportamiento deliberado — lista de verificación

**El diseño guarda las marcas en `localStorage`**, con clave por problema + momento. En un equipo
compartido de box eso significa que el siguiente médico, con **otro paciente**, abre el mismo problema
y encuentra la lista **ya marcada**: «5 de 5 listas» sin que se haya hecho nada. Es precisamente el
error que esta página existe para evitar (brecha n.º 1 de la unidad: oportunidad y cobertura de la
notificación).

Se cambió a:

- **`sessionStorage`** en lugar de `localStorage`: las marcas duran la sesión, no para siempre.
- **Se limpian al cambiar de problema**, que en la práctica es cambiar de paciente. Si se vuelve al
  mismo problema, se conservan.

Es el único cambio de comportamiento respecto del diseño y no altera nada visual. **Si la unidad
prefiere el comportamiento original, se revierte en `src/app.js` (`loadChecks`/`saveChecks` y la rama
`pick-ps`).**

## 6. Hallazgos de contraste — decisión pendiente de la unidad

La spec §8 exige verificación WCAG antes de publicar. Se midieron 32 pares de color del diseño:
**26 cumplen AA, 6 no.** No se corrigió ninguno, porque cambiar un color sería cambiar el diseño.

| Elemento | Contraste | Mínimo AA | Nota |
|---|---|---|---|
| «Cálculo referencial — no se guarda…» (`#8FA6C6` sobre `#EDF2F9`) | 2,21 | 4,5 | Texto informativo |
| «Fuente: …» (`#8FA6C6` sobre `#EDF2F9`) | 2,21 | 4,5 | **Es la trazabilidad de la fuente (CLAUDE.md §1.4)** |
| Bajada de la cabecera (blanco 92 %) | 3,27 | 4,5 | Solo en el extremo claro del degradado; en el oscuro llega a 5,33 |
| Línea de vigencia (blanco 85 %) | 3,03 | 4,5 | Ídem: 4,76 en el extremo oscuro. **Es la fecha de vigencia, obligatoria y visible** |
| Píldora «UNIDAD GES · HUAP» | 3,91 | 4,5 | Ídem |
| Chevron «›» de las tarjetas | 2,49 | 3,0 | Decorativo (`aria-hidden`), con la tarjeta ya rotulada: exento en la práctica |

**Recomendación:** subir la opacidad de la bajada y de la línea de vigencia al 100 % y oscurecer
`#8FA6C6` a `#6B82A6` resolvería los cinco casos no decorativos con un cambio mínimo. **Requiere visto
bueno**, porque toca el diseño.

## 7. Arquitectura

```
content/*.json     Datos normativos. Es lo único que edita la unidad.
src/build.js       Compone content/ + src/ → dist/. Sin dependencias.
src/shell.html     Armazón: cabecera, barra de contacto, puntos de anclaje.
src/styles.css     Estilos base, del documento lineal y de impresión.
src/app.js         Ruta guiada de 3 pasos (mejora progresiva).
src/assets/fonts/  Nunito, cinco subconjuntos.
dist/              Salida publicable (no versionada).
```

Construir: `node src/build.js`. El build **falla** si algún marcador `{{FALTA: …}}` llega a la salida.

**Para cambiar un plazo** se edita `content/plazos-intrahospitalarios.json` o `content/plazos-alta.json`
y se reconstruye. No se toca código. Cada registro lleva su `fuente` y su `fecha`.

## 8. Antes de publicar (spec §8)

- [ ] Validación de la Unidad GES: plazos revalidados, criterios NTMA transcritos y textos de la página.
- [ ] Decisión sobre los seis pares de contraste del §6.
- [ ] Visto bueno institucional de marca y publicación.
- [ ] Definición del hosting y de si `huap.online` está bajo control del hospital.
- [ ] Confirmar si los 14 problemas son todos los que corresponden a HUAP (`problemas.json`
      lo advierte: el afiche de origen no tiene fecha ni versión).
- [ ] Resolver a quién recurre un médico **fuera del horario** con una duda GES no urgente
      (`contactos.json` lo tiene marcado como pendiente; hoy la página solo declara la vía de riesgo
      vital, que es la que está confirmada).
- [ ] **Analítica: no implementada.** La spec §6 la contempla y la unidad la quiere, pero depende del
      hosting, que aún no está definido. Sale sin analítica y se declara.
