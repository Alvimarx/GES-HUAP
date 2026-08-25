# Revalidación de plazos GES contra el Decreto Supremo N° 29/2025

**Fecha:** 30-07-2026 · **Corregido:** 20-08-2026
**Elaborado por:** Claude, a solicitud de la Unidad GES
**Estado:** ⚠️ **BORRADOR — requiere validación de la Unidad GES antes de cualquier publicación**

> **Correcciones del 20-08-2026.** Al construir la landing se contrastó de nuevo cada plazo contra las fichas
> oficiales y aparecieron tres errores de este informe, ya corregidos más abajo: faltaban dos garantías del
> **PS 6** (consulta con especialista en 7 días; glicemia en 30 minutos para quien ya está en tratamiento) y una
> del **PS 55** (entrega de ayudas técnicas en 30 días), y el Hallazgo 3 afirmaba sin fundamento que Gran
> quemado era el único problema sin garantía de diagnóstico.

---

## Qué se hizo

Se contrastaron los 15 códigos CIE-10 del afiche *«Guía rápida CIE-10 para activar GES en SINA»* y los plazos
del afiche *«Plazos para la primera atención»* contra las garantías de oportunidad del decreto vigente.

**Fuente de contraste:** fichas oficiales por problema de salud publicadas por el MINSAL en
`https://auge.minsal.cl/problemasdesalud/index/{n}`, descargadas el 30-07-2026.
Corresponden al **Decreto Supremo N° 29 de 2025** (el listado de prestaciones del mismo sitio se publica bajo la
hoja *«LEP 29»*, lo que confirma la correspondencia).

Los 15 códigos del afiche mapean a **14 problemas de salud** del decreto, porque G45.9 e I64 apuntan ambos al
problema 37.

| CIE-10 | N.° en el decreto | Problema de salud |
|--------|------------------|-------------------|
| I21    | 5  | Infarto agudo del miocardio |
| E10    | 6  | Diabetes mellitus tipo 1 |
| B24    | 18 | Síndrome de la inmunodeficiencia adquirida VIH/SIDA |
| R00.1  | 25 | Trastornos de generación del impulso y conducción en personas de 15 años y más, que requieren marcapasos |
| K80.0  | 26 | Colecistectomía preventiva del cáncer de vesícula en personas de 35 a 49 años |
| Z99.1  | 36 | Ayudas técnicas para personas de 65 años y más |
| G45.9 / I64 | 37 | Ataque cerebrovascular isquémico en personas de 15 años y más |
| I60    | 42 | Hemorragia subaracnoidea secundaria a ruptura de uno o más aneurismas cerebrales |
| M51.1  | 44 | Tratamiento quirúrgico de hernia del núcleo pulposo lumbar |
| T07.X  | 48 | Politraumatizado grave |
| S09.9  | 49 | Traumatismo cráneo encefálico moderado o grave |
| S05.1  | 50 | Trauma ocular grave |
| T29.0  | 55 | Gran quemado |
| Y05    | 86 | Atención integral de salud en agresión sexual aguda |

Los 14 existen en el decreto vigente con la denominación esperada. **Ningún problema del afiche fue eliminado
ni renombrado por el DS 29/2025.**

---

## Hallazgo 1 — Los números del afiche están correctos; tres puntos de partida no

El afiche encabeza sus columnas con *«Seguimiento GES — Desde el alta hospitalaria»* y
*«Rehabilitación GES — Desde la indicación médica»*. Esa generalización es correcta en la mayoría de los casos,
pero **falla en tres celdas**, y en Gran quemado los dos hitos están intercambiados.

| Problema | Celda | Afiche dice | El decreto dice | |
|----------|-------|-------------|-----------------|---|
| Infarto agudo al miocardio | Seguimiento | 30 días desde el alta | «El primer control para prevención secundaria se realizará dentro de **30 días desde el alta hospitalaria**» | ✅ |
| ACV isquémico | Seguimiento | 10 días desde el alta | «La atención con médico especialista se realizará dentro de **10 días desde el alta hospitalaria**» | ✅ |
| ACV isquémico | Rehabilitación | 15 días desde indicación médica | «La rehabilitación ambulatoria se iniciará dentro de **15 días desde la indicación médica**» | ✅ |
| HSA por aneurisma roto | Seguimiento | 30 días desde el alta | «El primer control con médico especialista se realizará dentro de **30 días desde el alta**, según indicación médica» | ✅ |
| HSA por aneurisma roto | Rehabilitación | 15 días desde indicación médica | «La rehabilitación ambulatoria se iniciará dentro de **15 días desde la indicación médica**» | ✅ |
| Marcapaso | Seguimiento | 15 días desde el alta (instalación de MCP o cambio de generador) | «El primer control se realizará dentro de los **15 días posteriores al alta** de instalación de marcapaso o cambio de generador» | ✅ |
| HNP lumbar quirúrgica | Seguimiento | 30 días desde el alta | «El control por médico especialista se realizará dentro de **30 días del alta hospitalaria**» | ✅ |
| **Gran quemado** | **Seguimiento** | 15 días **desde el alta hospitalaria** | «El primer control se realizará dentro de **15 días desde indicación médica**» | ❌ |
| **Gran quemado** | **Rehabilitación** | 15 días **desde la indicación médica** | «Se realizará la primera atención de Rehabilitación ambulatoria dentro de los **15 días desde el alta hospitalaria**» | ❌ |
| **Agresión sexual aguda** | **Seguimiento** | 35 días **desde el alta hospitalaria** | «Se realizará dentro de los primeros **35 días desde la primera respuesta**» | ❌ |

