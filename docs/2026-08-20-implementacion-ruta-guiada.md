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
| Impresión | Sin hoja de estilos | Documento completo (14 páginas A4 · 15 en carta), sin fondos de color | Spec §5: hoja de impresión de primera clase, bloques plegables abiertos. |
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

## 6. Correcciones al contenido normativo del diseño

Una revisión adversarial contrastó cada dato publicable contra las fichas oficiales del MINSAL
(`fuentes/auge-minsal-2026-07-30/ps-*.txt`) y la transcripción de la NTMA. Aparecieron once defectos, todos
verificados uno por uno contra la fuente primaria antes de tocar nada. **Son las únicas diferencias de texto
respecto del diseño**, y se hicieron porque CLAUDE.md §1.1 prohíbe alterar criterios clínicos y §1.5 obliga a
corregir en vez de propagar.

**Garantías que faltaban** (omitir una garantía es el peor error posible en esta página):

| Problema | Garantía ausente | Fuente |
|---|---|---|
| PS 6 · DM tipo 1 | Consulta con médico especialista, **7 días desde la sospecha por exámenes alterados** | `ps-06.txt` |
| PS 6 · DM tipo 1 | Glicemia **30 min** en quien **ya está en tratamiento** y se descompensa — el caso más frecuente en urgencia | `ps-06.txt` |
| PS 55 · Gran quemado | Entrega de ayudas técnicas de rehabilitación ambulatoria, **30 días desde la indicación** | `ps-55.txt` |

**Criterios clínicos alterados:**

| Dónde | Decía | Dice ahora |
|---|---|---|
| PS 5, exclusiones de trombólisis | «ACV hemorrágico previo» | «antecedente de ataque cerebral hemorrágico **o de origen desconocido**» — se había estrechado la exclusión: un ACV previo no filiado aparecía como apto para trombolizar |
| PS 5, exclusiones de trombólisis | «otra hemorragia activa» | «otra hemorragia activa **(no menstrual)**» — se había ampliado: una menstruación en curso se leía como contraindicación |
| PS 26 | «Solo personas de 35 a 49 años» + una frase sin sujeto | «Personas de 35 a 49 años **con síntomas**» — la ecotomografía garantizada exige síntomas (NTMA 26.1) |
| PS 18, NTMA | «IGRA para TB latente con CD4 ≤350» | «CD4 ≤350 **o sin PPD**» |
| PS 18, plazo | «desde la sospecha o solicitud **del examen**» | «desde la sospecha o solicitud **del usuario**» — es un hito anterior a cualquier orden médica |
| Caso «el paciente no puede firmar» | Solo la firma del representante | «**huella digital del propio paciente** o de su representante» — ante un paciente consciente que no puede firmar, buscar un representante inexistente deja la notificación pendiente |
| PS 55 | «Único de los 14 sin garantía de diagnóstico» | Afirmación falsa, eliminada: tampoco la tienen los PS 36, 44, 48 y 86 |

**Denominación oficial.** Las etiquetas del diseño abrevian la redacción del decreto; la más grave es el PS 25,
donde «Trastornos de conducción que requieren marcapaso» pierde «**generación del impulso**» y con ello toda una
clase de cuadros cubiertos (p. ej. enfermedad del nódulo sinusal). No se cambió la etiqueta de la interfaz:
se agregó `denominacion_oficial` a `content/problemas.json`, que se usa como título en el documento impreso y
**se incorporó al buscador**, de modo que buscar «generación del impulso» ahora encuentra el PS 25.

**Sin respaldo documental.** La acción «Active el caso GES en SINA con el código CIE-10», primera instrucción de
la etapa de sospecha, no está descrita en ninguna fuente de la carpeta. Se dejó marcada con
`_pendiente_validacion` en `content/flujo-notificacion.json`: **la Unidad GES debe confirmarla o eliminarla.**

**Se corrigieron también las fuentes de las que venía el error** (CLAUDE.md §1.5): las tres garantías ausentes y
la afirmación falsa sobre Gran quemado estaban en `docs/2026-07-30-revalidacion-plazos-DS29-2025.md` y en
CLAUDE.md §5.7. Ambos quedaron actualizados, con nota de la corrección.

**Efecto visual.** Solo dos pantallas cambian de alto respecto del diseño, y por estas correcciones: Gran quemado
en Seguimiento gana la tarjeta de ayudas técnicas, y el caso «no puede firmar» ocupa una línea más. Todo lo
demás sigue verificándose idéntico.

## 7. Defectos de implementación corregidos

Además del contenido, la revisión encontró defectos del código. Los relevantes:

- **A 320 px la página se desplazaba en horizontal** (WCAG 1.4.10, nivel AA): el nombre del problema no
  cabía entre las dos píldoras y empujaba la tarjeta fuera de la pantalla. Además la barra fija de contacto
  ocupa tres líneas a ese ancho y tapaba el final del contenido, que reserva 96 px. Corregido **solo bajo
  360 px**: por encima cambiaría el ajuste de línea y la página dejaría de ser idéntica al diseño.
