// v22 - Nuvem no Neon (Postgres) com Supabase como reserva.
// Carregado depois do supabase-js e antes do app.js. Troca o cliente que o app recebe
// em supabase.createClient() por um cliente compativel que grava e le no Neon.
// Se o Neon nao responder ao abrir o app, a sessao inteira usa o Supabase antigo.
(function(){
  var NEON_DATA_API_URL = 'https://ep-aged-recipe-bde6crpf.apirest.c-8.us-east-2.aws.neon.tech/neondb/rest/v1';
  var NEON_AUTH_URL = 'https://ep-aged-recipe-bde6crpf.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth';
  var PING_TABLE = 'registros_treino';

  var realCreate = (window.supabase && window.supabase.createClient) ? window.supabase.createClient.bind(window.supabase) : null;
  var token = null, tokenExp = 0;

  async function neonToken(force){
    if(!force && token && Date.now() < tokenExp - 30000) return token;
    var r = await fetch(NEON_AUTH_URL + '/token/anonymous', {method:'GET'});
    if(!r.ok) throw new Error('Neon Auth HTTP ' + r.status);
    var j = await r.json();
    if(!j || !j.token) throw new Error('Neon Auth sem token');
    var exp = Number(j.expires_at) || 0;
    if(exp && exp < 1e12) exp = exp * 1000;
    token = j.token;
    tokenExp = exp || (Date.now() + 5 * 60 * 1000);
    return token;
  }

  function neonUrl(q){
    var p = [];
    if(q.select !== null) p.push('select=' + encodeURIComponent(q.select));
    q.filters.forEach(function(f){ p.push(encodeURIComponent(f[0]) + '=eq.' + encodeURIComponent(f[1])); });
    if(q.order) p.push('order=' + encodeURIComponent(q.order[0]) + '.' + (q.order[1] ? 'asc' : 'desc'));
    if(q.limit !== null) p.push('limit=' + q.limit);
    return NEON_DATA_API_URL + '/' + encodeURIComponent(q.table) + (p.length ? '?' + p.join('&') : '');
  }

  async function neonRun(q){
    var url = neonUrl(q), r = null;
    for(var attempt = 0; attempt < 2; attempt++){
      var headers = {'Authorization':'Bearer ' + (await neonToken(attempt > 0)), 'Content-Type':'application/json'};
      if(q.rows) headers['Prefer'] = q.select !== null ? 'return=representation' : 'return=minimal';
      r = await fetch(url, {method: q.rows ? 'POST' : 'GET', headers: headers, body: q.rows ? JSON.stringify(q.rows) : undefined});
      if(r.status !== 401) break;
    }
    var text = await r.text(), body = null;
    try{ body = text ? JSON.parse(text) : null; }catch(e){ body = null; }
    if(!r.ok) return {data:null, error:{message:(body && body.message) || ('Neon HTTP ' + r.status), status:r.status}};
    return {data:body, error:null};
  }

  function supabaseRun(sb, q){
    var b = sb.from(q.table);
    if(q.rows){ b = b.insert(q.rows); if(q.select !== null) b = b.select(q.select); }
    else b = b.select(q.select === null ? '*' : q.select);
    q.filters.forEach(function(f){ b = b.eq(f[0], f[1]); });
    if(q.order) b = b.order(q.order[0], {ascending:q.order[1]});
    if(q.limit !== null) b = b.limit(q.limit);
    return b;
  }

  function createCloudClient(sb){
    var backend = (async function(){
      try{
        var t = await neonRun({table:PING_TABLE, select:'id', filters:[], order:null, limit:1, rows:null});
        if(t.error) throw new Error(t.error.message);
        return 'neon';
      }catch(e){
        try{ console.warn('Neon indisponivel, usando reserva:', e && e.message ? e.message : e); }catch(_){}
        return sb ? 'supabase' : 'none';
      }
    })();

    async function run(q){
      var which = await backend;
      if(which === 'neon'){
        try{ return await neonRun(q); }
        catch(e){ return {data:null, error:{message:(e && e.message) ? e.message : String(e)}}; }
      }
      if(which === 'supabase') return await supabaseRun(sb, q);
      return {data:null, error:{message:'Nuvem indisponível'}};
    }

    function from(table){
      var q = {table:table, select:null, filters:[], order:null, limit:null, rows:null};
      var b = {
        select: function(cols){ q.select = cols || '*'; return b; },
        insert: function(rows){ q.rows = rows; return b; },
        eq: function(col, val){ q.filters.push([col, val]); return b; },
        order: function(col, opts){ q.order = [col, !(opts && opts.ascending === false)]; return b; },
        limit: function(n){ q.limit = n; return b; },
        then: function(ok, fail){ return run(q).then(ok, fail); }
      };
      return b;
    }
    return {from:from, backend:backend};
  }

  // Ajusta os avisos da tela para mostrar o banco realmente em uso.
  function watchLabels(backend){
    backend.then(function(which){
      var label = which === 'neon' ? 'Neon' : (which === 'supabase' ? 'Supabase (reserva, Neon não respondeu)' : null);
      if(!label) return;
      function fix(el){
        if(!el) return;
        var t = el.textContent || '';
        if(t.indexOf('Supabase') >= 0 && t.indexOf(label) < 0) el.textContent = t.replace(/Supabase/g, label);
      }
      ['cloudStatus','controlMsg'].forEach(function(id){
        var el = document.getElementById(id);
        if(!el) return;
        fix(el);
        new MutationObserver(function(){ fix(el); }).observe(el, {childList:true, characterData:true, subtree:true});
      });
    });
  }

  var shared = null;
  function createClient(url, key, opts){
    if(shared) return shared;
    var sb = null;
    try{ sb = realCreate ? realCreate(url, key, opts) : null; }catch(e){ sb = null; }
    shared = createCloudClient(sb);
    watchLabels(shared.backend);
    return shared;
  }

  // Substitui o objeto global inteiro (as propriedades do supabase-js podem ser somente leitura).
  window.supabase = {createClient:createClient};
  window.NEON_CLOUD = {dataApiUrl:NEON_DATA_API_URL, backend:function(){ return shared ? shared.backend : Promise.resolve('none'); }};
})();
