# CLAUDE.md — Unidad GES · Hospital de Urgencia Asistencia Pública (HUAP)

Espacio de trabajo de la Unidad GES del HUAP (Servicio de Salud Metropolitano Central, Santiago de Chile).
Aquí se desarrollan herramientas de apoyo al proceso GES: material de difusión, aplicaciones web, visualizadores
de datos, análisis de brechas y optimización de procesos.

---

## 0. Regla de oro

**Este trabajo toca garantías legales de salud de personas reales. Un dato inventado puede traducirse en una
garantía incumplida, un reclamo ante la Superintendencia de Salud, o un paciente sin su hora prioritaria.**

En orden de prioridad:

1. **Precisión sobre fluidez.** Es preferible una página con menos contenido y 100 % verificado que una completa
   y parcialmente inventada.
2. **Preguntar sobre suponer.** Ver §3.
3. **Trazabilidad.** Todo dato normativo, clínico o de contacto publicado debe tener fuente documentada y fecha.

---

## 1. Reglas de precisión (no negociables)

### 1.1 Prohibido inventar

Nunca generar, completar ni "rellenar" por analogía:

- Plazos de garantía (acceso, oportunidad, protección financiera, calidad).
- Códigos CIE-10, códigos de prestación, códigos SIGGES.
- Nombres de problemas de salud GES o su redacción oficial.
- Números de decreto, artículos de ley, números de memorándum, resoluciones, fechas de vigencia.
- Correos, anexos telefónicos, ubicaciones físicas, nombres de personas o cargos.
- Criterios clínicos de inclusión/exclusión de una canasta GES.
- Rutas de derivación, hospitales de destino, unidades receptoras.

Si un dato de estos no está en las fuentes de la carpeta ni fue confirmado explícitamente por el usuario:
**no se escribe**. Se deja un marcador visible y se pregunta.

### 1.2 Marcadores de dato faltante

Usar un marcador **imposible de confundir con contenido real** y que rompa visualmente si llega a producción:

```
{{FALTA: plazo de oportunidad para X — fuente pendiente}}
```

Nunca usar texto plausible como relleno. Un «30 días» de ejemplo en una maqueta es indistinguible de un
«30 días» real cuando alguien saca una captura de pantalla.

### 1.3 Jerarquía de fuentes

Cuando dos fuentes se contradigan, gana la de mayor jerarquía, y se deja constancia de la contradicción:

1. Texto del decreto o la ley (Diario Oficial, BCN/LeyChile).
2. Norma técnica y circulares de la Superintendencia de Salud.
3. `auge.minsal.cl` y documentos oficiales MINSAL.
4. Normativa interna HUAP/SSMC (memos, manuales, resoluciones).
5. Afiches y material de difusión interno.
6. Notas de prensa. **Nunca como fuente única de un dato normativo.**

Ya ocurrió: dos páginas del propio MINSAL listan distinto cuáles son los tres problemas de salud nuevos del
decreto vigente. Por eso se va al decreto.

### 1.4 Citar la fuente

Todo contenido normativo lleva su origen y fecha, en el artefacto o en un comentario adyacente:
`Memo N°05, 02-01-2026` · `DS N°29/2025 MINSAL` · `Confirmado por Unidad GES, <fecha>`.
Los memos se reemplazan y el contenido caduca; sin fecha no hay forma de saberlo.

### 1.5 Corregir, no propagar

Las fuentes existentes contienen erratas (§8). Al reutilizar contenido, corregir y avisar al usuario del cambio.
No copiar un error solo porque está en el original.

### 1.6 Verificar antes de declarar terminado

No afirmar «listo», «funciona» o «corregido» sin haber ejecutado la verificación y visto la salida.
Aplica `superpowers:verification-before-completion`.

---

## 2. Alcance y responsabilidad de los productos

- Los productos de esta carpeta son **apoyo administrativo al proceso GES**, no guías de práctica clínica.
  No sustituyen el juicio médico ni las Guías Clínicas GES del MINSAL.
- Toda pieza dirigida a clínicos debe declarar: qué es, de cuándo data el contenido, y a quién contactar ante duda.
- Ningún producto decide si un caso es GES. Los productos **orientan hacia el procedimiento**; la confirmación
  diagnóstica y la notificación son responsabilidad del médico tratante (Memo N°49).
- Antes de publicar contenido normativo debe existir **visto bueno explícito de la Unidad GES**.
  Claude no publica ni despliega nada sin autorización del usuario en el turno.

---

## 3. Cuándo preguntar y cuándo asumir

**Preguntar siempre (bloqueante):**

- Cualquier dato de §1.1 que falte.
- Ambigüedad en el flujo de proceso: quién hace qué, en qué orden, con qué plazo.
- Destino de publicación, audiencia real, o si el contenido saldrá de la intranet.
- Cualquier cosa que involucre datos de pacientes.

**Asumir y declarar (no bloqueante):**

- Decisiones estéticas, de layout, de nomenclatura de archivos, de stack técnico.
- Tomar la decisión más razonable, ejecutar, y declarar el supuesto en una línea.

---

## 4. Datos y privacidad

- **Nunca** ingresar a esta carpeta datos identificables de pacientes: RUT, nombre, ficha, fecha de nacimiento,
  domicilio, teléfono, diagnóstico asociado a persona.
- Las capturas de SINA/SIGGES deben venir **anonimizadas antes** de guardarse. Si llega una con datos visibles,
  avisar de inmediato y no procesarla.
- Para análisis de brechas, trabajar con datos agregados o seudonimizados. Si se requieren datos a nivel de caso,
  preguntar primero por la autorización y el mecanismo de resguardo.
- Los correos personales de funcionarios que aparecen en los memos **no se publican en sitios de acceso abierto**
  sin autorización de la persona. Usar el buzón institucional.
- El formulario de constancia recoge **nombre social** además del nombre legal. Cualquier producto que lo aborde
  debe respetar ese campo y no tratarlo como opcional o secundario.

---

## 5. Contexto verificado

> Todo lo de esta sección proviene de las fuentes citadas. Nada aquí es inferido.
> **Cualquier dato ausente de esta sección debe tratarse como desconocido.**

### 5.1 Institucional

