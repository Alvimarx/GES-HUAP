# Spec — Landing GES para médicos del HUAP

**Fecha:** 09-08-2026 · **Estado:** aprobado en diseño por el usuario; pendiente de revisión final del spec
**Proyecto:** página informativa para que un médico del HUAP sepa qué hacer ante la sospecha o confirmación
de una patología GES, en el momento en que le surge la duda.

---

## 1. Propósito y audiencia

**Problema.** La brecha n.°1 priorizada por la Unidad GES es la baja oportunidad y cobertura de la
notificación. El médico que confirma un diagnóstico GES debe emitir el IPD y el Formulario de Constancia **en
ese momento** (Circular IF/N°469; confirmado por la unidad), y al alta debe emitir la SIC y enviarla a la
unidad. Cada paso omitido es una garantía en riesgo. No existe hoy ningún material que reúna el proceso
completo, y ninguno cubre los plazos intrahospitalarios.

**Audiencia primaria:** médicos del HUAP (urgencia, hospitalización, especialidades), consultando de pie,
desde el celular, entre pacientes. **Audiencia secundaria tolerada:** el sitio es internet abierto e
indexable — pacientes, otros hospitales y prensa podrán leerlo. El contenido debe declarar su alcance («guía
de procedimiento interno para clínicos del HUAP; no sustituye el juicio médico ni las Guías Clínicas MINSAL»)
y resistir esa lectura.

**No hace:** decidir si un caso es GES; mostrar datos de pacientes; publicar correos personales.

## 2. Decisiones ya tomadas

| Decisión | Valor |
|---|---|
| Publicación | Internet abierto, sin autenticación |
| Alcance v1 | Ciclo completo: sospecha → confirmación → notificación → alta → seguimiento |
| Formato | Página lineal de scroll único, imprimible completa |
| Mantención | Contenido normativo en archivos de datos editables por la unidad |
| Criterios NTMA | Resumidos por problema, con cita, **validados por la unidad antes de publicar** |
| Analítica | Sí, mínima y sin datos personales |
| Estructura | 7 secciones (aprobada 09-08-2026) |

## 3. Contenido — las 7 secciones

Cada dato normativo sale de una fuente identificada; el marcador `{{FALTA: …}}` es obligatorio para todo dato
sin fuente. Nada se publica sin visto bueno de la unidad (§8).

**S1 — Cabecera.** Título, a quién está dirigida, **fecha de vigencia del contenido** (visible siempre),
contacto rápido: anexos internos `285221/285214/285200`, externos `225685221/225685214/226085200`, correo
`ges@huap.online`, horario (L–J 07:30–17:30, V 07:30–16:30). *Fuente: Unidad GES 08-2026.*

**S2 — ¿Es GES? Los 14 problemas del HUAP.** Tabla de 15 códigos CIE-10 → 14 problemas (número y denominación
del DS 29/2025). Por problema: criterios de inclusión resumidos de la NTMA (D.E. 57/2025 mod. D.E. 32/2026)
en bloque expandible (expandido en impresión). Aclaraciones confirmadas: E10 cubre debut y descompensación;
G45.9 (TIA) activa el problema 37; agresión sexual = ventana de 72 h, sin peritaje previo, denuncia
obligatoria del equipo. Cierre: «¿No está en la lista? HUAP es prestador de estos 14; ante duda, llame a la
unidad». *Fuentes: CODIGOS SINA.jpg + fichas auge.minsal.cl + NTMA + Unidad GES 08-2026.*

**S3 — Confirmé el diagnóstico → notifique ahora.** El momento: al confirmar (oncológico: desde la sospecha);
misma fecha que la intervención (IF/N°469). Ambos documentos se generan en SINA; papel solo ante falla. IPD:
médico llena campos 12–18 y firma (Admisión el resto); campo 18 = fecha máxima de inicio de tratamiento.
Constancia: firma quien notifica (médico tratante, enfermera/o u otra persona autorizada; responsabilidad
final del tratante, Memo N°49) + firma o huella del paciente o representante; copia al paciente en el acto.
Casos especiales en formato «si → entonces»: no puede firmar → representante/huella; omitida → notificación
diferida (equipo GES); ISAPRE → documentación + resumen clínico al representante para su Isapre; sin
previsión/extranjero/NN → interconsulta a Servicio Social; ¿ya notificado en otro establecimiento? →
consultar Oficina GES. *Fuentes: IF/N°469, formularios, Memos, Unidad GES 08-2026.*

**S4 — Plazos que corren dentro del hospital.** Los 14 plazos intrahospitalarios del DS 29/2025 (ECG 30 min,
trombólisis 30 min, TAC 24 h, estabilización gran quemado 8 h, politraumatizado <24 h desde el rescate, TEC y
trauma ocular 12 h, etc.), agrupados por inmediatez. Incluye ayudas técnicas <65 años en ACV/HSA. *Fuente:
fichas auge.minsal.cl (DS 29/2025), revalidadas 30-07-2026 — pendiente validación unidad.*

