// v21 - Dashboard de evolucao de cargas.
// Le exercicios_registros do Supabase e mostra KPIs, grafico de carga por exercicio,
// volume semanal e tabela de evolucao dentro da aba Dashboard.
(function(){
  var TABLE = 'exercicios_registros';
  var cache = {rows:null, loadedAt:0, loading:false, error:null};
  var selectedKey = null;

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function num(v){if(v===null||v===undefined||v==='') return null; var x=Number(v); return isFinite(x)?x:null;}
  function fmt(n,d){return Number(n).toLocaleString('pt-BR',{maximumFractionDigits:d==null?1:d});}
  function isLoad(r){return r && r.exercicio_key && r.exercicio_key.indexOf('bike')!==0 && num(r.peso_kg)!==null && num(r.peso_kg)>0;}
  function dayKey(iso){var d=new Date(iso); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}

  function cloudOk(){
    try{ return !!(cloudReady && supabaseClient); }catch(e){ return false; }
  }

  async function load(force){
    if(cache.loading) return;
    if(!force && cache.rows && Date.now()-cache.loadedAt < 60000) return;
    if(!cloudOk()){ cache.error='offline'; return; }
    cache.loading = true;
    try{
      var res = await supabaseClient.from(TABLE)
        .select('id,created_at,semana,treino_tipo,exercicio,exercicio_key,peso_kg,series,repeticoes')
        .eq('device_id', CLOUD_DEVICE_ID)
        .order('created_at',{ascending:true})
        .limit(2000);
      if(res.error) throw res.error;
      cache.rows = res.data || [];
      cache.loadedAt = Date.now();
      cache.error = null;
    }catch(e){
      cache.error = (e && e.message) ? e.message : String(e);
    }
    cache.loading = false;
  }

  function analyse(rows){
    var byEx = {}, volume = {}, days = {};
    rows.forEach(function(r){
      if(r.created_at) days[dayKey(r.created_at)] = true;
      if(!isLoad(r)) return;
      var key = r.exercicio_key, sem = num(r.semana), peso = num(r.peso_kg);
      if(sem===null) return;
      if(!byEx[key]) byEx[key] = {key:key, nome:r.exercicio, tipo:r.treino_tipo, weeks:{}};
      var w = byEx[key].weeks[sem];
      if(!w || peso > w.peso) byEx[key].weeks[sem] = {semana:sem, peso:peso, series:num(r.series), reps:num(r.repeticoes)};
      var s = num(r.series), rp = num(r.repeticoes);
      if(s && rp) volume[sem] = (volume[sem]||0) + peso*s*rp;
    });
    var list = Object.keys(byEx).map(function(k){
      var ex = byEx[k];
      var pts = Object.keys(ex.weeks).map(function(s){return ex.weeks[s];}).sort(function(a,b){return a.semana-b.semana;});
      var first = pts[0], last = pts[pts.length-1];
      var best = pts.reduce(function(m,p){return p.peso>m.peso?p:m;}, first);
      ex.points = pts; ex.first = first; ex.last = last; ex.best = best;
      ex.evol = first.peso>0 ? (last.peso-first.peso)/first.peso : 0;
      return ex;
    }).sort(function(a,b){return (a.tipo||'').localeCompare(b.tipo||'') || a.nome.localeCompare(b.nome);});
    var volWeeks = Object.keys(volume).map(Number).sort(function(a,b){return a-b;}).map(function(s){return {semana:s, vol:volume[s]};});
    return {list:list, volWeeks:volWeeks, sessions:Object.keys(days).length};
  }

  function lineChart(points){
    if(!points.length) return '<p class="muted">Sem cargas registradas para este exercício.</p>';
    var W=420,H=230,pl=34,pr=16,pt=24,pb=30;
    var xs=points.map(function(p){return p.semana;}), ys=points.map(function(p){return p.peso;});
    var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
    var yMax=Math.max.apply(null,ys)*1.15, yMin=0;
    function X(v){return x1===x0 ? (pl+(W-pl-pr)/2) : pl+(v-x0)/(x1-x0)*(W-pl-pr);}
    function Y(v){return pt+(1-(v-yMin)/(yMax-yMin))*(H-pt-pb);}
    var grid='', i;
    for(i=0;i<=4;i++){var gv=yMin+(yMax-yMin)*i/4, gy=Y(gv);
      grid+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+gy+'" y2="'+gy+'" stroke="rgba(255,255,255,.07)"/>'+
            '<text x="'+(pl-8)+'" y="'+(gy+4)+'" text-anchor="end" font-size="12" fill="#94a3b8">'+fmt(gv,0)+'</text>';}
    var path = points.map(function(p,j){return (j?'L':'M')+X(p.semana)+' '+Y(p.peso);}).join(' ');
    var area = path+' L'+X(points[points.length-1].semana)+' '+Y(0)+' L'+X(points[0].semana)+' '+Y(0)+' Z';
    var dots = points.map(function(p){
      var info = p.peso+' kg'+(p.series&&p.reps?' • '+p.series+'x'+p.reps:'');
      return '<circle cx="'+X(p.semana)+'" cy="'+Y(p.peso)+'" r="5" fill="#38bdf8" stroke="#0b1220" stroke-width="2"><title>Semana '+p.semana+': '+esc(info)+'</title></circle>'+
             '<text x="'+X(p.semana)+'" y="'+(Y(p.peso)-10)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#e0f2fe">'+fmt(p.peso)+'</text>'+
             '<text x="'+X(p.semana)+'" y="'+(H-12)+'" text-anchor="middle" font-size="12" fill="#94a3b8">S'+p.semana+'</text>';
    }).join('');
    return '<svg viewBox="0 0 '+W+' '+H+'" class="cg-chart" role="img" aria-label="Evolução de carga">'+
      '<defs><linearGradient id="cgFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#38bdf8" stop-opacity=".28"/><stop offset="1" stop-color="#38bdf8" stop-opacity="0"/></linearGradient></defs>'+
      grid+'<path d="'+area+'" fill="url(#cgFill)"/><path d="'+path+'" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'+dots+'</svg>';
  }

  function barChart(weeks){
    if(!weeks.length) return '<p class="muted">Registre peso, séries e repetições para calcular o volume.</p>';
    var W=420,H=200,pl=34,pr=8,pt=22,pb=26;
    var max=Math.max.apply(null,weeks.map(function(w){return w.vol;}))*1.15;
    var slot=(W-pl-pr)/weeks.length, bw=Math.min(46, slot*0.62);
    var out='';
    for(var i=0;i<=3;i++){var gv=max*i/3, gy=pt+(1-gv/max)*(H-pt-pb);
      out+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+gy+'" y2="'+gy+'" stroke="rgba(255,255,255,.07)"/>'+
           '<text x="'+(pl-8)+'" y="'+(gy+4)+'" text-anchor="end" font-size="12" fill="#94a3b8">'+fmt(gv/1000,1)+'t</text>';}
    weeks.forEach(function(w,j){
      var h=(w.vol/max)*(H-pt-pb), x=pl+slot*j+(slot-bw)/2, y=H-pb-h;
      var isLast = j===weeks.length-1;
      out+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+h+'" rx="7" fill="'+(isLast?'#34d399':'rgba(56,189,248,.65)')+'"><title>Semana '+w.semana+': '+fmt(w.vol,0)+' kg</title></rect>'+
           '<text x="'+(x+bw/2)+'" y="'+(y-6)+'" text-anchor="middle" font-size="11" font-weight="800" fill="#e0f2fe">'+fmt(w.vol/1000,1)+'t</text>'+
           '<text x="'+(x+bw/2)+'" y="'+(H-10)+'" text-anchor="middle" font-size="12" fill="#94a3b8">S'+w.semana+'</text>';
    });
    return '<svg viewBox="0 0 '+W+' '+H+'" class="cg-chart" role="img" aria-label="Volume semanal">'+out+'</svg>';
  }

  function evolBadge(e){
    var pct = Math.round(e*100);
    var cls = pct>0 ? 'up' : (pct<0 ? 'down' : 'flat');
    return '<span class="cg-badge '+cls+'">'+(pct>0?'+':'')+pct+'%</span>';
  }

  function render(){
    var box = ensureContainer(); if(!box) return;
    if(!cache.rows){
      var msg = cache.loading || !cache.error ? 'Carregando cargas da nuvem...' :
        (cache.error==='offline' ? 'Sem conexão com a nuvem: o painel de cargas precisa do Supabase.' : 'Não foi possível carregar as cargas: '+esc(cache.error));
      box.innerHTML = '<div class="card"><h2>Evolução de cargas</h2><p class="muted">'+msg+'</p></div>';
      return;
    }
    var a = analyse(cache.rows);
    if(!a.list.length){
      box.innerHTML = '<div class="card"><h2>Evolução de cargas</h2><p class="muted">Ainda não há exercícios com peso registrado.</p></div>';
      return;
    }
    if(!selectedKey || !a.list.some(function(e){return e.key===selectedKey;})){
      var top = a.list.slice().sort(function(x,y){return y.points.length-x.points.length;})[0];
      selectedKey = top.key;
    }
    var sel = a.list.filter(function(e){return e.key===selectedKey;})[0];
    var bestEvol = a.list.filter(function(e){return e.points.length>1;}).sort(function(x,y){return y.evol-x.evol;})[0];
    var vw = a.volWeeks, lastVol = vw[vw.length-1], prevVol = vw[vw.length-2];
    var volDelta = (lastVol && prevVol && prevVol.vol) ? (lastVol.vol-prevVol.vol)/prevVol.vol : null;

    var kpis =
      '<div class="card dash-card"><span>Dias de treino registrados</span><strong>'+a.sessions+'</strong><small>Sessões com exercícios salvos na nuvem</small></div>'+
      '<div class="card dash-card"><span>Exercícios com carga</span><strong>'+a.list.length+'</strong><small>Acompanhados semana a semana</small></div>'+
      '<div class="card dash-card"><span>Maior evolução</span><strong>'+(bestEvol?((bestEvol.evol>0?'+':'')+Math.round(bestEvol.evol*100)+'%'):'-')+'</strong><small>'+(bestEvol?esc(bestEvol.nome)+': '+fmt(bestEvol.first.peso)+' → '+fmt(bestEvol.last.peso)+' kg':'Precisa de 2 semanas registradas')+'</small></div>'+
      '<div class="card dash-card"><span>Volume da última semana</span><strong>'+(lastVol?fmt(lastVol.vol/1000,1)+' t':'-')+'</strong><small>'+(lastVol?'Semana '+lastVol.semana+(volDelta!==null?' • '+(volDelta>=0?'+':'')+Math.round(volDelta*100)+'% vs semana '+prevVol.semana:''):'Peso × séries × repetições')+'</small></div>';

    var options = a.list.map(function(e){return '<option value="'+esc(e.key)+'"'+(e.key===selectedKey?' selected':'')+'>'+esc(e.tipo||'')+' • '+esc(e.nome)+'</option>';}).join('');

    var rows = a.list.map(function(e){
      return '<tr data-key="'+esc(e.key)+'"'+(e.key===selectedKey?' class="sel"':'')+'>'+
        '<td><strong>'+esc(e.nome)+'</strong><small>Treino '+esc(e.tipo||'-')+' • '+e.points.length+' semana(s)</small></td>'+
        '<td>'+fmt(e.first.peso)+'</td><td>'+fmt(e.last.peso)+'</td><td>'+fmt(e.best.peso)+'</td><td>'+evolBadge(e.evol)+'</td></tr>';
    }).join('');

    box.innerHTML =
      '<div class="card cg-head"><div class="section-head"><div><h2>Evolução de cargas</h2>'+
        '<p class="muted">Maior peso por semana, direto dos registros da academia na nuvem.</p></div>'+
        '<button class="linkbtn" id="cgReload">atualizar</button></div></div>'+
      '<div class="dashboard-grid cg-kpis">'+kpis+'</div>'+
      '<div class="card"><div class="cg-title"><h2>Carga por exercício</h2><select id="cgSelect">'+options+'</select></div>'+
        lineChart(sel.points)+
        '<p class="muted cg-foot">'+esc(sel.nome)+': começou com '+fmt(sel.first.peso)+' kg (semana '+sel.first.semana+') e está em '+fmt(sel.last.peso)+' kg (semana '+sel.last.semana+'). Melhor marca: '+fmt(sel.best.peso)+' kg.</p></div>'+
      '<div class="card"><h2>Volume semanal (peso × séries × reps)</h2>'+barChart(vw)+'</div>'+
      '<div class="card"><h2>Resumo por exercício (kg)</h2><div class="cg-table-wrap"><table class="cg-table">'+
        '<thead><tr><th>Exercício</th><th>1ª</th><th>Atual</th><th>Melhor</th><th>Evol.</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
        '<p class="muted cg-foot">Toque em um exercício para ver o gráfico. Bike/mobilidade fica fora porque não é carga em kg.</p></div>';

    var s = document.getElementById('cgSelect');
    if(s) s.addEventListener('change', function(){ selectedKey = s.value; render(); });
    box.querySelectorAll('.cg-table tbody tr').forEach(function(tr){
      tr.addEventListener('click', function(){ selectedKey = tr.getAttribute('data-key'); render(); var c=document.getElementById('cgSelect'); if(c) c.scrollIntoView({behavior:'smooth',block:'center'}); });
    });
    var rl = document.getElementById('cgReload');
    if(rl) rl.addEventListener('click', function(){ refresh(true); });
  }

  function ensureContainer(){
    var view = document.getElementById('view-dashboard'); if(!view) return null;
    var box = document.getElementById('cargasDashboard');
    if(!box){
      box = document.createElement('div');
      box.id = 'cargasDashboard';
      var metrics = document.getElementById('dashboardMetrics');
      if(metrics && metrics.nextSibling) view.insertBefore(box, metrics.nextSibling); else view.appendChild(box);
    }
    return box;
  }

  async function refresh(force){
    render();
    await load(force);
    render();
  }

  function addStyles(){
    if(document.getElementById('cg-styles')) return;
    var st = document.createElement('style');
    st.id = 'cg-styles';
    st.textContent =
      '#cargasDashboard{margin-top:14px}'+
      '.cg-head{background:linear-gradient(135deg,rgba(56,189,248,.13),rgba(52,211,153,.08));border-color:rgba(56,189,248,.24)}'+
      '.cg-kpis{margin-bottom:14px}'+
      '.cg-title{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}'+
      '.cg-title h2{margin:0}.cg-title select{width:auto;max-width:100%;padding:9px 10px;font-size:.85rem}'+
      '.cg-chart{width:100%;height:auto;display:block;margin-top:6px}'+
      '.cg-foot{font-size:.82rem;margin-top:8px;line-height:1.4}'+
      '.cg-table-wrap{overflow-x:auto}'+
      '.cg-table{width:100%;border-collapse:collapse;font-size:.88rem}'+
      '.cg-table th{text-align:right;color:var(--muted);font-size:.74rem;font-weight:800;padding:8px 6px;border-bottom:1px solid var(--line)}'+
      '.cg-table th:first-child,.cg-table td:first-child{text-align:left}'+
      '.cg-table td{text-align:right;padding:10px 6px;border-bottom:1px solid rgba(255,255,255,.05);font-variant-numeric:tabular-nums;cursor:pointer}'+
      '.cg-table td small{display:block;color:var(--muted);font-size:.72rem;margin-top:2px}'+
      '.cg-table tr.sel td{background:rgba(56,189,248,.08)}'+
      '.cg-badge{display:inline-block;border-radius:999px;padding:3px 8px;font-size:.74rem;font-weight:900}'+
      '.cg-badge.up{color:#bbf7d0;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.28)}'+
      '.cg-badge.down{color:#fecdd3;background:rgba(251,113,133,.12);border:1px solid rgba(251,113,133,.3)}'+
      '.cg-badge.flat{color:#cbd5e1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}';
    document.head.appendChild(st);
  }

  function hook(){
    if(typeof renderDashboard !== 'function') return;
    var original = renderDashboard;
    renderDashboard = function(){
      var r = original.apply(this, arguments);
      try{ refresh(false); }catch(e){}
      return r;
    };
  }

  addStyles();
  hook();
  var tries = 0;
  (function waitCloud(){
    if(cloudOk() || tries > 20){ refresh(true); return; }
    tries++; setTimeout(waitCloud, 500);
  })();
})();