- **Hospital:** Hospital de Urgencia Asistencia Pública (HUAP), Servicio de Salud Metropolitano Central (SSMC).
- **Línea jerárquica:** Subdirección de Gestión Clínica → Departamento de Gestión de la Demanda → Unidad GES.
- **Jefa del Departamento de Gestión de la Demanda:** Dra. Yesvana Sánchez Faúndez.
- **Unidad GES:** correo `ges@huap.online` · anexos internos `285221`, `285214`, `285200` ·
  desde fuera del hospital o celular: `225685221`, `225685214`, `226085200` ·
  horario: lunes a jueves 07:30–17:30, viernes 07:30–16:30 ·
  1.er piso torre antigua, contigua a UTI. *(Teléfonos externos y horario: confirmados por Unidad GES, 08-2026.)*
- **HIS:** SINA. **Plataforma de garantías:** SIGGES. **Lista de espera no GES:** RNLE.
- Hospitales de la red citados: HCSBA (San Borja Arriarán), HEC (El Carmen).

*Fuentes: Manual de Organización y Funciones GES v01 (06/2025); afiches institucionales; Memos N°49 y N°05.*

### 5.2 Historia de la unidad

Sirve para entender por qué el proceso está donde está y por qué el formulario de constancia es tan sensible.

- **Inicio:** función adscrita a la Unidad de Estadística Hospitalaria, centrada en digitación. Sin estructura
  organizacional ni responsabilidades formales; acciones reactivas.
- **Septiembre 2019:** fiscalización de la Superintendencia de Salud con **resultados desfavorables**
  (ORD. ID/N°7671, 10-09-2019) **respecto del uso del "Formulario de constancia de información al paciente GES"**.
  A raíz de eso se designa un profesional dedicado exclusivamente a GES.
- **Septiembre 2023:** Resolución Exenta N°1897 — la Gestión GES se reconoce como unidad independiente bajo el
  Departamento de Gestión de la Demanda.
- **Primer semestre 2025:** Res. Exenta N°550 (04-03-2025) y Res. Exenta N°1499 (19-06-2025) — se incorporan
  tres profesionales.
- **Abril 2026:** **RES. EX. 902 (16-04-2026)** aprueba la primera versión del Manual de Organización y
  Funciones (v01, 06/2025, vigencia 5 años), con firmas electrónicas del 10-10-2025: revisión de la Jefatura
  de Calidad y Seguridad del Paciente (s) y aprobación del Director HUAP (s).

*Fuente: Manual de Organización y Funciones GES v01 (06/2025), §Antecedentes; RES. EX. 902/16-04-2026.*

### 5.3 Dotación y roles

| Rol | Foco |
|-----|------|
| Jefatura de la Unidad / Encargada GES | Gestión técnica y estratégica, cumplimiento normativo, indicadores, coordinación de red, capacitación, reclamos y auditorías |
| Monitor SIGGES y referente lista de espera no GES | Registro y monitoreo en SIGGES y RNLE, detección de incumplimientos, corrección de errores en FONASA/SIGGES/cartolas/previsión, reportes y alertas tempranas |
| Gestor de trazabilidad y enlace GES | Derivaciones y contrarreferencias con SSMC y red nacional, trazabilidad de casos, actualización de datos de contacto, **notificación diferida**, subroga a la jefatura |
| Gestor de casos GES Urgencia y Hospitalizado | Normativa GES en pacientes hospitalizados y de urgencia, apoyo a equipos clínicos en formularios y plazos, contacto directo con paciente y familia, **notificación diferida** |
| Funcionario administrativo | Recepción y validación de documentos, digitación en SIGGES y RNLE |

*Fuente: Manual de Organización y Funciones GES v01 (06/2025), §Funciones de los integrantes.*

### 5.4 Marco normativo

**Vigente (verificado en fuente primaria):**

- **Ley N° 19.966** (2004) — establece el Régimen General de Garantías en Salud. El **Artículo 24°** es el que
  funda el *Formulario de constancia de información al paciente GES*.
- **Decreto Supremo N° 29, de 2025**, Ministerio de Salud, Subsecretaría de Salud Pública.
  - Dictado el **30-05-2025**. Tomado de razón por Contraloría: el timbre electrónico del propio decreto dice
    **25-11-2025**; el extracto del Diario Oficial dice **26-11-2025**. Usar la del timbre.
  - Publicado **en extracto** en el Diario Oficial N° 44.311 del **28-11-2025** (CVE 2734505).
  - Texto íntegro disponible en `https://auge.minsal.cl/`.
  - **90 problemas de salud garantizados.**
  - Vigencia informada por MINSAL: **01-12-2025**. *El extracto del Diario Oficial no consigna la fecha de
    entrada en vigencia; confirmar en el texto íntegro del decreto antes de publicarla.*
  - La Contraloría (Dictamen E209768N25, 09-12-2025) instruyó regularizar con publicación íntegra.
    *Fuente secundaria — verificar el estado actual.*

**Decretos anteriores** (útiles como referencia histórica, ya no rigen):
N° 3 (2016) AUGE 80 · N° 22 (2019) AUGE 85 · N° 72 (2022) AUGE 87.

**Otros instrumentos citados por el Manual:**

- **NTMA vigente: Decreto Exento N° 57, de 2025**, MINSAL, dictado el **26-11-2025** — «Normas de carácter
  técnico médico y administrativo para el cumplimiento de las Garantías Explícitas en Salud de la ley N° 19.966».
  91 páginas. **Sustituye a la Norma Técnica N° 3014 (2013) que cita el Manual de la unidad.**
  - **Modificado por el Decreto Exento N° 32, de 06-03-2026** (Diario Oficial N° 44.408 del 24-03-2026,
    CVE 2782630). Ver §5.11.
  - Es de **carácter obligatorio para prestadores públicos y privados** y complementa los criterios clínicos de
    inclusión, las especificaciones de las prestaciones y los procedimientos de evaluación de cumplimiento.
  - Las fichas del decreto remiten constantemente a «lo dispuesto en la NTMA»: es el documento operativo real.
