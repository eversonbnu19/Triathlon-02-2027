// v10 - Historico de carga por exercicio.
// Salva peso/series/reps/observacao por exercicio e mostra peso anterior.
(function(){
  if(!window.TRAINING_DATA || !window.TRAINING_DATA.academia) return;

  const TABLE = 'exercicios_registros';
  const VERSION_LABEL = 'v10';
  const TREINO_CONFIG = {
    A: { title:'Academia A', subtitle:'Pernas, joelho e quadril', description:'Base para proteger joelho, melhorar corrida e sustentar o triathlon.', match:'A -', icon:'🏋️' },
    B: { title:'Academia B', subtitle:'Natação, costas e ombro', description:'Dorsal, escápulas, ombro e core para eficiência de braçada.', match:'B -', icon:'🏊' },
    C: { title:'Academia C', subtitle:'Manutenção, core e estabilidade', description:'Controle corporal, unilateral, core e estabilidade.', match:'C -', icon:'⚡' }
  };

  if(!state.exerciseWeights) state.exerciseWeights = {};
  if(!state.exerciseHistory) state.exerciseHistory = {};
  if(!state.exerciseStatus) state.exerciseStatus = {};

  function normalize(value){
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
  function exerciseKey(exercise){
    return normalize(exercise).replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }
  function rowsForTreino(letter){
    const cfg = TREINO_CONFIG[letter];
    return data.academia.filter(row => String(row['Treino'] || '').includes(cfg.match));
  }
  function extractLink(html){
    const match = String(html || '').match(/href=['"]([^'"]+)['"]/i);
    return match ? match[1] : '';
  }
  function stripHtml(html){
    const tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    return (tmp.textContent || tmp.innerText || '').replace('Ver referencia','').replace('Buscar video','').trim();
  }
  function currentWeekNumber(){
    try { return data.plano25[selectedWeek]['Sem']; } catch(e){ return null; }
  }
  function getDraft(key){
    return state.exerciseWeights[key] || {peso:'',series:'',reps:'',obs:''};
  }
  function setDraft(key, field, value){
    if(!state.exerciseWeights[key]) state.exerciseWeights[key] = {};
    state.exerciseWeights[key][field] = value;
    state.exerciseWeights[key].updatedAt = new Date().toISOString();
    save();
  }
  function getPrevious(key){
    const hist = state.exerciseHistory[key] || [];
    if(!hist.length) return null;
    const ordered = [...hist].sort((a,b)=>new Date(b.created_at || b.data || 0) - new Date(a.created_at || a.data || 0));
    return ordered[0];
  }
  function previousText(key){
    const prev = getPrevious(key);
    if(!prev) return '<strong>-</strong><small>Sem registro anterior</small>';
    const peso = prev.peso_kg ? `${prev.peso_kg} kg` : '-';
    const reps = prev.repeticoes ? ` • ${prev.repeticoes} reps` : '';
    const series = prev.series ? ` • ${prev.series} séries` : '';
    return `<strong>${peso}</strong><small>${series}${reps}</small>`;
  }
  function setExerciseStatus(card, msg, type){
    if(!card) return;
    const el = card.querySelector('.exercise-save-status');
    if(!el) return;
    el.textContent = msg;
    el.className = `exercise-save-status ${type || ''}`;
  }

  async function loadExerciseHistory(){
    if(!cloudReady || !supabaseClient) return false;
    try{
      const { data: rows, error } = await supabaseClient
        .from(TABLE)
        .select('*')
        .eq('device_id', CLOUD_DEVICE_ID)
        .order('created_at', { ascending:false })
        .limit(300);
      if(error) throw error;
      if(rows && rows.length){
        const grouped = {};
        rows.forEach(row=>{
          const key = row.exercicio_key || exerciseKey(row.exercicio || '');
          if(!grouped[key]) grouped[key] = [];
          grouped[key].push(row);
        });
        state.exerciseHistory = {...state.exerciseHistory, ...grouped};
        save();
      }
      return true;
    }catch(err){
      state.exerciseStatus.historyError = true;
      save();
      return false;
    }
  }

  async function saveExerciseRecord(row, letter, key, card){
    const draft = getDraft(key);
    const peso = String(draft.peso || '').replace(',','.').trim();
    const payload = {
      device_id: CLOUD_DEVICE_ID,
      semana: currentWeekNumber(),
      treino_tipo: letter,
      exercicio: row['Exercício'] || '',
      exercicio_key: key,
      peso_kg: peso === '' ? null : Number(peso),
      series: draft.series === '' ? null : Number(draft.series),
      repeticoes: draft.reps === '' ? null : Number(draft.reps),
      observacoes: draft.obs || null,
      dados_json: {
        treino: row['Treino'] || '',
        series_planejadas: row['Séries x reps'] || '',
        intensidade: row['Intensidade'] || '',
        app_version: VERSION_LABEL
      }
    };

    const localRow = {...payload, created_at:new Date().toISOString(), local:true};
    if(!state.exerciseHistory[key]) state.exerciseHistory[key] = [];

    if(!cloudReady || !supabaseClient){
      state.exerciseHistory[key].unshift(localRow);
      save();
      setExerciseStatus(card, 'Salvo localmente. Nuvem indisponível.', 'warn');
      return false;
    }

    try{
      const { data: inserted, error } = await supabaseClient.from(TABLE).insert(payload).select().single();
      if(error) throw error;
      state.exerciseHistory[key].unshift(inserted || localRow);
      save();
      setExerciseStatus(card, 'Salvo no Supabase.', 'ok');
      return true;
    }catch(err){
      state.exerciseHistory[key].unshift(localRow);
      save();
      setExerciseStatus(card, 'Salvo localmente. Crie/valide a tabela exercicios_registros.', 'warn');
      return false;
    }
  }

  function exerciseCard(row, idx, letter){
    const ex = row['Exercício'] || '';
    const key = exerciseKey(ex);
    const doneKey = `gym-v10-${letter}-${key}`;
    const checked = state.gymDone[doneKey] ? 'checked' : '';
    const doneClass = state.gymDone[doneKey] ? ' done' : '';
    const link = extractLink(row['Ponto técnico']);
    const point = stripHtml(row['Ponto técnico']);
    const draft = getDraft(key);
    return `
      <article class="exercise-card${doneClass}" data-exercise-card="${doneKey}" data-exercise-key="${key}">
        <div class="exercise-photo placeholder-photo">
          <div class="photo-icon">${TREINO_CONFIG[letter].icon}</div>
          <div>
            <strong>Foto pendente</strong>
            <span>Imagem será adicionada após aprovação</span>
          </div>
        </div>
        <div class="exercise-body">
          <div class="exercise-topline">
            <span class="exercise-tag">${TREINO_CONFIG[letter].title}</span>
            <span class="exercise-status">${state.gymDone[doneKey] ? 'Completo' : 'Pendente'}</span>
          </div>
          <h3>${ex}</h3>
          <div class="exercise-grid">
            <div><span>Planejado</span><strong>${row['Séries x reps'] || '-'}</strong></div>
            <div><span>Intensidade</span><strong>${row['Intensidade'] || '-'}</strong></div>
          </div>
          <div class="weight-box weight-box-v10">
            <label>Peso hoje (kg)
              <input class="weight-input" inputmode="decimal" type="text" placeholder="ex: 16" value="${draft.peso || ''}" data-field="peso" data-ex-key="${key}">
            </label>
            <label>Séries feitas
              <input class="weight-input" inputmode="numeric" type="number" min="0" placeholder="ex: 4" value="${draft.series || ''}" data-field="series" data-ex-key="${key}">
            </label>
            <label>Reps médias
              <input class="weight-input" inputmode="numeric" type="number" min="0" placeholder="ex: 10" value="${draft.reps || ''}" data-field="reps" data-ex-key="${key}">
            </label>
            <div class="previous-weight"><span>Peso anterior</span>${previousText(key)}</div>
          </div>
          <label class="exercise-note-input">Observação do exercício
            <textarea rows="2" placeholder="dor, facilidade, ajuste de carga..." data-field="obs" data-ex-key="${key}">${draft.obs || ''}</textarea>
          </label>
          <div class="coach-note"><strong>Ponto técnico</strong><p>${point || '-'}</p></div>
          <div class="coach-note knee-note"><strong>Se o joelho reclamar</strong><p>${row['Substituição se joelho reclamar'] || '-'}</p></div>
          <div class="exercise-actions">
            <label class="complete-toggle">
              <input type="checkbox" data-v10-gym-key="${doneKey}" ${checked}>
              <span>Concluir exercício</span>
            </label>
            <button type="button" class="save-exercise" data-save-ex="${key}" data-letter="${letter}">Salvar exercício</button>
            ${link ? `<a class="video-link" target="_blank" rel="noopener" href="${link}">Revisar referência</a>` : `<button class="video-link disabled" type="button">Vídeo pendente</button>`}
          </div>
          <div class="exercise-save-status"></div>
        </div>
      </article>`;
  }

  function renderAcademiaHome(){
    const el=document.getElementById('modalidadeList');
    if(!el) return;
    const blocks = Object.entries(TREINO_CONFIG).map(([letter, cfg])=>{
      const rows = rowsForTreino(letter);
      return `<button class="training-home-card" data-open-gym="${letter}"><div class="home-icon">${cfg.icon}</div><div><strong>${cfg.title}</strong><span>${cfg.subtitle}</span><small>${rows.length} exercícios</small></div></button>`;
    }).join('');
    el.innerHTML = `
      <section class="v9-training-shell">
        <div class="v9-head card">
          <p class="eyebrow">Treinos de academia</p>
          <h2>Escolha o treino</h2>
          <p class="muted">v10 registra peso, séries, repetições e mostra o peso anterior quando houver histórico.</p>
          ${state.exerciseStatus.historyError ? '<div class="exercise-save-status warn visible">Histórico em modo local. Rode o SQL da tabela exercicios_registros para sincronizar na nuvem.</div>' : ''}
        </div>
        <div class="training-home-grid">${blocks}</div>
        <details class="other-modalities"><summary>Outras modalidades</summary><div class="tableish"><div class="rowish"><strong>Corrida, Natação, Bike e Brick</strong><span class="muted">Continuam no plano semanal e checklist da aba Hoje.</span></div></div></details>
      </section>`;
    el.querySelectorAll('[data-open-gym]').forEach(btn=>btn.addEventListener('click',()=>renderAcademiaDetail(btn.dataset.openGym)));
  }

  function renderAcademiaDetail(letter){
    const cfg = TREINO_CONFIG[letter];
    const rows = rowsForTreino(letter);
    const el=document.getElementById('modalidadeList');
    if(!el) return;
    el.innerHTML = `<section class="v9-training-shell"><button class="back-training" type="button">← Voltar aos treinos</button><div class="card workout-hero"><div class="home-icon large">${cfg.icon}</div><div><p class="eyebrow">${cfg.title}</p><h2>${cfg.subtitle}</h2><p class="muted">${cfg.description}</p></div></div><div class="exercise-list">${rows.map((row, idx)=>exerciseCard(row, idx, letter)).join('')}</div></section>`;
    el.querySelector('.back-training').addEventListener('click', renderAcademiaHome);

    el.querySelectorAll('[data-v10-gym-key]').forEach(input=>{
      input.addEventListener('change', e=>{
        const doneKey = e.target.dataset.v10GymKey;
        const card = e.target.closest('.exercise-card');
        const status = card ? card.querySelector('.exercise-status') : null;
        state.gymDone[doneKey] = e.target.checked;
        save();
        if(card){ card.classList.toggle('done', e.target.checked); if(status) status.textContent = e.target.checked ? 'Completo' : 'Pendente'; }
        renderDashboard();
      });
    });
    el.querySelectorAll('[data-ex-key][data-field]').forEach(input=>{
      const eventName = input.tagName === 'TEXTAREA' ? 'blur' : 'change';
      input.addEventListener(eventName, e=>setDraft(e.target.dataset.exKey, e.target.dataset.field, e.target.value));
      input.addEventListener('blur', e=>setDraft(e.target.dataset.exKey, e.target.dataset.field, e.target.value));
    });
    el.querySelectorAll('[data-save-ex]').forEach(btn=>{
      btn.addEventListener('click', async e=>{
        const key = e.target.dataset.saveEx;
        const card = e.target.closest('.exercise-card');
        const row = rows.find(r=>exerciseKey(r['Exercício']) === key);
        setExerciseStatus(card, 'Salvando...', '');
        await saveExerciseRecord(row, letter, key, card);
        const prev = card.querySelector('.previous-weight');
        if(prev) prev.innerHTML = `<span>Peso anterior</span>${previousText(key)}`;
      });
    });
  }

  async function bootV10(){
    await loadExerciseHistory();
    renderModalidades = renderAcademiaHome;
    renderModalidades();
  }
  bootV10();
})();