**S5 — Voy a dar el alta.** SIC en SINA (HCSBA) o interconsulta azul (otros); rehabilitación ambulatoria ACV →
Unidad de Kinesiología HCSBA/HEC, consignando fono/TO en la SIC (Memo N°05; sin el correo personal del memo);
envío a `ges@huap.online`; verificar comuna y ≥1 teléfono efectivo **con el porqué**: sin contacto efectivo el
caso cae en «contacto no corresponde» y la garantía se cierra sin atención (NTMA §II.8–9). *Fuentes: flujo
seguimiento, Memo N°05, NTMA.*

**S6 — Plazos después del alta.** Seguimiento y rehabilitación por problema con puntos de partida corregidos
(gran quemado: seguimiento desde indicación médica, rehabilitación desde alta; agresión sexual: 35 días desde
la primera respuesta). Seguimiento ACV = neurología de adultos (NTMA 37.2). *Fuente: fichas DS 29/2025 +
NTMA.*

**S7 — La unidad.** Qué pasa tras enviar la interconsulta (activación de garantía de seguimiento, hora
prioritaria con red y macrored), quiénes son, ubicación, horario, contactos. Nota Ley de Urgencia: la
notificación SIS 24/7 corre por la Oficina 6 de Admisión. *Fuentes: Manual (RES. EX. 902), Unidad GES
08-2026.*

## 4. Arquitectura técnica

- **Sitio estático** sin frameworks de runtime ni dependencias externas (sin CDN, sin fuentes remotas).
  Compatible con cualquier hosting (pendiente definir dónde; no bloquea).
- **Separación contenido/presentación:** `content/*.json` — un archivo por dominio de datos
  (`problemas.json`, `plazos-intrahospitalarios.json`, `plazos-alta.json`, `contactos.json`,
  `flujo-notificacion.json`, `vigencia.json`). Cada registro lleva `fuente` y `fecha`. La unidad edita el
  JSON (o una planilla que lo genera) sin tocar código.
- **Build:** script simple (Node, sin dependencias o mínimas) que compone `content/` + plantillas →
  `dist/index.html` autocontenido. HTML funcional sin JavaScript; el JS solo mejora (expandir/colapsar,
  búsqueda rápida en la tabla).
- **Estructura:** `src/` (plantillas, CSS, build), `content/` (datos), `dist/` (salida publicable).

## 5. Diseño visual y UX

- Invocar `frontend-design` antes de la primera línea de UI; `dataviz` si hay visualización de plazos.
- Móvil primero; tipografía grande, contraste alto (legible en pasillo con mala luz).
- Identidad: paleta azul/verde de los afiches existentes; **sin escudo HUAP** hasta tener archivo oficial y
  autorización (pendiente §8).
- **Hoja de estilos de impresión de primera clase:** la página completa imprime como afiche/documento de
  consulta; los bloques expandibles se imprimen abiertos; URLs de fuentes visibles al pie.
- WCAG 2.1 AA como piso: estructura semántica, navegación por teclado, contraste verificado.
- Fecha de vigencia visible en cabecera y pie de impresión.

## 6. Analítica

Medición sin datos personales: conteo de páginas vistas y de interacciones por sección (qué problema se
consulta más), sin cookies, sin IP almacenada, sin identificadores de usuario. Implementación concreta se
decide en el plan según el hosting (opciones: contador propio en endpoint mínimo, o log del servidor
agregado). Si el hosting no permite nada, v1 sale sin analítica y se declara.

## 7. Mantención

- La unidad actualiza `content/*.json`; un cambio de plazo no toca código.
- `vigencia.json` obliga a declarar la fecha de la última revisión normativa; el build la estampa en la
  página.
- Al cambiar el decreto: el informe de revalidación (`docs/`) es el procedimiento de referencia para
  re-verificar los 14 problemas.

## 8. Gates de publicación (bloqueantes antes de salir a internet)

1. **Validación por la Unidad GES** de: plazos revalidados (informe 30-07-2026), criterios NTMA resumidos
   (transcripción 09-08-2026) y textos finales de las 7 secciones.
2. **Visto bueno institucional** de marca y publicación (responsable por definir).
3. Definición del **hosting** y si `huap.online` está bajo control del hospital.
4. Verificación final: WCAG AA (auditoría automática + revisión manual), impresión, peso de página, y
   lectura completa contra fuentes (checklist en el plan).

## 9. Fuera de alcance v1

Buscador con autocompletado; árbol de decisión guiado; versión para pacientes; panel de administración;
indicadores/tableros de gestión (proyecto aparte); actualización del Manual (proyecto paralelo ya iniciado);
descarga de formularios en blanco (se generan en SINA; reevaluar si la unidad lo pide).

## 10. Criterios de éxito

- Un médico llega desde el celular a «qué hago ahora» de su patología en menos de 3 toques/scrolls.
- Cada dato normativo de la página tiene fuente y fecha rastreables en `content/`.
- La página imprime completa y legible en A4/carta, en blanco y negro.
- Sin dependencias de red externas; carga < 200 KB sin imágenes decorativas pesadas.
- Cero `{{FALTA: …}}` visibles en la versión publicada.