- Listado Específico de Prestaciones (LEP) del AUGE/GES.
- Guías Clínicas GES por problema de salud.
- Guías rápidas SIGGES: instructivo de proceso y registro por problema de salud.
- Libro de Redes GES y no GES (2025), DIGERA.
- Ley Ricarte Soto · Ley de Urgencia (riesgo vital o secuela funcional grave).
- Arancel CAT GES y no GES vigente.
- Manual de procedimientos SIGGES 4.ª versión · Manuales de parametrización SIGGES.
- **Circular IF/N° 469 (20-05-2024)**, Superintendencia de Salud — «Introduce ajustes al Formulario de
  Constancia de Información al Paciente GES y al proceso de notificación». Vigente desde el 03-06-2024.
  Copia en la carpeta (`circular-if-n-469-2024 (1).pdf`). Reglas operativas clave:
  - **El formulario debe llenarse con la misma fecha en que el profesional determinó la intervención
    sanitaria correspondiente**, con todos los campos completos. Se firma en dos ejemplares y la copia se
    entrega al paciente **en el mismo acto**, indicando día y hora de notificación.
  - Solo los problemas **oncológicos** exigen un nuevo formulario por cada cambio de intervención sanitaria;
    en los demás, el formulario se emite con la confirmación diagnóstica.
  - Pueden notificar y firmar: el/la médico tratante, enfermera/o **u otra persona autorizada por el
    establecimiento**.
  - Papel o electrónico (mismos datos; el electrónico exige autenticidad, integridad, no repudio,
    confidencialidad y seguridad; firma electrónica según Ley 19.799). El formato no puede alterarse ni
    llevar distintivos del prestador.
  - Conservación por **al menos 15 años**; los formularios en papel pueden conservarse como copia digital.
  - Todo prestador debe tener un **procedimiento escrito de notificación GES** (con versión, responsables,
    flujo, controles) e **indicadores: como mínimo un indicador medido a lo más cada 3 meses**, capacitación
    GES al menos anual y **actividades de difusión de las garantías dirigidas a los usuarios**.
  ⚠️ Existen las IF/N° 516 y 517 (11-2025), que actualizan normas según el DS 29/2025; confirmar si modifican
  el proceso de notificación (§9).

### 5.5 Los dos documentos del momento del diagnóstico

**a) IPD — Informe del Proceso Diagnóstico** (formulario preimpreso MINSAL, con folio)

Reparto de llenado según el propio formulario:

| Bloque | Quién lo llena |
|--------|----------------|
| Encabezado (Servicio de Salud, establecimiento, especialidad, unidad) y datos del paciente (campos 1–11) | **Admisión** |
| Datos clínicos (campos 12–18) | **El/la profesional** |
| Datos del profesional (campos 19–20), excepto la firma | **Admisión** |

Campos clínicos que llena el médico:

- **12.** Problema de salud AUGE
- **13.** ¿Confirma que el diagnóstico pertenece al sistema AUGE? SÍ / NO
- **14.** Subgrupo o subproblema de salud AUGE
- **15.** Diagnóstico — *«con letra legible y sin siglas»*
- **16.** Fundamentos del diagnóstico
- **17.** Tratamiento e indicaciones
- **18.** **El tratamiento deberá iniciarse a más tardar el: ___/___/___** ← aquí se materializa la garantía de oportunidad
- Firma profesional

El original queda en el establecimiento que realiza la confirmación.

**b) Formulario de constancia información paciente GES** (Artículo 24°, Ley 19.966)

- *Datos del prestador:* institución, dirección, ciudad, nombre de la persona que notifica, RUN.
- *Antecedentes del paciente:* nombre legal, **nombre social**, RUN, previsión (Fonasa / Isapre), dirección,
  comuna, región, teléfono, correo.
- *Información médica:* problema de salud GES + confirmación. Para GES oncológico, la etapa:
  sospecha · confirmación · etapificación · tratamiento · seguimiento · rehabilitación.
- *Tipo de atención:* presencial / teleconsulta.
- *Constancia:* texto legal de toma de conocimiento + **fecha y hora de notificación**.
- *Firmas:* «Informé Problema Salud GES» (quien notifica) y «Tomé conocimiento» (**firma o huella digital** del
  paciente o representante).
- *Teleconsulta sin firma ni huella:* se registra el medio por el cual tomó conocimiento — correo electrónico,
  carta certificada u otro.
- *Si quien toma conocimiento no es el paciente:* nombre, RUN, teléfono y correo de esa persona.
- Pie del formulario: si no se cumplen las garantías, el usuario puede reclamar ante Fonasa o su Isapre, y en
  segunda instancia ante la **Superintendencia de Salud**.

> El campo de huella digital y la figura del representante son la vía prevista para pacientes que no pueden
> firmar. La **notificación diferida** aparece en el Manual como función de dos de los gestores.

*Fuentes: `IPD. (1).pdf` y `formulario-paciente-ges.pdf`; Manual de Organización y Funciones GES v01.*

### 5.6 Guía rápida CIE-10 para activar GES en SINA

Fuente: afiche institucional `CODIGOS SINA.jpg`, **sin fecha ni versión**. No consta si la lista es exhaustiva
o solo la más frecuente en HUAP (§9).

| CIE-10 | Problema de salud |
|--------|-------------------|
| G45.9  | Ataque cerebrovascular isquémico en personas de 15 años o más (TIA) |
| I64    | Ataque cerebrovascular isquémico en personas de 15 años o más |
| Y05    | Atención integral de salud en agresión sexual aguda |
| Z99.1  | Ayudas técnicas para personas de 65 años y más |
| K80.0  | Colecistectomía preventiva del cáncer de vesícula en personas de 35 a 49 años |
| E10    | Diabetes Mellitus tipo I (debut) |
| T29.0  | Gran quemado |
| I60    | HSA secundaria a ruptura de aneurismas cerebrales |
| I21    | Infarto agudo al miocardio |
| T07.X  | Politraumatizado grave |
| B24    | Síndrome de inmunodeficiencia adquirida VIH/SIDA |
| S05.1  | Trauma ocular grave |
| S09.9  | Traumatismo cráneo encefálico moderado o grave |
| R00.1  | Trastorno de generación del impulso y conducción en personas de 15 años o más que requieren marcapaso |
| M51.1  | Tratamiento quirúrgico hernia de núcleo pulposo lumbar |

### 5.7 Garantías de oportunidad — revalidadas contra el DS N° 29/2025

Contrastadas el 30-07-2026 contra las fichas oficiales del MINSAL
(`https://auge.minsal.cl/problemasdesalud/index/{n}`), copiadas en `fuentes/auge-minsal-2026-07-30/`.
**Informe completo: [docs/2026-07-30-revalidacion-plazos-DS29-2025.md](docs/2026-07-30-revalidacion-plazos-DS29-2025.md).**

> ⚠️ Estos datos están verificados contra la fuente oficial, pero **aún no validados por la Unidad GES**.
> No publicar hasta que la unidad los apruebe.

**Mapeo código → problema de salud del decreto.** Los 15 códigos del afiche mapean a **14 problemas**
(G45.9 e I64 apuntan ambos al 37). Los 14 existen en el decreto vigente sin cambio de denominación.

