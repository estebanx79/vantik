/* Vantik - Eliminar mi cuenta.
   Se anade solo al final de Ajustes. Pide escribir ELIMINAR para
   confirmar, llama a la funcion de la base y cierra la sesion. */
(function(){
  function css(){
    if(document.getElementById('ec-css')) return;
    const s=document.createElement('style'); s.id='ec-css';
    s.textContent = '#ec-caja{margin:26px 0 40px;border:1px solid #f0d6d2;background:#fdf7f6;border-radius:16px;padding:16px}'
      + '#ec-caja h3{margin:0 0 6px;font-size:15px;color:#8c1d16}'
      + '#ec-caja p{margin:0 0 12px;font-size:13px;color:#7a6f63;line-height:1.5}'
      + '#ec-caja .peligro{background:#b3261e;color:#fff;border:0;border-radius:12px;padding:12px;width:100%;'
      + 'font-size:14.5px;font-weight:700;cursor:pointer}'
      + '#ec-caja .peligro[disabled]{opacity:.45;cursor:not-allowed}'
      + '#ec-caja input{margin:0 0 10px}'
      + '#ec-est{font-size:13px;margin:10px 0 0;min-height:18px}';
    document.head.appendChild(s);
  }

  window.ecComprobar = function(){
    const v = (document.getElementById('ec-txt').value||'').trim().toUpperCase();
    document.getElementById('ec-btn').disabled = (v !== 'ELIMINAR');
  };

  window.ecEliminar = async function(){
    const est = document.getElementById('ec-est');
    const btn = document.getElementById('ec-btn');
    const seguro = (typeof vantikConfirm === 'function')
      ? await vantikConfirm('Eliminar tu cuenta',
          'Se borra tu cuenta y los datos de las fincas donde estas solo. Esto no se puede deshacer.',
          'Si, eliminar', true)
      : confirm('Se borra tu cuenta y no se puede deshacer. Continuar?');
    if(!seguro) return;

    btn.disabled = true; est.style.color = '#7a6f63'; est.textContent = 'Eliminando...';
    const r = await sb.rpc('eliminar_mi_cuenta');
    if(r.error){ est.style.color='#b3261e'; est.textContent = 'No se pudo: ' + r.error.message; btn.disabled=false; return; }
    const d = r.data || {};
    if(!d.ok){ est.style.color='#b3261e'; est.textContent = d.error || 'No se pudo eliminar.'; btn.disabled=false; return; }
    est.style.color='#1f6b32'; est.textContent = 'Cuenta eliminada. Cerrando sesion...';
    try { await sb.auth.signOut(); } catch(e){}
    setTimeout(function(){ location.href = 'index.html'; }, 1400);
  };

  function poner(){
    const c = document.querySelector('#view-ajustes .content');
    if(!c || document.getElementById('ec-caja')) return;
    css();
    const d = document.createElement('div'); d.id = 'ec-caja';
    d.innerHTML = '<h3>Eliminar mi cuenta</h3>'
      + '<p>Se borran tu cuenta y los datos de las fincas donde eres el unico miembro: '
      + 'animales, pesajes, eventos y sanidad. Las fincas que compartes con otras personas '
      + 'no se tocan, solo pierdes el acceso. <b>No se puede deshacer.</b></p>'
      + '<label>Escribe ELIMINAR para confirmar</label>'
      + '<input id="ec-txt" type="text" autocomplete="off" placeholder="ELIMINAR" oninput="ecComprobar()">'
      + '<button id="ec-btn" class="peligro" disabled onclick="ecEliminar()">Eliminar mi cuenta</button>'
      + '<p id="ec-est"></p>';
    c.appendChild(d);
  }

  document.addEventListener('DOMContentLoaded', poner);
  setTimeout(poner, 1500);
  setTimeout(poner, 4000);
  (function eng(){
    if(typeof show !== 'function'){ setTimeout(eng, 700); return; }
    const o = show;
    window.show = function(v){ const r = o.apply(this, arguments); if(v==='ajustes') setTimeout(poner, 120); return r; };
  })();
})();