**Lectura:** los siete números que el hospital difunde son correctos. Lo que está mal es *desde cuándo se cuenta*
en tres celdas. En Gran quemado están literalmente cruzados: el afiche atribuye al seguimiento el hito de la
rehabilitación y viceversa.

**Impacto práctico.** No es cosmético. En agresión sexual aguda, la primera respuesta ocurre en la unidad de
emergencia y el alta puede ser el mismo día o varios días después; contar desde el hito equivocado corre el
plazo y puede hacer aparecer como cumplida una garantía que no lo está — o al revés.

---

## Hallazgo 2 — El afiche omite los plazos intrahospitalarios, que son los que más importan en urgencia

Los afiches cubren solo seguimiento y rehabilitación, es decir, lo que ocurre **después del alta**. Pero el
decreto garantiza además plazos de diagnóstico y tratamiento que se cumplen o se incumplen **dentro del HUAP**,
en horas o minutos. Son los que un médico de urgencia necesita conocer y hoy no están en ningún material.

| Problema | Garantías de oportunidad dentro del hospital |
|----------|---------------------------------------------|
| **Infarto agudo al miocardio** | ECG en urgencia dentro de **30 minutos desde la sospecha**. Trombólisis dentro de **30 minutos desde la confirmación** de supradesnivel ST |
| **Diabetes mellitus tipo 1** | Consulta con médico especialista dentro de **7 días desde la sospecha por exámenes alterados**. Glicemia dentro de **30 minutos desde la atención en urgencia** por sospecha de descompensación. Tratamiento dentro de 24 h desde la confirmación. En personas **ya en tratamiento** que se descompensan, glicemia dentro de **30 minutos desde la atención médica en Servicio de Urgencia** |
| **ACV isquémico** | Confirmación diagnóstica **24 h** desde la sospecha · tratamiento **24 h** desde la confirmación · hospitalización en prestador con capacidad resolutiva **24 h** desde la indicación · rehabilitación hospitalizada **48 h** desde la indicación |
| **HSA por aneurisma roto** | TAC **24 h** desde la sospecha · angioTAC multicorte o angiografía digital **48 h** desde la confirmación de HSA · tratamiento **24 h** desde la confirmación de aneurisma roto · rehabilitación hospitalizada **48 h** desde la indicación |
| **Politraumatizado grave** | Tratamiento en centro con capacidad resolutiva **antes de 24 horas desde el rescate** · rehabilitación (solo con lesión medular) **24 h** desde la indicación |
| **TEC moderado o grave** | Diagnóstico **12 h** desde la sospecha · tratamiento **24 h** desde la confirmación |
| **Trauma ocular grave** | Diagnóstico **12 h** desde la sospecha · atención por médico especialista **60 h** desde la confirmación |
| **Gran quemado** | Tratamiento **72 h** desde la confirmación, en prestador con capacidad resolutiva · en mayores de 15 años, estabilización inicial en el centro de origen **8 h** desde la confirmación · rehabilitación hospitalizada **48 h** desde la indicación · entrega de ayudas técnicas indicadas en rehabilitación ambulatoria **30 días** desde la indicación |
| **Agresión sexual aguda** | Primera respuesta **inmediata** desde la solicitud de atención en unidad de emergencia hospitalaria |
| **VIH/SIDA** | Diagnóstico **45 días** desde la sospecha o solicitud · consulta médica **45 días** desde la confirmación · inicio de tratamiento **7 días** desde la indicación médica |
| **Marcapaso** | Diagnóstico **30 días** desde la sospecha · tratamiento **30 días** desde la confirmación o desde la indicación de recambio |
| **HNP lumbar** | Cirugía **45 días** desde la indicación quirúrgica |
| **Colecistectomía preventiva** | Confirmación **30 días** desde la sospecha · cirugía **90 días** desde la confirmación |
| **Ayudas técnicas ≥65 años** | Bastones, cojines y colchones **20 días** desde la indicación · sillas de ruedas o andadores **30 días** desde la indicación |

---

