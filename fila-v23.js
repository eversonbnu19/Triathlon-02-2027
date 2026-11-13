// v23 - Fila de envio offline.
// Todo registro que a nuvem nao confirmar fica guardado aqui (localStorage) e e reenviado
// sozinho: ao abrir o app, quando a internet volta, ao voltar para o app e a cada minuto.
// Um registro so sai da fila depois que a nuvem confirma o recebimento.
(function(){
  var KEY = 'tri_outbox_v1';
  var flushing = false;
  var justSent = 0, justSentTimer = null, retryTimer = null;

  function read(){
    try{ var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; }
    catch(e){ return []; }
  }
  function write(a){ localStorage.setItem(KEY, JSON.stringify(a)); }
  function uid(){ return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function client(){
    try{ return (cloudReady && supabaseClient) ? supabaseClient : null; }catch(e){ return null; }
  }

  // Guarda linhas para envio posterior. Marca a data real do registro (created_at),
  // para o treino nao entrar na nuvem com a data do reenvio.
  function enqueue(table, rows, label){
    var list = (Array.isArray(rows) ? rows : [rows]).map(function(r){
      var c = Object.assign({}, r);
      if(!c.created_at) c.created_at = new Date().toISOString();
      return c;
    });
    if(!list.length) return null;
    var items = read();
    var item = {id:uid(), table:table, rows:list, label:label || table, queuedAt:new Date().toISOString(), tries:0, lastError:null};
    items.push(item);
    write(items);
    render();
    setTimeout(flush, 15000);
    return item.id;
  }

  function pendingRows(table){
    var out = [];
    read().forEach(function(it){ if(it.table === table) it.rows.forEach(function(r){ out.push(r); }); });
    return out;
  }
  function count(){ return read().reduce(function(n, it){ return n + it.rows.length; }, 0); }

  async function flush(){
    if(flushing) return;
    var c = client();
    if(!c) return;
    if(typeof navigator !== 'undefined' && navigator.onLine === false) return;
    var items = read();
    if(!items.length) return;
    flushing = true; render();
    var sent = 0, tables = {};
    for(var i = 0; i < items.length; i++){
      var it = items[i], err = null;
      try{
        var res = await c.from(it.table).insert(it.rows);
        if(res && res.error) err = res.error.message || 'erro';
      }catch(e){ err = (e && e.message) ? e.message : String(e); }
      var now = read(), idx = -1;
      for(var j = 0; j < now.length; j++){ if(now[j].id === it.id){ idx = j; break; } }
      if(idx < 0) continue;
      if(err){ now[idx].tries = (now[idx].tries || 0) + 1; now[idx].lastError = err; }
      else { now.splice(idx, 1); sent += it.rows.length; tables[it.table] = true; }
      write(now);
    }
    flushing = false;
    // Sobrou algo e ha internet: tenta de novo em 20 s (sem internet, espera o evento 'online').
    if(read().length && !(typeof navigator !== 'undefined' && navigator.onLine === false)){ clearTimeout(retryTimer); retryTimer = setTimeout(flush, 20000); }
    if(sent){
      justSent = sent;
      clearTimeout(justSentTimer);
      justSentTimer = setTimeout(function(){ justSent = 0; render(); }, 6000);
      try{ window.dispatchEvent(new CustomEvent('tri-outbox-sent', {detail:{tables:Object.keys(tables), rows:sent}})); }catch(e){}
    }
    render();
  }

  function render(){
    var el = document.getElementById('outboxStatus');
    if(!el) return;
    var items = read(), n = count();
    if(!n){
      if(justSent){ el.className = 'outbox-status ok'; el.innerHTML = '<span>✓ ' + justSent + ' registro(s) da fila enviados para a nuvem.</span>'; }
      else { el.className = 'outbox-status hidden'; el.innerHTML = ''; }
      return;
    }
    var offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
    var lastErr = '';
    items.forEach(function(it){ if(it.lastError) lastErr = it.lastError; });
    var detail = offline ? 'Sem internet agora. O envio é automático quando a conexão voltar.'
      : (flushing ? 'Enviando...' : (lastErr ? 'Última tentativa falhou (' + esc(lastErr) + '). Tentando de novo sozinho.' : 'O envio é automático.'));
    el.className = 'outbox-status warn';
    el.innerHTML = '<div><strong>' + n + ' registro(s) guardados no celular, aguardando envio</strong><small>' + detail + '</small></div>' +
      '<button type="button" id="outboxSendNow"' + (flushing ? ' disabled' : '') + '>Enviar agora</button>';
    var b = document.getElementById('outboxSendNow');
    if(b) b.addEventListener('click', function(){ flush(); });
  }

  function addStyles(){
    if(document.getElementById('outbox-styles')) return;
    var st = document.createElement('style');
    st.id = 'outbox-styles';
    st.textContent =
      '.outbox-status{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;padding:12px 14px;border-radius:16px;font-size:.88rem;line-height:1.35}' +
      '.outbox-status.hidden{display:none}' +
      '.outbox-status strong{display:block}.outbox-status small{display:block;margin-top:2px;opacity:.9}' +
      '.outbox-status.warn{border:1px solid rgba(251,191,36,.32);background:rgba(251,191,36,.1);color:#fde68a}' +
      '.outbox-status.ok{border:1px solid rgba(52,211,153,.28);background:rgba(52,211,153,.1);color:#bbf7d0;font-weight:800}' +
      '.outbox-status button{flex:0 0 auto;border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.14);color:#fde68a;border-radius:12px;padding:9px 12px;font-weight:900;cursor:pointer}' +
      '.outbox-status button:disabled{opacity:.5}';
    document.head.appendChild(st);
  }

  window.TRI_OUTBOX = {enqueue:enqueue, flush:flush, pendingRows:pendingRows, count:count, render:render};

  addStyles();
  render();
  window.addEventListener('online', function(){ render(); setTimeout(flush, 1500); });
  window.addEventListener('offline', render);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) flush(); });
  setTimeout(flush, 3000);
  setInterval(function(){ if(count()) flush(); }, 60000);
})();
