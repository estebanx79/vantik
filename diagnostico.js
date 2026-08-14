/* ===================================================================
   Vantik v2.6 - Diagnostico del hato
   Revisa los datos de la finca y saca conclusiones con cuentas, no
   con IA: dias abiertos, intervalos entre partos, novillas en edad
   de servir, ganancias de peso flojas, retiros vigentes y vacunas
   vencidas. Todo se calcula en el telefono, sin mandar datos afuera.
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
    .dg-sub{color:#8a7f72;font-size:13.5px;margin:5px 0 16px;line-height:1.45}

    .dg-marcador{background:#fff;border:1px solid #e8e1d6;border-radius:16px;padding:16px;margin-bottom:14px;
      display:flex;align-items:center;gap:16px}
    .dg-aro{width:74px;height:74px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;
      font-size:23px;font-weight:800;color:#2f2a22}
    .dg-marcador .t{flex:1}
    .dg-marcador .t b{display:block;font-size:15.5px;margin-bottom:3px}
    .dg-marcador .t span{color:#8a7f72;font-size:13px;line-height:1.45}

    .dg-resumen{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-bottom:16px}
    .dg-r{border-radius:13px;padding:11px 12px;border:1px solid transparent}
    .dg-r .v{font-size:21px;font-weight:800;line-height:1.1}
    .dg-r .k{font-size:11.5px;margin-top:2px}
    .dg-r.alta{background:#fdecea;border-color:#f5c6c0} .dg-r.alta .v,.dg-r.alta .k{color:#8c1d16}
    .dg-r.media{background:#fff4e5;border-color:#f5ddb8} .dg-r.media .v,.dg-r.media .k{color:#8a5a12}
    .dg-r.info{background:#eaf2fb;border-color:#c9dcf2} .dg-r.info .v,.dg-r.info .k{color:#1d4e82}
    .dg-r.ok{background:#e9f5ec;border-color:#c8e4d0} .dg-r.ok .v,.dg-r.ok .k{color:#1f6b32}

    .dg-sec{margin:22px 0 10px;font-size:11.5px;letter-spacing:.09em;text-transform:uppercase;
      color:#9a8f81;font-weight:800}
    .dg-item{background:#fff;border:1px solid #e8e1d6;border-radius:15px;padding:14px 15px;margin-bottom:10px;
      border-left:4px solid #ccc}
    .dg-item.alta{border-left-color:#c0392b}
    .dg-item.media{border-left-color:#e0912f}
    .dg-item.info{border-left-color:#3d7fc1}
    .dg-item h4{margin:0 0 5px;font-size:15.5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .dg-tag{font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;
      padding:3px 8px;border-radius:99px}
    .dg-item.alta .dg-tag{background:#fdecea;color:#8c1d16}
    .dg-item.media .dg-tag{background:#fff4e5;color:#8a5a12}
    .dg-item.info .dg-tag{background:#eaf2fb;color:#1d4e82}
    .dg-item p{margin:0 0 9px;color:#6b6154;font-size:13.5px;line-height:1.5}
    .dg-item p.rec{color:#2f6b3c;background:#f1f8f3;border-radius:9px;padding:9px 11px;margin:9px 0 0;font-size:13px}
    .dg-item p.rec b{color:#1f5a2c}
    .dg-chips{display:flex;flex-wrap:wrap;gap:6px}
    .dg-chip{background:linear-gradient(180deg,#5cdc7c,#2fa851);color:#123a1e;font-weight:900;font-style:italic;
      border-radius:7px 7px 10px 10px;padding:4px 9px;font-size:12.5px;cursor:pointer;border:0}
    .dg-chip small{font-style:normal;font-weight:600;opacity:.75;margin-left:5px}
    .dg-vacio{background:#e9f5ec;border:1px solid #c8e4d0;border-radius:15px;padding:20px;text-align:center;
      color:#1f6b32;font-size:14px}
    .dg-nota{color:#a89e92;font-size:12px;margin-top:22px;line-height:1.5;text-align:center}
    #dg-abrir{width:100%;margin:0 0 16px;background:#fff;border:1px solid #e8e1d6;color:#2f2a22;
      border-radius:15px;padding:14px 16px;display:flex;align-items:center;gap:13px;cursor:pointer;text-align:left}
    #dg-abrir:hover{background:#fdfbf8}
    #dg-abrir .ic{width:38px;height:38px;border-radius:11px;background:#e9f5ec;color:#2f7a3e;
      display:grid;place-items:center;font-size:19px;flex-shrink:0}
    #dg-abrir .tx{flex:1}
    #dg-abrir .tx b{display:block;font-size:15px}
    #dg-abrir .tx span{color:#8a7f72;font-size:12.5px}
    #dg-abrir .n{background:#c0392b;color:#fff;border-radius:99px;min-width:23px;height:23px;
      display:grid;place-items:center;font-size:12px;font-weight:800;padding:0 6px}
    `;
    document.head.appendChild(s);
  }

  /* ---------- indices ---------- */
  function indices(){
    const A = (STATE.animales||[]).filter(a => !a.fecha_baja);
    const porId = {}; A.forEach(a => porId[a.id] = a);

    const evPorAnimal = {};
    (STATE.eventos||[]).forEach(e => { (evPorAnimal[e.animal_id] = evPorAnimal[e.animal_id]||[]).push(e); });
    Object.values(evPorAnimal).forEach(l => l.sort((x,y)=> fecha(y.fecha) - fecha(x.fecha)));

    const pePorAnimal = {};
    (STATE.pesajes||[]).forEach(p => { (pePorAnimal[p.animal_id] = pePorAnimal[p.animal_id]||[]).push(p); });
    Object.values(pePorAnimal).forEach(l => l.sort((x,y)=> fecha(y.fecha) - fecha(x.fecha)));

    const saPorAnimal = {};
    (STATE.sanidad||[]).forEach(s => { (saPorAnimal[s.animal_id] = saPorAnimal[s.animal_id]||[]).push(s); });
    Object.values(saPorAnimal).forEach(l => l.sort((x,y)=> fecha(y.fecha) - fecha(x.fecha)));

    const lotes = {}; (STATE.lotes||[]).forEach(l => lotes[l.id] = l.nombre);
    return {A, porId, evPorAnimal, pePorAnimal, saPorAnimal, lotes};
  }

  const ultimo = (lista, tipo) => (lista||[]).find(e => e.tipo_evento === tipo);

  /* ganancia diaria entre el primer y el ultimo pesaje */
  function gdp(pesajes){
    if(!pesajes || pesajes.length < 2) return null;
    const nuevo = pesajes[0], viejo = pesajes[pesajes.length-1];
    const d = dias(fecha(viejo.fecha), fecha(nuevo.fecha));
    if(d < 20) return null;
    return (nuevo.peso_kg - viejo.peso_kg)/d;
  }

  /* ---------- el analisis ---------- */
  function analizar(){
    const {A, porId, evPorAnimal, pePorAnimal, saPorAnimal, lotes} = indices();
    const H = [];
    const add = (nivel, area, titulo, texto, animales, rec) => {
      if(!animales.length) return;
      H.push({nivel, area, titulo, texto, animales, rec});
    };
    const ref = a => ({id:a.id, codigo:a.codigo, nota:a._nota||''});

    const hembras = A.filter(a => a.sexo === 'hembra');
    const vacas   = A.filter(a => ['vaca','vaca_desc'].includes(a.categoria_id));
    const novillas= A.filter(a => a.categoria_id === 'novilla');
    const toros   = A.filter(a => a.categoria_id === 'toro');

    /* --- REPRODUCCION --- */

    // 1. Dias abiertos: parieron hace mas de 90 dias y no las han vuelto a servir
    const abiertas = [];
    vacas.forEach(a => {
      const ev = evPorAnimal[a.id];
      const parto = ultimo(ev, 'parto');
      if(!parto) return;
      const d = desdeHoy(parto.fecha);
      if(d < 90) return;
      const serv = ultimo(ev, 'servicio');
      if(serv && fecha(serv.fecha) > fecha(parto.fecha)) return;
      a._nota = d + ' d';
      abiertas.push(ref(a));
    });
    add('alta','Reproduccion','Vacas con muchos dias abiertos',
      'Parieron hace mas de 90 dias y no registran un servicio nuevo. Cada dia abierto de mas es un ternero que se corre y leche que no se produce.',
      abiertas, 'Revisalas y programa servicio o IATF. La meta en doble proposito es volver a servir entre los 60 y 90 dias despues del parto.');

    // 2. Intervalo entre partos largo
    const ipl = [];
    vacas.forEach(a => {
      const partos = (evPorAnimal[a.id]||[]).filter(e => e.tipo_evento === 'parto');
      if(partos.length < 2) return;
      const d = dias(fecha(partos[1].fecha), fecha(partos[0].fecha));
      if(d <= 450) return;
      a._nota = d + ' d';
      ipl.push(ref(a));
    });
    add('media','Reproduccion','Intervalo entre partos largo',
      'Pasaron mas de 450 dias entre un parto y el siguiente. Lo deseable esta entre 365 y 400.',
      ipl, 'Mira si el problema es deteccion de celo, condicion corporal o fertilidad. Si se repite, considera el descarte.');

    // 3. Servidas sin palpar
    const sinPalpar = [];
    A.forEach(a => {
      const ev = evPorAnimal[a.id];
      const serv = ultimo(ev, 'servicio');
      if(!serv) return;
      const d = desdeHoy(serv.fecha);
      if(d < 45) return;
      const palp = ultimo(ev, 'palpacion');
      if(palp && fecha(palp.fecha) > fecha(serv.fecha)) return;
      a._nota = d + ' d';
      sinPalpar.push(ref(a));
    });
    add('alta','Reproduccion','Servidas sin diagnostico de prenez',
      'Las sirvieron hace mas de 45 dias y todavia no se palpan. Si estan vacias, estas perdiendo tiempo sin saberlo.',
      sinPalpar, 'Programa la palpacion o ecografia. A los 45 dias ya se puede diagnosticar con seguridad.');

    // 4. Novillas en edad y peso de servir, sin servicio
    const listas = [];
    novillas.forEach(a => {
      const ev = evPorAnimal[a.id];
      if(ultimo(ev,'servicio')) return;
      const m = meses(a.fecha_nacimiento);
      const pes = pePorAnimal[a.id];
      const peso = pes && pes.length ? pes[0].peso_kg : null;
      const porEdad = m !== null && m >= 24;
      const porPeso = peso !== null && peso >= 320;
      if(!porEdad && !porPeso) return;
      a._nota = (m!==null? m+' m':'') + (peso? ' / '+Math.round(peso)+' kg':'');
      listas.push(ref(a));
    });
    add('media','Reproduccion','Novillas listas para servir',
      'Ya pasaron los 24 meses o los 320 kg y no tienen servicio registrado. Cada mes que esperas de mas retrasa su primer parto.',
      listas, 'En Gyr y Girolando se puede servir desde los 320-340 kg. Metelas al proximo lote de IATF.');

    // 5. Vacias reincidentes
    const vaciasRep = [];
    hembras.forEach(a => {
      const neg = (evPorAnimal[a.id]||[]).filter(e =>
        e.tipo_evento === 'palpacion' && e.resultado_diagnostico === 'vacia');
      if(neg.length < 2) return;
      a._nota = neg.length + ' negativas';
      vaciasRep.push(ref(a));
    });
    add('media','Reproduccion','Repetidoras',
      'Dos o mas palpaciones negativas. Suele ser problema de nutricion, sanidad reproductiva o del semen.',
      vaciasRep, 'Revisa condicion corporal y descarta brucelosis o leptospirosis antes de seguir gastando pajillas.');

    // 6. Relacion toro : hembras en edad reproductiva
    const enEdad = hembras.filter(a => ['vaca','novilla'].includes(a.categoria_id)).length;
    if(toros.length && enEdad){
      const rel = Math.round(enEdad / toros.length);
      if(rel > 30){
        add('info','Reproduccion','Pocos reproductores para el hato',
          'Hay ' + rel + ' hembras en edad reproductiva por cada toro. Por encima de 30 la monta natural empieza a fallar.',
          toros.map(t => ({id:t.id, codigo:t.codigo, nota:''})),
          'Si usas monta natural, considera otro toro. Si trabajas con IATF, no es problema.');
      }
    }

    /* --- CRECIMIENTO --- */

    // 7. Sin pesar hace mucho
    const sinPesar = [];
    A.forEach(a => {
      const p = pePorAnimal[a.id];
      const d = (p && p.length) ? desdeHoy(p[0].fecha) : null;
      if(d !== null && d <= 120) return;
      a._nota = d === null ? 'nunca' : d + ' d';
      sinPesar.push(ref(a));
    });
    add('media','Crecimiento','Sin pesaje reciente',
      'Llevan mas de 120 dias sin pesarse o nunca se han pesado. Sin peso no se puede medir si el potrero esta rindiendo.',
      sinPesar, 'Pesa por lotes cada 3 meses. Con la carga rapida puedes registrar varios seguidos.');

    // 8. Ganancia diaria floja frente a su categoria
    const porCat = {};
    A.forEach(a => {
      const g = gdp(pePorAnimal[a.id]);
      if(g === null) return;
      (porCat[a.categoria_id] = porCat[a.categoria_id]||[]).push({a, g});
    });
    const flojos = [];
    Object.entries(porCat).forEach(([cat, lista]) => {
      if(lista.length < 4) return;
      const prom = lista.reduce((s,x)=>s+x.g,0)/lista.length;
      if(prom <= 0.05) return;
      lista.forEach(({a,g}) => {
        if(g >= prom * 0.75) return;
        a._nota = g.toFixed(2) + ' kg/d';
        flojos.push(ref(a));
      });
    });
    add('media','Crecimiento','Ganancia de peso por debajo de su grupo',
      'Estan creciendo menos del 75% de lo que gana el promedio de su misma categoria.',
      flojos, 'Revisa parasitos, dentadura y si compiten mal por el pasto. A veces basta cambiarlos de lote.');

    // 9. Perdida de peso
    const bajando = [];
    A.forEach(a => {
      const g = gdp(pePorAnimal[a.id]);
      if(g === null || g >= -0.05) return;
      a._nota = g.toFixed(2) + ' kg/d';
      bajando.push(ref(a));
    });
    add('alta','Crecimiento','Estan perdiendo peso',
      'El peso viene bajando entre el primer y el ultimo pesaje registrado.',
      bajando, 'Revisalos de cerca: parasitos, enfermedad o falta de comida. En vacas paridas puede ser normal al inicio de la lactancia.');

    /* --- SANIDAD --- */

    // 10. Retiro de leche o carne vigente
    const retiro = [];
    A.forEach(a => {
      (saPorAnimal[a.id]||[]).forEach(s => {
        const d = desdeHoy(s.fecha);
        const rl = s.retiro_leche_dias || 0, rc = s.retiro_carne_dias || 0;
        const faltaL = rl - d, faltaC = rc - d;
        if(faltaL <= 0 && faltaC <= 0) return;
        const partes = [];
        if(faltaL > 0) partes.push('leche ' + faltaL + ' d');
        if(faltaC > 0) partes.push('carne ' + faltaC + ' d');
        a._nota = partes.join(' / ');
        retiro.push(ref(a));
      });
    });
    add('alta','Sanidad','Retiro vigente: no vender',
      'Recibieron un producto y todavia no cumplen el periodo de retiro. Vender esa leche o ese animal es ilegal y te puede costar el cliente.',
      retiro, 'Aparta e identifica estos animales hasta que se cumpla el plazo.');

    // 11. Vacuna o desparasitacion vencida
    const vencidas = [];
    A.forEach(a => {
      (saPorAnimal[a.id]||[]).forEach(s => {
        if(!s.proxima_fecha) return;
        const d = desdeHoy(s.proxima_fecha);
        if(d <= 0) return;
        a._nota = s.producto ? (String(s.producto).slice(0,18) + ' · ' + d + ' d') : (d + ' d');
        vencidas.push(ref(a));
      });
    });
    add('alta','Sanidad','Refuerzos vencidos',
      'La proxima dosis ya paso de fecha.',
      vencidas, 'Ponte al dia. Si es aftosa, recuerda que el ciclo del ICA es obligatorio y se verifica.');

    // 12. Sin ningun registro sanitario
    const sinSanidad = A.filter(a => !(saPorAnimal[a.id]||[]).length && meses(a.fecha_nacimiento) >= 4)
                        .map(a => { a._nota=''; return ref(a); });
    add('info','Sanidad','Sin historial sanitario',
      'Tienen mas de 4 meses y no registran ninguna vacuna ni desparasitacion.',
      sinSanidad, 'Aunque los hayas vacunado, si no queda anotado no sirve para certificar ni para vender.');

    /* --- DATOS --- */

    const sinFecha = A.filter(a => !a.fecha_nacimiento).map(a => { a._nota=''; return ref(a); });
    add('info','Datos','Sin fecha de nacimiento',
      'Sin la fecha no se puede calcular la edad ni sugerir la categoria automaticamente.',
      sinFecha, 'Si no la sabes exacta, pon una aproximada. Sirve mas que dejarla vacia.');

    const sinRaza = A.filter(a => !a.raza).map(a => { a._nota=''; return ref(a); });
    add('info','Datos','Sin raza',
      'Sin raza no se pueden comparar rendimientos entre grupos geneticos.',
      sinRaza, 'Completala desde la ficha de cada animal.');

    const sinMadre = A.filter(a => !a.madre_id && meses(a.fecha_nacimiento) !== null &&
                                    meses(a.fecha_nacimiento) <= 36)
                      .map(a => { a._nota=''; return ref(a); });
    add('info','Datos','Nacidos en finca sin madre registrada',
      'Tienen 3 anos o menos y no tienen madre asignada. El arbol genealogico queda incompleto y no puedes medir cuales vacas dejan mejores crias.',
      sinMadre, 'Asignala desde la ficha del animal.');

    // duplicados de codigo
    const cuenta = {};
    A.forEach(a => { const c=(a.codigo||'').toUpperCase(); cuenta[c]=(cuenta[c]||0)+1; });
    const dup = A.filter(a => cuenta[(a.codigo||'').toUpperCase()] > 1).map(a => { a._nota=''; return ref(a); });
    add('media','Datos','Codigos repetidos',
      'Hay animales distintos con el mismo codigo. Al registrar un evento es facil equivocarse de animal.',
      dup, 'Renombra uno de los dos. Si son el mismo animal cargado dos veces, borra el sobrante.');

    const orden = {alta:0, media:1, info:2};
    H.sort((a,b) => orden[a.nivel] - orden[b.nivel] || b.animales.length - a.animales.length);
    return H;
  }

  /* ---------- pintar ---------- */
  function pintar(H){
    const cont = (n) => H.filter(h => h.nivel === n).reduce((s,h)=>s+h.animales.length, 0);
    const alta = cont('alta'), media = cont('media'), info = cont('info');
    const totalAnimales = (STATE.animales||[]).filter(a=>!a.fecha_baja).length;

    // marcador simple: penaliza segun gravedad
    const castigo = Math.min(100, Math.round((alta*4 + media*2 + info*0.5) / Math.max(1,totalAnimales) * 26));
    const nota = Math.max(0, 100 - castigo);
    const color = nota >= 80 ? '#2f7a3e' : nota >= 55 ? '#c8871f' : '#c0392b';
    const fondo = nota >= 80 ? '#e9f5ec' : nota >= 55 ? '#fff4e5' : '#fdecea';
    const frase = nota >= 80 ? 'La finca esta en buena forma. Quedan detalles menores por cerrar.'
                : nota >= 55 ? 'Hay varios puntos que vale la pena atender esta semana.'
                : 'Hay asuntos urgentes. Empieza por lo marcado en rojo.';

    const areas = [...new Set(H.map(h => h.area))];

    const item = h =>
      '<div class="dg-item '+h.nivel+'">'+
        '<h4>'+esc(h.titulo)+' <span class="dg-tag">'+
          (h.nivel==='alta'?'Urgente':h.nivel==='media'?'Revisar':'Sugerencia')+
        '</span></h4>'+
        '<p>'+esc(h.texto)+'</p>'+
        '<div class="dg-chips">'+ h.animales.slice(0,40).map(x =>
          '<button class="dg-chip" onclick="dgIr(\''+x.id+'\')">'+esc(x.codigo)+
          (x.nota? '<small>'+esc(x.nota)+'</small>':'')+'</button>').join('') +
          (h.animales.length>40 ? '<span style="align-self:center;color:#8a7f72;font-size:12.5px">y '+(h.animales.length-40)+' mas</span>':'')+
        '</div>'+
        '<p class="rec"><b>Que hacer:</b> '+esc(h.rec)+'</p>'+
      '</div>';

    return '<div class="dg-wrap">'+
      '<div class="dg-head"><h1>Diagnostico del hato</h1>'+
        '<button class="dg-x" onclick="dgCerrar()">&times;</button></div>'+
      '<p class="dg-sub">Revision automatica de tus '+totalAnimales+' animales. Todo se calcula aqui mismo, '+
        'con tus datos; no se manda nada a ningun servidor.</p>'+

      '<div class="dg-marcador">'+
        '<div class="dg-aro" style="background:'+fondo+';color:'+color+'">'+nota+'</div>'+
        '<div class="t"><b>'+(nota>=80?'Buen manejo':nota>=55?'Aceptable, con pendientes':'Requiere atencion')+'</b>'+
          '<span>'+frase+'</span></div>'+
      '</div>'+

      '<div class="dg-resumen">'+
        '<div class="dg-r alta"><div class="v">'+alta+'</div><div class="k">Urgentes</div></div>'+
        '<div class="dg-r media"><div class="v">'+media+'</div><div class="k">Por revisar</div></div>'+
        '<div class="dg-r info"><div class="v">'+info+'</div><div class="k">Sugerencias</div></div>'+
        '<div class="dg-r ok"><div class="v">'+H.length+'</div><div class="k">Hallazgos</div></div>'+
      '</div>'+

      (H.length ? areas.map(ar =>
        '<div class="dg-sec">'+esc(ar)+'</div>' +
        H.filter(h => h.area === ar).map(item).join('')
      ).join('') :
       '<div class="dg-vacio"><b>Todo en orden.</b><br>No encontre nada que corregir con los datos que hay hoy.</div>')+

      '<p class="dg-nota">El diagnostico se recalcula cada vez que lo abres.<br>'+
        'Toca cualquier chapeta para ir a la ficha del animal.</p>'+
    '</div>';
  }

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
    o.innerHTML = pintar(analizar());
    o.classList.add('on');
    o.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  };

  /* boton en Inicio */
  function ponerBoton(){
    const c = document.querySelector('#view-inicio .content');
    if(!c || document.getElementById('dg-abrir')) return;
    if(!(STATE.animales||[]).length) return;
    let urgentes = 0;
    try { urgentes = analizar().filter(h=>h.nivel==='alta').reduce((s,h)=>s+h.animales.length,0); } catch(e){}
    const b = document.createElement('button');
    b.id = 'dg-abrir';
    b.innerHTML = '<span class="ic">&#9873;</span>'+
      '<span class="tx"><b>Diagnostico del hato</b>'+
      '<span>Que necesita atencion en tu finca hoy</span></span>'+
      (urgentes ? '<span class="n">'+urgentes+'</span>' : '');
    b.onclick = abrirDiagnostico;
    css();
    c.insertBefore(b, c.firstChild);
  }
  document.addEventListener('DOMContentLoaded', ponerBoton);
  setTimeout(ponerBoton, 1500);
  setTimeout(ponerBoton, 3500);
  setTimeout(ponerBoton, 6000);
})();