| CIE-10 | N.° | Problema de salud |
|--------|-----|-------------------|
| I21 | 5 | Infarto agudo del miocardio |
| E10 | 6 | Diabetes mellitus tipo 1 |
| B24 | 18 | VIH/SIDA |
| R00.1 | 25 | Trastornos de generación del impulso y conducción ≥15 años que requieren marcapasos |
| K80.0 | 26 | Colecistectomía preventiva del cáncer de vesícula 35–49 años |
| Z99.1 | 36 | Ayudas técnicas para personas de 65 años y más |
| G45.9 / I64 | 37 | Ataque cerebrovascular isquémico ≥15 años |
| I60 | 42 | Hemorragia subaracnoidea por ruptura de aneurismas cerebrales |
| M51.1 | 44 | Tratamiento quirúrgico de hernia del núcleo pulposo lumbar |
| T07.X | 48 | Politraumatizado grave |
| S09.9 | 49 | Traumatismo cráneo encefálico moderado o grave |
| S05.1 | 50 | Trauma ocular grave |
| T29.0 | 55 | Gran quemado |
| Y05 | 86 | Atención integral de salud en agresión sexual aguda |

**Plazos dentro del hospital** — no están en ningún afiche actual:

| Problema | Garantía de oportunidad intrahospitalaria |
|----------|-------------------------------------------|
| IAM | ECG en urgencia **30 min** desde la sospecha · trombólisis **30 min** desde la confirmación de SDST |
| DM tipo 1 | Glicemia **30 min** desde la atención en urgencia por sospecha de descompensación · tratamiento 24 h desde la confirmación |
| ACV isquémico | Confirmación **24 h** desde la sospecha · tratamiento **24 h** desde la confirmación · hospitalización en prestador resolutivo **24 h** desde la indicación · rehabilitación hospitalizada **48 h** desde la indicación |
| HSA por aneurisma | TAC **24 h** desde la sospecha · angioTAC o angiografía digital **48 h** desde la confirmación de HSA · tratamiento **24 h** desde la confirmación de aneurisma roto · rehabilitación hospitalizada **48 h** |
| Politraumatizado grave | Tratamiento en centro resolutivo **antes de 24 h desde el rescate** · rehabilitación (solo con lesión medular) **24 h** desde la indicación |
| TEC moderado o grave | Diagnóstico **12 h** desde la sospecha · tratamiento **24 h** desde la confirmación |
| Trauma ocular grave | Diagnóstico **12 h** desde la sospecha · atención por especialista **60 h** desde la confirmación |
| Gran quemado | Tratamiento **72 h** desde la confirmación en prestador resolutivo · estabilización inicial en centro de origen **8 h** (>15 años) · rehabilitación hospitalizada **48 h** |
| Agresión sexual aguda | Primera respuesta **inmediata** desde la solicitud de atención en unidad de emergencia |
| VIH/SIDA | Diagnóstico **45 días** desde la sospecha o solicitud · consulta médica **45 días** desde la confirmación · tratamiento **7 días** desde la indicación |
| Marcapaso | Diagnóstico **30 días** desde la sospecha · tratamiento **30 días** desde la confirmación o indicación de recambio |
| HNP lumbar | Cirugía **45 días** desde la indicación quirúrgica |
| Colecistectomía preventiva | Confirmación **30 días** desde la sospecha · cirugía **90 días** desde la confirmación |
| Ayudas técnicas ≥65 | Bastones, cojines, colchones **20 días** · sillas de ruedas o andadores **30 días**, desde la indicación |

**Plazos después del alta** — los números del afiche son correctos; **tres puntos de partida no lo son**:

| Problema | Seguimiento | Rehabilitación ambulatoria |
|----------|-------------|----------------------------|
| IAM | 30 días desde el alta hospitalaria | sin garantía |
| ACV isquémico | 10 días desde el alta hospitalaria | 15 días desde la indicación médica |
| HSA por aneurisma | 30 días desde el alta | 15 días desde la indicación médica |
| Marcapaso | 15 días desde el alta de instalación o cambio de generador | sin garantía |
| HNP lumbar | 30 días desde el alta hospitalaria | sin garantía |
| **Gran quemado** | 15 días **desde la indicación médica** ⚠️ el afiche dice «desde el alta» | 15 días **desde el alta hospitalaria** ⚠️ el afiche dice «desde la indicación» |
| **Agresión sexual aguda** | 35 días **desde la primera respuesta** ⚠️ el afiche dice «desde el alta» | sin garantía |

**Además:** ACV isquémico (37) y HSA (42) garantizan **ayudas técnicas a menores de 65 años** — bastón, cojín o
colchón en 20 días; sillas de ruedas en 30 días, desde la indicación médica. El material actual asocia ayudas
técnicas solo al Z99.1, que es para 65 y más.

### 5.8 Flujo de seguimiento al alta

Fuente: `flujo seguimiento ges.png`.

**Responsabilidad médica**
1. **Alta médica** → emitir Solicitud de Interconsulta (SIC) a especialista: en SINA si el destino es HCSBA;
   interconsulta azul (formulario manual autocopiativo) para otros hospitales.
2. **Envío a Unidad GES** → correo a `ges@huap.online` adjuntando la interconsulta.

**Responsabilidad Unidad GES**
3. **Activación de la garantía de seguimiento** → se inicia el plazo para que el hospital receptor otorgue la
   consulta con especialidad.
4. **Solicitud de hora prioritaria GES** → por correo a la red y macrored.

⚠️ Antes del alta: **verificar comuna de residencia y al menos un contacto telefónico efectivo** del usuario o
familiar, para poder informar la hora de control.

### 5.9 Memo N°49 — 21-07-2025 · Responsabilidad de notificar durante la hospitalización

- La responsabilidad recae en el **médico tratante a cargo del paciente**, con independencia del servicio clínico
  y **sin importar si el GES es de urgencia o no**.
- Las especialidades que participan como **interconsultores no son responsables finales** del proceso de
  notificación; pueden colaborar en el levantamiento de antecedentes o apoyo diagnóstico.
- Ante solicitud expresa de la **Enfermera Gestora GES** para una notificación pendiente, el médico tratante debe
  cumplir en tiempo y forma según los plazos de la normativa vigente.

### 5.10 Memo N°05 — 02-01-2026 · Rehabilitación ambulatoria en ACV isquémico

Vigencia inmediata. Por indicación de la Mesa ACV del SSMC:

- Las SIC de rehabilitación ambulatoria se dirigen a la **Unidad de Kinesiología**, tanto en HCSBA como en HEC.
- Si se requiere **Fonoaudiología y/o Terapia Ocupacional**, se consigna explícitamente en la SIC, pero la
  derivación **se mantiene dirigida a Kinesiología**, que articula el abordaje interdisciplinario.
