// v13 - Conclusao do treino em lote.
// Exercicios sao preenchidos durante o treino; o envio ao Supabase ocorre apenas no botao final "Concluir treino e enviar".
(function(){
  if(!window.TRAINING_DATA || !window.TRAINING_DATA.academia) return;

  const TABLE = 'exercicios_registros';
  const VERSION_LABEL = 'v13';
  const TREINO_CONFIG = {
    A: { title:'Academia A', subtitle:'Pernas, joelho e quadril', description:'Base para proteger joelho, melhorar corrida e sustentar o triathlon.', match:'A -', icon:'🏋️' },
    B: { title:'Academia B', subtitle:'Natação, costas e ombro', description:'Dorsal, escápulas, ombro e core para eficiência de braçada.', match:'B -', icon:'🏊' },
    C: { title:'Academia C', subtitle:'Manutenção, core e estabilidade', description:'Controle corporal, unilateral, core e estabilidade.', match:'C -', icon:'⚡' }
  };

  if(!state.exerciseWeights) state.exerciseWeights = {};
  if(!state.exerciseHistory) state.exerciseHistory = {};
  if(!state.gymDone) state.gymDone = {};
  if(!state.workoutDone) state.workoutDone = {};

  function normalize(value){ return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function exerciseKey(exercise){ return normalize(exercise).replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  function rowsForTreino(letter){ return data.academia.filter(row => String(row['Treino'] || '').includes(TREINO_CONFIG[letter].match)); }
  function extractLink(html){ const m = String(html || '').match(/href=['"]([^'"]+)['"]/i); return m ? m[1] : ''; }
  function stripHtml(html){ const tmp=document.createElement('div'); tmp.innerHTML=String(html||''); return (tmp.textContent||tmp.innerText||'').replace('Ver referencia','').replace('Buscar video','').trim(); }
  function currentWeekNumber(){ try{return data.plano25[selectedWeek]['Sem'];}catch(e){return null;} }
  function workoutKey(letter){ return `workout-${letter}-sem-${currentWeekNumber() || 'atual'}`; }
  function getDraft(key){ return state.exerciseWeights[key] || {peso:'',series:'',reps:'',obs:''}; }
  function setDraft(key, field, value){ if(!state.exerciseWeights[key]) state.exerciseWeights[key]={}; state.exerciseWeights[key][field]=value; state.exerciseWeights[key].updatedAt=new Date().toISOString(); save(); }
  function getPrevious(key){ const hist=state.exerciseHistory[key] || []; if(!hist.length) return null; return [...hist].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0]; }
  function previousText(key){ const p=getPrevious(key); if(!p) return '<strong>-</strong><small>Sem registro anterior</small>'; return `<strong>${p.peso_kg ? p.peso_kg+' kg' : '-'}</strong><small>${p.series ? p.series+' séries' : ''}${p.repeticoes ? ' • '+p.repeticoes+' reps' : ''}</small>`; }
  function parseNumber(value){ const v=String(value||'').replace(',','.').trim(); return v==='' ? null : Number(v); }

  async function loadHistory(){
    if(!cloudReady || !supabaseClient) return;
    try{
      const {data:rows,error}=await supabaseClient.from(TABLE).select('*').eq('device_id',CLOUD_DEVICE_ID).order('created_at',{ascending:false}).limit(300);
      if(error) throw error;
      const grouped={};
      (rows||[]).forEach(row=>{ const key=row.exercicio_key || exerciseKey(row.exercicio||''); if(!grouped[key]) grouped[key]=[]; grouped[key].push(row); });
      state.exerciseHistory={...state.exerciseHistory,...grouped}; save();
    }catch(e){ /* mantém local */ }
  }

  function buildPayload(row, letter){
    const key=exerciseKey(row['Exercício']||'');
    const d=getDraft(key);
    return {
      device_id:CLOUD_DEVICE_ID,
      semana:currentWeekNumber(),
      treino_tipo:letter,
      exercicio:row['Exercício'] || '',
      exercicio_key:key,
      peso_kg:parseNumber(d.peso),
      series:d.series==='' ? null : Number(d.series),
      repeticoes:d.reps==='' ? null : Number(d.reps),
      observacoes:d.obs || null,
      dados_json:{
        treino:row['Treino'] || '',
        series_planejadas:row['Séries x reps'] || '',
        intensidade:row['Intensidade'] || '',
        feito:!!state.gymDone[`gym-v13-${letter}-${key}`],
        treino_concluido:true,
        app_version:VERSION_LABEL
      }
    };
  }

  function saveLocalRows(rows, insertedRows){
    const now=new Date().toISOString();
    (insertedRows && insertedRows.length ? insertedRows : rows.map(r=>({...r,created_at:now,local:true}))).forEach(row=>{
      const key=row.exercicio_key || exerciseKey(row.exercicio||'');
      if(!state.exerciseHistory[key]) state.exerciseHistory[key]=[];
      state.exerciseHistory[key].unshift(row);
    });
    save();
  }

  async function completeWorkout(letter, statusEl, button){
    const rows=rowsForTreino(letter);
    const payloads=rows.map(row=>buildPayload(row,letter));
    const valid=payloads.filter(p=>p.peso_kg!==null || p.series!==null || p.repeticoes!==null || p.observacoes || p.dados_json.feito);
    if(!valid.length){ statusEl.textContent='Preencha ou marque pelo menos um exercício antes de concluir.'; statusEl.className='exercise-save-status warn visible'; return; }
    button.disabled=true; button.textContent='Enviando treino...'; statusEl.textContent='Salvando treino completo...'; statusEl.className='exercise-save-status visible';
    try{
      if(cloudReady && supabaseClient){
        const {data:inserted,error}=await supabaseClient.from(TABLE).insert(valid).select();
        if(error) throw error;
        saveLocalRows(valid, inserted || []);
        state.workoutDone[workoutKey(letter)]={done:true,cloud:true,created_at:new Date().toISOString(),count:valid.length};
        statusEl.textContent=`Treino concluído e enviado ao Supabase. ${valid.length} exercícios registrados.`;
        statusEl.className='exercise-save-status ok visible';
      }else{
        saveLocalRows(valid,null);
        state.workoutDone[workoutKey(letter)]={done:true,cloud:false,created_at:new Date().toISOString(),count:valid.length};
        statusEl.textContent='Treino concluído e salvo localmente. Nuvem indisponível.';
        statusEl.className='exercise-save-status warn visible';
      }
      save(); renderDashboard();
    }catch(e){
      saveLocalRows(valid,null);
      state.workoutDone[workoutKey(letter)]={done:true,cloud:false,created_at:new Date().toISOString(),count:valid.length};
      save();
      statusEl.textContent='Treino salvo localmente. Verifique a tabela exercicios_registros/RLS no Supabase.';
      statusEl.className='exercise-save-status warn visible';
    }finally{
      button.disabled=false; button.textContent='Concluir treino e enviar';
    }
  }

  function exerciseCard(row, idx, letter){
    const ex=row['Exercício']||'';
    const key=exerciseKey(ex);
    const doneKey=`gym-v13-${letter}-${key}`;
    const d=getDraft(key);
    const link=extractLink(row['Ponto técnico']);
    const point=stripHtml(row['Ponto técnico']);
    const checked=state.gymDone[doneKey]?'checked':'';
    const doneClass=state.gymDone[doneKey]?' done':'';
    return `<article class="exercise-card${doneClass}" data-exercise-card="${doneKey}" data-exercise-key="${key}">
      <div class="exercise-photo placeholder-photo"><div class="photo-icon">${TREINO_CONFIG[letter].icon}</div><div><strong>Foto do exercício</strong><span>Carregando imagem</span></div></div>
      <div class="exercise-body">
        <div class="exercise-topline"><span class="exercise-tag">${TREINO_CONFIG[letter].title}</span><span class="exercise-status">${state.gymDone[doneKey]?'Feito':'Em aberto'}</span></div>
        <h3>${ex}</h3>
        <div class="exercise-grid"><div><span>Planejado</span><strong>${row['Séries x reps']||'-'}</strong></div><div><span>Intensidade</span><strong>${row['Intensidade']||'-'}</strong></div></div>
        <div class="weight-box weight-box-v10">
          <label>Peso hoje (kg)<input class="weight-input" inputmode="decimal" type="text" placeholder="ex: 16" value="${d.peso||''}" data-field="peso" data-ex-key="${key}"></label>
          <label>Séries feitas<input class="weight-input" inputmode="numeric" type="number" min="0" placeholder="ex: 4" value="${d.series||''}" data-field="series" data-ex-key="${key}"></label>
          <label>Reps médias<input class="weight-input" inputmode="numeric" type="number" min="0" placeholder="ex: 10" value="${d.reps||''}" data-field="reps" data-ex-key="${key}"></label>
          <div class="previous-weight"><span>Peso anterior</span>${previousText(key)}</div>
        </div>
        <label class="exercise-note-input">Observação do exercício<textarea rows="2" placeholder="dor, facilidade, ajuste de carga..." data-field="obs" data-ex-key="${key}">${d.obs||''}</textarea></label>
        <div class="coach-note"><strong>Ponto técnico</strong><p>${point||'-'}</p></div>
        <div class="coach-note knee-note"><strong>Se o joelho reclamar</strong><p>${row['Substituição se joelho reclamar']||'-'}</p></div>
        <div class="exercise-actions">
          <label class="complete-toggle"><input type="checkbox" data-v13-gym-key="${doneKey}" ${checked}><span>Marcar exercício feito</span></label>
          ${link ? `<a class="video-link" target="_blank" rel="noopener" href="${link}">Revisar referência</a>` : `<button class="video-link disabled" type="button">Vídeo pendente</button>`}
        </div>
      </div>
    </article>`;
  }

  function renderHome(){
    const el=document.getElementById('modalidadeList'); if(!el) return;
    el.innerHTML=`<section class="v9-training-shell"><div class="v9-head card"><p class="eyebrow">Treinos de academia</p><h2>Escolha o treino</h2><p class="muted">Preencha os exercícios durante o treino. O envio ao banco acontece no botão final de conclusão.</p></div><div class="training-home-grid">${Object.entries(TREINO_CONFIG).map(([l,c])=>`<button class="training-home-card" data-open-gym="${l}"><div class="home-icon">${c.icon}</div><div><strong>${c.title}</strong><span>${c.subtitle}</span><small>${rowsForTreino(l).length} exercícios</small></div></button>`).join('')}</div></section>`;
    el.querySelectorAll('[data-open-gym]').forEach(btn=>btn.addEventListener('click',()=>renderDetail(btn.dataset.openGym)));
  }

  function renderDetail(letter){
    const cfg=TREINO_CONFIG[letter]; const rows=rowsForTreino(letter); const el=document.getElementById('modalidadeList'); if(!el) return;
    const done=state.workoutDone[workoutKey(letter)];
    el.innerHTML=`<section class="v9-training-shell"><button class="back-training" type="button">← Voltar aos treinos</button><div class="card workout-hero"><div class="home-icon large">${cfg.icon}</div><div><p class="eyebrow">${cfg.title}</p><h2>${cfg.subtitle}</h2><p class="muted">${cfg.description}</p></div></div><div class="exercise-list">${rows.map((r,i)=>exerciseCard(r,i,letter)).join('')}</div><div class="card workout-complete-box"><h2>Finalizar treino</h2><p class="muted">Use este botão somente ao terminar o treino. Ele registra os exercícios preenchidos e envia tudo para a base de dados.</p><button type="button" class="primary complete-workout-btn">Concluir treino e enviar</button><div class="exercise-save-status ${done?'ok visible':''}">${done?`Último envio: ${done.count||0} exercícios registrados.`:''}</div></div></section>`;
    el.querySelector('.back-training').addEventListener('click',renderHome);
    el.querySelectorAll('[data-v13-gym-key]').forEach(input=>input.addEventListener('change',e=>{ const k=e.target.dataset.v13GymKey; const card=e.target.closest('.exercise-card'); const st=card?.querySelector('.exercise-status'); state.gymDone[k]=e.target.checked; save(); if(card){card.classList.toggle('done',e.target.checked); if(st) st.textContent=e.target.checked?'Feito':'Em aberto';} renderDashboard(); }));
    el.querySelectorAll('[data-ex-key][data-field]').forEach(input=>{ ['change','blur'].forEach(evt=>input.addEventListener(evt,e=>setDraft(e.target.dataset.exKey,e.target.dataset.field,e.target.value))); });
    const btn=el.querySelector('.complete-workout-btn'); const status=el.querySelector('.workout-complete-box .exercise-save-status');
    btn.addEventListener('click',()=>completeWorkout(letter,status,btn));
  }

  async function boot(){ await loadHistory(); renderModalidades=renderHome; renderModalidades(); }
  setTimeout(boot, 200);
})();