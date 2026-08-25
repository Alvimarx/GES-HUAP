// Cobertura de contenido. Comprueba dos cosas distintas:
//
//   1. La RUTA GUIADA muestra, en la rama que corresponde, cada acción y cada
//      plazo que `content/` declara — con su redacción breve (`breve`) cuando
//      la tiene. Nada puede quedar sin camino: lo del momento actual va en la
//      lista numerada, lo posterior en la sección plegada «Y después».
//   2. El DOCUMENTO LINEAL (#doc, lo que se imprime y lo que se ve sin
//      JavaScript) conserva el texto COMPLETO (`t` y `d`). Es la comprobación
//      que protege el acortamiento: si una redacción breve perdiera contenido
//      normativo, el documento de referencia lo seguiría diciendo entero.
//
// uso: node tools/behavior.js <url del sitio construido>
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH || undefined;
const { chromium } = require(PW);
const fs = require('node:fs');
const path = require('node:path');

const URL = process.argv[2] || 'http://127.0.0.1:8321/mine/index.html';
const CONTENT = path.join(__dirname, '..', 'content');
const json = (n) => JSON.parse(fs.readFileSync(path.join(CONTENT, n), 'utf8'));

const flujo = json('flujo-notificacion.json');
const problemas = json('problemas.json').problemas;
const intra = json('plazos-intrahospitalarios.json').plazos;
const alta = json('plazos-alta.json').plazos;

const porPs = (arr) => Object.fromEntries(arr.map((x) => [x.ps, x]));
const intraMap = porPs(intra);
const altaMap = porPs(alta);

// Espejo de la composición de src/app.js. Si allá cambia qué etapa va en qué
// rama, aquí también — es lo que hace que esta herramienta sirva de red.
const ETAPAS = {
  si: ['confirmacion', 'hospitalizacion', 'alta', 'seguimiento'],
  no: ['sospecha']
};

function esperado(p, resp) {
  const plazos = [...((intraMap[p.ps] || {}).plazos || []), ...((altaMap[p.ps] || {}).plazos || [])];
  const acciones = [];
  for (const e of ETAPAS[resp]) {
    for (const a of flujo.acciones_comunes[e] || []) acciones.push(a.breve || a.t);
    for (const a of (p.extras || {})[e] || []) acciones.push(a.breve || a.t);
  }
  return {
    acciones,
    plazos: plazos.filter((z) => ETAPAS[resp].includes(z.etapa)).map((z) => z.hito)
  };
}

// Todo el texto largo que el documento lineal debe seguir diciendo.
function textoCompleto() {
  const out = [];
  for (const accs of Object.values(flujo.acciones_comunes)) {
    for (const a of accs) out.push(a.t, a.d);
  }
  for (const p of problemas) {
    for (const accs of Object.values(p.extras || {})) {
      for (const a of accs) out.push(a.t, a.d);
    }
  }
  return out.filter(Boolean);
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  let checked = 0;
  const faltantes = [];

  // ---- 1. ruta guiada
  for (const p of problemas) {
    for (const resp of ['si', 'no']) {
      // La animación de salida usa un temporizador: se espera al selector.
      await page.click('[data-k="ps-' + p.ps + '"]');
      await page.waitForSelector('[data-k="resp-' + resp + '"]', { timeout: 5000 });
      await page.click('[data-k="resp-' + resp + '"]');
      await page.waitForSelector('[data-k="back-gate"]', { timeout: 5000 });

      // La sección «Y después» solo existe en la rama confirmada.
      if (resp === 'si' && (await page.$('[data-k="t-luego"]'))) {
        await page.click('[data-k="t-luego"]');
        await page.waitForSelector('#panel-luego', { timeout: 5000 });
      }
      const texto = await page.evaluate(() =>
        (document.getElementById('app').textContent || '').split(/[ \t\n\r]+/).join(' '));

      const exp = esperado(p, resp);
      for (const t of exp.acciones) {
        checked++;
        if (!texto.includes(t)) faltantes.push(`guiada · ps ${p.ps} · ${resp} · acción «${t}»`);
      }
      for (const h of exp.plazos) {
        checked++;
        if (!texto.includes(h)) faltantes.push(`guiada · ps ${p.ps} · ${resp} · plazo «${h}»`);
      }

      await page.click('[data-k="back-gate"]');
      await page.waitForSelector('[data-k="cambiar"]', { timeout: 5000 });
      await page.click('[data-k="cambiar"]');
      await page.waitForSelector('#buscador', { timeout: 5000 });
    }
  }

  // ---- 2. documento lineal: el texto largo sigue entero
  const doc = await page.evaluate(() =>
    (document.getElementById('doc').textContent || '').split(/[ \t\n\r]+/).join(' '));
  for (const t of textoCompleto()) {
    checked++;
    if (!doc.includes(t)) faltantes.push(`documento lineal · falta el texto completo «${t.slice(0, 60)}…»`);
  }

  await browser.close();
  if (faltantes.length) {
    console.error(`✗ ${faltantes.length} comprobaciones fallidas de ${checked}:`);
    for (const f of faltantes) console.error('   · ' + f);
    process.exit(1);
  }
  console.log(`✓ ${checked} comprobaciones correctas: la ruta guiada muestra todo lo de content/ en las 28 vistas`);
  console.log('  (14 problemas × 2 respuestas) y el documento lineal conserva el texto completo.');
})();
