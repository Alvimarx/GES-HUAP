/* Ruta guiada GES — HUAP.
 *
 * Mejora progresiva: el documento completo (#doc) ya está en el HTML y es lo
 * que se ve sin JavaScript y lo que sale al imprimir. Este archivo agrega
 * encima la ruta guiada (#app).
 *
 * Flujo: problema → resultado. Dos pasos. La pregunta «¿está confirmado?»
 * se eliminó el 2026-08-25: el médico sabe si confirmó o no, y lo que sí
 * necesita —con qué se confirma esta patología— pasó a ser lo primero que ve
 * en el resultado (campo `confirma`, con fuente NTMA o del decreto).
 *
 * El movimiento es parte del diseño: la tarjeta elegida sube (FLIP), el tallo
 * de la lista se dibuja solo, los números aparecen con rebote y las tarjetas
 * entran escalonadas desde la izquierda. Todo respeta `prefers-reduced-motion`
 * (styles.css anula las duraciones y aquí se salta el FLIP). El resto del
 * archivo es ES5: los equipos de box no siempre tienen navegador actualizado.
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

  // ---------------------------------------------------------------- estado
  var S = {
    view: 'problema', q: '', ps: null,
    calc: {}, showAyuda: false, showNtma: false, showLuego: false,
    // `anim` vale true solo en el primer dibujado tras cambiar de pantalla:
    // la cascada no debe repetirse al abrir un panel.
    anim: false
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
  // En la ruta guiada manda la redacción breve; `t`/`d` quedan para el
  // documento impreso. `nota` separa las advertencias de las acciones.
  // Primero lo común, después lo propio del problema: la pantalla responde
  // «qué debe quedar teniendo el paciente», y eso son los documentos. Lo
  // específico del problema va detrás, no delante.
  function fmtAccion(a) {
    return { t: a.breve || a.t, d: a.d_breve || a.d, nota: !!a.nota };
  }

  function accionesDe(sel, etapaId) {
    var comunes = D.acciones_comunes[etapaId] || [];
    var extras = (sel.extras && sel.extras[etapaId]) || [];
    return comunes.concat(extras).map(fmtAccion);
  }

  // Los pasos numerados son SIEMPRE los mismos cuatro trámites —activar el
  // caso y los tres documentos—, para que la pantalla tenga el mismo largo en
  // los 14 problemas. Lo propio de cada patología va aparte, sin numerar.
  var MOMENTO = ['sospecha', 'confirmacion'];

  function pasosDe(sel) {
    var out = [];
    for (var i = 0; i < MOMENTO.length; i++) {
      var accs = D.acciones_comunes[MOMENTO[i]] || [];
      for (var j = 0; j < accs.length; j++) {
        if (!accs[j].nota) out.push(fmtAccion(accs[j]));
      }
    }
    return out;
  }

  function propiasDe(sel) {
    var out = [];
    for (var i = 0; i < MOMENTO.length; i++) {
      var ex = (sel.extras && sel.extras[MOMENTO[i]]) || [];
      for (var j = 0; j < ex.length; j++) out.push(fmtAccion(ex[j]));
    }
    return out;
  }

  function notasDe(sel) {
    var out = [];
    for (var i = 0; i < MOMENTO.length; i++) {
      var accs = D.acciones_comunes[MOMENTO[i]] || [];
      for (var j = 0; j < accs.length; j++) {
        if (accs[j].nota) out.push(fmtAccion(accs[j]));
      }
    }
    return out;
  }

  // Lo que viene después del momento que la pantalla responde. Va plegado: es
  // real y no se puede omitir, pero no es lo que el médico necesita ahora.
  var LUEGO = ['hospitalizacion', 'alta', 'seguimiento'];

  function gruposLuego(sel) {
    var out = [];
    for (var i = 0; i < LUEGO.length; i++) {
      var accs = accionesDe(sel, LUEGO[i]);
      var pl = sel.plazos.filter(function (z) { return z.etapa === LUEGO[i]; });
      if (accs.length || pl.length) out.push({ etapa: etapa(LUEGO[i]), accs: accs, plazos: pl });
    }
    return out;
  }

  // Los plazos que corren en el momento que la pantalla responde.
  function plazosDe(sel) {
    return sel.plazos.filter(function (z) {
      return z.etapa === 'sospecha' || z.etapa === 'confirmacion';
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
    col: 'display:flex;flex-direction:column;gap:8px',
    crumbs: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap',
    back: 'background:#fff;border:1.5px solid #D9E5F3;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:800;color:#0D5BD8;cursor:pointer;font-family:inherit',
    chipSi: 'background:#C9F2E3;color:#0C2B5E;font-weight:900;font-size:12px;padding:6px 12px;border-radius:999px',
    accTitle: 'font-size:19px;font-weight:900',
    subT: 'margin:0 4px 4px;font-size:12.5px;font-weight:700;color:#5A6B8C',
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

  function chipPlazo(critico) {
    return 'flex:none;font-size:15px;font-weight:900;padding:9px 14px;border-radius:12px;white-space:nowrap;' +
      (critico ? 'background:#D02E63;color:#fff' : 'background:#0C2B5E;color:#fff');
  }


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

  // Pantalla 3 — el resultado. Responde una pregunta y la responde corta:
  // qué debe tener el paciente ANTES de pasar a hospitalización (rama
  // confirmada) o qué hacer mientras se confirma (rama sospecha). Lo que
  // ocurre después va plegado.
  function viewResultado() {
    var sel = problema();
    var pasos = pasosDe(sel);
    var propias = propiasDe(sel);
    var notas = notasDe(sel);

    // Lo primero que ve el médico: con qué se confirma esta patología. Solo
    // aparece cuando hay fuente primaria; para cinco de los 14 problemas
    // ninguna fuente lo dice y la banda se omite antes que inventarla
    // (CLAUDE.md §1.1; el vacío queda anotado en problemas.json).
    var confirmaHtml = sel.confirma && sel.confirma.texto
      ? '<div class="confirma' + animCls() + '" style="' + animDelay() + '">' +
          '<span class="confirma-t">Debe tener</span>' +
          '<span class="confirma-d">' + esc(sel.confirma.texto) + '</span>' +
          '<span class="confirma-f">' + esc(sel.confirma.fuente) + '</span>' +
        '</div>'
      : '';

    // Lista numerada con tallo: el tallo se dibuja de arriba abajo y cada
    // número aparece con rebote justo cuando el trazo lo alcanza.
    var pasosHtml = pasos.length
      ? '<ol class="pasos' + (S.anim ? ' pasos-anim' : '') + '">' +
        pasos.map(function (a, i) {
          var d = 260 + i * 130;
          return '<li class="paso' + animCls() + '" style="' + (S.anim ? 'animation-delay:' + d + 'ms;' : '') + '">' +
            '<span class="paso-n" style="' + (S.anim ? 'animation-delay:' + (d + 60) + 'ms' : '') + '" aria-hidden="true">' + (i + 1) + '</span>' +
            '<span class="paso-txt">' +
              '<span class="paso-t">' + esc(a.t) + '</span>' +
              (a.d ? '<span class="paso-d">' + esc(a.d) + '</span>' : '') +
            '</span>' +
            '</li>';
        }).join('') + '</ol>'
      : '';

    var retraso = 260 + pasos.length * 130;

    // Lo propio de la patología, sin numerar: no es un trámite más, es lo que
    // cambia de un problema a otro.
    var propiasHtml = propias.length
      ? '<div class="propias' + animCls() + '" style="' + (S.anim ? 'animation-delay:' + retraso + 'ms' : '') + '">' +
          '<div class="propias-t">Propio de ' + esc(sel.corto) + '</div>' +
          propias.map(function (a) {
            return '<div class="propias-i"><strong>' + esc(a.t) + '</strong>' +
              (a.d ? '<span>' + esc(a.d) + '</span>' : '') + '</div>';
          }).join('') +
        '</div>'
      : '';

    var notasHtml = notas.length
      ? '<div class="notas' + animCls() + '" style="' + (S.anim ? 'animation-delay:' + (retraso + 80) + 'ms' : '') + '">' +
        notas.map(function (a) {
          return '<div class="nota-i"><strong>' + esc(a.t) + '</strong> ' + esc(a.d) + '</div>';
        }).join('') + '</div>'
      : '';

    var plazoCard = function (z, dentro) {
      var val = S.calc[z.id] || '';
      var type = z.u === 'ya' ? false : (z.u === 'd' ? 'date' : 'time');
      var desdeCorto = z.desde.replace(/\s*\(.*\)/, '');
      var out = calcOut(z, val);
      return '<div class="' + (dentro ? '' : animCls()) + '" style="' + (dentro ? '' : animDelay()) + ST.plazoCard + '">' +
        '<div style="' + ST.plazoRow + '">' +
          '<span class="chip-plazo" style="' + chipPlazo(z.critico) + '">' + esc(fmtPlazo(z)) + '</span>' +
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

    var plazos = plazosDe(sel);
    var plazosHtml = plazos.length
      ? '<h2 class="' + animCls() + '" style="' + animDelay() + ST.plazosT + '">Plazos que corren</h2>' +
        '<div style="' + ST.col + '">' + plazos.map(function (z) { return plazoCard(z, false); }).join('') + '</div>' +
        '<div style="' + ST.nota + '">Cálculo referencial — no se guarda ningún dato del paciente.</div>'
      : '';

    // Lo que viene después, plegado: no se omite ninguna garantía, pero no
    // compite con lo que hay que hacer ahora.
    var luego = gruposLuego(sel);
    var luegoHtml = '';
    if (luego.length) {
      var cuerpo = luego.map(function (gr) {
        var pn = gr.etapa.id === 'seguimiento'
          ? (sel.postNota || (gr.plazos.length ? '' : (D.notaSinGarantiaPostAlta || ''))) : '';
        return '<div class="luego-g">' +
          '<div class="luego-t">' + esc(gr.etapa.titulo_checklist || gr.etapa.nombre) + '</div>' +
          gr.accs.map(function (a) {
            return '<div class="luego-i"><strong>' + esc(a.t) + '</strong>' + (a.d ? '<span>' + esc(a.d) + '</span>' : '') + '</div>';
          }).join('') +
          (gr.plazos.length ? '<div style="' + ST.col + ';margin-top:8px">' + gr.plazos.map(function (z) { return plazoCard(z, true); }).join('') + '</div>' : '') +
          (pn ? '<div style="' + ST.postNota + '">' + esc(pn) + '</div>' : '') +
          '</div>';
      }).join('');
      luegoHtml = '<div class="' + animCls() + '" style="' + animDelay() + ST.panel2 + '">' +
        '<button type="button" data-k="t-luego" data-a="toggle-luego" aria-expanded="' + S.showLuego + '"' + (S.showLuego ? ' aria-controls="panel-luego"' : '') + ' style="' + ST.panelBtn + '">Y después — hospitalización, alta y seguimiento <span class="giro' + (S.showLuego ? ' giro-on' : '') + '" style="color:#0D5BD8" aria-hidden="true">+</span></button>' +
        (S.showLuego ? '<div id="panel-luego" class="despliega" style="' + ST.panelBody + '">' + cuerpo + '</div>' : '') +
        '</div>';
    }

    var casosHtml = D.casos.map(function (c) {
      return '<div style="' + ST.caso + '">' +
        '<div style="' + ST.casoSi + '">' + esc(c.si) + '</div>' +
        '<div style="' + ST.casoEnt + '">' + esc(c.entonces) + '</div>' +
        '</div>';
    }).join('');

    var ayudaHtml =
      '<button type="button" class="btn-ayuda' + animCls() + '" data-k="t-ayuda" data-a="toggle-ayuda" aria-expanded="' + S.showAyuda + '"' + (S.showAyuda ? ' aria-controls="panel-ayuda"' : '') + ' style="' + animDelay() + ST.ayudaBtn + '">' +
        '<span style="' + ST.ayudaIcon + '" aria-hidden="true">?</span>' +
        '<span class="flex-min" style="flex:1">' +
          '<span style="' + ST.ayudaT + '">¿Problemas? ¿Algo no se pudo?</span>' +
          '<span style="' + ST.ayudaD + '">Notificación pendiente, paciente que no puede firmar, ISAPRE, sin previsión… La Unidad GES le ayuda.</span>' +
        '</span>' +
        '<span class="giro' + (S.showAyuda ? ' giro-on' : '') + '" style="color:#C9F2E3;font-weight:900" aria-hidden="true">+</span>' +
      '</button>' +
      (S.showAyuda
        ? '<div id="panel-ayuda" class="despliega" style="' + ST.ayudaPanel + '">' +
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
      '<div class="' + animCls() + '" style="' + animDelay() + ST.crumbs + '">' +
        '<button type="button" data-k="back-lista" data-a="volver-problema" style="' + ST.back + '">‹ Cambiar problema</button>' +
        '<span style="' + ST.chipSi + '">' + esc(sel.cie.join(' · ')) + '</span>' +
      '</div>' +

      '<h2 class="' + animCls() + '" style="' + animDelay() + ST.accTitle + ';margin:16px 4px 2px" id="paso-titulo" tabindex="-1">' +
        esc(sel.nombre) + '</h2>' +
      '<div class="' + animCls() + '" style="' + animDelay() + ST.subT + '">Antes de que el paciente pase a hospitalización.</div>' +
      confirmaHtml +
      pasosHtml +
      propiasHtml +
      notasHtml +
      plazosHtml +
      ayudaHtml +
      luegoHtml +

      '<div class="' + animCls() + '" style="' + animDelay() + ST.panel2 + '">' +
        // `aria-controls` solo cuando el panel existe: plegado se quita del DOM.
        '<button type="button" data-k="t-ntma" data-a="toggle-ntma" aria-expanded="' + S.showNtma + '"' + (S.showNtma ? ' aria-controls="panel-ntma"' : '') + ' style="' + ST.panelBtn + '">Criterios NTMA de este problema <span class="giro' + (S.showNtma ? ' giro-on' : '') + '" style="color:#0D5BD8" aria-hidden="true">+</span></button>' +
        (S.showNtma
          ? '<div id="panel-ntma" class="despliega" style="' + ST.panelBody + '">' + ntmaHtml +
            '<div style="' + ST.ntmaWarn + '">Transcripción de la NTMA pendiente de validación por la Unidad GES.</div></div>'
          : '') +
      '</div>' +

      '<div style="' + ST.fuente + '">Fuente: ' + esc(sel.fuente) + '</div>' +

      '<div style="' + ST.nav + '">' +
        '<button type="button" data-k="nav-back" data-a="volver-problema" style="' + ST.navBack + '">‹ Elegir otro problema</button>' +
      '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------- render
  function render() {
    var num = S.view === 'problema' ? '1' : '2';
    var titulo = S.view === 'problema' ? 'Problema de salud' : 'Sus acciones';
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
        '<span style="' + ST.stepPill + '">Paso ' + num + ' de 2</span>' +
        '<span>' + esc(titulo) + '</span>' +
      '</div>' +
      (S.view === 'problema' ? viewProblema() : viewResultado());

    // Las animaciones de entrada corren una vez por pantalla.
    S.anim = false;

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

  function anunciarResultado() {
    var sel = problema();
    if (!sel) return;
    var n = pasosDe(sel).length;
    anunciar(esc(sel.nombre) + '. ' +
      (sel.confirma && sel.confirma.texto ? 'Debe tener: ' + sel.confirma.texto + ' ' : '') +
      n + (n === 1 ? ' paso' : ' pasos') + ' antes de que el paciente pase a hospitalización.');
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
    var barra = document.getElementById('paso-titulo');
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
    // Otro problema es, en la práctica, otro paciente: los plazos calculados
    // del anterior no deben sobrevivir.
    if (S.ps !== null && S.ps !== ps) { S.calc = {}; }
    S.ps = ps;
    S.showAyuda = false;
    S.showNtma = false;
    S.showLuego = false;
    if (reducirMovimiento() || !btn) {
      goto('resultado');
      anunciarResultado();
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
      goto('resultado');
      subirTarjeta(desde);
      anunciarResultado();
    }, 170);
  }

  // ---------------------------------------------------------------- eventos
  app.addEventListener('click', function (ev) {
    var el = closest(ev.target, "[data-a]");
    if (!el) return;
    var a = el.getAttribute('data-a');
    var v = el.getAttribute('data-v');

    if (a === 'pick-ps') {
      elegirProblema(+v, el);
    } else if (a === 'volver-problema') {
      goto('problema');
    } else if (a === 'toggle-luego') {
      S.showLuego = !S.showLuego;
      render();
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
