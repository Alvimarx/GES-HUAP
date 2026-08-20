// Comprueba la salida impresa en A4 y en carta:
//   1. que la fecha de vigencia aparezca al pie de TODAS las páginas, y
//   2. que ninguna línea del cuerpo quede debajo del pie.
//
// La versión anterior de esta herramienta daba un falso «impresión correcta»
// mientras el pie borraba líneas del papel: buscaba el pie con una expresión
// que también casaba con texto del cuerpo, y medía contra la línea base del
// pie en vez de contra su caja. Ahora el texto exacto del pie se lee de la
// propia página y el cuerpo se identifica por descarte.
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH || undefined;
const PDFJS = process.env.PDFJS_PATH || 'pdfjs-dist';
const { chromium } = require(PW);
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const URL = process.argv[2];
if (!URL) {
  console.error('uso: node tools/print-check.js <url de dist/index.html>');
  process.exit(2);
}

// Holgura mínima entre la última línea del cuerpo y la primera del pie, en
// puntos: cubre el ascendente del pie, su borde, su relleno y el descendente
// del cuerpo. Por debajo de esto hay riesgo de que se toquen en el papel.
const HOLGURA_MINIMA = 14;
const norm = (s) => s.split(/[\s ]+/).join(' ').trim();

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ges-print-'));
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);

  // El texto exacto del pie se toma de la página, no se adivina.
  const textoPie = norm(await page.evaluate(() => {
    const el = document.querySelector('.print-footer');
    return el ? el.textContent : '';
  }));
  if (!textoPie) {
    console.error('No se encontró .print-footer en la página.');
    await browser.close();
    process.exit(1);
  }

  const formatos = ['A4', 'Letter'];
  for (const f of formatos) {
    await page.pdf({ format: f, printBackground: false, path: path.join(dir, f + '.pdf') });
  }
  await browser.close();

  const pdfjs = await import(PDFJS + '/legacy/build/pdf.mjs');
  let fallo = false;

  for (const f of formatos) {
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(fs.readFileSync(path.join(dir, f + '.pdf')))
    }).promise;

    const sinPie = [];
    let peor = Infinity;
    let peorPag = 0;
    let peorTexto = '';

    for (let i = 1; i <= doc.numPages; i++) {
      const items = (await doc.getPage(i).then((p) => p.getTextContent())).items.filter((x) => x.str.trim());
      if (!items.length) continue;

      // El pie es el bloque más bajo de la página cuyo texto, leído de abajo
      // hacia arriba por líneas, reconstruye el texto del pie. Se agrupa por
      // línea (misma coordenada vertical) para no confundirlo con el cuerpo.
      const lineas = new Map();
      for (const it of items) {
        const y = Math.round(it.transform[5] * 10) / 10;
        if (!lineas.has(y)) lineas.set(y, []);
        lineas.get(y).push(it);
      }
      const ys = [...lineas.keys()].sort((a, b) => a - b); // de abajo hacia arriba

      let usadas = [];
      let acumulado = '';
      for (const y of ys) {
        const linea = norm(lineas.get(y).map((x) => x.str).join(''));
        const tentativa = norm(linea + ' ' + acumulado);
        if (!textoPie.endsWith(tentativa) && !tentativa.startsWith(textoPie)) break;
        usadas.push(y);
        acumulado = tentativa;
        if (acumulado === textoPie) break;
      }

      if (acumulado !== textoPie) { sinPie.push(i); continue; }

      const pieTop = Math.max(...usadas);
      const cuerpo = items.filter((x) => !usadas.includes(Math.round(x.transform[5] * 10) / 10));
      if (!cuerpo.length) continue;

      const bajo = cuerpo.reduce((a, b) => (a.transform[5] <= b.transform[5] ? a : b));
      const holgura = bajo.transform[5] - pieTop;
      if (holgura < peor) { peor = holgura; peorPag = i; peorTexto = bajo.str.slice(0, 60); }
    }

    console.log(`${f}: ${doc.numPages} páginas · holgura mínima cuerpo→pie ${peor === Infinity ? 'n/d' : peor.toFixed(1) + ' pt'}` +
      (peorPag ? ` (página ${peorPag}: «${peorTexto}»)` : ''));

    if (sinPie.length) {
      console.error(`  ⚠  páginas sin la fecha de vigencia al pie: ${sinPie.join(', ')}`);
      fallo = true;
    }
    if (peor !== Infinity && peor < HOLGURA_MINIMA) {
      console.error(`  ⚠  el cuerpo queda a ${peor.toFixed(1)} pt del pie (mínimo ${HOLGURA_MINIMA}): el pie puede tapar texto.`);
      fallo = true;
    }
  }

  console.log(fallo ? '\nimpresión CON PROBLEMAS.' : '\nimpresión correcta en A4 y carta.');
  process.exit(fallo ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
