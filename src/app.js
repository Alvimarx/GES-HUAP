/* Ruta guiada GES — HUAP.
 *
 * Mejora progresiva: el documento completo (#doc) ya está en el HTML y es lo
 * que se ve sin JavaScript y lo que sale al imprimir. Este archivo agrega
 * encima la ruta guiada de 3 pasos (#app) del diseño aprobado.
 *
 * El marcado que se genera aquí reproduce el del diseño: los estilos van en
 * línea, con los mismos valores, porque la página no tiene reset global y
 * cualquier cambio de caja altera el resultado. Al tocar este archivo,
 * comparar contra el diseño con las herramientas de tools/ (ver tools/README.md).
 */
(function () {
  'use strict';

  var dataEl = document.getElementById('ges-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var app = document.getElementById('app');
  if (!app) return;

  // ---------------------------------------------------------------- utilidades
  // Los equipos de box no siempre tienen navegador actualizado: el resto del
  // archivo es ES5 y `closest` es lo único que faltaría en los más antiguos.
  function closest(el, sel) {
    if (el && el.closest) return el.closest(sel);
    var m = Element.prototype.matches || Element.prototype.msMatchesSelector;
    while (el && el.nodeType === 1) {
      if (m && m.call(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  // Un médico apurado escribe «craneo», no «cráneo»: sin esto el buscador
  // respondía «Sin coincidencias en los 14 problemas GES», que se lee como
  // «no es GES». Se comparan ambos lados sin diacríticos.
  function plano(s) {
    s = String(s == null ? '' : s).toLowerCase();
    return s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
  }

  // Separa en palabras y quita la puntuación pegada: sin esto «TEC,» o «¿ACV?»
  // —cómo se escribe de verdad al copiar de una ficha— daban cero resultados.
  // Se conservan el punto y el guion interiores, que forman parte de los
  // códigos CIE-10 (G45.9, T07.X, R00.1).
  function partir(s) {
    var bruto = plano(s).split(/[^0-9a-z.\-]+/);
    var out = [];
    for (var i = 0; i < bruto.length; i++) {
      var w = bruto[i].replace(/^[.\-]+/, '').replace(/[.\-]+$/, '');
      if (w) out.push(w);
    }
    return out;
  }

  // Palabras vacías: «trauma de ojo» debe encontrar el trauma ocular.
  var VACIAS = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'en', 'con', 'por', 'un', 'una', 'al'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Las marcas de verificación son de la sesión, no del navegador: en un equipo
  // compartido de box, una lista que aparece pre-marcada para el paciente
  // siguiente es exactamente el error que esta página existe para evitar.
  var STORE_KEY = 'gesChecksA';
  function loadChecks() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveChecks(c) {
    S.checks = c;
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(c)); } catch (e) { /* modo privado */ }
  }

  // ---------------------------------------------------------------- estado
  var S = {
    view: 'problema', q: '', ps: null, etapa: null, ctx: 'urgencia',
    checks: loadChecks(), calc: {}, showCasos: false, showNtma: false
  };

  function fmtPlazo(z) {
    return z.u === 'ya' ? 'Inmediata'
      : z.u === 'min' ? z.n + ' min'
      : z.u === 'h' ? z.n + ' h'
      : z.n + ' días';
  }

  function calcOut(z, val) {
    if (!val) return '';
    if (z.u === 'min' || z.u === 'h') {
      var p = val.split(':');
      if (p.length < 2) return '';
      var tot = (+p[0]) * 60 + (+p[1]) + z.n * (z.u === 'h' ? 60 : 1);
      var dd = Math.floor(tot / 1440);
      tot %= 1440;
      var pad = function (x) { return (x < 10 ? '0' : '') + x; };
      return pad(Math.floor(tot / 60)) + ':' + pad(tot % 60) + (dd ? ' (+' + dd + (dd > 1 ? ' días)' : ' día)') : '');
    }
    var d = new Date(val + 'T12:00:00');
    if (isNaN(d)) return '';
    d.setDate(d.getDate() + z.n);
    var ds = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    var ms = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return ds[d.getDay()] + ' ' + d.getDate() + ' ' + ms[d.getMonth()];
  }

  function problema() { return S.ps == null ? null : D.problemas.filter(function (p) { return p.ps === S.ps; })[0]; }
  function etapaIdx() { var i = -1; D.etapas.forEach(function (e, k) { if (e.id === S.etapa) i = k; }); return i; }

  function accionesDe(sel) {
    var comunes = (D.acciones_comunes[S.etapa] || []).filter(function (a) { return !a.ctx || a.ctx === S.ctx; });
    var extras = (sel.extras && sel.extras[S.etapa]) || [];
    return extras.concat(comunes).map(function (a) {
      var k = sel.ps + '.' + S.etapa + '.' + a.t;
      return { k: k, t: a.t, d: a.d, done: !!S.checks[k] };
    });
  }

  // ---------------------------------------------------------------- estilos
  var ST = {
    step: 'display:flex;align-items:center;gap:8px;padding:14px 20px 4px;font-size:12px;font-weight:800;color:#5A6B8C',
    stepPill: 'background:#0C2B5E;color:#fff;border-radius:999px;padding:2px 10px',
    pad: 'padding:10px 16px 0',
    h2: 'font-size:19px;font-weight:900;margin:6px 4px 10px',
    input: 'width:100%;box-sizing:border-box;padding:14px 18px;border-radius:999px;border:2px solid #C6D6EC;background:#fff;font-size:15px;font-weight:600;color:#0C2B5E;outline-color:#0D5BD8',
    list: 'display:flex;flex-direction:column;gap:8px;margin-top:12px',
    psBtn: 'display:flex;align-items:center;gap:12px;text-align:left;background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;padding:12px 14px;cursor:pointer;font-family:inherit;min-height:56px',
    cie: 'flex:none;background:#C9F2E3;color:#0C2B5E;font-weight:900;font-size:13px;padding:6px 10px;border-radius:999px;letter-spacing:.02em',
    psName: 'flex:1;font-size:14.5px;font-weight:700;color:#0C2B5E;line-height:1.25',
    tiempo: 'flex:none;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#B31D52;background:#FCE3EA;padding:3px 8px;border-radius:999px',
    caret: 'flex:none;color:#8FA6C6;font-weight:900',
    vacio: 'margin-top:10px;background:#fff;border:1.5px dashed #C6D6EC;border-radius:16px;padding:16px;font-size:14px;font-weight:600;color:#5A6B8C',
    aviso: 'margin-top:16px;background:#0C2B5E;color:#fff;border-radius:18px;padding:16px 18px',
    avisoT: 'font-size:15px;font-weight:900;margin-bottom:4px',
    avisoD: 'font-size:13px;font-weight:600;line-height:1.5;opacity:.92',
    selBar: 'display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;padding:12px 14px',
    selCie: 'background:#C9F2E3;color:#0C2B5E;font-weight:900;font-size:12px;padding:5px 10px;border-radius:999px',
    selName: 'flex:1;font-size:14px;font-weight:800',
    cambiar: 'background:none;border:none;color:#0D5BD8;font-weight:800;font-size:12.5px;cursor:pointer;font-family:inherit;padding:4px',
    label: 'margin:16px 4px 8px;font-size:13px;font-weight:800;color:#5A6B8C',
    row: 'display:flex;gap:8px',
    h2b: 'margin:18px 4px 8px;font-size:19px;font-weight:900',
    col: 'display:flex;flex-direction:column;gap:8px',
    etBtn: 'display:flex;align-items:center;gap:12px;text-align:left;background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;padding:14px;cursor:pointer;font-family:inherit;min-height:60px',
    etNum: 'flex:none;width:30px;height:30px;border-radius:999px;background:#EDF2F9;color:#0C2B5E;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center',
    etName: 'display:flex;align-items:center;gap:8px;font-size:15px;font-weight:900;color:#0C2B5E',
    etBadge: 'font-size:10px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;background:#D02E63;color:#fff;padding:3px 8px;border-radius:999px;animation:pulseA 2s infinite',
    etDesc: 'display:block;font-size:12.5px;font-weight:600;color:#5A6B8C;margin-top:2px',
    crumbs: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap',
    back: 'background:#fff;border:1.5px solid #D9E5F3;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:800;color:#0D5BD8;cursor:pointer;font-family:inherit',
    chipEt: 'background:#C9F2E3;color:#0C2B5E;font-weight:900;font-size:12px;padding:6px 12px;border-radius:999px',
    chipCtx: 'background:#EDF2F9;border:1.5px solid #D9E5F3;color:#5A6B8C;font-weight:800;font-size:12px;padding:6px 12px;border-radius:999px',
    accHead: 'margin:16px 4px 8px;display:flex;align-items:baseline;justify-content:space-between',
    accTitle: 'font-size:19px;font-weight:900',
    accCount: 'font-size:12px;font-weight:800;color:#5A6B8C',
    accT: 'display:block;font-size:14.5px;font-weight:800;line-height:1.3;color:#0C2B5E',
    accD: 'display:block;font-size:12.5px;font-weight:600;color:#5A6B8C;line-height:1.45;margin-top:3px',
    plazosT: 'margin:20px 4px 8px;font-size:16px;font-weight:900',
    plazoCard: 'background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;padding:14px',
    plazoRow: 'display:flex;align-items:center;gap:12px',
    plazoHito: 'display:block;font-size:14px;font-weight:800;line-height:1.3',
    plazoDesde: 'display:block;font-size:12px;font-weight:600;color:#5A6B8C;margin-top:2px',
    plazoNota: 'margin-top:8px;font-size:12px;font-weight:600;color:#5A6B8C;background:#EDF2F9;border-radius:10px;padding:8px 10px',
    plazoCorr: 'margin-top:8px;font-size:12px;font-weight:700;color:#8A1E44;background:#FCE3EA;border-radius:10px;padding:8px 10px',
    calcBox: 'margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px dashed #D9E5F3;padding-top:10px',
    calcLabel: 'font-size:12px;font-weight:700;color:#5A6B8C',
    calcInput: 'border:1.5px solid #C6D6EC;border-radius:10px;padding:6px 10px;font-size:13px;font-weight:700;color:#0C2B5E',
    calcOut: 'font-size:13px;font-weight:900;color:#fff;background:#0C2B5E;padding:5px 12px;border-radius:999px',
    nota: 'margin:8px 4px 0;font-size:11px;font-weight:600;color:#8FA6C6',
    postNota: 'margin-top:10px;background:#EDF2F9;border:1.5px solid #D9E5F3;border-radius:14px;padding:12px 14px;font-size:13px;font-weight:700;color:#5A6B8C',
    panel: 'margin-top:18px;background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;overflow:hidden',
    panel2: 'margin-top:10px;background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;overflow:hidden',
    panelBtn: 'width:100%;display:flex;justify-content:space-between;align-items:center;background:none;border:none;padding:14px 16px;cursor:pointer;font-family:inherit;font-size:14.5px;font-weight:900;color:#0C2B5E',
    panelBody: 'padding:0 16px 14px;display:flex;flex-direction:column;gap:8px',
    caso: 'border-left:3px solid #C9F2E3;padding:2px 0 2px 12px',
    casoSi: 'font-size:13px;font-weight:800',
    casoEnt: 'font-size:12.5px;font-weight:600;color:#5A6B8C;line-height:1.45;margin-top:2px',
    ntmaTxt: 'font-size:12.5px;font-weight:600;color:#3D5378;line-height:1.5;border-left:3px solid #D9E5F3;padding-left:12px',
    ntmaWarn: 'font-size:11px;font-weight:700;color:#8A1E44;background:#FCE3EA;border-radius:10px;padding:8px 10px',
    fuente: 'margin:14px 4px 0;font-size:11px;font-weight:600;color:#8FA6C6',
    nav: 'display:flex;gap:8px;margin-top:16px',
    navBack: 'flex:1;background:#fff;border:1.5px solid #C6D6EC;border-radius:999px;padding:14px;font-size:14px;font-weight:800;color:#0D5BD8;cursor:pointer;font-family:inherit',
    navNext: 'flex:2;background:#0D5BD8;border:none;border-radius:999px;padding:14px;font-size:14px;font-weight:900;color:#fff;cursor:pointer;font-family:inherit'
  };

  function ctxBtn(on) {
    return 'flex:1;padding:11px;border-radius:999px;font-family:inherit;font-size:13.5px;font-weight:900;cursor:pointer;' +
      (on ? 'background:#0C2B5E;color:#fff;border:1.5px solid #0C2B5E'
          : 'background:#fff;color:#5A6B8C;border:1.5px solid #C6D6EC');
  }
  function accRow(done) {
    return 'display:flex;align-items:flex-start;gap:12px;text-align:left;width:100%;border-radius:16px;padding:13px 14px;cursor:pointer;font-family:inherit;' +
      (done ? 'background:#F2FBF7;border:1.5px solid #9FE8CC;opacity:.75' : 'background:#fff;border:1.5px solid #D9E5F3');
  }
  function accBox(done) {
    return 'flex:none;width:26px;height:26px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-top:1px;' +
      (done ? 'background:#9FE8CC;border:2px solid #9FE8CC' : 'background:#fff;border:2px solid #C6D6EC');
  }
  function chipPlazo(critico) {
    return 'flex:none;font-size:15px;font-weight:900;padding:9px 14px;border-radius:12px;white-space:nowrap;' +
      (critico ? 'background:#D02E63;color:#fff' : 'background:#0C2B5E;color:#fff');
  }

  var TICK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0C2B5E" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 13l4 4L19 7"></path></svg>';

  // ---------------------------------------------------------------- vistas
  function viewProblema() {
    var q = plano(S.q.trim());
    // Se busca en la etiqueta, en la denominación del decreto —«generación del
    // impulso» debe encontrar el PS 25—, en los códigos y en los sinónimos.
    var lista;
    if (!q) {
      lista = D.problemas;
    } else {
      var idx = D.problemas.map(function (p) {
        var txt = plano([p.nombre, p.corto, p.denominacionOficial || '']
          .concat(p.cie).concat(p.sinonimos || []).join(' · '));
        return { p: p, txt: txt, palabras: partir(txt) };
      });
      // La consulta se parte en palabras y deben estar TODAS. Sin esto,
      // «tec grave», «diabetes tipo 1» o «hernia lumbar» no encontraban nada:
      // el índice es una sola cadena y se exigía coincidencia contigua.
      var crudos = partir(q);
      var toks = [];
      var i;
      for (i = 0; i < crudos.length; i++) {
        if (VACIAS.indexOf(crudos[i]) < 0) toks.push(crudos[i]);
      }
      if (!toks.length) toks = crudos;

      // Una palabra del índice coincide con lo escrito si empieza por ello
      // —«cere» encuentra «cerebrovascular»— o si lo escrito empieza por ella,
      // que es lo que rescata los plurales: «quemaduras» contra «quemadura».
      // Calidad de la coincidencia de una palabra del índice con lo escrito:
      // 3 palabra idéntica · 2 la palabra empieza por lo escrito · 1 lo escrito
      // empieza por la palabra (plurales) · 0 no coincide. Se usa para ordenar,
      // nunca para descartar: buscar «tec» debe poner el TEC primero, no
      // esconder las ayudas técnicas.
      var calidad = function (w, t) {
        if (w === t) return 3;
        if (w.indexOf(t) === 0) return 2;
        if (w.length >= 4 && t.indexOf(w) === 0) return 1;
        return 0;
      };
      var mejor = function (x, t) {
        var top = 0, largo = 0;
        for (var k = 0; k < x.palabras.length; k++) {
          var c = calidad(x.palabras[k], t);
          if (c > top || (c === top && c > 0 && x.palabras[k].length > largo)) {
            if (c >= top) { top = c; largo = x.palabras[k].length; }
          }
        }
        return top ? top * 100 + Math.min(largo, 99) : 0;
      };
      var empieza = function (x, t) { return mejor(x, t) > 0; };
      var todos = function (x, fn) {
        for (var k = 0; k < toks.length; k++) { if (!fn(x, toks[k])) return false; }
        return true;
      };

      var alInicio = idx.filter(function (x) { return todos(x, empieza); });

      // El respaldo de coincidencia libre solo aplica a palabras de 4 letras o
      // más. «SIC», «ITU», «IRA» y «SCA» coincidían dentro de ve-sic-ula,
      // melli-tu-s, antirretrov-ira-l y re-sca-te, y devolvían el problema
      // equivocado: con «SCA» ni siquiera aparecía el infarto, que es el que
      // corresponde. Vale más «Sin coincidencias» —que va acompañado del aviso
      // «¿No está en la lista?» con el teléfono de la unidad— que una tarjeta
      // que no corresponde y que abre los plazos de otro problema.
      var hayCortos = false;
      for (i = 0; i < toks.length; i++) { if (toks[i].length < 4) hayCortos = true; }
      var enCualquiera = hayCortos ? [] : idx.filter(function (x) {
        return todos(x, function (y, t) { return y.txt.indexOf(t) >= 0; });
      });

      var elegidos = alInicio.length ? alInicio : enCualquiera;
      if (alInicio.length && toks.length) {
        // Orden estable: mejor coincidencia primero, y a igual puntaje se
        // conserva el orden del decreto.
        var conPuntaje = elegidos.map(function (x, n) {
          var pts = 0;
          for (var k = 0; k < toks.length; k++) { pts += mejor(x, toks[k]); }
          return { x: x, pts: pts, n: n };
        });
        conPuntaje.sort(function (a, b) { return b.pts - a.pts || a.n - b.n; });
        elegidos = conPuntaje.map(function (c) { return c.x; });
      }
      lista = elegidos.map(function (x) { return x.p; });
    }
    var items = lista.map(function (p) {
      return '<button type="button" class="card-int" data-k="ps-' + p.ps + '" data-a="pick-ps" data-v="' + p.ps + '" style="' + ST.psBtn + '">' +
        '<span style="' + ST.cie + '">' + esc(p.cie.join(' · ')) + '</span>' +
        '<span class="flex-min" style="' + ST.psName + '">' + esc(p.nombre) + '</span>' +
        (p.tiempo ? '<span style="' + ST.tiempo + '">min / horas</span>' : '') +
        '<span style="' + ST.caret + '" aria-hidden="true">›</span>' +
        '</button>';
    }).join('');

    return '<div style="' + ST.pad + '">' +
      '<h2 style="' + ST.h2 + '" id="paso-titulo" tabindex="-1">¿Sospecha una de estas patologías?</h2>' +
      '<label class="sr-only" for="buscador">Buscar problema de salud por nombre o código CIE-10</label>' +
      '<input id="buscador" data-k="q" data-a="q" autocomplete="off" value="' + esc(S.q) + '" placeholder="Buscar por nombre o código CIE-10…" style="' + ST.input + '">' +
      '<div style="' + ST.list + '">' + items + '</div>' +
      (lista.length === 0
        ? '<div style="' + ST.vacio + '">Sin coincidencias en los 14 problemas GES del HUAP.</div>' : '') +
      '<div style="' + ST.aviso + '">' +
        '<div style="' + ST.avisoT + '">¿No está en la lista?</div>' +
        '<div style="' + ST.avisoD + '">HUAP confirma y trata estos 14 problemas GES. Ante cualquier duda, llame a la Unidad GES: anexos ' +
          esc(D.contacto.anexos) + ' · <a href="mailto:' + esc(D.contacto.correo) + '" style="color:#9FE8CC;font-weight:800">' + esc(D.contacto.correo) + '</a></div>' +
      '</div>' +
      '</div>';
  }

  function viewEtapa() {
    var sel = problema();
    var items = D.etapas.map(function (e, i) {
      return '<button type="button" class="card-int" data-k="et-' + e.id + '" data-a="pick-etapa" data-v="' + e.id + '" style="' + ST.etBtn + '">' +
        '<span style="' + ST.etNum + '" aria-hidden="true">' + (i + 1) + '</span>' +
        '<span class="flex-min" style="flex:1">' +
          '<span style="' + ST.etName + '">' + esc(e.nombre) +
            (e.badge ? '<span style="' + ST.etBadge + '">' + esc(e.badge) + '</span>' : '') +
          '</span>' +
          '<span style="' + ST.etDesc + '">' + esc(e.desc) + '</span>' +
        '</span>' +
        '<span style="' + ST.caret + '" aria-hidden="true">›</span>' +
        '</button>';
    }).join('');

    return '<div style="' + ST.pad + '">' +
      '<div style="' + ST.selBar + '">' +
        '<span style="' + ST.selCie + '">' + esc(sel.cie.join(' · ')) + '</span>' +
        '<span class="flex-min" style="' + ST.selName + '">' + esc(sel.nombre) + '</span>' +
        '<button type="button" data-k="cambiar" data-a="volver-problema" style="' + ST.cambiar + '">Cambiar</button>' +
      '</div>' +
      '<div style="' + ST.label + '" id="ctx-label">¿Dónde atiende al paciente?</div>' +
      '<div style="' + ST.row + '" role="group" aria-labelledby="ctx-label">' +
        '<button type="button" data-k="ctx-u" data-a="ctx" data-v="urgencia" aria-pressed="' + (S.ctx === 'urgencia') + '" style="' + ctxBtn(S.ctx === 'urgencia') + '">Urgencia</button>' +
        '<button type="button" data-k="ctx-p" data-a="ctx" data-v="piso" aria-pressed="' + (S.ctx === 'piso') + '" style="' + ctxBtn(S.ctx === 'piso') + '">Piso / hospitalizado</button>' +
      '</div>' +
      '<h2 style="' + ST.h2b + '" id="paso-titulo" tabindex="-1">¿En qué punto está el paciente?</h2>' +
      '<div style="' + ST.col + '">' + items + '</div>' +
      '</div>';
  }

  function viewAcciones() {
    var sel = problema();
    var idx = etapaIdx();
    var next = idx >= 0 && idx < D.etapas.length - 1 ? D.etapas[idx + 1] : null;

    var accs = accionesDe(sel);
    var accHtml = accs.map(function (a) {
      return '<button type="button" data-k="acc-' + esc(a.k) + '" data-a="toggle" data-v="' + esc(a.k) + '" aria-pressed="' + a.done + '" style="' + accRow(a.done) + '">' +
        '<span style="' + accBox(a.done) + '" aria-hidden="true">' + (a.done ? TICK : '') + '</span>' +
        '<span class="flex-min" style="flex:1">' +
          '<span style="' + ST.accT + '">' + esc(a.t) + '</span>' +
          '<span style="' + ST.accD + '">' + esc(a.d) + '</span>' +
        '</span>' +
        '</button>';
    }).join('');

    var plazos = sel.plazos.filter(function (z) { return z.etapa === S.etapa; });
    var plazosHtml = plazos.map(function (z) {
      var val = S.calc[z.id] || '';
      var type = z.u === 'ya' ? false : (z.u === 'd' ? 'date' : 'time');
      var desdeCorto = z.desde.replace(/\s*\(.*\)/, '');
      var out = calcOut(z, val);
      return '<div style="' + ST.plazoCard + '">' +
        '<div style="' + ST.plazoRow + '">' +
          '<span style="' + chipPlazo(z.critico) + '">' + esc(fmtPlazo(z)) + '</span>' +
          '<span class="flex-min" style="flex:1">' +
            '<span style="' + ST.plazoHito + '">' + esc(z.hito) + '</span>' +
            '<span style="' + ST.plazoDesde + '">desde ' + esc(z.desde) + '</span>' +
          '</span>' +
        '</div>' +
        (z.nota ? '<div style="' + ST.plazoNota + '">' + esc(z.nota) + '</div>' : '') +
        (z.corregido ? '<div style="' + ST.plazoCorr + '">Corrección al afiche: ' + esc(z.corregido) + '</div>' : '') +
        (type
          ? '<div style="' + ST.calcBox + '">' +
              '<label style="' + ST.calcLabel + '" for="calc-' + esc(z.id) + '">' +
                (type === 'time' ? '¿Cuándo fue ' + esc(desdeCorto) + '?' : '¿Qué día fue ' + esc(desdeCorto) + '?') + '</label>' +
              '<input id="calc-' + esc(z.id) + '" data-k="calc-' + esc(z.id) + '" data-a="calc" data-v="' + esc(z.id) + '" type="' + type + '" value="' + esc(val) + '" style="' + ST.calcInput + '">' +
              (out ? '<span style="' + ST.calcOut + '" role="status">límite: ' + esc(out) + '</span>' : '') +
            '</div>'
          : '') +
        '</div>';
    }).join('');

    var postNota = '';
    if (S.etapa === 'seguimiento') {
      if (sel.postNota) postNota = sel.postNota;
      else if (plazos.length === 0) postNota = D.notaSinGarantiaPostAlta || '';
    }

    var casosHtml = D.casos.map(function (c) {
      return '<div style="' + ST.caso + '">' +
        '<div style="' + ST.casoSi + '">' + esc(c.si) + '</div>' +
        '<div style="' + ST.casoEnt + '">' + esc(c.entonces) + '</div>' +
        '</div>';
    }).join('');

    var ntmaHtml = (sel.ntma || []).map(function (t) {
      return '<div style="' + ST.ntmaTxt + '">' + esc(t) + '</div>';
    }).join('');

    return '<div style="' + ST.pad + '">' +
      '<div style="' + ST.crumbs + '">' +
        '<button type="button" data-k="back-et" data-a="volver-etapa" style="' + ST.back + '">‹ ' + esc(sel.corto) + '</button>' +
        '<span style="' + ST.chipEt + '">' + esc(idx >= 0 ? D.etapas[idx].nombre : '') + '</span>' +
        '<span style="' + ST.chipCtx + '">' + (S.ctx === 'urgencia' ? 'Urgencia' : 'Piso') + '</span>' +
      '</div>' +

      '<div style="' + ST.accHead + '">' +
        '<h2 style="' + ST.accTitle + '" id="paso-titulo" tabindex="-1">Haga esto ahora</h2>' +
        '<div style="' + ST.accCount + '">' + accs.filter(function (a) { return a.done; }).length + ' de ' + accs.length + ' listas</div>' +
      '</div>' +
      '<div style="' + ST.col + '">' + accHtml + '</div>' +

      (plazos.length
        ? '<h2 style="' + ST.plazosT + '">Plazos que corren</h2>' +
          '<div style="' + ST.col + '">' + plazosHtml + '</div>' +
          '<div style="' + ST.nota + '">Cálculo referencial — no se guarda ningún dato del paciente.</div>'
        : '') +
      (postNota ? '<div style="' + ST.postNota + '">' + esc(postNota) + '</div>' : '') +

      '<div style="' + ST.panel + '">' +
        // `aria-controls` solo cuando el panel existe: plegado se quita del DOM.
        '<button type="button" data-k="t-casos" data-a="toggle-casos" aria-expanded="' + S.showCasos + '"' + (S.showCasos ? ' aria-controls="panel-casos"' : '') + ' style="' + ST.panelBtn + '">Casos especiales — si… entonces… <span style="color:#0D5BD8" aria-hidden="true">' + (S.showCasos ? '−' : '+') + '</span></button>' +
        (S.showCasos ? '<div id="panel-casos" style="' + ST.panelBody + '">' + casosHtml + '</div>' : '') +
      '</div>' +

      '<div style="' + ST.panel2 + '">' +
        '<button type="button" data-k="t-ntma" data-a="toggle-ntma" aria-expanded="' + S.showNtma + '"' + (S.showNtma ? ' aria-controls="panel-ntma"' : '') + ' style="' + ST.panelBtn + '">Criterios NTMA de este problema <span style="color:#0D5BD8" aria-hidden="true">' + (S.showNtma ? '−' : '+') + '</span></button>' +
        (S.showNtma
          ? '<div id="panel-ntma" style="' + ST.panelBody + '">' + ntmaHtml +
            '<div style="' + ST.ntmaWarn + '">Transcripción de la NTMA pendiente de validación por la Unidad GES.</div></div>'
          : '') +
      '</div>' +

      '<div style="' + ST.fuente + '">Fuente: ' + esc(sel.fuente) + '</div>' +

      '<div style="' + ST.nav + '">' +
        '<button type="button" data-k="nav-back" data-a="volver-etapa" style="' + ST.navBack + '">‹ Momento</button>' +
        (next ? '<button type="button" class="btn-primary" data-k="nav-next" data-a="siguiente" style="' + ST.navNext + '">' + esc(next.nombre) + ' ›</button>' : '') +
      '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------- render
  function render() {
    var num = S.view === 'problema' ? '1' : S.view === 'etapa' ? '2' : '3';
    var titulo = S.view === 'problema' ? 'Problema de salud' : S.view === 'etapa' ? 'Momento del paciente' : 'Sus acciones';

    // Se conserva el foco del teclado: sin esto, cada pulsación en el buscador
    // o cada marca de la lista devolvería el foco al inicio de la página.
    var act = document.activeElement;
    var fk = act && act.getAttribute ? act.getAttribute('data-k') : null;
    var selStart = null, selEnd = null;
    if (fk && act.tagName === 'INPUT' && act.type === 'text') {
      try { selStart = act.selectionStart; selEnd = act.selectionEnd; } catch (e) { /* time/date no lo permiten */ }
    }

    app.innerHTML =
      '<div style="' + ST.step + '">' +
        '<span style="' + ST.stepPill + '">Paso ' + num + ' de 3</span>' +
        '<span>' + esc(titulo) + '</span>' +
      '</div>' +
      (S.view === 'problema' ? viewProblema() : S.view === 'etapa' ? viewEtapa() : viewAcciones());

    if (fk) {
      var back = app.querySelector('[data-k="' + (window.CSS && CSS.escape ? CSS.escape(fk) : fk.replace(/"/g, '\\"')) + '"]');
      if (back) {
        back.focus({ preventScroll: true });
        if (selStart != null) { try { back.setSelectionRange(selStart, selEnd); } catch (e) { /* ignorar */ } }
      }
    }
  }

  // Anuncia un cambio de estado a los lectores de pantalla. La región vive
  // fuera de #app para que sobreviva al re-dibujado.
  var anuncioEl = document.getElementById('anuncio');
  function anunciar(msg) {
    if (anuncioEl) anuncioEl.textContent = msg;
  }

  // Al cambiar de paso, el foco va al título: quien navega con teclado o lector
  // de pantalla queda en el contenido nuevo, no al inicio de la página.
  function goto(view) {
    S.view = view;
    render();
    var h = document.getElementById('paso-titulo');
    if (h) h.focus({ preventScroll: true });
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
  }

  // ---------------------------------------------------------------- eventos
  app.addEventListener('click', function (ev) {
    var el = closest(ev.target, "[data-a]");
    if (!el) return;
    var a = el.getAttribute('data-a');
    var v = el.getAttribute('data-v');

    if (a === 'pick-ps') {
      var ps = +v;
      // Otro problema es, en la práctica, otro paciente: la lista parte limpia.
      // En la primera selección no hay paciente anterior, así que se conserva
      // lo que sobreviva en sessionStorage a una recarga.
      if (S.ps !== null && S.ps !== ps) { saveChecks({}); S.calc = {}; }
      S.ps = ps;
      goto('etapa');
    } else if (a === 'volver-problema') {
      S.etapa = null;
      goto('problema');
    } else if (a === 'volver-etapa') {
      goto('etapa');
    } else if (a === 'ctx') {
      S.ctx = v;
      render();
    } else if (a === 'pick-etapa') {
      S.etapa = v;
      S.showCasos = v === 'confirmacion';
      S.showNtma = false;
      goto('acciones');
    } else if (a === 'siguiente') {
      var i = etapaIdx();
      var next = i >= 0 && i < D.etapas.length - 1 ? D.etapas[i + 1] : null;
      if (next) {
        S.etapa = next.id;
        S.showCasos = next.id === 'confirmacion';
        goto('acciones');
      }
    } else if (a === 'toggle') {
      var c = {};
      Object.keys(S.checks).forEach(function (k) { c[k] = S.checks[k]; });
      c[v] = !c[v];
      saveChecks(c);
      render();
      var sel = problema();
      if (sel) {
        var accs = accionesDe(sel);
        anunciar(accs.filter(function (x) { return x.done; }).length + ' de ' + accs.length + ' listas');
      }
    } else if (a === 'toggle-casos') {
      S.showCasos = !S.showCasos;
      render();
    } else if (a === 'toggle-ntma') {
      S.showNtma = !S.showNtma;
      render();
    }
  });

  app.addEventListener('input', function (ev) {
    var el = ev.target;
    if (el.getAttribute('data-a') === 'q') {
      S.q = el.value;
      render();
      var n = app.querySelectorAll('[data-a="pick-ps"]').length;
      anunciar(n === 0
        ? 'Sin coincidencias en los 14 problemas GES del HUAP.'
        : n + (n === 1 ? ' problema encontrado' : ' problemas encontrados'));
    }
  });

  app.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.getAttribute('data-a') === 'calc') {
      var id = el.getAttribute('data-v');
      S.calc[id] = el.value;
      render();
      var chip = app.querySelector('#calc-' + id.replace(/[^\w-]/g, ''));
      var out = chip && chip.parentNode ? chip.parentNode.textContent : '';
      var lim = out.indexOf('límite:');
      if (lim >= 0) anunciar(out.slice(lim).trim());
    }
  });

  render();
})();