- Emisión: HCSBA → SIC habitual por SINA. HEC → interconsulta manual (formulario azul autocopiativo).
- Envío a `ges@huap.online`, con copia al referente de red indicado en el memo.

### 5.11 NTMA — Decreto Exento N° 57/2025: reglas que resuelven casos borde

Extraído de las definiciones generales de la NTMA (secciones I y II). **Es la fuente que responde varias de las
dudas operativas que los médicos plantean.**

**Modificación vigente (Decreto Exento N° 32, 06-03-2026).** Tres cambios, uno relevante para HUAP:

- Problema de salud **86 «Atención Integral en Salud en Agresión Sexual Aguda», numeral 86.1: se sustituyó el
  guarismo «29» por «72»**. Confirma la ventana de **72 horas**.
- Problema 82 renombrado a «Cáncer de Tiroides en personas de 15 años y más».
- Problema 3 (cáncer cervicouterino): precisión de «PAP reflejo» e incorporación de genotipificación VPH 45.

**Causales de cierre de una garantía** (§II.8). El cierre de una garantía **no** implica el cierre del caso: el
caso puede permanecer abierto y el beneficiario seguir recibiendo otras prestaciones del mismo problema.

| Causal | Detalle |
|--------|---------|
| Fallecimiento del beneficiario | |
| Cambio de sistema previsional | Quien esté recibiendo prestaciones tiene derecho a seguir recibiéndolas según la intervención sanitaria y periodicidad en curso |
| No cumple criterios de inclusión | Ingresó a un problema sin cumplir los criterios del decreto; debe cerrarse el caso |
| Cumple criterios de exclusión | Decisión médica |
| **Inasistencia** | No acude a **tres citaciones efectivas**. Cada inasistencia debe consignarse en el registro |
| **Contacto no corresponde** | Los datos de contacto entregados no corresponden, habiéndose intentado todas las modalidades de citación |
| Rechazo al prestador asignado | |
| Rechazo del tratamiento | El beneficiario no desea continuar o no desea el tratamiento indicado |
| **Indicación médica definitiva** | Definición justificada del profesional tratante, basada en condiciones clínicas que no permiten cumplir la garantía. **Debe registrarse en la ficha clínica** |

El **cierre de caso** (§II.10) tiene las mismas causales más «término del tratamiento garantizado».

**Citación efectiva** (§II.9) — contacto directo con el paciente o su representante por cualquiera de estos
medios, con su respaldo:

1. **Presencial** — registro de entrega suscrito por el beneficiario o representante.
2. **Llamada telefónica** — en días y horarios diferentes, registrando todos los intentos. Si hay grabación,
   debe conservarse.
3. **Visita domiciliaria** — en sobre cerrado, con nombre y firma de quien recibe y del funcionario.
4. **Carta certificada** — con registro del resultado.
5. **Correo electrónico** — desde cuenta institucional, respaldando envío y acuse de recibo.
6. **Otros medios electrónicos** — aplicaciones móviles o mensajería instantánea, siempre que se verifique que
   los datos pertenecen al beneficiario o su representante.

> **Por esto el flujo de alta insiste en verificar comuna y teléfono efectivo.** Si los datos no sirven, el caso
> cae en «contacto no corresponde» y la garantía se cierra sin que el paciente haya sido atendido. La verificación
> de datos de contacto no es un trámite: es lo que sostiene la garantía.

**Ficha clínica** (§II.24). Puede ser electrónica, en papel o cualquier soporte. Su contenido es **dato
sensible** conforme al art. 2° letra g) de la Ley N° 19.628 y a los arts. 12 y 13 de la Ley N° 20.584.

**Otras definiciones útiles:** «Excepción de garantías» y «Gestión de casos con garantía exceptuada» se rigen por
normativa de la Superintendencia de Salud (§II.23 y §II.25).

### 5.12 Proceso GES en HUAP — confirmado por la Unidad GES (08-2026)

> Respuestas entregadas por la Unidad GES en agosto de 2026 al cuestionario del proyecto. Son la fuente
> operativa local que faltaba; donde tocan normativa, coinciden con la Circular IF/N° 469 y la NTMA.

**Momento de la notificación.** En problemas **no oncológicos**, el IPD y el Formulario de Constancia se emiten
**al momento de la confirmación diagnóstica** realizada por el médico tratante. En problemas **oncológicos**
con sospecha garantizada, el formulario de constancia se emite **desde la sospecha** y luego por cada
intervención sanitaria realizada.

**Cartera HUAP.** De los 14 problemas de salud mapeados, **HUAP es prestador según el Libro de Redes GES y no
GES: otorga confirmación diagnóstica y tratamiento**.

**Soporte de los documentos.** IPD y constancia **se generan automáticamente en SINA**. En falla informática o
dificultad, se llenan en papel. (Por eso existen los preimpresos.)

**Códigos de activación.** Confirmado: el decreto no restringe DM tipo 1 al debut — cubre debut y
descompensación. Confirmado: el TIA (G45.9) forma parte de las patologías cubiertas por el problema 37.

**Notificación diferida.** Procedimiento para asegurar que el usuario reciba la notificación de su condición
GES cuando no pudo realizarse durante la hospitalización. La ejecuta el **equipo GES en coordinación con el
equipo clínico tratante**: verifica antecedentes, coordina el contacto con el usuario y realiza la entrega
formal de la información.

**GES «de urgencia».** El GES de urgencia puede notificarse a través del Dato de Atención de Urgencia (DAU);
**en HUAP no se utiliza el DAU para notificar**.

**GES y Ley de Urgencia.** Se articulan mediante dos unidades: la **Unidad de Gestión de Pacientes** (rol
clínico, continuidad asistencial) y la **Unidad de Admisión (Oficina 6)** (rol administrativo), responsable
**24/7** de registrar y notificar en la plataforma de la Superintendencia de Salud (SIS) el ingreso de los
usuarios acogidos a la Ley de Urgencia por urgencia vital o riesgo de secuela funcional grave.

**Ruta del documento a SIGGES.** Digita la **Unidad de Estadística del HUAP** (tres digitadoras). Las gestoras
GES visitan las unidades clínicas, fotografían los documentos GES y los envían a la enfermera de Trazabilidad
y Enlace, quien consolida en planilla Excel la nómina de pendientes y la remite por correo a Estadística.
**Plazo máximo de ingreso a SIGGES: 5 días hábiles desde la emisión.**

