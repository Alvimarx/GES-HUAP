#!/usr/bin/env node
/* Build de la landing GES para médicos del HUAP.
 *
 * Compone content/*.json + src/ → dist/. Sin dependencias externas: se ejecuta
 * con `node src/build.js` en cualquier equipo con Node 18 o superior.
 *
 * La unidad edita únicamente los archivos de content/; nada de este script
 * contiene datos normativos.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const SRC = __dirname;
const DIST = path.join(ROOT, 'dist');

const read = (p) => fs.readFileSync(p, 'utf8');
const json = (name) => JSON.parse(read(path.join(CONTENT, name)));

// Las fechas se guardan en content/ como aaaa-mm-dd y se muestran dd-mm-aaaa,
// que es el formato de los memos y afiches de la unidad.
const fecha = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('-') : iso);

const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// --------------------------------------------------------------- contenido
const vigencia = json('vigencia.json');
const contactos = json('contactos.json');
const flujo = json('flujo-notificacion.json');
const problemasSrc = json('problemas.json');
const intra = json('plazos-intrahospitalarios.json');
const alta = json('plazos-alta.json');

const byPs = (arr) => {
  const m = new Map();
  arr.forEach((x) => m.set(x.ps, x));
  return m;
};
const intraMap = byPs(intra.plazos);
const altaMap = byPs(alta.plazos);

// Los plazos viven repartidos en dos archivos (dentro del hospital / después
// del alta) porque así los revisa la unidad; la vista los necesita juntos por
// problema. El orden intra→alta es el del decreto.
const problemas = problemasSrc.problemas.map((p) => {
  const i = intraMap.get(p.ps);
  const a = altaMap.get(p.ps);
  return {
    ps: p.ps,
    cie: p.cie,
    nombre: p.nombre,
    denominacionOficial: p.denominacion_oficial,
    corto: p.corto,
    tiempo: p.tiempo,
    plazos: [...((i && i.plazos) || []), ...((a && a.plazos) || [])],
    extras: p.extras || {},
    ntma: p.ntma || [],
    postNota: (a && a.post_nota) || '',
    fuente: p.fuente
  };
});

// --------------------------------------------------------------- validación
// Un `ps` o una `etapa` mal escritos harían desaparecer una garantía sin ruido:
// el filtro de la vista simplemente no encontraría nada. Aquí el build se cae.
const ETAPAS_VALIDAS = flujo.etapas.map((e) => e.id);
const UNIDADES = ['min', 'h', 'd', 'ya'];
const errores = [];
const psConocidos = new Set(problemasSrc.problemas.map((p) => p.ps));
const idsVistos = new Set();

const revisarGrupo = (grupo, archivo, etapasPermitidas) => {
  if (!psConocidos.has(grupo.ps)) {
    errores.push(`${archivo}: el problema ${grupo.ps} no existe en problemas.json`);
    return;
  }
  for (const z of grupo.plazos || []) {
    const d = `${archivo} · ps ${grupo.ps} · plazo ${z.id || '(sin id)'}`;
    if (!z.id) errores.push(`${d}: falta el campo id`);
    else if (idsVistos.has(z.id)) errores.push(`${d}: id repetido`);
    else idsVistos.add(z.id);
    if (!etapasPermitidas.includes(z.etapa)) {
      errores.push(`${d}: etapa «${z.etapa}» no válida aquí (se espera ${etapasPermitidas.join(', ')})`);
    }
    if (!UNIDADES.includes(z.u)) errores.push(`${d}: unidad «${z.u}» no válida (${UNIDADES.join(', ')})`);
    if (z.u !== 'ya' && typeof z.n !== 'number') errores.push(`${d}: el campo n debe ser un número`);
    if (!z.hito) errores.push(`${d}: falta el hito`);
    if (!z.desde) errores.push(`${d}: falta el campo «desde»`);
  }
};

intra.plazos.forEach((g) => revisarGrupo(g, 'plazos-intrahospitalarios.json', ETAPAS_VALIDAS.filter((e) => e !== 'seguimiento')));
alta.plazos.forEach((g) => revisarGrupo(g, 'plazos-alta.json', ['seguimiento']));

for (const p of problemasSrc.problemas) {
  for (const etapa of Object.keys(p.extras || {})) {
    if (!ETAPAS_VALIDAS.includes(etapa)) {
      errores.push(`problemas.json · ps ${p.ps}: la etapa «${etapa}» de extras no existe en flujo-notificacion.json`);
    }
  }
  if (!p.denominacion_oficial) errores.push(`problemas.json · ps ${p.ps}: falta denominacion_oficial`);
}
for (const etapa of Object.keys(flujo.acciones_comunes)) {
  if (!ETAPAS_VALIDAS.includes(etapa)) {
    errores.push(`flujo-notificacion.json: la etapa «${etapa}» de acciones_comunes no existe`);
  }
}
const sinPlazos = problemas.filter((p) => !p.plazos.length);
if (sinPlazos.length) errores.push('Problemas sin ningún plazo: ' + sinPlazos.map((p) => p.ps).join(', '));

if (errores.length) {
  console.error('El contenido de content/ tiene errores; no se generó nada:\n');
  for (const e of errores) console.error('  · ' + e);
  process.exit(1);
}

// Datos que necesita la ruta guiada en el navegador. Se envía solo lo que la
// vista usa: los bloques _meta y las notas de procedencia se quedan en el repo.
const runtime = {
  contacto: {
    correo: contactos.unidad_ges.correo,
    anexos: contactos.unidad_ges.anexos,
    horario: contactos.unidad_ges.horario
  },
  etapas: flujo.etapas,
  acciones_comunes: flujo.acciones_comunes,
  casos: flujo.casos,
  notaSinGarantiaPostAlta: alta.nota_sin_garantia_post_alta,
  problemas
};

// --------------------------------------------------------- documento lineal
// Es lo que ve quien abre la página sin JavaScript y lo que sale al imprimir:
// los 14 problemas completos, en orden, sin nada plegado.
const U = { min: 'min', h: 'h', d: 'días' };
const fmtPlazo = (z) => (z.u === 'ya' ? 'Inmediata' : `${z.n} ${U[z.u]}`);

const accsHtml = (accs) =>
  `<ul class="doc-accs" role="list">${accs
    .map(
      (a) =>
        `<li><strong>${esc(a.t)}</strong>${a.ctx ? ` <em class="doc-ctx">(solo ${esc(a.ctx)})</em>` : ''}<br>${esc(a.d)}</li>`
    )
    .join('')}</ul>`;

// Las acciones comunes se listan una sola vez, en «El proceso, momento a
// momento»; en la ficha de cada problema van solo las suyas y sus plazos.
function docEtapa(p, etapa) {
  const accs = (p.extras && p.extras[etapa.id]) || [];
  const plazos = p.plazos.filter((z) => z.etapa === etapa.id);
  if (!accs.length && !plazos.length) return '';

  const accHtml = accs.length ? accsHtml(accs) : '';

  const plazoHtml = plazos.length
    ? `<ul class="doc-plazos" role="list">${plazos
        .map(
          (z) =>
            `<li><span class="doc-plazo-chip${z.critico ? ' doc-critico' : ''}">${esc(fmtPlazo(z))}</span> ` +
            `<strong>${esc(z.hito)}</strong> — desde ${esc(z.desde)}` +
            (z.nota ? `<br><em>${esc(z.nota)}</em>` : '') +
            (z.corregido ? `<br><strong class="doc-corr">Corrección al afiche:</strong> ${esc(z.corregido)}` : '') +
            `</li>`
        )
        .join('')}</ul>`
    : '';

  return `<div class="doc-etapa"><h4>${esc(etapa.nombre)}${etapa.badge ? ` — ${esc(etapa.badge)}` : ''}</h4>${accHtml}${plazoHtml}</div>`;
}

function docProblema(p) {
  const etapas = flujo.etapas.map((e) => docEtapa(p, e)).join('');
  const post = p.postNota ? `<p class="doc-post">${esc(p.postNota)}</p>` : '';
  const ntma = p.ntma.length
    ? `<div class="doc-ntma"><h4>Criterios NTMA</h4><ul>${p.ntma.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` +
      `<p class="doc-warn">Transcripción de la NTMA pendiente de validación por la Unidad GES.</p></div>`
    : '';
  // El documento de consulta lleva la redacción del decreto, no la etiqueta
  // abreviada de la interfaz.
  return `<section class="doc-ps">
  <h3><span class="doc-cie">${esc(p.cie.join(' · '))}</span> ${esc(p.denominacionOficial || p.nombre)}</h3>
  ${p.denominacionOficial && p.denominacionOficial !== p.nombre ? `<p class="doc-fuente">En la ruta guiada aparece como «${esc(p.nombre)}».</p>` : ''}
  ${etapas}${post}${ntma}
  <p class="doc-fuente">Fuente: ${esc(p.fuente)}</p>
</section>`;
}

const docHtml = `
<p class="doc-intro">Esta página reúne, por problema de salud, qué le corresponde hacer al médico tratante en
cada momento del paciente y qué plazos empiezan a correr. Es apoyo administrativo al proceso GES:
<strong>no decide si un caso es GES</strong> ni sustituye el juicio clínico. La confirmación diagnóstica y la
notificación son responsabilidad del médico tratante (Memo N°49).</p>

<section class="doc-sec">
  <h2>Unidad GES · contacto</h2>
  <ul class="doc-contacto">
    <li><strong>Correo:</strong> <a href="mailto:${esc(contactos.unidad_ges.correo)}">${esc(contactos.unidad_ges.correo)}</a></li>
    <li><strong>Anexos internos:</strong> ${esc(contactos.unidad_ges.anexos)}</li>
    <li><strong>Desde fuera del hospital o celular:</strong> ${esc(contactos.unidad_ges.externos)}</li>
    <li><strong>Horario:</strong> ${esc(contactos.unidad_ges.horario)}</li>
    <li><strong>Ubicación:</strong> ${esc(contactos.unidad_ges.ubicacion)}</li>
    <li>${esc(contactos.fuera_horario.texto)}</li>
  </ul>
</section>

<section class="doc-sec" id="momentos">
  <h2>El proceso, momento a momento</h2>
  <p class="doc-nota">Estas acciones corren para cualquiera de los 14 problemas. Lo propio de cada problema
  —sus plazos y sus indicaciones específicas— va en su ficha, más abajo.</p>
  ${flujo.etapas
    .map((e, i) => {
      const comunes = flujo.acciones_comunes[e.id] || [];
      return `<div class="doc-etapa"><h3>${i + 1}. ${esc(e.nombre)} — ${esc(e.desc)}${e.badge ? ` <em>(${esc(e.badge)})</em>` : ''}</h3>${comunes.length ? accsHtml(comunes) : ''}</div>`;
    })
    .join('')}
  <p class="doc-fuente">Fuentes: ${esc(flujo.fuentes)}</p>
</section>

<section class="doc-sec">
  <h2>Los 14 problemas GES del HUAP</h2>
  <p class="doc-nota">HUAP es prestador de estos 14 problemas: otorga confirmación diagnóstica y tratamiento.
  Ante un caso que no aparezca aquí, consulte a la Unidad GES antes de descartar que sea GES.
  Cada ficha suma sus plazos e indicaciones propias a las acciones del momento (ver «El proceso, momento a momento»).</p>
  ${problemas.map(docProblema).join('\n')}
</section>

<section class="doc-sec">
  <h2>Casos especiales — si… entonces…</h2>
  <dl class="doc-casos">
    ${flujo.casos.map((c) => `<dt>${esc(c.si)}</dt><dd>${esc(c.entonces)}</dd>`).join('')}
  </dl>
</section>

<section class="doc-sec">
  <h2>Ayudas técnicas para menores de 65 años</h2>
  <p>${esc(alta.ayudas_tecnicas_menores_65.descripcion)}</p>
  <ul>
    ${alta.ayudas_tecnicas_menores_65.garantias.map((g) => `<li><strong>${esc(g.hito)}:</strong> ${esc(g.plazo)} desde ${esc(g.desde)}</li>`).join('')}
  </ul>
  <p class="doc-fuente">Fuente: ${esc(alta.ayudas_tecnicas_menores_65.fuente)}</p>
</section>

<section class="doc-sec doc-fuentes">
  <h2>Vigencia y fuentes</h2>
  <ul>
    <li><strong>${esc(vigencia.decreto_ges.nombre)}.</strong> ${esc(vigencia.decreto_ges.problemas_garantizados)} problemas garantizados.
      ${esc(vigencia.decreto_ges.publicacion_detalle)}, ${esc(fecha(vigencia.decreto_ges.publicacion_extracto))}.
      Vigencia informada por MINSAL: ${esc(fecha(vigencia.decreto_ges.vigencia_informada))}. <em>${esc(vigencia.decreto_ges.nota_vigencia)}</em></li>
    <li><strong>${esc(vigencia.ntma.nombre)}</strong>, de ${esc(fecha(vigencia.ntma.dictacion))}.
      ${vigencia.ntma.modificaciones.map((m) => `Modificado por ${esc(m.nombre)} (${esc(fecha(m.dictacion))}): ${esc(m.alcance_huap)}`).join(' ')}</li>
    <li><strong>${esc(vigencia.circular_notificacion.nombre)}</strong>, vigente desde ${esc(fecha(vigencia.circular_notificacion.vigencia))}. <em>${esc(vigencia.circular_notificacion.nota)}</em></li>
    <li><strong>${esc(vigencia.ley.nombre)}.</strong> ${esc(vigencia.ley.nota)} <a href="${esc(vigencia.ley.fuente)}">${esc(vigencia.ley.fuente)}</a></li>
    <li>Fichas oficiales por problema de salud: <a href="https://auge.minsal.cl/">https://auge.minsal.cl/</a></li>
  </ul>
  <p class="doc-warn">${esc(vigencia.validacion)}. ${esc(vigencia.revision)}.</p>
  <p class="doc-fuente">Última revisión normativa: ${esc(fecha(vigencia.ultima_revision_normativa))}. ${esc(vigencia.linea_cabecera)}.</p>
</section>`;

// ------------------------------------------------------------------ salida
const SUSTITUCIONES = {
  TITLE: esc('¿Qué hago con mi paciente GES? · Unidad GES HUAP'),
  STYLES: read(path.join(SRC, 'styles.css')).trim(),
  BADGE: esc(vigencia.etiqueta_estado),
  VIGENCIA: esc(vigencia.linea_cabecera),
  TEL: esc(contactos.unidad_ges.telHref.replace(/^tel:/, '')),
  CORREO: esc(contactos.unidad_ges.correo),
  ANEXOS: esc(contactos.unidad_ges.anexos),
  HORARIO: esc(contactos.unidad_ges.horario),
  DOC: docHtml,
  // Cierra la etiqueta <script> si algún texto llegara a contener "</script>".
  DATA: JSON.stringify(runtime).replace(/</g, '\\u003c'),
  APP: read(path.join(SRC, 'app.js')).trim()
};

// Reemplazo por función: un valor con `$&` o `$1` no se interpreta como patrón.
const shell = read(path.join(SRC, 'shell.html'));
const sinResolver = [];
const out = shell.replace(/\{\{([A-Z]+)\}\}/g, (m, k) => {
  if (!(k in SUSTITUCIONES)) { sinResolver.push(k); return m; }
  return SUSTITUCIONES[k];
});
if (sinResolver.length) {
  throw new Error('Marcadores sin valor en shell.html: ' + [...new Set(sinResolver)].join(', '));
}

// Un marcador visible en producción sería una garantía sin fuente publicada:
// no se escribe nada.
const publicadosPrevios = (out.match(/\{\{FALTA:[^}]*\}\}/g) || []).length;
if (publicadosPrevios) {
  console.error(`No se generó nada: ${publicadosPrevios} marcador(es) {{FALTA: …}} llegarían a la página.`);
  process.exit(1);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'fonts'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), out);
for (const f of fs.readdirSync(path.join(SRC, 'assets', 'fonts'))) {
  fs.copyFileSync(path.join(SRC, 'assets', 'fonts', f), path.join(DIST, 'fonts', f));
}

// Los marcadores que viven en content/ sin llegar a la página siguen siendo
// datos pendientes: se listan para que no se den por resueltos (CLAUDE.md §1.2).
const enContent = [];
for (const f of fs.readdirSync(CONTENT).filter((n) => n.endsWith('.json'))) {
  for (const m of read(path.join(CONTENT, f)).match(/\{\{FALTA:[^}]*\}\}/g) || []) {
    enContent.push(`${f}: ${m}`);
  }
}
const sinRespaldo = [];
for (const [etapa, accs] of Object.entries(flujo.acciones_comunes)) {
  for (const a of accs) {
    if (a._pendiente_validacion) sinRespaldo.push(`${etapa}: «${a.t}» — ${a._pendiente_validacion}`);
  }
}

const noValidados = ['problemas.json', 'plazos-intrahospitalarios.json', 'plazos-alta.json']
  .filter((f) => /pendiente de validación/i.test(read(path.join(CONTENT, f))));

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const fontLatin = fs.statSync(path.join(DIST, 'fonts', 'nunito-latin.woff2')).size;
console.log(`dist/index.html  ${kb(Buffer.byteLength(out))}`);
console.log(`carga inicial en español (html + subconjunto latino)  ${kb(Buffer.byteLength(out) + fontLatin)}`);
console.log(`problemas: ${problemas.length} · plazos: ${problemas.reduce((n, p) => n + p.plazos.length, 0)}`);

if (enContent.length) {
  console.log(`\ndatos pendientes en content/ (no se publican, siguen abiertos):`);
  for (const p of enContent) console.log(`  · ${p}`);
}
if (sinRespaldo.length) {
  console.log(`\ncontenido publicado SIN respaldo documental — confirmar o retirar antes de publicar:`);
  for (const x of sinRespaldo) console.log(`  · ${x}`);
}
if (noValidados.length) {
  console.log(`\ncontenido marcado como pendiente de validación por la Unidad GES: ${noValidados.join(', ')}`);
}
