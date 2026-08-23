// Cobertura de contenido: recorre los 14 problemas × las 2 respuestas de la
// pregunta de confirmación y comprueba que TODO lo que content/ declara para
// esa rama aparezca en la vista dibujada — cada acción, cada plazo, cada nota.
//
// Existe porque en el flujo anterior un `ps` o una etapa mal escritos hacían
// desaparecer una garantía en silencio; el build ya valida los datos, y esta
// herramienta valida que la vista no filtre de más. Reemplaza a la comparación
// contra el diseño de Claude Design: desde el rediseño del 2026-08-23 las
// pantallas 2 y 3 divergen del diseño original a propósito.
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

// Qué espera ver cada rama. Debe reflejar la composición de src/app.js:
// «sí» = confirmación + hospitalización + alta (+ seguimiento como informativo);
// «no» = sospecha.
function esperado(p, resp) {
  const plazos = [...((intraMap[p.ps] || {}).plazos || []), ...((altaMap[p.ps] || {}).plazos || [])];
  const etapas = resp === 'si' ? ['confirmacion', 'hospitalizacion', 'alta', 'seguimiento'] : ['sospecha'];
  const acciones = [];
  for (const e of etapas) {
    for (const a of (p.extras || {})[e] || []) acciones.push(a.t);
    for (const a of flujo.acciones_comunes[e] || []) acciones.push(a.t);
  }
  return {
    acciones,
    plazos: plazos.filter((z) => etapas.includes(z.etapa)).map((z) => z.hito),
    confirma: resp === 'si' || !p.confirma ? [] : []
  };
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  let checked = 0;
  const faltantes = [];

  for (const p of problemas) {
    for (const resp of ['si', 'no']) {
      // Navegación directa por data-k: la animación de salida usa un timeout,
      // así que se espera a que la pantalla siguiente exista.
      await page.click('[data-k="ps-' + p.ps + '"]');
      await page.waitForSelector('[data-k="resp-' + resp + '"]', { timeout: 4000 });
      await page.click('[data-k="resp-' + resp + '"]');
      await page.waitForSelector('[data-k="back-gate"]', { timeout: 4000 });
      await page.waitForTimeout(80);

      const texto = await page.evaluate(() => {
        const app = document.getElementById('app');
        return (app.textContent || '').split(/[ \t\n\r]+/).join(' ');
      });

      const exp = esperado(p, resp);
      for (const t of exp.acciones) {
        checked++;
        if (!texto.includes(t)) faltantes.push(`ps ${p.ps} · ${resp} · acción «${t}»`);
      }
      for (const h of exp.plazos) {
        checked++;
        if (!texto.includes(h)) faltantes.push(`ps ${p.ps} · ${resp} · plazo «${h}»`);
      }
      // La pista de confirmación se muestra en la pregunta, no aquí.

      await page.click('[data-k="back-gate"]');
      await page.waitForSelector('[data-k="cambiar"]', { timeout: 4000 });
      await page.click('[data-k="cambiar"]');
      await page.waitForSelector('#buscador', { timeout: 4000 });
    }
  }

  // La pista de confirmación de cada problema que la declara debe verse en la
  // pantalla de la pregunta.
  for (const p of problemas.filter((x) => x.confirma)) {
    await page.click('[data-k="ps-' + p.ps + '"]');
    await page.waitForSelector('[data-k="resp-si"]', { timeout: 4000 });
    const texto = await page.evaluate(() => document.getElementById('app').textContent);
    checked++;
    if (!texto.includes(p.confirma)) faltantes.push(`ps ${p.ps} · pista «confirma» ausente en la pregunta`);
    await page.click('[data-k="cambiar"]');
    await page.waitForSelector('#buscador', { timeout: 4000 });
  }

  await browser.close();
  if (faltantes.length) {
    console.error(`✗ ${faltantes.length} elementos de content/ no aparecen en la vista (${checked} comprobados):`);
    for (const f of faltantes) console.error('   · ' + f);
    process.exit(1);
  }
  console.log(`✓ cobertura completa: ${checked} acciones/plazos de content/ presentes en las 28 vistas (14 problemas × 2 respuestas).`);
})();
