/* ===================================================================
   Vantik - Predicciones
   Proyecta a partir de lo que ya esta registrado: fecha probable de
   parto, cuando secar, cuando una novilla llegara al peso de servir
   y cuanto pesara un animal de ceba. Son estimaciones, no certezas:
   cada una dice de que dato sale.
   =================================================================== */
(function(){
  const V = window.Vantik;
  if(!V){ return; }
  const u = V.u;
  const DIA = 86400000;

  /* gestacion: el usuario la puede cambiar en las referencias */
  function gestacion(){
    try {
      const k = 'vantik_dg_cfg_' + ((typeof STATE !== 'undefined' && STATE.fincaId) ? STATE.fincaId : 'x');
      const c = JSON.parse(localStorage.getItem(k)) || {};
      return c.gestacion || 285;
    } catch(e){ return 285; }
  }

  function css(){
    if(document.getElementById('pr-css')) return;
    const s = document.createElement('style'); s.id='pr-css';
    s.textContent = [
      '#pr-overlay{position:fixed;inset:0;z-index:9000;background:#faf7f2;overflow-y:auto;display:none}',
      '#pr-overlay.on{display:block}',
      '.pr-wrap{max-width:660px;margin:0 auto;padding:18px 16px 60px}',
      '.pr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
      '.pr-head h1{font-size:23px;margin:0}',
      '.pr-x{background:#fff;border:1px solid #e8e1d6;border-radius:50%;width:34px;height:34px;font-size:19px;',
      'cursor:pointer;color:#7a6f63;flex-shrink:0;display:grid;place-items:center}',
      '.pr-sub{color:#8a7f72;font-size:13.5px;margin:5px 0 16px;line-height:1.5}',
      '.pr-sec{margin:22px 0 4px;font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;color:#9a8f81;font-weight:800}',
      '.pr-nota{color:#a89e92;font-size:12.5px;margin:0 0 10px;line-height:1.5}',
      '.pr-lista{display:flex;flex-direction:column;gap:1px;background:#e8e1d6;border:1px solid #e8e1d6;border-radius:14px;overflow:hidden}',
      '.pr-f{display:flex;align-items:center;gap:11px;background:#fff;padding:11px 13px;cursor:pointer}',
      '.pr-f:hover{background:#fdfbf8}',
      '.pr-chip{background:linear-gradient(180deg,#5cdc7c,#2fa851);color:#123a1e;font-weight:900;font-style:italic;',
      'border-radius:6px 6px 9px 9px;padding:3px 9px;font-size:12px;white-space:nowrap}',
      '.pr-q{flex:1;font-size:13px;color:#5c5347;line-height:1.4}',
      '.pr-q b{color:#2f2a22}',
      '.pr-c{font-size:12px;font-weight:700;white-space:nowrap;padding:3px 9px;border-radius:99px}',
      '.pr-c.pronto{background:#fdecea;color:#8c1d16}',
      '.pr-c.medio{background:#fff4e5;color:#8a5a12}',
      '.pr-c.lejos{background:#eaf2fb;color:#1d4e82}',
      '.pr-vacio{background:#fff;color:#a89e92;font-size:13px;text-align:center;padding:16px}',
      '.pr-pie{color:#a89e92;font-size:12px;margin-top:24px;line-height:1.6;text-align:center}'
    ].join('\n');
    document.head.appendChild(s);
  }

  const fmt = d => String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();
  const tono = d => d <= 30 ? 'pronto' : (d <= 90 ? 'medio' : 'lejos');

  /* ganancia diaria a partir de los pesajes */
  function gdp(lista){
    if(!lista || lista.length < 2) return null;
    const n = lista[0], v = lista[lista.length-1];
    const d = u.dias(u.fecha(v.fecha), u.fecha(n.fecha));
    if(d < 20) return null;
    const g = (n.peso_kg - v.peso_kg)/d;
    return g > 0 ? g : null;
  }

  function calcular(){
    const A = u.animales();
    const ev = u.porAnimal(STATE.eventos), pe = u.porAnimal(STATE.pesajes);
    const G = gestacion();
    const partos = [], secados = [], novillas = [], ceba = [];

    A.forEach(function(a){
      const eventos = ev[a.id] || [];
      const pesos = pe[a.id] || [];

      /* --- parto estimado --- */
      if(a.estado_actual_id === 'prenada'){
        const serv = eventos.find(function(e){ return e.tipo_evento === 'servicio'; });
        if(serv){
          const f = new Date(u.fecha(serv.fecha).getTime() + G*DIA);
          const faltan = u.dias(u.hoy(), f);
          if(faltan > -30){
            partos.push({id:a.id, cod:a.codigo, fecha:f, faltan:faltan, desde:serv.fecha});
            /* secado: 60 dias antes del parto */
            const fs = new Date(f.getTime() - 60*DIA);
            const fd = u.dias(u.hoy(), fs);
            if(fd > -15 && ['lactando','parida'].indexOf(a.estado_actual_id) < 0){
              secados.push({id:a.id, cod:a.codigo, fecha:fs, faltan:fd});
            }
          }
        }
      }

      /* --- novilla: cuando llega al peso de servir --- */
      if(a.categoria_id === 'novilla' && !eventos.some(function(e){ return e.tipo_evento === 'servicio'; })){
        const g = gdp(pesos);
        const actual = pesos.length ? pesos[0].peso_kg : null;
        let meta = 320;
        try {
          const k='vantik_dg_cfg_'+((typeof STATE!=='undefined'&&STATE.fincaId)?STATE.fincaId:'x');
          const c=JSON.parse(localStorage.getItem(k))||{}; if(c.pesoServir) meta=c.pesoServir;
        } catch(e){}
        if(g && actual !== null && actual < meta){
          const d = Math.ceil((meta - actual)/g);
          if(d < 600) novillas.push({id:a.id, cod:a.codigo, actual:actual, meta:meta, g:g,
            faltan:d, fecha:new Date(u.hoy().getTime() + d*DIA)});
        }
      }

      /* --- ceba: peso proyectado a 90 dias --- */
      if(['novillo','ternero'].indexOf(a.categoria_id) >= 0 || a.estado_actual_id === 'engorde'){
        const g = gdp(pesos);
        const actual = pesos.length ? pesos[0].peso_kg : null;
        if(g && actual !== null){
          ceba.push({id:a.id, cod:a.codigo, actual:actual, g:g, proyectado: Math.round(actual + g*90)});
        }
      }
    });

    partos.sort(function(x,y){ return x.faltan - y.faltan; });
    secados.sort(function(x,y){ return x.faltan - y.faltan; });
    novillas.sort(function(x,y){ return x.faltan - y.faltan; });
    ceba.sort(function(x,y){ return y.g - x.g; });
    return {partos:partos, secados:secados, novillas:novillas, ceba:ceba, G:G};
  }

  window.prIr = function(id){ prCerrar(); setTimeout(function(){ if(typeof _openFicha==='function') _openFicha(id); }, 80); };
  window.prCerrar = function(){ const o=document.getElementById('pr-overlay'); if(o) o.classList.remove('on'); document.body.style.overflow=''; };

  function lista(items, pinta){
    if(!items.length) return '<div class="pr-lista"><div class="pr-vacio">Nada por aqui todavia.</div></div>';
    return '<div class="pr-lista">' + items.slice(0,30).map(pinta).join('') + '</div>';
  }

  window.abrirPredicciones = function(){
    css();
    let o = document.getElementById('pr-overlay');
    if(!o){ o=document.createElement('div'); o.id='pr-overlay'; document.body.appendChild(o); }
    const D = calcular();

    const fila = function(id, cod, texto, etiqueta, clase){
      return '<div class="pr-f" onclick="prIr(\'' + id + '\')">' +
        '<span class="pr-chip">' + u.esc(cod) + '</span>' +
        '<span class="pr-q">' + texto + '</span>' +
        (etiqueta ? '<span class="pr-c ' + clase + '">' + u.esc(etiqueta) + '</span>' : '') +
      '</div>';
    };

    o.innerHTML = '<div class="pr-wrap">' +
      '<div class="pr-head"><h1>Lo que viene</h1><button class="pr-x" onclick="prCerrar()">&times;</button></div>' +
      '<p class="pr-sub">Proyecciones a partir de lo que ya tiene registrado. Son estimaciones: ' +
        'cada una dice de donde sale el numero.</p>' +

      '<div class="pr-sec">Partos estimados</div>' +
      '<p class="pr-nota">Fecha del servicio mas ' + D.G + ' dias de gestacion.</p>' +
      lista(D.partos, function(p){
        return fila(p.id, p.cod, '<b>' + fmt(p.fecha) + '</b>',
          p.faltan < 0 ? 'atrasado ' + (-p.faltan) + ' d' : 'en ' + p.faltan + ' d',
          tono(Math.abs(p.faltan)));
      }) +

      '<div class="pr-sec">Secado sugerido</div>' +
      '<p class="pr-nota">Sesenta dias antes del parto estimado, para que la vaca descanse.</p>' +
      lista(D.secados, function(s){
        return fila(s.id, s.cod, '<b>' + fmt(s.fecha) + '</b>',
          s.faltan < 0 ? 'ya paso' : 'en ' + s.faltan + ' d', tono(Math.abs(s.faltan)));
      }) +

      '<div class="pr-sec">Novillas: cuando llegan al peso de servir</div>' +
      '<p class="pr-nota">Con la ganancia diaria que traen segun sus pesajes.</p>' +
      lista(D.novillas, function(n){
        return fila(n.id, n.cod,
          Math.round(n.actual) + ' kg, sube ' + n.g.toFixed(2) + ' kg/dia &rarr; <b>' + n.meta + ' kg</b> hacia el ' + fmt(n.fecha),
          'en ' + n.faltan + ' d', tono(n.faltan));
      }) +

      '<div class="pr-sec">Ceba: peso proyectado a 90 dias</div>' +
      '<p class="pr-nota">Si mantienen la ganancia que traen hasta hoy.</p>' +
      lista(D.ceba, function(c){
        return fila(c.id, c.cod,
          Math.round(c.actual) + ' kg &rarr; <b>' + c.proyectado + ' kg</b>',
          '+' + c.g.toFixed(2) + ' kg/d', 'lejos');
      }) +

      '<p class="pr-pie">Una proyeccion vale lo que valen los datos que la alimentan.<br>' +
        'Entre mas seguido pese y anote, mas se acerca.</p>' +
    '</div>';

    o.classList.add('on'); o.scrollTop = 0; document.body.style.overflow = 'hidden';
  };

  /* se anuncia: Inicio y el tutorial lo recogen solos */
  function registrarse(){
    if(!window.Vantik) return;
    Vantik.registrar({
      id:'predicciones', nombre:'Lo que viene', icono:'&#8599;', tono:'azul', orden:15,
      accion: function(){ abrirPredicciones(); },
      avisos: function(){
        if(!u.hayDatos()) return [];
        const D = calcular();
        const av = [];
        const pronto = D.partos.filter(function(p){ return p.faltan >= 0 && p.faltan <= 30; });
        if(pronto.length) av.push({nivel:'media', n:pronto.length, titulo:'Partos en los proximos 30 dias',
          detalle:'El mas cercano: ' + pronto[0].cod + ' hacia el ' + fmt(pronto[0].fecha),
          accion:function(){ abrirPredicciones(); }});
        const sec = D.secados.filter(function(s){ return s.faltan >= 0 && s.faltan <= 15; });
        if(sec.length) av.push({nivel:'media', n:sec.length, titulo:'Toca ir secando',
          detalle:'Se acercan a los 60 dias antes del parto', accion:function(){ abrirPredicciones(); }});
        return av;
      },
      pasos: function(){
        return [{titulo:'Mira lo que viene',
                 texto:'Con los servicios y los pesajes, Vantik calcula partos, secados y cuando estaran listas.',
                 hecho: u.hayDatos() && (STATE.eventos||[]).length > 0}];
      }
    });
  }
  setTimeout(registrarse, 900);
  setTimeout(registrarse, 3000);
})();
