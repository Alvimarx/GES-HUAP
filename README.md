# Unidad GES · Hospital de Urgencia Asistencia Pública (HUAP)

Herramientas de apoyo al proceso GES de la Unidad GES del HUAP (Servicio de Salud Metropolitano
Central, Santiago de Chile): material de difusión, análisis de brechas y una guía de procedimiento
para clínicos.

**Sitio:** https://alvimarx.github.io/GES-HUAP/

---

## ⚠️ Estado: borrador, pendiente de validación

**El contenido normativo de este repositorio no ha sido validado por la Unidad GES y no debe usarse
como fuente autorizada.** Los plazos y criterios están contrastados contra las fichas oficiales del
MINSAL y la Norma Técnica, pero la revisión formal de la unidad sigue abierta (ver
[gates de publicación](docs/2026-08-20-implementacion-ruta-guiada.md#11-antes-de-publicar-spec-8)).

Mientras siga en ese estado, el sitio se publica con `noindex, nofollow`: no aparece en buscadores.
Pasa a indexable solo cuando la unidad valide el contenido y se retire esa marca de `content/`.

Ante cualquier duda sobre un caso concreto, la fuente son las **Guías Clínicas GES del MINSAL**, el
**Decreto Supremo N° 29/2025** y la propia **Unidad GES** (`ges@huap.online`).

## Qué es la guía

Una página para que un médico del HUAP sepa qué hacer ante la sospecha o confirmación de una
patología GES, en el momento en que le surge la duda: qué documentos emitir, qué plazos empiezan a
correr y qué hacer al alta.

Es **apoyo administrativo al proceso GES**. No decide si un caso es GES, no sustituye el juicio
médico ni las Guías Clínicas del MINSAL. La confirmación diagnóstica y la notificación son
responsabilidad del médico tratante (Memo N°49).

Funciona de dos maneras sobre el mismo HTML:

- **Ruta guiada de 3 pasos** — problema de salud → momento del paciente → qué hacer ahora, con los
  plazos que corren y una calculadora referencial. Pensada para el celular, de pie, entre pacientes.
- **Documento lineal completo** — los 14 problemas con todos sus momentos, plazos y criterios. Es lo
  que se ve sin JavaScript y lo que sale al imprimir (14 páginas A4, sin fondos de color, con la
  fecha de vigencia al pie de cada hoja).

Sin dependencias de red: ni CDN ni fuentes remotas. Carga inicial ~140 KB.

## Cómo se actualiza el contenido

**La unidad edita solo `content/`.** Cambiar un plazo no requiere tocar código:

```sh
# 1. editar el archivo que corresponda en content/
# 2. reconstruir
node src/build.js        # requiere Node 18 o superior; sin dependencias
```

El build **se cae** si un `ps` o una etapa están mal escritos, si falta un campo obligatorio o si un
marcador `{{FALTA: …}}` llegaría a la página. Al hacer push, el sitio se regenera solo.

| Archivo | Qué contiene |
|---|---|
| `content/problemas.json` | Los 14 problemas GES del HUAP: códigos CIE-10, denominación oficial, criterios NTMA, sinónimos del buscador |
| `content/plazos-intrahospitalarios.json` | Garantías que corren dentro del hospital |
| `content/plazos-alta.json` | Garantías de seguimiento y rehabilitación posteriores al alta |
| `content/flujo-notificacion.json` | Momentos del paciente, acciones y casos especiales |
| `content/contactos.json` · `content/vigencia.json` | Contacto de la unidad y marco normativo vigente |

Cada registro lleva su **fuente y fecha**.

## Estructura

```
content/    Datos normativos. Es lo único que edita la unidad.
src/        Build (sin dependencias), plantilla, estilos y ruta guiada.
docs/       Informes de revalidación, transcripción NTMA, spec y notas de implementación.
fuentes/    Fichas oficiales del MINSAL y normativa. Solo lectura.
design/     Diseño aprobado de origen, como referencia de fidelidad.
tools/      Verificación: fidelidad visual, geometría, buscador, impresión.
```

## Marco normativo

- **Ley N° 19.966** (2004) — Régimen General de Garantías en Salud. Su Artículo 24° funda el
  Formulario de constancia de información al paciente GES.
- **Decreto Supremo N° 29, de 2025**, MINSAL — 90 problemas de salud garantizados.
- **Decreto Exento N° 57, de 2025** (NTMA), modificado por el **Decreto Exento N° 32, de 2026**.
- **Circular IF/N° 469** (2024), Superintendencia de Salud — proceso de notificación.

Documentación de referencia: [revalidación de plazos](docs/2026-07-30-revalidacion-plazos-DS29-2025.md) ·
[especificaciones NTMA](docs/2026-08-09-ntma-especificaciones-14-problemas-huap.md) ·
[notas de implementación](docs/2026-08-20-implementacion-ruta-guiada.md)

## Contacto

**Unidad GES · HUAP** — `ges@huap.online` · 1.er piso torre antigua, contigua a UTI
Lunes a jueves 07:30–17:30 · viernes 07:30–16:30
