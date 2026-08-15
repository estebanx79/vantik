/* Vantik - Volver en todas las pantallas.
   Lleva el rastro de por donde paso el usuario y pone el boton de volver
   en cualquier vista con barra superior que no lo traiga. Tambien cubre
   las pantallas que agreguemos despues. */
(function(){
  const RAIZ = 'inicio';
  const rastro = [];
  let actual = RAIZ;

  function poner(){
    document.querySelectorAll('.view').forEach(function(vista){
      const barra = vista.querySelector('.topbar');
      if(!barra) return;
      if(vista.querySelector('.back')) return;
      if(vista.id === 'view-' + RAIZ) return;
      const b = document.createElement('button');
      b.className = 'back nav-atras';
      b.type = 'button';
      b.innerHTML = '&lsaquo; Volver';
      b.onclick = atras;
      barra.insertBefore(b, barra.firstChild);
    });
  }

  function atras(){
    const previa = rastro.pop();
    if(previa && previa !== actual) show(previa);
    else show(RAIZ);
  }
  window.volverAtras = atras;

  (function enganchar(){
    if(typeof show !== 'function'){ setTimeout(enganchar, 600); return; }
    const orig = show;
    window.show = function(v){
      if(v !== actual){
        rastro.push(actual);
        if(rastro.length > 12) rastro.shift();
        actual = v;
      }
      const r = orig.apply(this, arguments);
      setTimeout(poner, 60);
      return r;
    };
  })();

  document.addEventListener('DOMContentLoaded', poner);
  document.addEventListener('vantik:cambio', poner);
  setTimeout(poner, 1200);
  setTimeout(poner, 3000);
  setTimeout(poner, 6000);
})();
