/* ===================================================================
   Vantik core - registro de modulos
   Cada modulo nuevo se anuncia aqui y aparece solo en Inicio, en el
   tutorial y donde haga falta. Nadie tiene que acordarse de ir a
   editar la pantalla de Inicio cada vez que agregamos algo.
   =================================================================== */
(function(){
  if(window.Vantik) return;

  const V = {
    modulos: [],

    registrar(m){
      if(!m || !m.id) return;
      V.modulos = V.modulos.filter(x => x.id !== m.id);
      V.modulos.push(m);
      V.modulos.sort((a,b) => (a.orden||50) - (b.orden||50));
      V.avisar();
      return m;
    },

    quitar(id){ V.modulos = V.modulos.filter(x => x.id !== id); V.avisar(); },

    accesos(){ return V.modulos.filter(m => m.enAccesos !== false && typeof m.accion === 'function'); },

    avisos(){
      const todos = [];
      V.modulos.forEach(m => {
        if(typeof m.avisos !== 'function') return;
        try {
          (m.avisos() || []).forEach(a => {
            if(!a || !a.n) return;
            todos.push(Object.assign({modulo:m.id, nivel:'media'}, a));
          });
        } catch(e){}
      });
      const peso = {alta:0, media:1, baja:2};
      const p = n => (peso[n] === undefined ? 1 : peso[n]);
      return todos.sort((a,b) => p(a.nivel) - p(b.nivel) || b.n - a.n);
    },

    pasos(){
      const todos = [];
      V.modulos.forEach(m => {
        if(typeof m.pasos !== 'function') return;
        try { (m.pasos() || []).forEach(x => todos.push(Object.assign({modulo:m.id}, x))); } catch(e){}
      });
      return todos;
    },

    avisar(){
      clearTimeout(V._t);
      V._t = setTimeout(function(){
        document.dispatchEvent(new CustomEvent('vantik:cambio', {detail:{modulos:V.modulos.length}}));
      }, 30);
    },

    u: {
      DIA: 86400000,
      hoy: function(){ return new Date(new Date().toISOString().slice(0,10)); },
      fecha: function(f){ return f ? new Date(String(f).slice(0,10)) : null; },
      dias: function(a,b){ return Math.round((b-a)/86400000); },
      desdeHoy: function(f){ return f ? V.u.dias(V.u.fecha(f), V.u.hoy()) : null; },
      faltan: function(f){ return f ? V.u.dias(V.u.hoy(), V.u.fecha(f)) : null; },
      meses: function(f){ return f ? Math.floor(V.u.desdeHoy(f)/30.44) : null; },
      dmy: function(f){ const d = V.u.fecha(f); return d ? String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0') : ''; },
      esc: function(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); },
      porAnimal: function(lista, campo){
        const m = {};
        (lista||[]).forEach(function(x){ const k = x[campo||'animal_id']; (m[k] = m[k]||[]).push(x); });
        Object.values(m).forEach(function(l){ l.sort(function(a,b){ return V.u.fecha(b.fecha) - V.u.fecha(a.fecha); }); });
        return m;
      },
      animales: function(){ var S = (typeof STATE !== 'undefined') ? STATE : null;
        return (S && S.animales ? S.animales : []).filter(function(a){ return !a.fecha_baja; }); },
      hayDatos: function(){ return V.u.animales().length > 0; }
    }
  };

  window.Vantik = V;

  const ir = function(v){ return function(){ if(typeof show === 'function') show(v); }; };

  V.registrar({id:'registrar', nombre:'Registrar', icono:'&#9998;',  tono:'ambar', orden:30, accion:ir('registrar')});
  V.registrar({id:'agenda',    nombre:'Agenda',    icono:'&#128197;', tono:'azul',  orden:40, accion:ir('agenda')});
  V.registrar({id:'finca',     nombre:'Exportar',  icono:'&#8681;',   tono:'verde', orden:90, accion:ir('finca')});
})();
