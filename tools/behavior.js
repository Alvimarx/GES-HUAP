// Behaviour parity: walk every problema × etapa × contexto in both builds and
// compare the rendered text, plus the plazo calculator output.
// Ruta a Playwright y a Chromium; ajustar si la instalación está en otro lugar.
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH || undefined;
const { chromium } = require(PW);

// La región comparable es la que va desde la barra de pasos hasta la barra
// fija de contacto: en el diseño no existe un contenedor propio para ella.
const TEXT = `(() => {
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll('#doc, script, style').forEach(n => n.remove());
  const all = (clone.textContent || '').split(/[ \\t\\n\\r]+/).join(' ').trim();
  const a = all.indexOf('Paso ');
  const b = all.indexOf('Llamar ges@huap.online');
  return all.slice(a < 0 ? 0 : a, b < 0 ? undefined : b).trim();
})()`;

async function click(page, txt, exact) {
  const ok = await page.evaluate(([t, e]) => {
    const bs = [...document.querySelectorAll('button')];
    const b = e ? bs.find((x) => x.textContent.trim() === t) : bs.find((x) => x.textContent.includes(t));
    if (!b) return false; b.click(); return true;
  }, [txt, !!exact]);
  if (!ok) throw new Error('no button: ' + txt);
  await page.waitForTimeout(120);
}

async function open(browser, url) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  return page;
}

const PROBLEMAS = ['Infarto agudo', 'Diabetes mellitus', 'VIH/SIDA', 'Trastornos de conducción',
  'Colecistectomía preventiva', 'Ayudas técnicas', 'Ataque cerebrovascular', 'Hemorragia subaracnoidea',
  'hernia del núcleo pulposo', 'Politraumatizado', 'Traumatismo cráneo', 'Trauma ocular', 'Gran quemado',
  'agresión sexual'];
const ETAPAS = ['Sospecha', 'Confirmación', 'Hospitalización', 'Alta', 'Seguimiento'];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const A = await open(browser, process.argv[2]);
  const B = await open(browser, process.argv[3]);
  let checked = 0, bad = 0;

  for (const prob of PROBLEMAS) {
    for (const ctx of ['Urgencia', 'Piso / hospitalizado']) {
      for (const et of ETAPAS) {
        for (const p of [A, B]) {
          // Volver al paso 1 sin suponer en qué vista quedó.
          await p.evaluate(() => {
            const b = [...document.querySelectorAll('button')].find((x) => /^‹ /.test(x.textContent.trim()));
            if (b) b.click();
          });
          await p.waitForTimeout(80);
          await p.evaluate(() => {
            const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Cambiar');
            if (b) b.click();
          });
          await p.waitForTimeout(80);
          await click(p, prob);
          await click(p, ctx, true);
          await click(p, et);
        }
        let [ta, tb] = await Promise.all([A.evaluate(TEXT), B.evaluate(TEXT)]);
        ta = ta.split(/\s+/).join(''); tb = tb.split(/\s+/).join('');
        checked++;
        if (ta !== tb) {
          bad++;
          const i = [...ta].findIndex((c, k) => c !== tb[k]);
          console.log(`DIFERENCIA ${prob} / ${ctx} / ${et}\n  A: …${ta.slice(Math.max(0, i - 60), i + 90)}\n  B: …${tb.slice(Math.max(0, i - 60), i + 90)}`);
        }
      }
    }
  }
  console.log(`\nvistas comparadas: ${checked} · ${bad ? bad + ' con diferencias' : 'todas idénticas'}`);

  // Calculadora de plazos: horas y días.
  for (const [prob, et, val, sel] of [
    ['Infarto agudo', 'Sospecha', '08:45', 'input[type=time]'],
    ['Gran quemado', 'Seguimiento', '2026-08-20', 'input[type=date]']
  ]) {
    const outs = [];
    for (const p of [A, B]) {
      await p.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => /^‹ /.test(x.textContent.trim()));
        if (b) b.click();
      });
      await p.waitForTimeout(80);
      await p.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Cambiar');
        if (b) b.click();
      });
      await p.waitForTimeout(80);
      await click(p, prob);
      await click(p, et);
      await p.fill(sel, val);
      await p.waitForTimeout(200);
      outs.push(await p.evaluate(() => {
        const s = [...document.querySelectorAll('span')].filter((x) => x.textContent.trim().startsWith('límite:'));
        return s.map((x) => x.textContent.trim()).join(' | ');
      }));
    }
    console.log(`calculadora ${prob}/${et} (${val}): ${outs[0] === outs[1] ? 'igual' : 'DISTINTO'} → ${JSON.stringify(outs)}`);
  }

  await browser.close();
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
