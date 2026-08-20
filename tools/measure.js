// Compare geometry element-by-element between the reference design and the build.
// Walks the visible box tree and compares rects of every element that renders text.
// Ruta a Playwright y a Chromium; ajustar si la instalación está en otro lugar.
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH || undefined;
const { chromium } = require(PW);

async function clickText(page, txt) {
  const ok = await page.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(t));
    if (!b) return false; b.click(); return true;
  }, txt);
  if (!ok) throw new Error('no button: ' + txt);
  await page.waitForTimeout(300);
}

// Collect (text, rect) for every leaf-ish element inside the app column.
const COLLECT = `(() => {
  const out = [];
  const skip = new Set(['SCRIPT', 'STYLE', 'HEAD']);
  const walk = (el) => {
    for (const c of el.children) {
      if (skip.has(c.tagName) || c.id === 'doc') continue;
      const r = c.getBoundingClientRect();
      const own = [...c.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('');
      // Solo las cajas con estilo en línea: son las del diseño y existen igual
      // en ambos árboles. El runtime del editor envuelve además cada texto
      // interpolado en un <span> propio, que aquí no interesa.
      if (c.hasAttribute('style') && r.width && r.height) {
        const label = (c.textContent || '').split(/[ \\t\\n\\r]+/).join(' ').trim().slice(0, 40);
        out.push({ t: label, x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
      }
      walk(c);
    }
  };
  walk(document.body);
  // Orden de lectura: comparable entre dos árboles con envoltorios distintos.
  out.sort((a, b) => a.y - b.y || a.x - b.x || (a.t < b.t ? -1 : 1));
  return out;
})()`;

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const steps = [
    ['1-problema', []],
    ['2-etapa', ['Ataque cerebrovascular']],
    ['3-acciones', ['Ataque cerebrovascular', 'Confirmación']],
    ['5-seguimiento', ['Gran quemado', 'Seguimiento']]
  ];
  for (const [name, clicks] of steps) {
    const res = [];
    for (const url of [process.argv[2], process.argv[3]]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      for (const c of clicks) await clickText(page, c);
      res.push(await page.evaluate(COLLECT));
      await page.close();
    }
    const [a, b] = res;
    let bad = 0;
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const x = a[i], y = b[i];
      if (!x || !y) { console.log(`  [${name}] falta #${i}`, x || y); bad++; continue; }
      if (x.t !== y.t) { console.log(`  [${name}] texto #${i}: ${JSON.stringify(x.t)} vs ${JSON.stringify(y.t)}`); bad++; continue; }
      for (const k of ['x', 'y', 'w', 'h']) {
        if (Math.abs(x[k] - y[k]) > 0.01) { console.log(`  [${name}] ${k} de ${JSON.stringify(x.t)}: ${x[k]} vs ${y[k]}`); bad++; }
      }
    }
    console.log(`${name}: ${a.length} nodos con texto · ${bad ? bad + ' DIFERENCIAS' : 'geometría idéntica'}`);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
