// Prueba de regresión del buscador: lo ejercita EN EL NAVEGADOR y compara los
// resultados con lo esperado. Existe porque el buscador es el único camino al
// contenido y acumuló tres defectos graves: fallaba sin tildes, no encontraba
// nada con consultas de varias palabras, y siglas como SCA, ITU, IRA o SIC
// devolvían el problema GES equivocado por coincidir dentro de otra palabra.
//
// uso: node tools/search-check.js [url]
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH || undefined;
const { chromium } = require(PW);
const URL = process.argv[2] || 'http://127.0.0.1:8321/mine/index.html';
const CASOS = [
  // [consulta, conjunto esperado (null = no se comprueba), problema que debe ir PRIMERO]
  ['',                        [5,6,18,25,26,36,37,42,44,48,49,50,55,86]],
  // varias palabras
  ['tec grave',               [49]],
  ['diabetes tipo 1',         [6]],
  ['hernia lumbar',           [44]],
  ['infarto miocardio',       [5]],
  ['TEC moderado',            [49]],
  ['gran quemado',            [55]],
  ['gran  quemado',           [55]],
  ['quemado grave',           [55]],
  ['trauma de ojo',           [50]],
  ['VIH SIDA',                [18]],
  ['hernia nucleo pulposo',   [44]],
  ['acv  isquemico',          [37]],
  ['generacion del impulso',  [25]],
  ['dm tipo I',               [6]],
  // siglas que antes devolvían el problema equivocado
  ['FA',                      []],
  ['SCA',                     [5]],
  ['ITU',                     []],
  ['IRA',                     []],
  ['SIC',                     []],
  // regresión: lo que ya funcionaba
  ['AVE',                     [37]],
  ['ACV',                     [37]],
  ['TIA',                     [37]],
  ['craneo',                  [49]],
  ['cráneo',                  [49]],
  ['isquemico',               [37]],
  ['agresion',                [86]],
  ['vesicula',                [26]],
  ['I21',                     [5]],
  ['G45.9',                   [37]],
  ['marcapaso',               [25]],
  ['quemadura',               [55]],
  ['colelitiasis',            [26]],
  ['glasgow',                 [49]],
  ['vascular',                [37]],
  ['zzz',                     []],
  // puntuación pegada, como se copia de una ficha
  ['TEC,',                    null, 49],
  ['¿ACV?',                   [37]],
  ['acv.',                    [37]],
  ['I21.',                    [5]],
  // plurales corrientes
  ['quemaduras',              [55]],
  ['hernias',                 [44]],
  ['traumatismos',            null, 49],
  ['aneurismas',              [42]],
  // ayudas técnicas: el ACV y la HSA también las garantizan (menores de 65)
  ['ayudas tecnicas',         [36,37,42], 36],
  ['silla de ruedas',         [36,37,42]],
  ['baston',                  [36,37,42]],
  // politraumatizado debe aparecer al buscar «trauma»
  ['trauma',                  null, 48],
];
(async () => {
  const b = await chromium.launch({ executablePath: CHROME });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  let mal = 0;
  for (const [q, esp, primero] of CASOS) {
    await p.fill('#buscador', '');
    if (q) await p.fill('#buscador', q);
    await p.waitForTimeout(120);
    const got = await p.evaluate(() =>
      [...document.querySelectorAll('#app [data-a="pick-ps"]')].map(x => +x.getAttribute('data-v')));
    let ok = esp === null || JSON.stringify(got) === JSON.stringify(esp);
    if (ok && primero !== undefined) ok = got[0] === primero;
    if (!ok) mal++;
    console.log((ok ? '  ok  ' : ' FALLA') + '  ' + JSON.stringify(q).padEnd(26) + JSON.stringify(got) +
      (ok ? '' : '   esperado ' + (esp === null ? 'primero ' + primero : JSON.stringify(esp) +
        (primero !== undefined ? ' con ' + primero + ' primero' : ''))));
  }
  console.log('\n' + CASOS.length + ' consultas · ' + (mal ? mal + ' FALLAN' : 'todas correctas'));
  await b.close();
  process.exit(mal ? 1 : 0);
})();
