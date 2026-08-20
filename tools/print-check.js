// Comprueba la salida impresa: que el pie con la fecha de vigencia aparezca en
// TODAS las páginas y que ningún texto del cuerpo lo pise.
//
// El pie es un elemento `position: fixed`, así que no reserva espacio en el
// flujo: la holgura depende de dónde caigan los saltos de página y puede
// cambiar al editar content/. Por eso esto se vuelve a correr después de
// cualquier cambio de contenido.
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH || undefined;
const PDFJS = process.env.PDFJS_PATH || 'pdfjs-dist';
const { chromium } = require(PW);
const fs = require('fs');
const os = require('os');
const path = require('path');

const URL = process.argv[2];
if (!URL) {
  console.error('uso: node tools/print-check.js <url de dist/index.html>');
  process.exit(2);
}
const MARCAS = /revisado|ges@huap\.online|Unidad GES HUAP|Borrador/;
const HOLGURA_MINIMA = 4; // pt

(async () => {
  const pdfPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ges-')), 'impresion.pdf');
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.pdf({ format: 'A4', printBackground: false, path: pdfPath });
  await browser.close();

  const pdfjs = await import(PDFJS + '/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdfPath)) }).promise;

  let sinPie = [];
  let peor = Infinity;
  let peorPag = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    const items = (await doc.getPage(i).then((p) => p.getTextContent())).items.filter((x) => x.str.trim());
    const pie = items.filter((x) => MARCAS.test(x.str));
    if (!pie.length) { sinPie.push(i); continue; }
    const pieY = Math.max(...pie.map((x) => x.transform[5]));
    const cuerpo = items.filter((x) => x.transform[5] > pieY + 3);
    if (!cuerpo.length) continue;
    const holgura = Math.min(...cuerpo.map((x) => x.transform[5])) - pieY;
    if (holgura < peor) { peor = holgura; peorPag = i; }
  }

  console.log(`páginas A4: ${doc.numPages}`);
  console.log(`holgura mínima entre el cuerpo y el pie: ${peor.toFixed(1)} pt (página ${peorPag})`);
  let mal = false;
  if (sinPie.length) {
    console.error(`⚠  páginas sin la fecha de vigencia al pie: ${sinPie.join(', ')}`);
    mal = true;
  }
  if (peor < HOLGURA_MINIMA) {
    console.error(`⚠  el cuerpo se acerca a menos de ${HOLGURA_MINIMA} pt del pie: ajustar el margen inferior en src/styles.css (@page).`);
    mal = true;
  }
  if (!mal) console.log('impresión correcta.');
  process.exit(mal ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
