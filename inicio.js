/* ===================================================================
   Vantik v3.1 - Inicio
   No sabe que modulos existen: lee todo del registro (Vantik.registrar).
   Cuando agreguemos algo nuevo, aparece aqui solo.
   =================================================================== */
(function(){
  const V = window.Vantik;
  if(!V){ console.warn('inicio.js necesita vantik-core.js'); return; }
  const u = V.u;

  function css(){
    if(document.getElementById('ini-css')) return;
    const s = document.createElement('style'); s.id = 'ini-css';
    s.textContent = `
    #ini-extra{margin:0 0 18px}
    .ini-acc{display:grid;grid-template-columns:repeat(auto-fit,minmax(90px,1fr));gap:8px;margin-bottom:16px}
    #view-inicio .ini-acc button{background:#fff;border:1px solid #e8e1d6;border-radius:14px;padding:12px 6px;
      display:flex;flex-direction:column;align-items:center;gap:7px;cursor:pointer;color:#3f382e;
      font-size:11.5px;font-weight:700;line-height:1.25;text-align:center;width:auto;margin:0}
    #view-inicio .ini-acc button:hover{background:#fdfbf8;border-color:#d8cfc0}
    .ini-acc .ic{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-size:17px}
    .ini-acc .verde{background:#e9f5ec;color:#2f7a3e}
    .ini-acc .ambar{background:#fff4e5;color:#8a5a12}
    .ini-acc .azul{background:#eaf2fb;color:#1d4e82}
    .ini-tit{font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:#9a8f81;
      font-weight:800;margin:0 0 9px}
    .ini-hoy{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
    .ini-f{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e8e1d6;
      border-radius:14px;padding:12px 14px;cursor:pointer;border-left:4px solid #d8d0c4;text-align:left}
    .ini-f:hover{background:#fdfbf8}
    .ini-f.alta{border-left-color:#c0392b}
    .ini-f.media{border-left-color:#e0912f}
    .ini-f.baja{border-left-color:#3d7fc1}
    .ini-f .n{font-size:22px;font-weight:800;min-width:32px;text-align:center;line-height:1}
    .ini-f.alta .n{color:#c0392b} .ini-f.media .n{color:#c8871f} .ini-f.baja .n{color:#2f6b9e}
    .ini-f .tx{flex:1}
    .ini-f .tx b{display:block;font-size:14.5px;color:#2f2a22;margin-bottom:2px}
    .ini-f .tx span{font-size:12.5px;color:#8a7f72;line-height:1.4}
    .ini-f .go{color:#b7ada0;font-size:18px}
    .ini-ok{background:#e9f5ec;border:1px solid #c8e4d0;border-radius:14px;padding:16px;
      text-align:center;color:#1f6b32;font-size:13.5px;margin-bottom:18px;line-height:1.5}
    .ini-act{display:flex;flex-direction:column;gap:1px;background:#e8e1d6;border:1px solid #e8e1d6;
      border-radius:14px;overflow:hidden}
    .ini-a{display:flex;align-items:center;gap:11px;background:#fff;padding:10px 13px;cursor:pointer}
    .ini-a:hover{background:#fdfbf8}
    .ini-a .chip{background:linear-gradient(180deg,#5cdc7c,#2fa851);color:#123a1e;font-weight:900;
      font-style:italic;border-radius:6px 6px 9px 9px;padding:3px 8px;font-size:11.5px;white-space:nowrap}
    .ini-a .q{flex:1;font-size:13px;color:#5c5347;line-height:1.35}
    .ini-a .d{font-size:11.5px;color:#a89e92;white-space:nowrap}
    .ini-vacio{color:#a89e92;font-size:13px;text-align:center;padding:16px 0;background:#fff}
    `;
    document.head.appendChild(s);
  }

  function actividad(){
    const EV = {servicio:'Servicio', palpacion:'Palpacion', parto:'Parto', aborto:'Aborto', secado:'Secado'};
    const SA = {vacuna:'Vacuna', desparasitacion:'Desparasitacion', vitaminas:'Vitaminas',
                tratamiento:'Tratamiento', revision:'Revision'};
    const a = [];
    (STATE.eventos||[]).forEach(e => a.push({f:e.fecha, id:e.animal_id, q: EV[e.tipo_evento] || e.tipo_evento}));
    (STATE.pesajes||[]).forEach(p => a.push({f:p.fecha, id:p.animal_id, q:'Pesaje - ' + p.peso_kg + ' kg'}));
    (STATE.sanidad||[]).forEach(s => a.push({f:s.fecha, id:s.animal_id,
      q:(SA[s.tipo] || 'Sanidad') + (s.producto ? ' - ' + s.producto : '')}));
    a.sort((x,y) => u.fecha(y.f) - u.fecha(x.f));
    return a.slice(0,6);
  }

  window.iniAccion = function(i){ const m = V.accesos()[i]; if(m && m.accion) m.accion(); };
  window.iniAviso  = function(i){ const a = V.avisos()[i];  if(a && a.accion) a.accion(); };
  window.iniIr     = function(id){ if(typeof _openFicha === 'function') _openFicha(id); };

  function pintar(){
    const c = document.querySelector('#view-inicio .content');
    if(!c || !u.hayDatos()) return;
    css();

    let caja = document.getElementById('ini-extra');
    if(!caja){
      caja = document.createElement('div'); caja.id = 'ini-extra';
      const dg = document.getElementById('dg-abrir');
      if(dg) c.insertBefore(caja, dg.nextSibling); else c.insertBefore(caja, c.firstChild);
    }

    const porId = {}; u.animales().forEach(a => porId[a.id] = a);
    const accesos = V.accesos(), avisos = V.avisos(), act = actividad();

    caja.innerHTML =
      '<div class="ini-acc">' +
        accesos.map((m,i) =>
          '<button onclick="iniAccion(' + i + ')">' +
            '<span class="ic ' + (m.tono||'verde') + '">' + (m.icono||'&#9679;') + '</span>' +
            u.esc(m.nombre) + '</button>').join('') +
      '</div>' +

      (avisos.length
        ? '<p class="ini-tit">Hoy en la finca</p><div class="ini-hoy">' +
          avisos.map((a,i) =>
            '<div class="ini-f ' + (a.nivel||'media') + '" onclick="iniAviso(' + i + ')">' +
              '<div class="n">' + a.n + '</div>' +
              '<div class="tx"><b>' + u.esc(a.titulo) + '</b>' +
                (a.detalle ? '<span>' + u.esc(a.detalle) + '</span>' : '') + '</div>' +
              '<div class="go">&rsaquo;</div></div>').join('') +
          '</div>'
        : '<div class="ini-ok"><b>Nada urgente por hoy.</b><br>Los modulos no encontraron pendientes.</div>') +

      '<p class="ini-tit">Ultimos registros</p>' +
      '<div class="ini-act">' +
        (act.length
          ? act.map(a => '<div class="ini-a" onclick="iniIr(\'' + a.id + '\')">' +
              '<span class="chip">' + u.esc(porId[a.id] ? porId[a.id].codigo : '?') + '</span>' +
              '<span class="q">' + u.esc(a.q) + '</span>' +
              '<span class="d">' + u.dmy(a.f) + '</span></div>').join('')
          : '<div class="ini-vacio">Todavia no hay registros.</div>') +
      '</div>';
  }

  window.pintarInicio = pintar;
  function arranque(){ try{ pintar(); } catch(e){} }

  document.addEventListener('DOMContentLoaded', arranque);
  document.addEventListener('vantik:cambio', arranque);
  setTimeout(arranque, 1600);
  setTimeout(arranque, 3600);
  setTimeout(arranque, 6500);

  (function enganchar(){
    if(typeof show !== 'function'){ setTimeout(enganchar, 700); return; }
    const orig = show;
    window.show = function(v){
      const r = orig.apply(this, arguments);
      if(v === 'inicio') setTimeout(arranque, 120);
      return r;
    };
  })();
})();
