/* ===================================================================
   Vantik v3.0 - Revision del hato
   No califica al ganadero ni le da ordenes. Separa dos cosas:
     HECHOS      - verificables solos (retiro vigente, peso que bajo,
                   codigo repetido, fecha que el mismo puso y ya paso).
     COMPARACION - un numero suyo frente a una referencia que EL fija.
                   Las referencias se editan y cada aviso se silencia.
   Todo se calcula en el telefono. No sale ningun dato de la finca.
   =================================================================== */
(function(){
  const DIA = 86400000;
  const hoy = () => new Date(new Date().toISOString().slice(0,10));
  const fecha = f => f ? new Date(String(f).slice(0,10)) : null;
  const dias = (a,b) => Math.round((b - a)/DIA);
  const desdeHoy = f => f ? dias(fecha(f), hoy()) : null;
  const meses = f => f ? Math.floor(desdeHoy(f)/30.44) : null;

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  /* ---------- preferencias del usuario ---------- */
  const clave = s => 'vantik_dg_' + s + '_' + ((typeof STATE !== 'undefined' && STATE.fincaId) ? STATE.fincaId : 'x');
  const leer = (s, def) => { try { return JSON.parse(localStorage.getItem(clave(s))) ?? def; } catch(e){ return def; } };
  const guardar = (s, v) => { try { localStorage.setItem(clave(s), JSON.stringify(v)); } catch(e){} };

  const PERFILES = {
    doble:   {diasAbiertos:90,  iep:400, edadServir:24, pesoServir:320, diasPalpar:45, diasPesaje:120, hembrasPorToro:30},
    cria:    {diasAbiertos:120, iep:450, edadServir:28, pesoServir:340, diasPalpar:60, diasPesaje:180, hembrasPorToro:30},
    lecheria:{diasAbiertos:85,  iep:390, edadServir:22, pesoServir:350, diasPalpar:35, diasPesaje:90,  hembrasPorToro:40}
  };
  const NOMBRE_PERFIL = {doble:'Doble proposito', cria:'Cria y ceba extensiva', lecheria:'Lecheria especializada', propio:'Ajustado por mi'};

  const cfg = () => Object.assign({perfil:'doble', estacional:false}, PERFILES.doble, leer('cfg', {}));
  const silenciadas = () => leer('off', []);
  const silenciada = id => silenciadas().indexOf(id) >= 0;

  window.dgSilenciar = function(id){
    const l = silenciadas(); if(l.indexOf(id)<0) l.push(id);
    guardar('off', l); abrirDiagnostico();
  };
  window.dgReactivar = function(id){
    guardar('off', silenciadas().filter(x => x !== id)); abrirDiagnostico();
  };

  function css(){
    if(document.getElementById('dg-css')) return;
    const s = document.createElement('style'); s.id='dg-css';
    s.textContent = `
    #dg-overlay{position:fixed;inset:0;z-index:9000;background:#faf7f2;overflow-y:auto;display:none}
    #dg-overlay.on{display:block}
    .dg-wrap{max-width:660px;margin:0 auto;padding:18px 16px 60px}
    .dg-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .dg-head h1{font-size:23px;margin:0;letter-spacing:-.01em}
    .dg-x{background:#fff;border:1px solid #e8e1d6;border-radius:50%;width:34px;height:34px;
      font-size:19px;line-height:1;cursor:pointer;color:#7a6f63;flex-shrink:0;display:grid;place-items:center}
    .dg-sub{color:#8a7f72;font-size:13.5px;margin:5px 0 14px;line-height:1.5}

    .dg-barra{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
    .dg-pill{background:#fff;border:1px solid #e8e1d6;border-radius:99px;padding:8px 14px;font-size:13px;
      color:#5c5347;cursor:pointer;font-weight:600}
    .dg-pill:hover{background:#f2ece3}
    .dg-pill b{color:#2f2a22}

    .dg-sec{margin:22px 0 4px;font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;
      color:#9a8f81;font-weight:800}
    .dg-secsub{color:#a89e92;font-size:12.5px;margin:0 0 10px;line-height:1.5}

    .dg-item{background:#fff;border:1px solid #e8e1d6;border-radius:15px;padding:14px 15px;margin-bottom:10px;
      border-left:4px solid #d8d0c4}
    .dg-item.hecho{border-left-color:#c0392b}
    .dg-item.obs{border-left-color:#c8a04a}
    .dg-item.dato{border-left-color:#8fa8bf}
    .dg-item h4{margin:0 0 5px;font-size:15.5px}
    .dg-item p{margin:0 0 9px;color:#6b6154;font-size:13.5px;line-height:1.5}
    .dg-ref{background:#f7f3ec;border-radius:9px;padding:8px 11px;margin:0 0 10px;font-size:12.5px;color:#7a6f63}
    .dg-ref b{color:#5c5347}
    .dg-chips{display:flex;flex-wrap:wrap;gap:6px}
    .dg-chip{background:linear-gradient(180deg,#5cdc7c,#2fa851);color:#123a1e;font-weight:900;font-style:italic;
      border-radius:7px 7px 10px 10px;padding:4px 9px;font-size:12.5px;cursor:pointer;border:0}
    .dg-chip small{font-style:normal;font-weight:600;opacity:.75;margin-left:5px}
    .dg-causas{color:#5c5347;background:#f7f3ec;border-radius:9px;padding:10px 12px;margin:10px 0 0;font-size:13px;line-height:1.55}
    .dg-causas b{color:#3f382e}
    .dg-pie{display:flex;justify-content:flex-end;margin-top:10px}
    .dg-mio{background:none;border:0;color:#8a7f72;font-size:12.5px;cursor:pointer;padding:5px 2px;
      text-decoration:underline;text-underline-offset:3px}
    .dg-mio:hover{color:#5c5347}

    .dg-vacio{background:#fff;border:1px solid #e8e1d6;border-radius:15px;padding:22px;text-align:center;
      color:#6b6154;font-size:14px;line-height:1.6}
    .dg-nota{color:#a89e92;font-size:12px;margin-top:24px;line-height:1.6;text-align:center}

    /* panel de referencias */
    .dg-cfg{background:#fff;border:1px solid #e8e1d6;border-radius:16px;padding:16px;margin-bottom:14px}
    .dg-cfg h3{margin:0 0 4px;font-size:16px}
    .dg-cfg .ex{color:#8a7f72;font-size:12.5px;margin:0 0 14px;line-height:1.5}
    .dg-perf{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}
    .dg-perf button{flex:1 1 auto;background:#f7f3ec;border:1px solid #e8e1d6;border-radius:10px;
      padding:9px 10px;font-size:12.5px;cursor:pointer;color:#5c5347;font-weight:600}
    .dg-perf button.on{background:#2f7a3e;color:#fff;border-color:#2f7a3e}
    .dg-campo{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f2ece3}
    .dg-campo:last-of-type{border-bottom:0}
    .dg-campo label{flex:1;font-size:13.5px;color:#5c5347;line-height:1.35}
    .dg-campo label small{display:block;color:#a89e92;font-size:11.5px;margin-top:2px}
    #dg-overlay .dg-campo input[type=number]{width:82px;margin:0;text-align:center;padding:8px}
    .dg-check{display:flex;align-items:flex-start;gap:10px;background:#f7f3ec;border-radius:10px;padding:11px 12px;margin:12px 0 0}
    .dg-check input{margin:2px 0 0}
    .dg-check span{font-size:13px;color:#5c5347;line-height:1.45}
    .dg-check span small{display:block;color:#8a7f72;font-size:11.5px;margin-top:3px}
    #dg-overlay .dg-cfg .btn{margin:14px 0 0}

    #dg-abrir{width:100%;margin:0 0 16px;background:#fff;border:1px solid #e8e1d6;color:#2f2a22;
      border-radius:15px;padding:14px 16px;display:flex;align-items:center;gap:13px;cursor:pointer;text-align:left}
    #dg-abrir:hover{background:#fdfbf8}
    #dg-abrir .ic{width:38px;height:38px;border-radius:11px;background:#e9f5ec;color:#2f7a3e;
      display:grid;place-items:center;font-size:19px;flex-shrink:0}
    #dg-abrir .tx{flex:1}
    #dg-abrir .tx b{display:block;font-size:15px}
    #dg-abrir .tx span{color:#8a7f72;font-size:12.5px}
    #dg-abrir .n{background:#f2ece3;color:#5c5347;border-radius:99px;min-width:23px;height:23px;
      display:grid;place-items:center;font-size:12px;font-weight:800;padding:0 7px}
    `;
    document.head.appendChild(s);
  }

  /* ---------- indices ---------- */
  function indices(){
    const A = (STATE.animales||[]).filter(a => !a.fecha_baja);
    const agrupar = (lista, campo) => {
      const m = {};
      (lista||[]).forEach(x => { (m[x[campo]] = m[x[campo]]||[]).push(x); });
      Object.values(m).forEach(l => l.sort((x,y)=> fecha(y.fecha) - fecha(x.fecha)));
      return m;
    };
    return {A,
      ev: agrupar(STATE.eventos, 'animal_id'),
      pe: agrupar(STATE.pesajes, 'animal_id'),
      sa: agrupar(STATE.sanidad, 'animal_id')};
  }
  const ultimo = (lista, tipo) => (lista||[]).find(e => e.tipo_evento === tipo);

  function gdp(pesajes){
    if(!pesajes || pesajes.length < 2) return null;
    const n = pesajes[0], v = pesajes[pesajes.length-1];
    const d = dias(fecha(v.fecha), fecha(n.fecha));
    return d < 20 ? null : (n.peso_kg - v.peso_kg)/d;
  }

  /* ---------- analisis ---------- */
  function analizar(){
    const {A, ev, pe, sa} = indices();
    const C = cfg();
    const H = [];
    const ref = a => ({id:a.id, codigo:a.codigo, nota:a._nota||''});
    const add = (o) => {
      if(!o.animales.length) return;
      if(o.id !== 'retiro' && silenciada(o.id)) return;
      H.push(o);
    };

    const hembras  = A.filter(a => a.sexo === 'hembra');
    const vacas    = A.filter(a => ['vaca','vaca_desc'].includes(a.categoria_id));
    const novillas = A.filter(a => a.categoria_id === 'novilla');
    const toros    = A.filter(a => a.categoria_id === 'toro');

    /* ===== HECHOS ===== */

    // Retiro vigente (normativo, no se silencia)
    const retiro = [];
    A.forEach(a => (sa[a.id]||[]).forEach(s => {
      const d = desdeHoy(s.fecha);
      const fL = (s.retiro_leche_dias||0) - d, fC = (s.retiro_carne_dias||0) - d;
      if(fL <= 0 && fC <= 0) return;
      const p = [];
      if(fL > 0) p.push('leche ' + fL + ' d');
      if(fC > 0) p.push('carne ' + fC + ' d');
      a._nota = p.join(' / ');
      retiro.push(ref(a));
    }));
    add({id:'retiro', tipo:'hecho', area:'Hechos', titulo:'Retiro vigente',
      texto:'Recibieron un producto y todavia no se cumple el periodo de retiro que quedo anotado.',
      animales:retiro,
      causas:'El plazo lo define el producto, no Vantik. Mientras corre, esa leche y esos animales no deberian ir al mercado. Este aviso no se puede silenciar porque es normativo.'});

    // Fecha que el mismo puso y ya paso
    const vencidas = [];
    A.forEach(a => (sa[a.id]||[]).forEach(s => {
      if(!s.proxima_fecha) return;
      const d = desdeHoy(s.proxima_fecha);
      if(d <= 0) return;
      a._nota = (s.producto ? String(s.producto).slice(0,16) + ' · ' : '') + d + ' d';
      vencidas.push(ref(a));
    }));
    add({id:'vencidas', tipo:'hecho', area:'Hechos', titulo:'Proxima dosis con fecha cumplida',
      texto:'Paso la fecha que usted mismo anoto como proxima aplicacion.',
      animales:vencidas,
      causas:'Puede que ya la haya aplicado y falte registrarla, que la haya corrido a proposito, o que este pendiente. Solo usted sabe cual de las tres.'});

    // Perdida de peso (hecho medido, no comparado)
    const bajando = [];
    A.forEach(a => {
      const g = gdp(pe[a.id]);
      if(g === null || g >= -0.05) return;
      a._nota = g.toFixed(2) + ' kg/d';
      bajando.push(ref(a));
    });
    add({id:'bajando', tipo:'hecho', area:'Hechos', titulo:'Pesan menos que en el registro anterior',
      texto:'Entre su primer y su ultimo pesaje el peso bajo.',
      animales:bajando,
      causas:'<b>Suele deberse a:</b> parasitos, problemas de dentadura, enfermedad, o simplemente menos pasto que en el pesaje anterior. En vacas recien paridas la baja al inicio de la lactancia es esperable.'});

    // Codigos repetidos
    const cuenta = {};
    A.forEach(a => { const c=(a.codigo||'').toUpperCase(); cuenta[c]=(cuenta[c]||0)+1; });
    const dup = A.filter(a => cuenta[(a.codigo||'').toUpperCase()] > 1).map(a => { a._nota=''; return ref(a); });
    add({id:'dup', tipo:'hecho', area:'Hechos', titulo:'Codigos repetidos',
      texto:'Hay mas de un animal con el mismo codigo.',
      animales:dup,
      causas:'Al registrar un evento la app no puede distinguirlos, y el dato puede terminar en el animal equivocado.'});

    /* ===== COMPARACIONES ===== */

    if(!C.estacional){
      const abiertas = [];
      vacas.forEach(a => {
        const parto = ultimo(ev[a.id], 'parto');
        if(!parto) return;
        const d = desdeHoy(parto.fecha);
        if(d < C.diasAbiertos) return;
        const serv = ultimo(ev[a.id], 'servicio');
        if(serv && fecha(serv.fecha) > fecha(parto.fecha)) return;
        a._nota = d + ' d';
        abiertas.push(ref(a));
      });
      add({id:'abiertos', tipo:'obs', area:'Comparaciones', titulo:'Dias desde el parto sin servicio nuevo',
        texto:'Parieron y no aparece un servicio posterior.',
        referencia:'Su referencia: <b>' + C.diasAbiertos + ' dias</b>',
        animales:abiertas,
        causas:'<b>Puede ser:</b> que aun no se detecte el celo, condicion corporal baja, o que asi lo tenga planeado. Si en su manejo esto es normal, silencie el aviso o suba la referencia.'});

      const ipl = [];
      vacas.forEach(a => {
        const partos = (ev[a.id]||[]).filter(e => e.tipo_evento === 'parto');
        if(partos.length < 2) return;
        const d = dias(fecha(partos[1].fecha), fecha(partos[0].fecha));
        if(d <= C.iep) return;
        a._nota = d + ' d';
        ipl.push(ref(a));
      });
      add({id:'iep', tipo:'obs', area:'Comparaciones', titulo:'Intervalo entre partos',
        texto:'Tiempo transcurrido entre sus dos ultimos partos.',
        referencia:'Su referencia: <b>' + C.iep + ' dias</b>',
        animales:ipl,
        causas:'En sistemas extensivos un intervalo mas largo puede salir mas barato que forzarlo con suplemento. La cuenta depende de sus costos y del precio al que venda.'});
    }

    const sinPalpar = [];
    A.forEach(a => {
      const serv = ultimo(ev[a.id], 'servicio');
      if(!serv) return;
      const d = desdeHoy(serv.fecha);
      if(d < C.diasPalpar) return;
      const palp = ultimo(ev[a.id], 'palpacion');
      if(palp && fecha(palp.fecha) > fecha(serv.fecha)) return;
      a._nota = d + ' d';
      sinPalpar.push(ref(a));
    });
    add({id:'palpar', tipo:'obs', area:'Comparaciones', titulo:'Servidas sin diagnostico registrado',
      texto:'Tienen servicio anotado y despues no aparece palpacion ni ecografia.',
      referencia:'Su referencia: <b>' + C.diasPalpar + ' dias</b> tras el servicio',
      animales:sinPalpar,
      causas:'Puede que ya las haya diagnosticado y falte anotarlo. Si palpa por tandas cuando pasa el veterinario, ajuste la referencia a su ritmo real.'});

    const listas = [];
    novillas.forEach(a => {
      if(ultimo(ev[a.id],'servicio')) return;
      const m = meses(a.fecha_nacimiento);
      const p = pe[a.id];
      const peso = p && p.length ? p[0].peso_kg : null;
      if(!(m !== null && m >= C.edadServir) && !(peso !== null && peso >= C.pesoServir)) return;
      a._nota = (m!==null? m+' m':'') + (peso? ' / '+Math.round(peso)+' kg':'');
      listas.push(ref(a));
    });
    add({id:'listas', tipo:'obs', area:'Comparaciones', titulo:'Novillas sin servicio registrado',
      texto:'Pasaron la edad o el peso que usted marco como punto de servicio.',
      referencia:'Su referencia: <b>' + C.edadServir + ' meses</b> o <b>' + C.pesoServir + ' kg</b>',
      animales:listas,
      causas:'El punto correcto cambia con la raza, el biotipo y la comida disponible. Si su criterio es otro, muevalo aqui.'});

    const repet = [];
    hembras.forEach(a => {
      const neg = (ev[a.id]||[]).filter(e => e.tipo_evento==='palpacion' && e.resultado_diagnostico==='vacia');
      if(neg.length < 2) return;
      a._nota = neg.length + ' negativas';
      repet.push(ref(a));
    });
    add({id:'repet', tipo:'obs', area:'Comparaciones', titulo:'Dos o mas diagnosticos negativos',
      texto:'Acumulan palpaciones con resultado vacia.',
      referencia:'Se avisa desde <b>2 negativas</b>',
      animales:repet,
      causas:'<b>Puede ser:</b> nutricion, sanidad reproductiva, calidad del semen o del momento de la inseminacion. Antes de descartar vale la pena mirar cual de las cuatro.'});

    const sinPesar = [];
    A.forEach(a => {
      const p = pe[a.id];
      const d = (p && p.length) ? desdeHoy(p[0].fecha) : null;
      if(d !== null && d <= C.diasPesaje) return;
      a._nota = d === null ? 'nunca' : d + ' d';
      sinPesar.push(ref(a));
    });
    add({id:'pesar', tipo:'obs', area:'Comparaciones', titulo:'Tiempo sin pesaje registrado',
      texto:'No tienen pesaje reciente o nunca se han pesado.',
      referencia:'Su referencia: <b>' + C.diasPesaje + ' dias</b>',
      animales:sinPesar,
      causas:'Sin bascula esto puede ser inviable, y no pasa nada. Si no lleva pesos, silencie el aviso y listo.'});

    const enEdad = hembras.filter(a => ['vaca','novilla'].includes(a.categoria_id)).length;
    if(toros.length && enEdad){
      const rel = Math.round(enEdad / toros.length);
      if(rel > C.hembrasPorToro){
        toros.forEach(t => t._nota = '');
        add({id:'toro', tipo:'obs', area:'Comparaciones', titulo:'Hembras por reproductor',
          texto:'Hay ' + rel + ' hembras en edad reproductiva por cada toro de la finca.',
          referencia:'Su referencia: <b>' + C.hembrasPorToro + ' hembras</b> por toro',
          animales:toros.map(ref),
          causas:'Solo aplica si usa monta natural. Con inseminacion la relacion no significa nada: silencie el aviso.'});
      }
    }

    /* ===== DATOS QUE LE FALTAN A VANTIK ===== */
    const D = [];
    const addD = (id, titulo, texto, animales, para) => {
      if(!animales.length || silenciada(id)) return;
      D.push({id, tipo:'dato', area:'Datos', titulo, texto, animales, causas:para});
    };

    addD('fnac','Sin fecha de nacimiento','',
      A.filter(a => !a.fecha_nacimiento).map(a => { a._nota=''; return ref(a); }),
      'Sin ella Vantik no puede calcular edad ni sugerir la categoria sola. Una fecha aproximada le sirve.');
    addD('raza','Sin raza','',
      A.filter(a => !a.raza).map(a => { a._nota=''; return ref(a); }),
      'Sin raza no se pueden comparar rendimientos entre grupos geneticos en los reportes.');
    addD('madre','Sin madre asignada','',
      A.filter(a => !a.madre_id && meses(a.fecha_nacimiento) !== null && meses(a.fecha_nacimiento) <= 36)
       .map(a => { a._nota=''; return ref(a); }),
      'El arbol genealogico queda cortado y no se puede ver que vacas dejan mejores crias.');
    addD('sansin','Sin registros de sanidad','',
      A.filter(a => !(sa[a.id]||[]).length && meses(a.fecha_nacimiento) >= 4)
       .map(a => { a._nota=''; return ref(a); }),
      'Puede que si los haya aplicado. Anotarlos sirve para certificar y para tener el historial a la mano.');

    return {H, D, C};
  }

  /* ---------- pintar ---------- */
  function bloque(h){
    return '<div class="dg-item '+h.tipo+'">'+
      '<h4>'+esc(h.titulo)+'</h4>'+
      (h.texto ? '<p>'+esc(h.texto)+'</p>' : '')+
      (h.referencia ? '<div class="dg-ref">'+h.referencia+' &nbsp;·&nbsp; '+
        '<a href="#" onclick="dgCfg();return false" style="color:#2f7a3e">cambiar</a></div>' : '')+
      '<div class="dg-chips">'+ h.animales.slice(0,40).map(x =>
        '<button class="dg-chip" onclick="dgIr(\''+x.id+'\')">'+esc(x.codigo)+
        (x.nota? '<small>'+esc(x.nota)+'</small>':'')+'</button>').join('') +
        (h.animales.length>40 ? '<span style="align-self:center;color:#8a7f72;font-size:12.5px">y '+(h.animales.length-40)+' mas</span>':'')+
      '</div>'+
      (h.causas ? '<p class="dg-causas">'+h.causas+'</p>' : '')+
      (h.id !== 'retiro' ? '<div class="dg-pie">'+
        '<button class="dg-mio" onclick="dgSilenciar(\''+h.id+'\')">Asi lo manejo yo, no me lo muestres</button></div>' : '')+
    '</div>';
  }

  function pintar(){
    const {H, D, C} = analizar();
    const total = (STATE.animales||[]).filter(a=>!a.fecha_baja).length;
    const off = silenciadas();
    const hechos = H.filter(h => h.tipo==='hecho');
    const obs    = H.filter(h => h.tipo==='obs');

    return '<div class="dg-wrap">'+
      '<div class="dg-head"><h1>Revision del hato</h1>'+
        '<button class="dg-x" onclick="dgCerrar()">&times;</button></div>'+
      '<p class="dg-sub">Lo que Vantik alcanza a ver en sus '+total+' animales. '+
        'Son observaciones para que usted decida, no recomendaciones. '+
        'Todo se calcula en su telefono; no sale ningun dato de la finca.</p>'+

      '<div class="dg-barra">'+
        '<button class="dg-pill" onclick="dgCfg()">Referencias: <b>'+esc(NOMBRE_PERFIL[C.perfil]||'Propio')+'</b></button>'+
        (off.length ? '<button class="dg-pill" onclick="dgOcultos()">Avisos silenciados: <b>'+off.length+'</b></button>' : '')+
      '</div>'+

      (hechos.length ?
        '<div class="dg-sec">Hechos</div>'+
        '<p class="dg-secsub">Esto no depende de ningun criterio: son datos suyos contra el calendario.</p>'+
        hechos.map(bloque).join('') : '')+

      (obs.length ?
        '<div class="dg-sec">Comparaciones con sus referencias</div>'+
        '<p class="dg-secsub">Aqui Vantik solo compara un numero suyo con el valor que usted fijo. '+
        'Si su manejo es otro, cambie la referencia o silencie el aviso.</p>'+
        obs.map(bloque).join('') : '')+

      (D.length ?
        '<div class="dg-sec">Datos que le faltan a Vantik</div>'+
        '<p class="dg-secsub">Esto no dice nada de como maneja la finca. Son campos vacios que dejan '+
        'funciones de la app a medias.</p>'+
        D.map(bloque).join('') : '')+

      (!H.length && !D.length ?
        '<div class="dg-vacio">No encontre nada que mostrarle con los datos y las referencias de hoy.<br>'+
        'Si cree que deberia estar viendo algo, revise las referencias.</div>' : '')+

      '<p class="dg-nota">Vantik no sabe como es su finca ni su clima ni sus costos.<br>'+
        'Usted sabe. Esto es solo lo que se alcanza a ver desde los datos.</p>'+
    '</div>';
  }

  /* ---------- panel de referencias ---------- */
  const CAMPOS = [
    ['diasAbiertos','Dias desde el parto para volver a servir','Cuando quiere que le avise'],
    ['iep','Intervalo entre partos aceptable','En dias'],
    ['diasPalpar','Dias tras el servicio para palpar','Cuando espera tener el diagnostico'],
    ['edadServir','Edad para servir novillas','En meses'],
    ['pesoServir','Peso para servir novillas','En kilos'],
    ['diasPesaje','Cada cuanto pesa','En dias'],
    ['hembrasPorToro','Hembras por toro','Solo si usa monta natural']
  ];

  window.dgCfg = function(){
    const C = cfg();
    const o = document.getElementById('dg-overlay');
    o.innerHTML = '<div class="dg-wrap">'+
      '<div class="dg-head"><h1>Sus referencias</h1>'+
        '<button class="dg-x" onclick="abrirDiagnostico()">&times;</button></div>'+
      '<p class="dg-sub">Vantik no tiene un numero correcto. Estos son los suyos, y son los unicos '+
        'contra los que se va a comparar.</p>'+
      '<div class="dg-cfg">'+
        '<h3>Punto de partida</h3>'+
        '<p class="ex">Elija el que mas se parezca a su finca y despues ajuste lo que quiera.</p>'+
        '<div class="dg-perf">'+
          Object.keys(PERFILES).map(k =>
            '<button class="'+(C.perfil===k?'on':'')+'" onclick="dgPerfil(\''+k+'\')">'+
            esc(NOMBRE_PERFIL[k])+'</button>').join('')+
        '</div>'+
        CAMPOS.map(([k,t,s]) =>
          '<div class="dg-campo"><label>'+esc(t)+'<small>'+esc(s)+'</small></label>'+
          '<input type="number" id="dgc-'+k+'" value="'+C[k]+'" min="1"></div>').join('')+
        '<label class="dg-check"><input type="checkbox" id="dgc-estacional"'+(C.estacional?' checked':'')+'>'+
          '<span>Manejo pariciones por temporada'+
          '<small>Si marca esto, Vantik deja de avisarle por dias abiertos e intervalo entre partos, '+
          'porque en ese manejo los tiempos largos son a proposito.</small></span></label>'+
        '<button class="btn" onclick="dgGuardarCfg()">Guardar</button>'+
      '</div>'+
      '<p class="dg-nota">Se guardan en este dispositivo, para esta finca.</p>'+
    '</div>';
    o.scrollTop = 0;
  };

  window.dgPerfil = function(k){
    guardar('cfg', Object.assign({}, PERFILES[k], {perfil:k, estacional:cfg().estacional}));
    dgCfg();
  };

  window.dgGuardarCfg = function(){
    const nuevo = {perfil:'propio', estacional: document.getElementById('dgc-estacional').checked};
    CAMPOS.forEach(([k]) => {
      const v = parseInt(document.getElementById('dgc-'+k).value, 10);
      if(v > 0) nuevo[k] = v;
    });
    // si coincide con un perfil, conservar su nombre
    Object.keys(PERFILES).forEach(k => {
      if(CAMPOS.every(([c]) => nuevo[c] === PERFILES[k][c])) nuevo.perfil = k;
    });
    guardar('cfg', nuevo);
    abrirDiagnostico();
  };

  window.dgOcultos = function(){
    const off = silenciadas();
    const o = document.getElementById('dg-overlay');
    o.innerHTML = '<div class="dg-wrap">'+
      '<div class="dg-head"><h1>Avisos silenciados</h1>'+
        '<button class="dg-x" onclick="abrirDiagnostico()">&times;</button></div>'+
      '<p class="dg-sub">Estos no se le muestran porque usted dijo que asi maneja su finca.</p>'+
      (off.length ? off.map(id =>
        '<div class="dg-item"><h4>'+esc(id)+'</h4>'+
        '<div class="dg-pie"><button class="dg-mio" onclick="dgReactivar(\''+id+'\')">Volver a mostrarlo</button></div></div>'
      ).join('') : '<div class="dg-vacio">No hay ninguno silenciado.</div>')+
    '</div>';
    o.scrollTop = 0;
  };

  window.dgIr = function(id){
    dgCerrar();
    setTimeout(function(){ if(typeof _openFicha === 'function') _openFicha(id); }, 80);
  };

  window.dgCerrar = function(){
    const o = document.getElementById('dg-overlay');
    if(o) o.classList.remove('on');
    document.body.style.overflow = '';
  };

  window.abrirDiagnostico = function(){
    css();
    let o = document.getElementById('dg-overlay');
    if(!o){ o = document.createElement('div'); o.id='dg-overlay'; document.body.appendChild(o); }
    o.innerHTML = pintar();
    o.classList.add('on');
    o.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  };

  /* boton en Inicio */
  function ponerBoton(){
    const c = document.querySelector('#view-inicio .content');
    if(!c || document.getElementById('dg-abrir')) return;
    if(!(STATE.animales||[]).length) return;
    let n = 0;
    try { const r = analizar(); n = r.H.length + r.D.length; } catch(e){}
    const b = document.createElement('button');
    b.id = 'dg-abrir';
    b.innerHTML = '<span class="ic">&#9873;</span>'+
      '<span class="tx"><b>Revision del hato</b>'+
      '<span>Lo que Vantik alcanza a ver en sus datos</span></span>'+
      (n ? '<span class="n">'+n+'</span>' : '');
    b.onclick = abrirDiagnostico;
    css();
    c.insertBefore(b, c.firstChild);
  }
  document.addEventListener('DOMContentLoaded', ponerBoton);
  setTimeout(ponerBoton, 1500);
  setTimeout(ponerBoton, 3500);
  setTimeout(ponerBoton, 6000);
})();
