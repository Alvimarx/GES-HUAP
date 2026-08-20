// Screenshot harness: walks the 3 views of the guided route and captures each.
// Ruta a Playwright y a Chromium; ajustar si la instalación está en otro lugar.
const PW = process.env.PLAYWRIGHT_PATH || 'playwright';
const CHROME = process.env.CHROME_PATH || undefined;
const { chromium } = require(PW);

const url = process.argv[2];
const outDir = process.argv[3];
const fs = require('fs');
fs.mkdirSync(outDir, { recursive: true });

// Click a button whose text contains `txt`.
async function clickText(page, txt) {
  const ok = await page.evaluate((t) => {
    const btns = [...document.querySelectorAll('button')];
    const b = btns.find((x) => x.textContent.includes(t));
    if (!b) return false;
    b.click();
    return true;
  }, txt);
  if (!ok) throw new Error('no button with text: ' + txt);
  await page.waitForTimeout(350);
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  for (const [name, vp] of [['m', { width: 390, height: 844 }], ['d', { width: 1280, height: 900 }]]) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 2 });
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    // El distintivo «Notificar ahora» parpadea: sin congelar las animaciones,
    // dos capturas del MISMO documento caen en fases distintas y el comparador
    // marca diferencias que no existen.
    await page.addStyleTag({
      content: '*,*::before,*::after{animation:none !important;transition:none !important}'
    });
    await page.waitForTimeout(120);
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);

    await page.screenshot({ path: `${outDir}/${name}-1-problema.png`, fullPage: true });

    // View 2: pick ACV isquémico (has the most plazos and extras)
    await clickText(page, 'Ataque cerebrovascular');
    await page.screenshot({ path: `${outDir}/${name}-2-etapa.png`, fullPage: true });

    // View 3: Confirmación (badge + casos auto-open)
    await clickText(page, 'Confirmación');
    await page.screenshot({ path: `${outDir}/${name}-3-acciones.png`, fullPage: true });

    // Expand NTMA panel
    await clickText(page, 'Criterios NTMA');
    await page.screenshot({ path: `${outDir}/${name}-4-ntma.png`, fullPage: true });

    // Seguimiento stage of the same problem (post-alta plazos + corrections)
    await clickText(page, '‹ ACV isquémico');
    await clickText(page, 'Seguimiento');
    await page.screenshot({ path: `${outDir}/${name}-5-seguimiento.png`, fullPage: true });

    // Gran quemado seguimiento: the two corrected plazos
    await clickText(page, '‹ ACV isquémico');
    await clickText(page, 'Cambiar');
    await clickText(page, 'Gran quemado');
    await clickText(page, 'Seguimiento');
    await page.screenshot({ path: `${outDir}/${name}-6-quemado.png`, fullPage: true });

    if (errs.length) console.log(`[${name}] console errors:`, errs.slice(0, 8));
    await page.close();
  }
  await browser.close();
  console.log('done ->', outDir);
})().catch((e) => { console.error(e); process.exit(1); });