**Beneficiario ISAPRE.** Se entrega al familiar/tutor/representante la documentación GES (más resumen clínico
si está hospitalizado), para presentarla a la Isapre, activar garantías y gestionar rescate o traslado al
prestador designado por la aseguradora.

**Sin previsión, extranjero o NN.** Interconsulta al **Servicio Social del HUAP**: regularización con RUT
provisorio e inscripción en FONASA, o toma de huellas para identificación ante el Registro Civil.

**Paciente ya notificado en otro establecimiento.** Las gestoras revisan el historial en SIGGES y lo registran
en ficha, pero **no alcanzan a revisar sistemáticamente a todos**: ante cualquier duda, el equipo tratante debe
consultar a la Oficina GES antes de duplicar.

**Cierre por indicación médica definitiva.** El médico deja registro en la ficha clínica según su evaluación.

**Rescate de notificaciones pendientes.** Búsqueda activa del médico responsable para regularizar; se informa
a la jefatura correspondiente para adoptar medidas.

**Indicadores actuales.** El cumplimiento de la notificación lo evalúa la **Unidad de Auditoría HUAP**, más los
indicadores del BSC. No hay sistema de indicadores internos permanente (ver brechas).

**Exportación de datos.** SIGGES y SINA exportan nóminas en Excel (p. ej., IPD emitidos en SINA por fecha;
prestaciones otorgadas por mes en SIGGES).

**Brechas priorizadas por la propia unidad (08-2026):**
1. **Baja oportunidad y cobertura de la notificación GES** — requiere detección temprana de casos,
   coordinación clínico-administrativa y seguimiento de pendientes.
2. **Alta dependencia de procesos manuales** — fotos, planillas Excel y correos entre unidades; riesgo de
   retrasos, omisiones, duplicidad y pérdida de trazabilidad.
3. **Ausencia de indicadores internos permanentes** — la evaluación descansa en auditorías; sin monitoreo
   continuo de oportunidad, cobertura y plazos. *(Nota: la Circular IF/N° 469 exige un indicador medido al
   menos cada 3 meses — esta brecha es también un punto de cumplimiento.)*

**Analítica de la landing:** a la unidad **sí** le interesa medir uso.

**Mapa de derivación SSMC / Libro de Redes DIGERA:** contienen la red de prestadores GES de todo el país por
problema de salud; accesibles desde los PC del establecimiento solo con el enlace.

### 5.13 Sistemas y recursos externos

| Recurso | URL | Estado |
|---------|-----|--------|
| Plataforma Web GES MINSAL — decreto, LEP, guías clínicas, listado de 90 problemas | https://auge.minsal.cl/ | Público, accesible |
| Mapa de derivación SSMC | https://sistemas.ssmc.gob.cl/mapa-derivacion/ | Aplicación JS; no legible por fetch. Requiere revisión manual |
| Libro de Redes GES y no GES, DIGERA | https://libro-redes-digera.web.app/ | No accesible sin sesión. La ruta `/admin/home/` sugiere acceso restringido |
| Canal de reclamos y consultas Fonasa | https://www.fonasa.gob.cl/consulta-reclamo-sugerencia-felicitacion-o-solicitud/ | Bloquea fetch automatizado (403). Requiere revisión manual |
| Ley 19.966 | https://bcn.cl/2fckl | Público |
| Superintendencia de Salud — circulares | https://www.superdesalud.gob.cl/ | Público |

---

## 6. El proceso GES en HUAP, de punta a punta

Reconstruido a partir de las fuentes y confirmado por la Unidad GES (08-2026, §5.12).

```
SOSPECHA CLÍNICA
      │
      ▼
CONFIRMACIÓN DIAGNÓSTICA  ──►  ¿Está en la lista GES?   ── no ──►  vía habitual
      │ sí                     (14 problemas: HUAP confirma y trata)
      ▼
1. IPD + 2. FORMULARIO DE CONSTANCIA — SE EMITEN AL MOMENTO DE LA CONFIRMACIÓN,
   con la misma fecha en que se determinó la intervención (Circular IF/N°469)
   · Ambos se generan automáticamente en SINA (papel solo ante falla informática)
   · IPD: el médico llena campos 12–18 y firma; Admisión llena el resto
     El campo 18 fija la fecha máxima de inicio del tratamiento
   · Constancia (Art. 24° Ley 19.966): firma quien notifica (médico tratante,
     enfermera/o u otra persona autorizada) + firma o huella del paciente
     o representante; copia al paciente en el mismo acto
   · Oncológico: constancia desde la SOSPECHA y por cada intervención
   · Paciente que no puede firmar → representante · omitida → notificación
     diferida (equipo GES + equipo tratante)
      │
      ▼
3. RUTA A SIGGES — gestoras GES fotografían documentos en las unidades →
   enfermera de Trazabilidad y Enlace consolida nómina (Excel) → correo a
   Unidad de Estadística (3 digitadoras) → ingreso a SIGGES
   PLAZO MÁXIMO: 5 días hábiles desde la emisión
      │
      ▼
HOSPITALIZACIÓN — responsabilidad del médico tratante (Memo N°49)
   La Enfermera Gestora GES puede requerir notificaciones pendientes;
   si el médico ya no está, búsqueda activa e informe a jefatura
      │
      ▼
4. ALTA — el médico emite SIC (SINA → HCSBA · interconsulta azul → otros)
   y verifica comuna y teléfono efectivo (sostiene la «citación efectiva», NTMA §II.9)
      │
      ▼
5. ENVÍO A ges@huap.online adjuntando la interconsulta
      │
      ▼
6. UNIDAD GES activa la garantía de seguimiento y gestiona la hora prioritaria
   con la red y macrored
```

**Paralelo, 24/7:** la Ley de Urgencia corre por otra vía — Unidad de Gestión de Pacientes (rol clínico) y
Oficina 6 de Admisión (rol administrativo), que registra y notifica en la plataforma SIS de la
Superintendencia los ingresos por urgencia vital o riesgo de secuela funcional grave.

**Casos especiales:** ISAPRE → documentación GES + resumen clínico al representante, para activar garantías
ante su Isapre y gestionar rescate/traslado. Sin previsión, extranjero o NN → interconsulta a Servicio Social
(RUT provisorio, inscripción FONASA o identificación vía Registro Civil). ¿Ya notificado en otro
establecimiento? → consultar a la Oficina GES antes de duplicar.

---

## 7. Brechas detectadas

Hallazgos de la revisión documental. Sirven al objetivo de la unidad de identificar brechas y son insumo directo
para los proyectos.