- **Un `ps` o una `etapa` mal escritos en `content/` borraban una garantía en silencio** — el filtro de la
  vista simplemente no encontraba nada. Ahora el build valida problemas, etapas, unidades, ids repetidos y
  campos obligatorios, y **se cae sin generar nada** si algo no cuadra. Es la protección que necesita un
  archivo que edita la unidad a mano.
- **Si `app.js` fallaba, la página quedaba en blanco**, porque el documento lineal se oculta al activarse
  el JavaScript. Ahora un guardia al final del HTML comprueba que la ruta guiada se haya dibujado y, si no,
  vuelve a mostrar el documento completo.
- **La clave de la lista de verificación incluía el índice de la acción**, que cambia al filtrar por
  contexto: la marca podía perderse al pasar de Urgencia a Piso. Ahora la clave usa el título completo.
- **El resultado de la calculadora de plazos no se anunciaba** a lectores de pantalla, igual que el
  contador. Ambos pasan por la región de anuncios persistente.
- El buscador se emitía como `type="search"`, que en Safari dibuja un botón de limpiar que el diseño no
  tiene. Vuelve a ser un campo de texto simple.
- `padStart` y `closest` sustituidos o con respaldo: `app.js` es ES5 completo, para los equipos de box que
  la spec advierte que no están actualizados.
- El texto «Sin garantía de oportunidad después del alta» lo generaba el código; pasó a `content/`, porque
  es una afirmación normativa y la unidad debe poder editarla.
- Las fechas se muestran en un solo formato (dd-mm-aaaa) y el procedimiento común del documento impreso
  lleva su línea de fuentes.

**Anexos internos en un sitio abierto — decisión pendiente.** La ruta guiada muestra «anexos 285221 ·
285214 · 285200», que no funcionan desde fuera del hospital, aunque el botón «Llamar» sí marca el número
externo. Es exactamente el punto que CLAUDE.md §11 dejó por confirmar antes de publicar. No se cambió el
texto del diseño; el documento lineal sí lista los tres números externos. **Requiere decisión de la unidad.**

**El buscador no encontraba nada sin tildes.** `craneo`, `isquemico`, `agresion` y `vesicula` devolvían
cero resultados, y la respuesta —«Sin coincidencias en los 14 problemas GES del HUAP»— se lee como
«no es GES». `TIA` tampoco encontraba nada, pese a que el TIA activa el problema 37 por confirmación
expresa de la unidad, y `AVE` devolvía los problemas 48, 49 y 50 porque coincidía dentro de «gra**ve**».
Ahora la búsqueda ignora los diacríticos, incluye un índice de sinónimos editable
(`content/problemas.json`, campo `sinonimos`: siglas y nombre corriente, sin valor normativo) y
prefiere las coincidencias que empiezan una palabra, con la coincidencia libre como respaldo. `AVE`
devuelve el ACV y nada más.

### El pie de impresión borraba texto — corregido

**Se reportó como correcto antes de estarlo.** La primera versión del pie repetido usaba
`position: fixed; bottom: 0` con fondo blanco opaco. En Chrome eso se repite en todas las páginas,
pero **no reserva espacio en el flujo**: la caja del pie se pinta encima de las últimas líneas y las
borra del papel. En carta, la página 14 perdía entera la línea «La Ley de Urgencia corre en paralelo:
la Oficina 6 de Admisión…», y su respuesta quedaba huérfana al comienzo de la página siguiente.

Peor: **la herramienta que debía detectarlo daba un falso «impresión correcta»**. Buscaba el pie con
una expresión que también casaba con texto del cuerpo, descartaba del cuerpo justamente las líneas
solapadas, y medía contra la línea base del pie en vez de contra su caja.

Corregido de raíz: el documento imprimible es ahora una tabla con `<tfoot>` en
`display: table-footer-group`, que Chrome repite en cada página **y** cuya altura descuenta del área
de flujo, de modo que el solapamiento es imposible por construcción. En pantalla la tabla se
neutraliza a bloques y el documento lineal se ve igual que antes. `tools/print-check.js` se reescribió
para leer el texto exacto del pie de la propia página, identificar el cuerpo por descarte y medir
contra la caja, y ahora prueba **A4 y carta**. Resultado verificado de forma independiente: pie en
las 14 páginas A4 y en las 15 de carta, con 27 pt de holgura mínima en ambos tamaños.

## 8. Hallazgos de contraste — decisión pendiente de la unidad

La spec §8 exige verificación WCAG antes de publicar. Se midieron 32 pares de color del diseño:
**26 cumplen AA, 6 no.** Una segunda pasada sobre los **estados compuestos por opacidad** —que la primera
medición no cubrió, porque solo miró los colores en reposo— añadió un séptimo: **7 pares bajo AA en total.**
No se corrigió ninguno, porque cambiar un color sería cambiar el diseño.

