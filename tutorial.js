/* ===================================================================
   Vantik - Primeros pasos
   No trae una lista escrita a mano: pregunta al registro que pasos
   publica cada modulo (Vantik.pasos). Un modulo nuevo que publique
   sus pasos aparece aqui solo.
   =================================================================== */
(function(){
  const V = window.Vantik;
  if(!V){ return; }
  const u = V.u;
  const CLAVE = function(){ return 'vantik_tutorial_' + ((typeof STATE!=='undefined' && STATE.fincaId) ? STATE.fincaId : 'x'); };
  const visto = function(){ try { return localStorage.getItem(CLAVE()) === 'si'; } catch(e){ return false; } };
  const marcar = function(){ try { localStorage.setItem(CLAVE(), 'si'); } catch(e){} };

  function css(){
    if(document.getElementById('tu-css')) return;
    const s=document.createElement('style'); s.id='tu-css';
    s.textContent = [
      '#tu-overlay{position:fixed;inset:0;z-index:9200;background:rgba(30,24,16,.5);display:none;',
      'align-items:center;justify-content:center;padding:18px}',
      '#tu-overlay.on{display:flex}',
      '.tu-caja{background:#faf7f2;border-radius:20px;max-width:460px;width:100%;max-height:88vh;',
      'overflow-y:auto;padding:22px;box-shadow:0 20px 50px rgba(0,0,0,.28)}',
      '.tu-caja h2{margin:0 0 4px;font-size:21px}',
      '.tu-caja .ex{color:#8a7f72;font-size:13.5px;margin:0 0 18px;line-height:1.5}',
      '.tu-paso{display:flex;gap:12px;background:#fff;border:1px solid #e8e1d6;border-radius:14px;',
      'padding:13px 14px;margin-bottom:9px;cursor:pointer;text-align:left}',
      '.tu-paso:hover{background:#fdfbf8}',
      '.tu-paso.listo{opacity:.62}',
      '.tu-mark{width:26px;height:26px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;',
      'font-size:13px;font-weight:800;background:#f2ece3;color:#a89e92}',
      '.tu-paso.listo .tu-mark{background:#2f7a3e;color:#fff}',
      '.tu-tx b{display:block;font-size:14.5px;color:#2f2a22;margin-bottom:3px}',
      '.tu-tx span{font-size:12.5px;color:#7a6f63;line-height:1.45}',
      '.tu-barra{height:6px;background:#e8e1d6;border-radius:99px;overflow:hidden;margin:0 0 16px}',
      '.tu-barra i{display:block;height:100%;background:#2f7a3e;border-radius:99px;transition:width .4s}',
      '.tu-pie{display:flex;gap:9px;margin-top:14px}',
      '#tu-overlay .tu-pie button{flex:1;margin:0;padding:12px;border-radius:12px;font-size:14px;',
      'font-weight:700;cursor:pointer;border:1px solid #e0d8cc;background:#fff;color:#5c5347}',
      '#tu-overlay .tu-pie button.si{background:#2f7a3e;color:#fff;border-color:#2f7a3e}',
      '#tu-abrir{width:100%;margin:0 0 16px;background:#fff;border:1px solid #e8e1d6;color:#2f2a22;',
      'border-radius:15px;padding:13px 15px;display:flex;align-items:center;gap:12px;cursor:pointer;text-align:left}',
      '#tu-abrir .ic{width:34px;height:34px;border-radius:11px;background:#fff4e5;color:#8a5a12;',
      'display:grid;place-items:center;font-size:16px;flex-shrink:0}',
      '#tu-abrir .tx{flex:1;font-size:14px;font-weight:700}',
      '#tu-abrir .tx small{display:block;font-weight:400;color:#8a7f72;font-size:12.5px;margin-top:2px}',
      '#tu-abrir .n{background:#f2ece3;color:#5c5347;border-radius:99px;padding:3px 9px;font-size:12px;font-weight:800}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function pasos(){
    const base = [
      {titulo:'Crea tus lotes', texto:'Los potreros o grupos en los que reparte el ganado.',
       hecho: (STATE.lotes||[]).length > 0, ir:function(){ show('finca'); }},
      {titulo:'Registra tus animales', texto:'Uno por uno, o varios seguidos con la carga rapida.',
       hecho: u.animales().length > 0, ir:function(){ show('animales'); }},
      {titulo:'Anota un evento', texto:'Un servicio, una palpacion, un parto o una vacuna.',
       hecho: (STATE.eventos||[]).length > 0 || (STATE.sanidad||[]).length > 0, ir:function(){ show('registrar'); }},
      {titulo:'Pesa tus animales', texto:'Con dos pesajes Vantik ya calcula la ganancia diaria.',
       hecho: (STATE.pesajes||[]).length > 0, ir:function(){ show('animales'); }}
    ];
    const delRegistro = V.pasos().map(function(p){
      const m = V.modulos.filter(function(x){ return x.id === p.modulo; })[0];
      return {titulo:p.titulo, texto:p.texto, hecho:!!p.hecho,
              ir: m && m.accion ? m.accion : function(){ show('inicio'); }};
    });
    return base.concat(delRegistro);
  }

  window.tuIr = function(i){
    const p = pasos()[i];
    cerrarTutorial();
    if(p && p.ir) setTimeout(p.ir, 120);
  };
  window.cerrarTutorial = function(){
    const o=document.getElementById('tu-overlay'); if(o) o.classList.remove('on');
    document.body.style.overflow='';
  };
  window.listoTutorial = function(){ marcar(); cerrarTutorial(); poner(); };

  window.abrirTutorial = function(){
    css();
    let o=document.getElementById('tu-overlay');
    if(!o){ o=document.createElement('div'); o.id='tu-overlay';
      o.onclick=function(e){ if(e.target===o) cerrarTutorial(); };
      document.body.appendChild(o); }
    const ps = pasos();
    const hechos = ps.filter(function(p){ return p.hecho; }).length;
    const pct = Math.round(hechos/ps.length*100);

    o.innerHTML = '<div class="tu-caja">' +
      '<h2>Primeros pasos</h2>' +
      '<p class="ex">' + hechos + ' de ' + ps.length + ' listos. Toca cualquiera para ir alli.</p>' +
      '<div class="tu-barra"><i style="width:' + pct + '%"></i></div>' +
      ps.map(function(p,i){
        return '<div class="tu-paso' + (p.hecho?' listo':'') + '" onclick="tuIr(' + i + ')">' +
          '<span class="tu-mark">' + (p.hecho ? '&#10003;' : (i+1)) + '</span>' +
          '<span class="tu-tx"><b>' + u.esc(p.titulo) + '</b><span>' + u.esc(p.texto) + '</span></span>' +
        '</div>';
      }).join('') +
      '<div class="tu-pie">' +
        '<button onclick="cerrarTutorial()">Cerrar</button>' +
        '<button class="si" onclick="listoTutorial()">No mostrar mas</button>' +
      '</div></div>';
    o.classList.add('on');
    document.body.style.overflow='hidden';
  };

  function poner(){
    const c = document.querySelector('#view-inicio .content');
    if(!c) return;
    css();
    const ps = pasos();
    const faltan = ps.filter(function(p){ return !p.hecho; }).length;
    let b = document.getElementById('tu-abrir');

    if(!faltan && visto()){ if(b) b.remove(); return; }

    if(!b){
      b = document.createElement('button'); b.id='tu-abrir';
      b.onclick = abrirTutorial;
      c.insertBefore(b, c.firstChild);
    }
    b.innerHTML = '<span class="ic">&#9873;</span>' +
      '<span class="tx">Primeros pasos' +
      '<small>' + (faltan ? 'Te faltan ' + faltan + ' para tener la finca al dia' : 'Todo listo') + '</small></span>' +
      '<span class="n">' + (ps.length - faltan) + '/' + ps.length + '</span>';
  }

  /* al entrar por primera vez, abrirlo solo */
  function primeraVez(){
    if(visto()) return;
    if(!(typeof STATE !== 'undefined' && STATE.fincaId)) return;
    if(u.animales().length > 0) return;   // ya tiene datos, no lo molestamos
    abrirTutorial(); marcar();
  }

  function arranque(){ try{ poner(); } catch(e){} }
  document.addEventListener('DOMContentLoaded', arranque);
  document.addEventListener('vantik:cambio', arranque);
  setTimeout(arranque, 1800);
  setTimeout(arranque, 4000);
  setTimeout(primeraVez, 3200);
  (function eng(){
    if(typeof show !== 'function'){ setTimeout(eng, 700); return; }
    const o = show;
    window.show = function(v){ const r=o.apply(this,arguments); if(v==='inicio') setTimeout(arranque,150); return r; };
  })();
})();