1. **Marco normativo desactualizado en el Manual.** El Manual v01 (06/2025) declara vigente el Decreto N°72/2022
   con 87 problemas de salud. Desde el **01-12-2025** rige el **DS N° 29/2025 con 90 problemas**. El Manual es
   anterior al decreto, así que no fue un error al redactarlo, pero hoy induce a error.
2. **Norma técnica posiblemente superada.** El Manual cita la NTMA N° 3014 (2013); `auge.minsal.cl` anuncia una
   **NTMA 2025**.
3. **Circular de la Superintendencia posiblemente superada.** El Manual cita la IF/N° 469 (2024); existe una
   **IF/N° 516 (2025)**.
4. **Tres puntos de partida errados en el afiche de plazos.** Revalidado el 30-07-2026: los siete números son
   correctos, pero en **Gran quemado** los hitos de seguimiento y rehabilitación están **intercambiados**, y en
   **agresión sexual aguda** el seguimiento se cuenta desde la primera respuesta, no desde el alta. Contar desde
   el hito equivocado puede hacer aparecer como cumplida una garantía que no lo está.
   Detalle en [docs/2026-07-30-revalidacion-plazos-DS29-2025.md](docs/2026-07-30-revalidacion-plazos-DS29-2025.md).
5. **No existe material sobre los plazos intrahospitalarios.** Todo el material actual cubre lo posterior al
   alta. Los plazos que el HUAP puede incumplir por sí mismo — ECG en 30 minutos, TAC en 24 horas,
   politraumatizado en centro resolutivo antes de 24 horas desde el rescate, gran quemado estabilizado en 8
   horas — no están difundidos en ninguna parte. Es la brecha de mayor impacto clínico.
6. **Ayudas técnicas para menores de 65 años invisibilizadas.** ACV isquémico y HSA las garantizan, pero el
   material asocia ayudas técnicas solo al Z99.1 (65 y más).
7. **Material de difusión sin control de versiones.** Ningún afiche tiene fecha, versión ni responsable. Cuando
   cambie el decreto no habrá manera de saber qué material retirar.
8. ~~**Manual sin firmas.**~~ **Resuelto 09-08-2026:** el Manual está aprobado por **RES. EX. 902 del
   16-04-2026** (HUAP), primera versión, vigencia 5 años, con firmas electrónicas de revisión (Jefatura de
   Calidad y Seguridad del Paciente (s)) y aprobación (Director HUAP (s)) del 10-10-2025. Archivo:
   `Manual de Organización y funciones unidad GES.pdf`. **Persiste, eso sí, la brecha 1:** la versión
   aprobada por resolución sigue citando el Decreto N°72/2022 y la Norma Técnica N°3014/2013.
9. **Dato personal en normativa de circulación amplia.** El Memo N°05 difunde el correo personal de una
   funcionaria. No debe replicarse en material de acceso abierto.
10. **Erratas en material publicado.** Ver §8.
11. **El flujo documento→SIGGES es artesanal** (confirmado por la unidad, §5.12): fotos con celular, planilla
    Excel, correo y tres digitadoras, con plazo de 5 días hábiles. Coincide con las brechas 1 y 2 que la
    propia unidad prioriza y es terreno fértil para los proyectos de optimización.
12. **El indicador trimestral que exige la Circular IF/N°469 no existe como sistema interno** — la evaluación
    descansa en auditorías y BSC. La brecha 3 de la unidad es también un punto de cumplimiento normativo.

---

## 8. Erratas detectadas en las fuentes

Corregir al reutilizar; no propagar:

- `CODIGOS SINA.jpg`: «que requerien mzarcapaso» → «que requieren marcapaso».
- `Garantía oportunidad…jpg`: «Tramiento quirúrgico» → «Tratamiento quirúrgico».
- Nombre de archivo: `rehbailitación` → `rehabilitación`.
- Manual, §Marco normativo: «por arte de los equipos de salud» → «por parte de».

---

## 9. Pendientes de verificación

No usar ninguno de estos datos hasta confirmarlos. Al confirmarse, moverlos a §5 con su fuente.

**Normativo**
- [x] ~~Si alguno de los 15 problemas está entre los modificados y si cambiaron sus plazos.~~ **Resuelto
      30-07-2026:** los 14 problemas siguen vigentes con la misma denominación y los plazos del afiche son
      correctos en el número; tres tienen el punto de partida errado. Ver §5.7 y el informe en `docs/`.
      *Pendiente de validación por la Unidad GES.*
- [ ] Fecha de entrada en vigencia del DS N° 29/2025 según el texto íntegro del decreto (no según prensa).
      El extracto del Diario Oficial no la consigna; MINSAL informa 01-12-2025.
- [x] ~~Número y alcance de la NTMA 2025.~~ **Resuelto 30-07-2026:** es el **Decreto Exento N° 57/2025**
      (26-11-2025), modificado por el **Decreto Exento N° 32** de 06-03-2026. Reemplaza a la N° 3014/2013.
      Ver §5.4 y §5.11.
- [x] ~~Leer las especificaciones por problema de salud de la NTMA (pp. 15–91).~~ **Resuelto 09-08-2026:**
      transcritas para los 14 problemas en
      [docs/2026-08-09-ntma-especificaciones-14-problemas-huap.md](docs/2026-08-09-ntma-especificaciones-14-problemas-huap.md).
      *Transcripción pendiente de validación por la Unidad GES.*
- [ ] Si las Circulares IF/N° 516 y 517 (11-2025) modifican el proceso de notificación de la IF/N° 469, cuyo
      contenido operativo está en §5.4. La unidad trabaja con la 469.
- [ ] Estado de la publicación íntegra del decreto ordenada por Contraloría.

**Proceso HUAP** — el bloque completo fue respondido por la Unidad GES en 08-2026; todo movido a §5.12
(momento de la notificación, cartera de 14 problemas como prestador, SINA como soporte, notificación diferida,
GES de urgencia/DAU, Ley de Urgencia/Oficina 6, ruta a SIGGES con plazo de 5 días hábiles, ISAPRE, sin
previsión/NN, duplicados, cierre por indicación médica definitiva, rescate de pendientes, E10 y G45.9,
teléfonos y horario). Queda abierto:

- [ ] Si `huap.online` es un dominio institucional bajo control del hospital, y dónde se alojará la landing.
- [ ] A quién recurre un médico **fuera del horario** de la unidad (L–J 17:30, V 16:30) con una duda GES no
      urgente. (La Oficina 6 cubre 24/7 solo la Ley de Urgencia.)

