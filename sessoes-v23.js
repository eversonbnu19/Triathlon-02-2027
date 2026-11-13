// v23 - Registro do treino real (corrida, bike, natacao, brick, forca).
// Cada treino do checklist ganha "Registrar treino": tempo, distancia, RPE, dor no joelho e observacao.
// Mostra feito x planejado na aba Hoje e no Dashboard. Grava na tabela sessoes_registros;
// sem confirmacao da nuvem, o registro vai para a fila de envio (fila-v23.js).
(function(){
  if(!window.TRAINING_DATA || !window.TRAINING_DATA.plano25) return;

  var TABLE = 'sessoes_registros';
  var VERSION_LABEL = 'v23';
  var MOD = {
    corrida:{label:'Corrida', icon:'🏃'},
    bike:{label:'Bike', icon:'🚴'},
    natacao:{label:'Natação', icon:'🏊'},
    brick:{label:'Brick', icon:'🔁'},
    forca:{label:'Força', icon:'🏋️'},
    prova:{label:'Prova', icon:'🏁'},
    outro:{label:'Treino', icon:'✅'}
  };
  var openId = null;      // tarefa com formulario aberto
  var drafts = {};        // valores digitados e ainda nao salvos
  var formMsg = {};       // aviso de validacao por tarefa

  if(!state.sessions) state.sessions = {};

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function norm(v){ return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function fmt(n, d){ return Number(n).toLocaleString('pt-BR', {maximumFractionDigits: d == null ? 1 : d}); }
  function todayISO(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmtDay(iso){ if(!iso) return ''; var p = String(iso).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] : ''; }

  function modality(title){
    var t = norm(title);
    if(/prova|gp triathlon|race/.test(t)) return 'prova';
    if(/brick|transicao/.test(t)) return 'brick';
    if(/speed|bike|bicicleta|ciclismo/.test(t)) return 'bike';
    if(/natacao|piscina|praia/.test(t)) return 'natacao';
    if(/academia|forca|ativacao|manutencao|core/.test(t)) return 'forca';
    if(/corrida|longao/.test(t)) return 'corrida';
    return 'outro';
  }

  // "32", "32,5", "32:30" (min:seg) ou "1:05:00" (h:min:seg) -> minutos
  function parseMinutes(v){
    var s = String(v == null ? '' : v).trim().replace(',', '.');
    if(!s) return null;
    if(s.indexOf(':') >= 0){
      var p = s.split(':').map(Number);
      if(p.some(function(x){ return !isFinite(x) || x < 0; })) return NaN;
      if(p.length === 2) return p[0] + p[1] / 60;
      if(p.length === 3) return p[0] * 60 + p[1] + p[2] / 60;
      return NaN;
    }
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  function parseNum(v){
    var s = String(v == null ? '' : v).trim().replace(',', '.');
    if(!s) return null;
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }
  function clock(min){ // 6.67 -> "6:40"
    var total = Math.round(min * 60), m = Math.floor(total / 60), s = total % 60;
    return m + ':' + String(s).padStart(2, '0');
  }
  function fmtMin(min){
    var m = Math.round(Number(min) || 0);
    return m >= 60 ? Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0') : m + ' min';
  }

  function pace(mod, min, km){
    if(!min || !km) return '';
    if(mod === 'corrida') return clock(min / km) + '/km';
    if(mod === 'bike') return fmt(km / (min / 60), 1) + ' km/h';
    if(mod === 'natacao') return clock(min / (km * 10)) + '/100 m';
    return '';
  }

  function summary(s){
    var parts = [];
    var x = s.dados_json || {};
    if(s.modalidade === 'brick'){
      if(x.bike_min) parts.push('bike ' + fmtMin(x.bike_min) + (x.bike_km ? ' (' + fmt(x.bike_km, 1) + ' km)' : ''));
      if(x.corrida_min) parts.push('corrida ' + fmtMin(x.corrida_min) + (x.corrida_km ? ' (' + fmt(x.corrida_km, 2) + ' km, ' + pace('corrida', x.corrida_min, x.corrida_km) + ')' : ''));
    }else{
      if(s.duracao_min) parts.push(fmtMin(s.duracao_min));
      if(s.distancia_km){
        parts.push(s.modalidade === 'natacao' ? fmt(s.distancia_km * 1000, 0) + ' m' : fmt(s.distancia_km, 2) + ' km');
        var p = pace(s.modalidade, s.duracao_min, s.distancia_km);
        if(p) parts.push(p);
      }
    }
    if(s.rpe != null) parts.push('RPE ' + fmt(s.rpe, 1));
    if(s.dor_joelho != null) parts.push('joelho ' + fmt(s.dor_joelho, 1) + '/10');
    return parts.join(' • ');
  }

  // ---------- nuvem ----------
  function cloud(){ try{ return (cloudReady && supabaseClient) ? supabaseClient : null; }catch(e){ return null; } }
  function inQueue(taskId){
    return !!(window.TRI_OUTBOX && window.TRI_OUTBOX.pendingRows(TABLE).some(function(r){ return r.tarefa_id === taskId; }));
  }

  function toRow(s){
    return {
      device_id: CLOUD_DEVICE_ID,
      semana: Number(s.semana),
      tarefa_id: s.tarefa_id,
      treino: s.treino || null,
      modalidade: s.modalidade,
      data_treino: s.data_treino || null,
      duracao_min: s.duracao_min,
      distancia_km: s.distancia_km,
      rpe: s.rpe,
      dor_joelho: s.dor_joelho,
      observacoes: s.observacoes || null,
      dados_json: Object.assign({}, s.dados_json || {}, {savedAt: s.savedAt, app_version: VERSION_LABEL})
    };
  }
  function fromRow(r){
    var x = (r.dados_json && typeof r.dados_json === 'object') ? r.dados_json : {};
    function n(v){ return v === null || v === undefined || v === '' ? null : Number(v); }
    return {
      semana: r.semana, tarefa_id: r.tarefa_id, treino: r.treino || '', modalidade: r.modalidade,
      data_treino: r.data_treino ? String(r.data_treino).slice(0, 10) : '',
      duracao_min: n(r.duracao_min), distancia_km: n(r.distancia_km), rpe: n(r.rpe), dor_joelho: n(r.dor_joelho),
      observacoes: r.observacoes || '', dados_json: x, savedAt: x.savedAt || r.created_at, removido: !!x.removido
    };
  }

  async function send(s){
    var row = toRow(s), ok = false, c = cloud();
    if(c){
      try{ var res = await c.from(TABLE).insert(row); ok = !(res && res.error); }
      catch(e){ ok = false; }
    }
    if(ok) return 'ok';
    if(window.TRI_OUTBOX){
      window.TRI_OUTBOX.enqueue(TABLE, Object.assign({created_at: s.savedAt}, row), (MOD[s.modalidade] || MOD.outro).label + ' semana ' + s.semana);
      return 'queued';
    }
    return 'local';
  }

  // O registro mais novo de cada treino vence (a nuvem so recebe inclusoes; editar = incluir de novo).
  async function loadCloud(){
    var c = cloud();
    if(!c) return;
    try{
      var res = await c.from(TABLE).select('*').eq('device_id', CLOUD_DEVICE_ID).order('created_at', {ascending:true}).limit(1000);
      if(res.error) throw res.error;
      var latest = {};
      (res.data || []).forEach(function(r){
        var s = fromRow(r);
        if(!s.tarefa_id) return;
        if(!latest[s.tarefa_id] || String(s.savedAt) >= String(latest[s.tarefa_id].savedAt)) latest[s.tarefa_id] = s;
      });
      var changed = false;
      Object.keys(latest).forEach(function(id){
        var s = latest[id], local = state.sessions[id];
        if(inQueue(id)) return; // o que esta na fila e mais novo que a nuvem
        if(local && String(local.savedAt) > String(s.savedAt)) return;
        if(s.removido){ if(local){ delete state.sessions[id]; changed = true; } return; }
        state.sessions[id] = s; state.done[id] = true; changed = true;
      });
      if(changed){ save(); renderAll(); }
    }catch(e){
      // Sem nuvem: segue com o que esta no celular.
    }
  }

  // ---------- totais ----------
  function weekTotals(sem){
    var t = {corrida:0, bike:0, natacao:0, forca:0, outro:0, km:{corrida:0, bike:0, natacao:0}, count:0};
    Object.keys(state.sessions).forEach(function(id){
      var s = state.sessions[id];
      if(!s || String(s.semana) !== String(sem)) return;
      t.count++;
      var x = s.dados_json || {};
      if(s.modalidade === 'brick'){
        t.bike += Number(x.bike_min) || 0; t.corrida += Number(x.corrida_min) || 0;
        t.km.bike += Number(x.bike_km) || 0; t.km.corrida += Number(x.corrida_km) || 0;
      }else if(t[s.modalidade] !== undefined && s.modalidade !== 'outro'){
        t[s.modalidade] += Number(s.duracao_min) || 0;
        if(t.km[s.modalidade] !== undefined) t.km[s.modalidade] += Number(s.distancia_km) || 0;
      }else{
        t.outro += Number(s.duracao_min) || 0;
      }
    });
    t.total = t.corrida + t.bike + t.natacao + t.forca + t.outro;
    return t;
  }

  // ---------- formulario ----------
  function fieldDefs(mod){
    var time = {k:'tempo', label:'Tempo', ph:'min ou min:seg', mode:'text'};
    var rpe = {k:'rpe', label:'RPE 1-10', ph:'ex: 4', mode:'decimal'};
    var knee = {k:'joelho', label:'Dor joelho 0-10', ph:'0', mode:'decimal'};
    if(mod === 'corrida') return [time, {k:'dist', label:'Distância (km)', ph:'ex: 5,2', mode:'decimal'}, rpe, knee];
    if(mod === 'bike') return [time, {k:'dist', label:'Distância (km)', ph:'ex: 22', mode:'decimal'}, rpe, knee];
    if(mod === 'natacao') return [time, {k:'dist', label:'Distância (m)', ph:'ex: 800', mode:'decimal'}, rpe];
    if(mod === 'brick') return [
      {k:'bikeTempo', label:'Bike: tempo', ph:'min ou min:seg', mode:'text'},
      {k:'bikeDist', label:'Bike: distância (km)', ph:'ex: 20', mode:'decimal'},
      {k:'runTempo', label:'Corrida: tempo', ph:'min ou min:seg', mode:'text'},
      {k:'runDist', label:'Corrida: distância (km)', ph:'ex: 2', mode:'decimal'},
      rpe, knee];
    if(mod === 'forca') return [time, rpe, knee];
    return [time, rpe];
  }

  function draftFor(task){
    if(drafts[task.id]) return drafts[task.id];
    var s = state.sessions[task.id], d = {data: todayISO(), obs: ''};
    if(s){
      var x = s.dados_json || {};
      d.data = s.data_treino || todayISO();
      d.obs = s.observacoes || '';
      d.rpe = s.rpe != null ? String(s.rpe).replace('.', ',') : '';
      d.joelho = s.dor_joelho != null ? String(s.dor_joelho).replace('.', ',') : '';
      if(s.modalidade === 'brick'){
        d.bikeTempo = x.bike_min ? clockOrMin(x.bike_min) : ''; d.bikeDist = x.bike_km ? String(x.bike_km).replace('.', ',') : '';
        d.runTempo = x.corrida_min ? clockOrMin(x.corrida_min) : ''; d.runDist = x.corrida_km ? String(x.corrida_km).replace('.', ',') : '';
      }else{
        d.tempo = s.duracao_min ? clockOrMin(s.duracao_min) : '';
        d.dist = s.distancia_km ? String(s.modalidade === 'natacao' ? Math.round(s.distancia_km * 1000) : s.distancia_km).replace('.', ',') : '';
      }
    }
    drafts[task.id] = d;
    return d;
  }
  function clockOrMin(min){ return Number.isInteger(min) ? String(min) : clock(min); }

  function formHtml(task, mod){
    var d = draftFor(task);
    var fields = fieldDefs(mod).map(function(f){
      return '<label>' + f.label + '<input type="text" inputmode="' + (f.mode === 'decimal' ? 'decimal' : 'text') + '" placeholder="' + f.ph + '" value="' + esc(d[f.k] || '') + '" data-sess-field="' + f.k + '"></label>';
    }).join('');
    return '<div class="sess-form" data-sess-form="' + task.id + '">' +
      '<div class="sess-fields">' + fields +
        '<label>Data<input type="date" value="' + esc(d.data || todayISO()) + '" data-sess-field="data"></label></div>' +
      '<label class="sess-obs">Observação<textarea rows="2" placeholder="como foi, percurso, dor, clima..." data-sess-field="obs">' + esc(d.obs || '') + '</textarea></label>' +
      (formMsg[task.id] ? '<div class="sess-msg warn">' + esc(formMsg[task.id]) + '</div>' : '') +
      '<div class="sess-buttons"><button type="button" class="sess-save" data-sess-save="' + task.id + '">Salvar treino</button>' +
      '<button type="button" class="sess-link" data-sess-cancel="' + task.id + '">cancelar</button></div></div>';
  }

  function boxHtml(task){
    var mod = modality(task.title), s = state.sessions[task.id];
    var html = '';
    if(s){
      var pend = inQueue(task.id);
      html += '<div class="sess-done"><span class="sess-ico">' + (MOD[s.modalidade] || MOD.outro).icon + '</span><div><strong>Feito' + (s.data_treino ? ' em ' + fmtDay(s.data_treino) : '') + ': ' + (esc(summary(s)) || 'registrado') + '</strong>' +
        (s.observacoes ? '<small>' + esc(s.observacoes) + '</small>' : '') +
        (pend ? '<small class="sess-pend">guardado no celular, aguardando envio</small>' : '') + '</div></div>';
    }
    if(openId === task.id) html += formHtml(task, mod);
    else html += '<div class="sess-buttons">' +
      '<button type="button" class="sess-open" data-sess-open="' + task.id + '">' + (s ? 'Editar registro' : 'Registrar treino') + '</button>' +
      (s ? '<button type="button" class="sess-link" data-sess-del="' + task.id + '">apagar</button>' : '') + '</div>';
    return html;
  }

  function currentWeek(){ return data.plano25[selectedWeek]; }
  function taskById(id){
    var w = currentWeek(), list = weekTasks(w);
    for(var i = 0; i < list.length; i++) if(list[i].id === id) return list[i];
    return null;
  }

  function decorateChecklist(){
    var box = document.getElementById('checklist');
    if(!box) return;
    var w = currentWeek(), tasks = weekTasks(w);
    var labels = box.querySelectorAll('.check-item');
    labels.forEach(function(label, i){
      var task = tasks[i];
      if(!task) return;
      label.classList.add('has-sess');
      var div = document.createElement('div');
      div.className = 'sess-box';
      div.setAttribute('data-sess-task', task.id);
      div.innerHTML = boxHtml(task);
      label.parentNode.insertBefore(div, label.nextSibling);
    });
    // feito x planejado nos quadros da aba Hoje
    var t = weekTotals(w['Sem']);
    [['mRun', 'corrida', 'Run min'], ['mBike', 'bike', 'Bike min'], ['mSwim', 'natacao', 'Swim min'], ['mStrength', 'forca', 'Força min']].forEach(function(m){
      var el = document.getElementById(m[0]);
      if(!el) return;
      var plan = w[m[2]] || 0, done = Math.round(t[m[1]]);
      el.innerHTML = done ? done + ' <small class="sess-of">de ' + plan + ' min</small>' : plan + ' min';
    });
  }

  function readForm(task){
    var d = draftFor(task), mod = modality(task.title);
    var rpe = parseNum(d.rpe), knee = parseNum(d.joelho);
    if(rpe !== null && (isNaN(rpe) || rpe < 1 || rpe > 10)) return {error:'RPE deve ficar entre 1 e 10.'};
    if(knee !== null && (isNaN(knee) || knee < 0 || knee > 10)) return {error:'Dor no joelho deve ficar entre 0 e 10.'};
    var s = {semana: currentWeek()['Sem'], tarefa_id: task.id, treino: task.title, modalidade: mod,
      data_treino: d.data || todayISO(), rpe: rpe, dor_joelho: knee, observacoes: (d.obs || '').trim(),
      duracao_min: null, distancia_km: null, dados_json: {}, savedAt: new Date().toISOString()};
    function bad(v){ return v !== null && (isNaN(v) || v < 0); }
    if(mod === 'brick'){
      var bm = parseMinutes(d.bikeTempo), bk = parseNum(d.bikeDist), rm = parseMinutes(d.runTempo), rk = parseNum(d.runDist);
      if(bad(bm) || bad(rm)) return {error:'Tempo inválido. Use minutos (ex: 45) ou min:seg (ex: 45:30).'};
      if(bad(bk) || bad(rk)) return {error:'Distância inválida.'};
      if(!bm && !rm) return {error:'Informe o tempo da bike ou da corrida.'};
      s.dados_json = {bike_min: bm || 0, bike_km: bk || 0, corrida_min: rm || 0, corrida_km: rk || 0};
      s.duracao_min = round2((bm || 0) + (rm || 0));
      s.distancia_km = (bk || rk) ? round2((bk || 0) + (rk || 0)) : null;
    }else{
      var min = parseMinutes(d.tempo), dist = parseNum(d.dist);
      if(bad(min)) return {error:'Tempo inválido. Use minutos (ex: 32) ou min:seg (ex: 32:30).'};
      if(bad(dist)) return {error:'Distância inválida.'};
      if(!min) return {error:'Informe o tempo do treino.'};
      s.duracao_min = round2(min);
      if(dist) s.distancia_km = mod === 'natacao' ? round3(dist / 1000) : round2(dist);
    }
    return {session: s};
  }
  function round2(n){ return Math.round(n * 100) / 100; }
  function round3(n){ return Math.round(n * 1000) / 1000; }

  async function saveSession(taskId){
    var task = taskById(taskId);
    if(!task) return;
    var r = readForm(task);
    if(r.error){ formMsg[taskId] = r.error; renderChecklist(); return; }
    delete formMsg[taskId]; delete drafts[taskId];
    state.sessions[taskId] = r.session;
    state.done[taskId] = true;
    save();
    openId = null;
    renderChecklist(); renderDashboard();
    await send(r.session);
    renderChecklist(); renderDashboard();
  }

  async function deleteSession(taskId){
    var s = state.sessions[taskId];
    if(!s) return;
    if(!window.confirm('Apagar o registro deste treino?')) return;
    delete state.sessions[taskId]; delete drafts[taskId];
    state.done[taskId] = false;
    save();
    renderChecklist(); renderDashboard();
    var tomb = Object.assign({}, s, {duracao_min:null, distancia_km:null, rpe:null, dor_joelho:null, observacoes:'', dados_json:{removido:true}, savedAt:new Date().toISOString()});
    await send(tomb);
    renderChecklist();
  }

  // ---------- dashboard ----------
  function bar(label, done, plan){
    var pct = plan ? Math.min(100, Math.round(done / plan * 100)) : (done ? 100 : 0);
    var cls = !plan ? 'none' : (done >= plan * 0.9 ? 'ok' : (done > 0 ? 'part' : 'none'));
    return '<div class="sess-row"><div class="sess-row-top"><span>' + label + '</span><strong>' + Math.round(done) + ' / ' + (plan || 0) + ' min</strong></div>' +
      '<div class="sess-bar"><div class="' + cls + '" style="width:' + pct + '%"></div></div></div>';
  }

  function weeksChart(){
    var byWeek = {};
    Object.keys(state.sessions).forEach(function(id){ var s = state.sessions[id]; if(s) byWeek[s.semana] = true; });
    var weeks = Object.keys(byWeek).map(Number).sort(function(a, b){ return a - b; }).slice(-8);
    if(weeks.length < 2) return '';
    var rows = weeks.map(function(sem){
      var w = data.plano25.filter(function(x){ return String(x['Sem']) === String(sem); })[0] || {};
      return {sem: sem, done: weekTotals(sem).total, plan: Number(w['Total min']) || 0};
    });
    var W = 420, H = 190, pl = 34, pr = 8, pt = 20, pb = 26;
    var max = Math.max.apply(null, rows.map(function(r){ return Math.max(r.done, r.plan); })) * 1.15 || 1;
    var slot = (W - pl - pr) / rows.length, bw = Math.min(40, slot * 0.6), out = '';
    for(var i = 0; i <= 3; i++){
      var gv = max * i / 3, gy = pt + (1 - gv / max) * (H - pt - pb);
      out += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy + '" y2="' + gy + '" stroke="rgba(255,255,255,.07)"/>' +
        '<text x="' + (pl - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="12" fill="#94a3b8">' + Math.round(gv) + '</text>';
    }
    rows.forEach(function(r, j){
      var x = pl + slot * j + (slot - bw) / 2, h = (r.done / max) * (H - pt - pb), y = H - pb - h;
      var py = pt + (1 - r.plan / max) * (H - pt - pb);
      out += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="6" fill="rgba(56,189,248,.7)"><title>Semana ' + r.sem + ': ' + Math.round(r.done) + ' de ' + r.plan + ' min</title></rect>' +
        '<line x1="' + (x - 4) + '" x2="' + (x + bw + 4) + '" y1="' + py + '" y2="' + py + '" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>' +
        '<text x="' + (x + bw / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#e0f2fe">' + Math.round(r.done) + '</text>' +
        '<text x="' + (x + bw / 2) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="12" fill="#94a3b8">S' + r.sem + '</text>';
    });
    return '<div class="card"><h2>Minutos feitos por semana</h2><svg viewBox="0 0 ' + W + ' ' + H + '" class="sess-chart" role="img" aria-label="Minutos feitos por semana">' + out + '</svg>' +
      '<p class="muted sess-foot">Barra azul: minutos registrados. Traço amarelo: minutos planejados da semana.</p></div>';
  }

  function renderDash(){
    var view = document.getElementById('view-dashboard');
    if(!view) return;
    var box = document.getElementById('sessoesDashboard');
    if(!box){
      box = document.createElement('div');
      box.id = 'sessoesDashboard';
      var metrics = document.getElementById('dashboardMetrics');
      if(metrics && metrics.nextSibling) view.insertBefore(box, metrics.nextSibling); else view.appendChild(box);
    }
    var w = currentWeek(), t = weekTotals(w['Sem']);
    var plan = Number(w['Total min']) || 0;
    var pct = plan ? Math.round(t.total / plan * 100) : 0;
    var kms = [];
    if(t.km.corrida) kms.push('corrida ' + fmt(t.km.corrida, 1) + ' km');
    if(t.km.bike) kms.push('bike ' + fmt(t.km.bike, 1) + ' km');
    if(t.km.natacao) kms.push('natação ' + fmt(t.km.natacao * 1000, 0) + ' m');

    var all = Object.keys(state.sessions).map(function(id){ return state.sessions[id]; }).filter(Boolean)
      .sort(function(a, b){ return String(b.data_treino || b.savedAt).localeCompare(String(a.data_treino || a.savedAt)) || String(b.savedAt).localeCompare(String(a.savedAt)); })
      .slice(0, 8);
    var list = all.length ? all.map(function(s){
      return '<div class="history-item"><strong>' + (MOD[s.modalidade] || MOD.outro).icon + ' ' + esc(s.treino || (MOD[s.modalidade] || MOD.outro).label) + '</strong>' +
        '<div class="muted">Semana ' + s.semana + (s.data_treino ? ' • ' + fmtDay(s.data_treino) : '') + ' • ' + esc(summary(s)) + '</div>' +
        (s.observacoes ? '<p>' + esc(s.observacoes) + '</p>' : '') + '</div>';
    }).join('') : '<p class="muted">Nenhum treino registrado ainda. Na aba Hoje, toque em "Registrar treino" depois de cada sessão.</p>';

    box.innerHTML =
      '<div class="card"><div class="section-head"><div><h2>Feito × planejado — Semana ' + w['Sem'] + '</h2>' +
        '<p class="muted">' + (t.count ? Math.round(t.total) + ' de ' + plan + ' min (' + pct + '%)' + (kms.length ? ' • ' + kms.join(' • ') : '') : 'Sem treinos registrados nesta semana.') + '</p></div></div>' +
        bar('Corrida', t.corrida, w['Run min']) + bar('Bike', t.bike, w['Bike min']) + bar('Natação', t.natacao, w['Swim min']) + bar('Força', t.forca, w['Força min']) + '</div>' +
      weeksChart() +
      '<div class="card"><h2>Últimos treinos registrados</h2><div class="history compact">' + list + '</div></div>';
  }

  // ---------- ligacoes ----------
  function hook(){
    var origChecklist = renderChecklist;
    renderChecklist = function(){
      var r = origChecklist.apply(this, arguments);
      try{ decorateChecklist(); }catch(e){}
      return r;
    };
    var origDash = renderDashboard;
    renderDashboard = function(){
      var r = origDash.apply(this, arguments);
      try{ renderDash(); }catch(e){}
      return r;
    };
  }

  document.addEventListener('click', function(e){
    var t = e.target.closest ? e.target.closest('[data-sess-open],[data-sess-cancel],[data-sess-save],[data-sess-del]') : null;
    if(!t) return;
    if(t.hasAttribute('data-sess-open')){ openId = t.getAttribute('data-sess-open'); delete formMsg[openId]; renderChecklist(); return; }
    if(t.hasAttribute('data-sess-cancel')){ var id = t.getAttribute('data-sess-cancel'); delete drafts[id]; delete formMsg[id]; openId = null; renderChecklist(); return; }
    if(t.hasAttribute('data-sess-save')){ saveSession(t.getAttribute('data-sess-save')); return; }
    if(t.hasAttribute('data-sess-del')){ deleteSession(t.getAttribute('data-sess-del')); return; }
  });
  document.addEventListener('input', function(e){
    var el = e.target;
    if(!el || !el.matches || !el.matches('[data-sess-field]')) return;
    var form = el.closest('[data-sess-form]');
    if(!form) return;
    var id = form.getAttribute('data-sess-form');
    if(!drafts[id]) drafts[id] = {};
    drafts[id][el.getAttribute('data-sess-field')] = el.value;
  });
  window.addEventListener('tri-outbox-sent', function(){ try{ renderChecklist(); }catch(e){} });

  function addStyles(){
    if(document.getElementById('sess-styles')) return;
    var st = document.createElement('style');
    st.id = 'sess-styles';
    st.textContent =
      '.check-item.has-sess{border-bottom:0;padding-bottom:6px}' +
      '.sess-box{padding:0 0 14px 34px;border-bottom:1px solid var(--line)}.sess-box:last-child{border-bottom:0;padding-bottom:4px}' +
      '.sess-buttons{display:flex;align-items:center;gap:14px;flex-wrap:wrap}' +
      '.sess-open{border:1px solid rgba(56,189,248,.3);background:rgba(56,189,248,.1);color:#e0f2fe;border-radius:12px;padding:9px 14px;font-weight:900;font-size:.86rem}' +
      '.sess-save{border:0;border-radius:12px;padding:11px 18px;background:linear-gradient(135deg,#0ea5e9,#22c55e);color:#fff;font-weight:900;font-size:.92rem}' +
      '.sess-link{border:0;background:transparent;color:#94a3b8;font-weight:800;font-size:.84rem;padding:6px 2px}' +
      '.sess-done{display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;padding:10px 12px;border-radius:14px;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.22)}' +
      '.sess-done strong{display:block;color:#bbf7d0;font-size:.9rem;line-height:1.35}.sess-done small{display:block;color:#cbd5e1;margin-top:3px;line-height:1.35}' +
      '.sess-done small.sess-pend{color:#fde68a;font-weight:800}.sess-ico{font-size:1.2rem;line-height:1.2}' +
      '.sess-form{display:grid;gap:10px;padding:12px;border-radius:16px;background:rgba(56,189,248,.06);border:1px solid rgba(56,189,248,.18)}' +
      '.sess-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
      '.sess-form label{font-size:.8rem;font-weight:800;color:#dbeafe}.sess-form input,.sess-form textarea{padding:10px;border-radius:12px}' +
      '.sess-msg.warn{color:#fde68a;font-weight:800;font-size:.86rem}' +
      '.sess-of{font-size:.78rem;color:var(--muted);font-weight:700}' +
      '#sessoesDashboard{margin-top:14px}' +
      '.sess-row{margin-top:12px}.sess-row-top{display:flex;justify-content:space-between;gap:10px;font-size:.88rem}.sess-row-top span{color:var(--muted);font-weight:800}' +
      '.sess-bar{height:10px;border-radius:999px;background:rgba(148,163,184,.18);overflow:hidden;margin-top:6px}' +
      '.sess-bar > div{height:100%;border-radius:999px}.sess-bar .ok{background:#34d399}.sess-bar .part{background:#38bdf8}.sess-bar .none{background:transparent}' +
      '.sess-chart{width:100%;height:auto;display:block;margin-top:6px}.sess-foot{font-size:.82rem;margin-top:8px;line-height:1.4}' +
      '@media(min-width:740px){.sess-fields{grid-template-columns:repeat(3,1fr)}}';
    document.head.appendChild(st);
  }

  addStyles();
  hook();
  renderAll();
  var tries = 0;
  (function waitCloud(){
    if(cloud() || tries > 20){ loadCloud(); return; }
    tries++; setTimeout(waitCloud, 500);
  })();
})();
