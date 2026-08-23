/* Ruta guiada GES — HUAP.
 *
 * Mejora progresiva: el documento completo (#doc) ya está en el HTML y es lo
 * que se ve sin JavaScript y lo que sale al imprimir. Este archivo agrega
 * encima la ruta guiada (#app).
 *
 * Flujo (rediseño 2026-08-23, pedido por el usuario): problema → una sola
 * pregunta «¿Diagnóstico confirmado?» → resultado. Ya no se pregunta ni el
 * momento del paciente ni si está en urgencia o piso: con «sí» se muestra la
 * lista de verificación completa (IPD, Constancia, SIC…) y los plazos que
 * corren; con «todavía no», qué hacer para confirmar y sus plazos.
 *
 * El movimiento es parte del diseño: la tarjeta elegida sube (FLIP) mientras
 * el resto se desvanece, y las listas entran en cascada. Todo respeta
 * `prefers-reduced-motion` (las duraciones se anulan en styles.css y el FLIP
 * se salta aquí). El resto del archivo es ES5: los equipos de box no siempre
 * tienen navegador actualizado.
 */
(function () {
  'use strict';

  var dataEl = document.getElementById('ges-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var app = document.getElementById('app');
  if (!app) return;

  // ---------------------------------------------------------------- utilidades
  function closest(el, sel) {
    if (el && el.closest) return el.closest(sel);
    var m = Element.prototype.matches || Element.prototype.msMatchesSelector;
    while (el && el.nodeType === 1) {
      if (m && m.call(el, sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function reducirMovimiento() {
    try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
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
    view: 'problema', q: '', ps: null, resp: null,
    checks: loadChecks(), calc: {}, showAyuda: false, showNtma: false,
    // `anim` vale true solo en el primer dibujado tras cambiar de pantalla:
    // las entradas en cascada no deben repetirse al marcar una casilla.
    anim: false,
    // Última casilla marcada: su tic entra con un pequeño rebote.
    lastToggle: null
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
  function etapa(id) {
    for (var i = 0; i < D.etapas.length; i++) { if (D.etapas[i].id === id) return D.etapas[i]; }
    return null;
  }

  // Acciones de un momento: primero las propias del problema, luego las comunes.
  function accionesDe(sel, etapaId) {
    var comunes = D.acciones_comunes[etapaId] || [];
    var extras = (sel.extras && sel.extras[etapaId]) || [];
    return extras.concat(comunes).map(function (a) {
      var k = sel.ps + '.' + etapaId + '.' + a.t;
      return { k: k, t: a.t, d: a.d, done: !!S.checks[k] };
    });
  }

  // Los grupos de la lista de verificación cuando el diagnóstico está
  // confirmado: notificar ahora → hospitalización → alta. El momento
  // «sospecha» queda para la rama «todavía no».
  var GRUPOS_SI = ['confirmacion', 'hospitalizacion', 'alta'];

  function gruposDe(sel, resp) {
    var ids = resp === 'si' ? GRUPOS_SI : ['sospecha'];
    var out = [];
    for (var i = 0; i < ids.length; i++) {
      var e = etapa(ids[i]);
      var accs = accionesDe(sel, ids[i]);
      if (accs.length) out.push({ etapa: e, accs: accs });
    }
    return out;
  }

  function plazosDe(sel, resp) {
    return sel.plazos.filter(function (z) {
      return resp === 'si'
        ? (z.etapa === 'confirmacion' || z.etapa === 'hospitalizacion')
        : z.etapa === 'sospecha';
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
    h2b: 'margin:18px 4px 8px;font-size:19px;font-weight:900',
    col: 'display:flex;flex-direction:column;gap:8px',
    confirma: 'margin:0 4px 10px;font-size:12.5px;font-weight:700;color:#3D5378;background:#fff;border:1.5px solid #D9E5F3;border-left:3px solid #C9F2E3;border-radius:12px;padding:10px 12px',
    respBtn: 'display:flex;align-items:center;gap:12px;text-align:left;background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;padding:16px 14px;cursor:pointer;font-family:inherit;min-height:64px',
    respMark: 'flex:none;width:34px;height:34px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;',
    respName: 'display:block;font-size:15.5px;font-weight:900;color:#0C2B5E',
    respDesc: 'display:block;font-size:12.5px;font-weight:600;color:#5A6B8C;margin-top:2px',
    crumbs: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap',
    back: 'background:#fff;border:1.5px solid #D9E5F3;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:800;color:#0D5BD8;cursor:pointer;font-family:inherit',
    chipSi: 'background:#C9F2E3;color:#0C2B5E;font-weight:900;font-size:12px;padding:6px 12px;border-radius:999px',
    chipNo: 'background:#EDF2F9;border:1.5px solid #D9E5F3;color:#5A6B8C;font-weight:800;font-size:12px;padding:6px 12px;border-radius:999px',
    accHead: 'margin:16px 4px 8px;display:flex;align-items:baseline;justify-content:space-between',
    accTitle: 'font-size:19px;font-weight:900',
    accCount: 'font-size:12px;font-weight:800;color:#5A6B8C',
    grupoT: 'margin:14px 4px 6px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#5A6B8C',
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
    infoItem: 'border-left:3px solid #C9F2E3;padding:2px 0 2px 12px',
    infoT: 'font-size:13.5px;font-weight:800;color:#0C2B5E',
    infoD: 'font-size:12.5px;font-weight:600;color:#5A6B8C;line-height:1.45;margin-top:2px',
    ayudaBtn: 'width:100%;display:flex;align-items:center;gap:12px;text-align:left;margin-top:18px;background:#0C2B5E;color:#fff;border:none;border-radius:18px;padding:16px 18px;cursor:pointer;font-family:inherit',
    ayudaIcon: 'flex:none;width:38px;height:38px;border-radius:999px;background:#C9F2E3;color:#0C2B5E;font-weight:900;font-size:19px;display:flex;align-items:center;justify-content:center',
    ayudaT: 'display:block;font-size:15px;font-weight:900',
    ayudaD: 'display:block;font-size:12.5px;font-weight:600;opacity:.85;margin-top:2px',
    ayudaPanel: 'margin-top:10px;background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;padding:14px 16px;display:flex;flex-direction:column;gap:10px',
    ayudaContacto: 'background:#EDF2F9;border-radius:12px;padding:12px 14px;font-size:13px;font-weight:700;color:#0C2B5E;line-height:1.6',
    caso: 'border-left:3px solid #C9F2E3;padding:2px 0 2px 12px',
    casoSi: 'font-size:13px;font-weight:800',
    casoEnt: 'font-size:12.5px;font-weight:600;color:#5A6B8C;line-height:1.45;margin-top:2px',
    panel2: 'margin-top:10px;background:#fff;border:1.5px solid #D9E5F3;border-radius:16px;overflow:hidden',
    panelBtn: 'width:100%;display:flex;justify-content:space-between;align-items:center;background:none;border:none;padding:14px 16px;cursor:pointer;font-family:inherit;font-size:14.5px;font-weight:900;color:#0C2B5E',
    panelBody: 'padding:0 16px 14px;display:flex;flex-direction:column;gap:8px',
    ntmaTxt: 'font-size:12.5px;font-weight:600;color:#3D5378;line-height:1.5;border-left:3px solid #D9E5F3;padding-left:12px',
    ntmaWarn: 'font-size:11px;font-weight:700;color:#8A1E44;background:#FCE3EA;border-radius:10px;padding:8px 10px',
    fuente: 'margin:14px 4px 0;font-size:11px;font-weight:600;color:#8FA6C6',
    nav: 'display:flex;gap:8px;margin-top:16px',
    navBack: 'flex:1;background:#fff;border:1.5px solid #C6D6EC;border-radius:999px;padding:14px;font-size:14px;font-weight:800;color:#0D5BD8;cursor:pointer;font-family:inherit',
    navNext: 'flex:2;background:#0D5BD8;border:none;border-radius:999px;padding:14px;font-size:14px;font-weight:900;color:#fff;cursor:pointer;font-family:inherit'
  };

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

  // Entrada en cascada: cada tarjeta se retrasa un poco más que la anterior.
  // Solo en el primer dibujado de la pantalla (S.anim); el tope evita que las
  // listas largas hagan esperar. `animCls()` va dentro del atributo class y
  // `animDelay()` al comienzo del atributo style — siempre en pareja.
  var animN = 0;
  function animCls() { return S.anim ? ' anim-in' : ''; }
  function animDelay() {
    if (!S.anim) return '';
    var delay = Math.min(animN * 45, 500);
    animN++;
    return 'animation-delay:' + delay + 'ms;';
  }

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
      return '<button type="button" class="card-int card-ps' + animCls() + '" data-k="ps-' + p.ps + '" data-a="pick-ps" data-v="' + p.ps + '" style="' + animDelay() + ST.psBtn + '">' +
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
      '<div class="' + animCls() + '" style="' + animDelay() + ST.aviso + '">' +
        '<div style="' + ST.avisoT + '">¿No está en la lista?</div>' +
        '<div style="' + ST.avisoD + '">HUAP confirma y trata estos 14 problemas GES. Ante cualquier duda, llame a la Unidad GES: anexos ' +
          esc(D.contacto.anexos) + ' · <a href="mailto:' + esc(D.contacto.correo) + '" style="color:#9FE8CC;font-weight:800">' + esc(D.contacto.correo) + '</a></div>' +
      '</div>' +
      '</div>';
  }

  function selBarHtml(sel) {
    return '<div id="selbar" style="' + ST.selBar + '">' +
      '<span style="' + ST.selCie + '">' + esc(sel.cie.join(' · ')) + '</span>' +
      '<span class="flex-min" style="' + ST.selName + '">' + esc(sel.nombre) + '</span>' +
      '<button type="button" data-k="cambiar" data-a="volver-problema" style="' + ST.cambiar + '">Cambiar</button>' +
      '</div>';
  }

  // Pantalla 2 — la única pregunta: ¿diagnóstico confirmado?
  function viewGate() {
    var sel = problema();
    var g = D.gate;
    return '<div style="' + ST.pad + '">' +
      selBarHtml(sel) +
      '<h2 class="' + (S.anim ? 'anim-in' : '') + '" style="' + ST.h2b + ';animation-delay:120ms" id="paso-titulo" tabindex="-1">' + esc(g.pregunta) + '</h2>' +
      (sel.confirma ? '<div class="' + (S.anim ? 'anim-in' : '') + '" style="' + ST.confirma + ';animation-delay:180ms">' + esc(sel.confirma) + '</div>' : '') +
      '<div style="' + ST.col + '">' +
        '<button type="button" class="card-int' + (S.anim ? ' anim-in' : '') + '" data-k="resp-si" data-a="resp" data-v="si" style="' + ST.respBtn + ';animation-delay:240ms">' +
          '<span style="' + ST.respMark + 'background:#C9F2E3;color:#0C2B5E" aria-hidden="true">' + TICK + '</span>' +
          '<span class="flex-min" style="flex:1">' +
            '<span style="' + ST.respName + '">' + esc(g.si) + '</span>' +
            '<span style="' + ST.respDesc + '">' + esc(g.si_desc) + '</span>' +
          '</span>' +
          '<span style="' + ST.caret + '" aria-hidden="true">›</span>' +
        '</button>' +
        '<button type="button" class="card-int' + (S.anim ? ' anim-in' : '') + '" data-k="resp-no" data-a="resp" data-v="no" style="' + ST.respBtn + ';animation-delay:320ms">' +
          '<span style="' + ST.respMark + 'background:#EDF2F9;color:#5A6B8C" aria-hidden="true">?</span>' +
          '<span class="flex-min" style="flex:1">' +
            '<span style="' + ST.respName + '">' + esc(g.no) + '</span>' +
            '<span style="' + ST.respDesc + '">' + esc(g.no_desc) + '</span>' +
          '</span>' +
          '<span style="' + ST.caret + '" aria-hidden="true">›</span>' +
        '</button>' +
      '</div>' +
      '</div>';
  }

  // Pantalla 3 — el resultado: la lista de verificación (confirmado) o qué
  // hacer mientras se confirma (sospecha), los plazos, y el botón de ayuda.
  function viewResultado() {
    var sel = problema();
    var confirmado = S.resp === 'si';
    var grupos = gruposDe(sel, S.resp);

    var total = 0, hechas = 0;
    grupos.forEach(function (gr) {
      gr.accs.forEach(function (a) { total++; if (a.done) hechas++; });
    });

    var listaHtml = grupos.map(function (gr) {
      // Punto rojo pulsante en vez del texto del badge: el título del grupo ya
      // dice «Notifique ahora» y repetirlo era ruido.
      var badge = gr.etapa.id === 'confirmacion' && gr.etapa.badge
        ? '<span title="' + esc(gr.etapa.badge) + '" style="width:9px;height:9px;border-radius:999px;background:#D02E63;animation:pulseA 2s infinite" aria-hidden="true"></span>' : '';
      var titulo = grupos.length > 1
        ? '<div class="' + animCls() + '" style="' + animDelay() + ST.grupoT + '">' + esc(gr.etapa.titulo_checklist || gr.etapa.nombre) + badge + '</div>'
        : '';
      var items = gr.accs.map(function (a) {
        var pop = S.lastToggle === a.k && a.done ? ' class="tick-pop"' : '';
        return '<button type="button" class="acc-row' + animCls() + '" data-k="acc-' + esc(a.k) + '" data-a="toggle" data-v="' + esc(a.k) + '" aria-pressed="' + a.done + '" style="' + animDelay() + accRow(a.done) + '">' +
          '<span style="' + accBox(a.done) + '" aria-hidden="true">' + (a.done ? '<span' + pop + ' style="display:flex">' + TICK + '</span>' : '') + '</span>' +
          '<span class="flex-min" style="flex:1">' +
            '<span style="' + ST.accT + '">' + esc(a.t) + '</span>' +
            '<span style="' + ST.accD + '">' + esc(a.d) + '</span>' +
          '</span>' +
          '</button>';
      }).join('');
      return titulo + '<div style="' + ST.col + '">' + items + '</div>';
    }).join('');

    var plazoCard = function (z) {
      var val = S.calc[z.id] || '';
      var type = z.u === 'ya' ? false : (z.u === 'd' ? 'date' : 'time');
      var desdeCorto = z.desde.replace(/\s*\(.*\)/, '');
      var out = calcOut(z, val);
      return '<div class="' + animCls() + '" style="' + animDelay() + ST.plazoCard + '">' +
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
    };

    var plazos = plazosDe(sel, S.resp);
    var plazosHtml = plazos.length
      ? '<h2 style="' + ST.plazosT + '">Plazos que corren</h2>' +
        '<div style="' + ST.col + '">' + plazos.map(plazoCard).join('') + '</div>' +
        '<div style="' + ST.nota + '">Cálculo referencial — no se guarda ningún dato del paciente.</div>'
      : '';

    // Después del alta (solo en la rama confirmada): plazos de seguimiento,
    // acciones de la unidad y notas propias del problema. Informativo, sin
    // casillas: ya no depende del médico tratante.
    var postHtml = '';
    if (confirmado) {
      var segPlazos = sel.plazos.filter(function (z) { return z.etapa === 'seguimiento'; });
      var segInfo = ((sel.extras && sel.extras.seguimiento) || []).concat(D.acciones_comunes.seguimiento || []);
      var pn = sel.postNota || (segPlazos.length ? '' : (D.notaSinGarantiaPostAlta || ''));
      if (segPlazos.length || segInfo.length || pn) {
        postHtml = '<h2 style="' + ST.plazosT + '">' + esc(etapa('seguimiento').titulo_checklist || 'Después del alta') + '</h2>' +
          (segInfo.length
            ? '<div class="' + (S.anim ? 'anim-in' : '') + '" style="' + ST.plazoCard + ';display:flex;flex-direction:column;gap:8px">' +
              segInfo.map(function (a) {
                return '<div style="' + ST.infoItem + '">' +
                  '<div style="' + ST.infoT + '">' + esc(a.t) + '</div>' +
                  '<div style="' + ST.infoD + '">' + esc(a.d) + '</div>' +
                  '</div>';
              }).join('') + '</div>'
            : '') +
          (segPlazos.length ? '<div style="' + ST.col + ';margin-top:8px">' + segPlazos.map(plazoCard).join('') + '</div>' : '') +
          (pn ? '<div style="' + ST.postNota + '">' + esc(pn) + '</div>' : '');
      }
    }

    // Puente entre ramas: desde sospecha, el paso natural es confirmar.
    var puente = !confirmado
      ? '<div class="' + (S.anim ? 'anim-in' : '') + '" style="' + ST.postNota + ';margin-top:16px">En cuanto confirme el diagnóstico, la notificación GES se hace en el mismo acto y con la misma fecha.</div>'
      : '';

    var casosHtml = D.casos.map(function (c) {
      return '<div style="' + ST.caso + '">' +
        '<div style="' + ST.casoSi + '">' + esc(c.si) + '</div>' +
        '<div style="' + ST.casoEnt + '">' + esc(c.entonces) + '</div>' +
        '</div>';
    }).join('');

    var ayudaHtml =
      '<button type="button" class="btn-ayuda" data-k="t-ayuda" data-a="toggle-ayuda" aria-expanded="' + S.showAyuda + '"' + (S.showAyuda ? ' aria-controls="panel-ayuda"' : '') + ' style="' + ST.ayudaBtn + '">' +
        '<span style="' + ST.ayudaIcon + '" aria-hidden="true">?</span>' +
        '<span class="flex-min" style="flex:1">' +
          '<span style="' + ST.ayudaT + '">¿Problemas? ¿Algo no se pudo?</span>' +
          '<span style="' + ST.ayudaD + '">Notificación pendiente, paciente que no puede firmar, ISAPRE, sin previsión… La Unidad GES le ayuda.</span>' +
        '</span>' +
        '<span style="color:#C9F2E3;font-weight:900" aria-hidden="true">' + (S.showAyuda ? '−' : '+') + '</span>' +
      '</button>' +
      (S.showAyuda
        ? '<div id="panel-ayuda" class="anim-in" style="' + ST.ayudaPanel + '">' +
            casosHtml +
            '<div style="' + ST.ayudaContacto + '">Unidad GES · anexos ' + esc(D.contacto.anexos) +
              ' · <a href="mailto:' + esc(D.contacto.correo) + '">' + esc(D.contacto.correo) + '</a><br>' +
              esc(D.contacto.horario) + '</div>' +
          '</div>'
        : '');

    var ntmaHtml = (sel.ntma || []).map(function (t) {
      return '<div style="' + ST.ntmaTxt + '">' + esc(t) + '</div>';
    }).join('');

    return '<div style="' + ST.pad + '">' +
      '<div style="' + ST.crumbs + '">' +
        '<button type="button" data-k="back-gate" data-a="volver-gate" style="' + ST.back + '">‹ ' + esc(sel.corto) + '</button>' +
        (confirmado
          ? '<span style="' + ST.chipSi + '">Diagnóstico confirmado</span>'
          : '<span style="' + ST.chipNo + '">Sospecha — sin confirmar</span>') +
      '</div>' +

      '<div style="' + ST.accHead + '">' +
        '<h2 style="' + ST.accTitle + '" id="paso-titulo" tabindex="-1">' +
          (confirmado ? 'El paciente debe quedar con:' : 'Mientras confirma') + '</h2>' +
        (total ? '<div style="' + ST.accCount + '">' + hechas + ' de ' + total + ' listas</div>' : '') +
      '</div>' +
      listaHtml +
      plazosHtml +
      postHtml +
      puente +
      ayudaHtml +

      '<div style="' + ST.panel2 + '">' +
        // `aria-controls` solo cuando el panel existe: plegado se quita del DOM.
        '<button type="button" data-k="t-ntma" data-a="toggle-ntma" aria-expanded="' + S.showNtma + '"' + (S.showNtma ? ' aria-controls="panel-ntma"' : '') + ' style="' + ST.panelBtn + '">Criterios NTMA de este problema <span style="color:#0D5BD8" aria-hidden="true">' + (S.showNtma ? '−' : '+') + '</span></button>' +
        (S.showNtma
          ? '<div id="panel-ntma" style="' + ST.panelBody + '">' + ntmaHtml +
            '<div style="' + ST.ntmaWarn + '">Transcripción de la NTMA pendiente de validación por la Unidad GES.</div></div>'
          : '') +
      '</div>' +

      '<div style="' + ST.fuente + '">Fuente: ' + esc(sel.fuente) + '</div>' +

      '<div style="' + ST.nav + '">' +
        '<button type="button" data-k="nav-back" data-a="volver-gate" style="' + ST.navBack + '">‹ Pregunta</button>' +
        (!confirmado
          ? '<button type="button" class="btn-primary" data-k="nav-next" data-a="resp" data-v="si" style="' + ST.navNext + '">Ya está confirmado ›</button>'
          : '') +
      '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------- render
  function render() {
    var num = S.view === 'problema' ? '1' : S.view === 'gate' ? '2' : '3';
    var titulo = S.view === 'problema' ? 'Problema de salud' : S.view === 'gate' ? 'Confirmación' : 'Sus acciones';
    animN = 0;

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
      (S.view === 'problema' ? viewProblema() : S.view === 'gate' ? viewGate() : viewResultado());

    // Las animaciones de entrada corren una vez por pantalla; el rebote del
    // tic, una vez por marca.
    S.anim = false;
    S.lastToggle = null;

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
    S.anim = !reducirMovimiento();
    render();
    var h = document.getElementById('paso-titulo');
    if (h) h.focus({ preventScroll: true });
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
  }

  // La tarjeta elegida «sube» hasta convertirse en la barra del problema
  // (técnica FLIP): se mide dónde estaba, se dibuja la pantalla nueva, y la
  // barra parte desde la posición vieja y viaja a la suya.
  function subirTarjeta(desde) {
    var barra = document.getElementById('selbar');
    if (!barra || !desde) return;
    var hasta = barra.getBoundingClientRect();
    var dx = desde.left - hasta.left;
    var dy = desde.top - hasta.top;
    if (!dx && !dy) return;
    barra.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    barra.style.transition = 'none';
    // Reflujo forzado: el navegador debe pintar la posición de partida antes
    // de animar hacia la definitiva.
    void barra.offsetWidth;
    barra.style.transition = 'transform .32s cubic-bezier(.2,.7,.3,1)';
    barra.style.transform = '';
  }

  // Evita dobles taps mientras la lista se desvanece.
  var saliendo = false;

  function elegirProblema(ps, btn) {
    if (S.ps !== null && S.ps !== ps) { saveChecks({}); S.calc = {}; }
    S.ps = ps;
    S.resp = null;
    if (reducirMovimiento() || !btn) {
      goto('gate');
      return;
    }
    if (saliendo) return;
    saliendo = true;
    var desde = btn.getBoundingClientRect();
    // El resto de la lista se desvanece; la tarjeta elegida queda firme.
    var cards = app.querySelectorAll('.card-ps');
    for (var i = 0; i < cards.length; i++) {
      if (cards[i] !== btn) cards[i].className += ' saliendo';
    }
    btn.style.borderColor = '#0D5BD8';
    setTimeout(function () {
      saliendo = false;
      goto('gate');
      subirTarjeta(desde);
    }, 170);
  }

  // ---------------------------------------------------------------- eventos
  app.addEventListener('click', function (ev) {
    var el = closest(ev.target, "[data-a]");
    if (!el) return;
    var a = el.getAttribute('data-a');
    var v = el.getAttribute('data-v');

    if (a === 'pick-ps') {
      // Otro problema es, en la práctica, otro paciente: la lista parte limpia.
      // En la primera selección no hay paciente anterior, así que se conserva
      // lo que sobreviva en sessionStorage a una recarga.
      elegirProblema(+v, el);
    } else if (a === 'volver-problema') {
      S.resp = null;
      goto('problema');
    } else if (a === 'volver-gate') {
      goto('gate');
    } else if (a === 'resp') {
      S.resp = v;
      S.showAyuda = false;
      S.showNtma = false;
      goto('resultado');
      var sel = problema();
      if (sel) {
        var n = 0;
        gruposDe(sel, v).forEach(function (gr) { n += gr.accs.length; });
        anunciar((v === 'si' ? 'Diagnóstico confirmado: ' : 'Sospecha: ') + n + (n === 1 ? ' acción' : ' acciones'));
      }
    } else if (a === 'toggle') {
      var c = {};
      Object.keys(S.checks).forEach(function (k) { c[k] = S.checks[k]; });
      c[v] = !c[v];
      S.lastToggle = c[v] ? v : null;
      saveChecks(c);
      render();
      var sel2 = problema();
      if (sel2) {
        var tot = 0, hechas = 0;
        gruposDe(sel2, S.resp).forEach(function (gr) {
          gr.accs.forEach(function (x) { tot++; if (x.done) hechas++; });
        });
        anunciar(hechas + ' de ' + tot + ' listas');
      }
    } else if (a === 'toggle-ayuda') {
      S.showAyuda = !S.showAyuda;
      render();
      if (S.showAyuda) {
        var p = document.getElementById('panel-ayuda');
        if (p && p.scrollIntoView) { try { p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* ignorar */ } }
      }
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

  S.anim = !reducirMovimiento();
  render();
})();