## Hallazgo 3 — Detalles que el material actual no captura y probablemente generan errores

1. **Ayudas técnicas para menores de 65 años.** ACV isquémico (PS 37) y HSA (PS 42) garantizan ayudas técnicas a
   **menores de 65 años**: bastón, cojín o colchón dentro de 20 días, y sillas de ruedas dentro de 30 días,
   desde la indicación médica. El material actual asocia «ayudas técnicas» solo al código Z99.1, que es para
   **65 años y más**. Un paciente de 50 años con ACV tiene derecho por la vía del PS 37, no del PS 36.

2. **Politraumatizado grave: la rehabilitación solo está garantizada con lesión medular.** El decreto lo acota
   explícitamente.

3. **Gran quemado no tiene garantía de diagnóstico.** Sus garantías parten en tratamiento.
   ⚠️ **Corregido el 20-08-2026:** este informe afirmaba que era «el único de los 14 con esa estructura», y es
   falso. Las fichas oficiales muestran que tampoco tienen sección de diagnóstico el **PS 36** (solo
   rehabilitación), el **PS 44** (tratamiento y seguimiento), el **PS 48** (tratamiento y rehabilitación) ni el
   **PS 86** (acceso con primera respuesta inmediata, y seguimiento). El error alcanzó a propagarse al contenido
   de la landing y se corrigió allí también.

4. **Agresión sexual aguda: la ventana es de 72 horas o menos** desde el episodio. Es un criterio de inclusión
   estricto y es lo primero que un médico de urgencia necesita saber para decidir si activa el GES.

5. **Trauma ocular grave no tiene plazo de seguimiento garantizado.** Existe la prestación «Seguimiento trauma
   ocular grave» en el listado de prestaciones, pero las garantías de oportunidad solo cubren diagnóstico y
   tratamiento.

6. **«E10 — Diabetes Mellitus tipo I (debut)».** El decreto no restringe el problema al debut: cubre
   confirmación, tratamiento, descompensación con tratamiento de urgencia y hospitalización, y continuidad del
   tratamiento. El «(debut)» del afiche parece una convención local de activación en SINA.
   **Confirmar con la unidad.**

7. **«G45.9 — ACV isquémico (TIA)».** El afiche mapea el código de crisis isquémica transitoria al mismo problema
   de salud que I64. Es plausible como convención local de codificación, pero conviene dejarlo confirmado por
   escrito. **Confirmar con la unidad.**

---

## Hallazgo 4 — Discrepancia en la fecha de toma de razón

| Fuente | Fecha |
|--------|-------|
| Timbre electrónico de Contraloría en el propio decreto | **25/11/2025** |
| Extracto publicado en el Diario Oficial N° 44.311 | **26 de noviembre de 2025** |

Menor, pero si se cita la fecha en algún documento oficial conviene usar la del timbre y verificar.

---

## Qué necesita validar la Unidad GES

- [ ] Confirmar las tres correcciones de punto de partida del Hallazgo 1 y ordenar la corrección de los afiches.
- [ ] Decidir si los plazos intrahospitalarios del Hallazgo 2 entran en la landing. **Recomendación: sí.**
      Son los que el médico de urgencia puede incumplir sin darse cuenta.
- [ ] Resolver los puntos 6 y 7 del Hallazgo 3 (convenciones locales de codificación en SINA).
- [ ] Confirmar si los 14 problemas son todos los que corresponden a HUAP o si falta alguno.
- [ ] Actualizar el §Marco normativo del Manual de Organización y Funciones (hoy cita el Decreto N°72/2022).

---

## Fuentes

- Decreto Supremo N° 29 de 2025, MINSAL — texto íntegro (escaneado, 288 pp.):
  `https://auge.minsal.cl/laravel-filemanager/files/shares/DECRETO 29 del 2025.pdf`
- Fichas por problema de salud: `https://auge.minsal.cl/problemasdesalud/index/{5,6,18,25,26,36,37,42,44,48,49,50,55,86}`
- Listado Específico de Prestaciones, hoja «LEP 29»: `https://auge.minsal.cl/website/doc/LEP.xlsx`
- Extracto en Diario Oficial N° 44.311, 28-11-2025, CVE 2734505:
  `https://auge.minsal.cl/laravel-filemanager/files/10/Diario Oficial GES.pdf`
- Afiches institucionales HUAP: `CODIGOS SINA.jpg`, `Garantía oportunidad seguimiento y rehbailitación.jpg`

**Nota metodológica.** El texto íntegro del decreto es un PDF escaneado sin capa de texto, por lo que no fue
posible verificar contra él directamente. El contraste se hizo contra las fichas oficiales del MINSAL, que son
la publicación del mismo decreto. Si la unidad requiere verificación contra el texto del decreto para algún
plazo específico, se puede hacer sobre las páginas puntuales.