**Datos y sistemas**
- [x] ~~Qué indicadores se miden hoy.~~ **Resuelto 08-2026:** auditoría HUAP + BSC; sin indicadores internos
      permanentes (brecha 3 de la unidad, ver §5.12).
- [x] ~~Qué exportan SIGGES y SINA.~~ **Resuelto 08-2026:** nóminas en Excel (ver §5.12).
- [ ] Si esos datos pueden salir del hospital, aunque sea agregados (condiciona dónde corren los
      visualizadores).
- [x] ~~Qué contiene el Mapa de derivación SSMC y el Libro de Redes DIGERA.~~ **Resuelto 08-2026:** red de
      prestadores GES del país por problema de salud; acceso desde los PC del establecimiento con el enlace.

**Gobernanza (sin responder aún)**
- [ ] Quién da el **visto bueno del contenido normativo** antes de publicar (gate explícito).
- [ ] Quién autoriza publicar con **marca institucional** (comunicaciones, subdirección, TI).
- [ ] Si existe **manual de marca** HUAP y archivo oficial del escudo; mientras no exista respuesta, se
      reutiliza la paleta de los afiches sin escudo.
- [ ] Rol del usuario dentro de la unidad (qué puede validar directamente).

---

## 10. Diseño y desarrollo frontend

### 10.1 Estándar

Todo producto visual debe verse **deliberadamente diseñado**, no plantilla genérica. Invocar la skill
`frontend-design` **antes** de escribir la primera línea de UI, y `dataviz` antes de cualquier gráfico, tabla de
indicadores o tablero.

### 10.2 Restricciones del contexto real de uso

No son preferencias, son condiciones del entorno hospitalario:

- **Móvil primero.** Un médico consulta esto de pie, en un pasillo, con una mano, entre pacientes.
- **Camino más corto.** Cada clic extra es una notificación que no se hace.
- **Red y equipos lentos.** Sitio liviano, sin dependencias externas pesadas. No asumir navegadores actualizados
  en los equipos de box.
- **Legible a distancia y con mala luz.** Tipografía grande, contraste alto.
- **Imprimible.** Hoja de estilos de impresión de primera clase: mucho de esto termina pegado en un muro.
- **Accesibilidad WCAG 2.1 AA como piso.** Es un sitio de un órgano de la Administración del Estado de Chile.
- **Fecha de vigencia visible** en toda pieza con contenido normativo.

### 10.3 Identidad

- Existe material institucional previo con paleta azul/verde y el escudo del HUAP. Reutilizar la identidad
  existente en vez de inventar una nueva, salvo indicación contraria.
- No usar logos ni escudos institucionales sin confirmar que se cuenta con el archivo oficial y la autorización.

### 10.4 Contenido separado de la presentación

El contenido normativo va en archivos de datos estructurados (`content/*.json` o similar), no incrustado en el
marcado, para que actualizar un plazo no requiera tocar código. Cada registro lleva su fuente y fecha.

---

## 11. Proyecto «Landing para médicos» — decisiones tomadas

Confirmadas por el usuario el 30-07-2026:

| Decisión | Valor | Consecuencia |
|----------|-------|--------------|
| Publicación | **Internet abierto** | Accesible desde celular sin VPN. Obliga a filtrar qué información interna se expone. |
| Alcance v1 | **Ciclo completo** | Sospecha → confirmación GES → IPD y constancia → interconsulta al alta → seguimiento. |
| Formato | **Página informativa lineal** | Scroll único con secciones. Se imprime completa y sirve como afiche de muro. |
| Mantención | **Archivo de datos editable por la unidad** | Contenido normativo en archivo estructurado y legible, separado del código. |

**Implicancias de «internet abierto»:**

- Solo el buzón institucional `ges@huap.online`; ningún correo personal.
- Confirmar antes de publicar los anexos: si son internos, no sirven desde fuera y hay que ofrecer alternativa.
- El sitio será indexable y citable por terceros — pacientes, otros hospitales, prensa. El contenido debe
  resistir esa lectura: fechas visibles, alcance declarado, sin ambigüedad sobre a quién está dirigido.
- Nada de analítica que registre datos identificables.

**Implicancias de «página lineal»:**

- La hoja de estilos de impresión es un entregable de primera clase.
- La tabla completa de problemas queda a la vista. Si la lista de §5.6 no fuera exhaustiva, un médico con un caso
  no listado concluirá «no es GES». Cerrar ese punto de §9 es bloqueante.

---

## 12. Método de trabajo

- **Idioma:** es-419, con ortografía y tildes completas. Identificadores de código en inglés.
- **Antes de construir:** `superpowers:brainstorming` → spec → `superpowers:writing-plans` → implementación.
- **Al depurar:** `superpowers:systematic-debugging`. No proponer arreglos antes de tener la causa raíz.
- **Un cambio, un propósito.** Sin refactorizaciones oportunistas no solicitadas.
- **Reportar fielmente.** Si algo quedó fuera, decirlo explícitamente y por qué.

---

## 13. Estructura propuesta de la carpeta

*(pendiente de aprobación del usuario antes de mover nada)*

```
fuentes/          Memos, afiches, formularios, normativa. Solo lectura.
                  Nomenclatura: AAAA-MM-DD-descripcion.ext
content/          Datos normativos estructurados, cada registro con fuente y fecha
docs/             Specs y planes de implementación
src/              Código de la landing y futuras herramientas
```

---

## 14. Glosario

| Sigla | Significado |
|-------|-------------|
| GES | Garantías Explícitas en Salud |
| AUGE | Acceso Universal con Garantías Explícitas |
| HUAP | Hospital de Urgencia Asistencia Pública |
| SSMC | Servicio de Salud Metropolitano Central |
| SINA | Sistema de información clínica (HIS) del hospital |
| SIGGES | Sistema de Gestión de Garantías Explícitas en Salud |
| RNLE | Registro Nacional de Lista de Espera |
| IPD | Informe del Proceso Diagnóstico |
| SIC | Solicitud de Interconsulta |
| LEP | Listado Específico de Prestaciones |
| NTMA | Norma Técnica Médico Administrativa |
| DIGERA | División de Gestión de la Red Asistencial (MINSAL) |
| CAT | Catálogo/Arancel de prestaciones |
| HCSBA | Hospital Clínico San Borja Arriarán |
| HEC | Hospital El Carmen |
| UEH | Unidad de Emergencia Hospitalaria |
| HSA | Hemorragia subaracnoidea |
| HNP | Hernia del núcleo pulposo |
| MCP | Marcapaso |
| TO | Terapia Ocupacional |
