// Pixel diff between the reference design and the built implementation.
// Ruta a Playwright y a Chromium; ajustar si la instalación está en otro lugar.
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH || undefined;
const { chromium } = require(PW);
const fs = require('fs');
const path = require('path');

const A = process.argv[2], B = process.argv[3], OUT = process.argv[4];
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage();
  const names = fs.readdirSync(A).filter((f) => f.endsWith('.png'));
  const rows = [];
  for (const n of names) {
    if (!fs.existsSync(path.join(B, n))) { rows.push([n, 'FALTA en B']); continue; }
    const res = await page.evaluate(async ([a, b]) => {
      const load = (src) => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
      const px = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0);
        return x.getImageData(0, 0, w, h).data; };
      const da = px(ia), db = px(ib);
      let diff = 0, maxd = 0;
      const out = document.createElement('canvas'); out.width = w; out.height = h;
      const oc = out.getContext('2d'); const od = oc.createImageData(w, h);
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
        if (d > 8) { diff++; maxd = Math.max(maxd, d);
          od.data[i] = 255; od.data[i + 1] = 0; od.data[i + 2] = 0; od.data[i + 3] = 255;
        } else { const g = 255 - (255 - da[i]) * 0.15;
          od.data[i] = g; od.data[i + 1] = g; od.data[i + 2] = g; od.data[i + 3] = 255; }
      }
      oc.putImageData(od, 0, 0);
      return { w, h, wa: ia.width, ha: ia.height, wb: ib.width, hb: ib.height,
        diff, pct: (diff / (w * h) * 100), maxd, png: out.toDataURL('image/png') };
    }, ['data:image/png;base64,' + fs.readFileSync(path.join(A, n)).toString('base64'),
        'data:image/png;base64,' + fs.readFileSync(path.join(B, n)).toString('base64')]);
    if (res.diff) fs.writeFileSync(path.join(OUT, n), Buffer.from(res.png.split(',')[1], 'base64'));
    rows.push([n, `${res.wa}x${res.ha} vs ${res.wb}x${res.hb}`, `${res.diff} px`, `${res.pct.toFixed(3)}%`]);
  }
  console.log(rows.map((r) => r.join('  |  ')).join('\n'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