| Elemento | Contraste | Mínimo AA | Nota |
|---|---|---|---|
| «Cálculo referencial — no se guarda…» (`#8FA6C6` sobre `#EDF2F9`) | 2,21 | 4,5 | Texto informativo |
| «Fuente: …» (`#8FA6C6` sobre `#EDF2F9`) | 2,21 | 4,5 | **Es la trazabilidad de la fuente (CLAUDE.md §1.4)** |
| Bajada de la cabecera (blanco 92 %) | 3,27 | 4,5 | Solo en el extremo claro del degradado; en el oscuro llega a 5,33 |
| Línea de vigencia (blanco 85 %) | 3,03 | 4,5 | Ídem: 4,76 en el extremo oscuro. **Es la fecha de vigencia, obligatoria y visible** |
| Píldora «UNIDAD GES · HUAP» | 3,91 | 4,5 | Ídem |
| Chevron «›» de las tarjetas | 2,49 | 3,0 | Decorativo (`aria-hidden`), con la tarjeta ya rotulada: exento en la práctica |
| Descripción de una acción **ya marcada** (`#5A6B8C` sobre `#F2FBF7`, con el `opacity:.75` de la fila sobre `#EDF2F9`) | 3,13 | 4,5 | Es donde va la cita normativa (Art. 24° Ley 19.966, Circular IF/N°469). El título de la fila sí aprueba (6,24) |

Se corrigieron además, por estar en la capa propia y no en el diseño, el color de las líneas «Fuente:» del
documento lineal (de 2,49:1 a 5,36:1) y la impresión, que ahora sale toda en negro sobre blanco.

**Alcance de la medición.** La primera pasada midió solo colores en reposo y por eso se le escapó el
séptimo par, que aparece únicamente cuando una acción está marcada. Los siete son del diseño; la
implementación no introdujo ninguno.

**Remedio del séptimo, si la unidad lo aprueba:** con la composición al 75 %, `#33465F` alcanza 4,65:1.
Bastaría usar ese color para la descripción **solo en estado marcado**; el estado en reposo no cambia.

**Recomendación:** subir la opacidad de la bajada y de la línea de vigencia al 100 % y oscurecer
`#8FA6C6` a `#6B82A6` resolvería los cinco casos no decorativos con un cambio mínimo. **Requiere visto
bueno**, porque toca el diseño.

## 9. Arquitectura

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

## 10. Dos preguntas abiertas que la unidad debe cerrar

**1. La etapa «Alta» no muestra ningún plazo, en ninguno de los 14 problemas.** El reparto actual es
sospecha 12 · confirmación 18 · hospitalización 4 · seguimiento 11 · **alta 0**. Varias garantías
arrancan «desde la indicación médica», que es justamente el acto del alta, pero están archivadas en
`seguimiento`: el primer control del gran quemado a 15 días, sus ayudas técnicas a 30 días, la
rehabilitación ambulatoria de ACV y HSA a 15 días y las ayudas técnicas de menores de 65. El médico
que va a dar el alta no las ve a menos que avance un paso más. **No se movió ningún plazo por cuenta
propia**: cambiar la etapa de una garantía es una decisión de la unidad y se hace editando el campo
`etapa` en `content/plazos-alta.json`. **Recomendación: revisarlo, es la brecha de mayor impacto que
queda.**

**2. Los plazos en días, ¿son corridos o hábiles, y desde qué día se cuentan?** La calculadora suma
días de calendario y devuelve una fecha concreta que el médico puede copiar al **campo 18 del IPD**,
que es donde se materializa la garantía. Ninguna fuente de la carpeta documenta la convención de
cómputo —una búsqueda de «corridos», «hábiles» o «cómputo» en CLAUDE.md, `docs/` y `content/` no
devuelve nada— ni si el día de inicio cuenta como 0 o como 1. Un día de desfase en un plazo de 45 días
es un incumplimiento que la propia página habría inducido. **Confirmar contra la NTMA antes de
publicar.**

## 11. Antes de publicar (spec §8)

- [ ] Validación de la Unidad GES: plazos revalidados, criterios NTMA transcritos y textos de la página.
- [ ] Decisión sobre los siete pares de contraste del §8.
- [ ] Visto bueno institucional de marca y publicación.
- [ ] Definición del hosting y de si `huap.online` está bajo control del hospital.
- [ ] Confirmar si los 14 problemas son todos los que corresponden a HUAP (`problemas.json`
      lo advierte: el afiche de origen no tiene fecha ni versión).
- [ ] Resolver a quién recurre un médico **fuera del horario** con una duda GES no urgente
      (`contactos.json` lo tiene marcado como pendiente; hoy la página solo declara la vía de riesgo
      vital, que es la que está confirmada).
- [ ] **Analítica: no implementada.** La spec §6 la contempla y la unidad la quiere, pero depende del
      hosting, que aún no está definido. Sale sin analítica y se declara.
